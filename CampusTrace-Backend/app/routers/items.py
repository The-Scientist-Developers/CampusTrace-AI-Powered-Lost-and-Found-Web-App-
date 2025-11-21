from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
import traceback
import asyncio
from uuid import uuid4
from pathlib import Path
from PIL import Image
import io
import os
import google.generativeai as genai

from app.config import get_settings
from app.dependencies import get_current_user_id, supabase
from app.models import ItemCreate, DescriptionRequest
from app.utils import (
    create_notification,
    generate_ai_tags,
    find_proactive_matches,
    award_badge,
    process_image_efficiently,
    get_university_settings,
)
from app import jina_embedding_util
from app import shared
from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/api/items", tags=["Items"])
settings = get_settings()

def ensure_ai_model():
    if shared.model is None and settings.GEMINI_API_KEY:
        try:
            print("🔄 Lazy loading Gemini AI model...")
            genai.configure(api_key=settings.GEMINI_API_KEY)
            shared.model = genai.GenerativeModel("gemini-2.5-flash")
            print("✅ Gemini AI model loaded successfully.")
        except Exception as e:
            print(f"❌ Failed to lazy load AI model: {e}")
            traceback.print_exc()

@router.get("")
async def get_items_paginated(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    user_id: str = Depends(get_current_user_id),
):
    try:
        limit = min(limit, 20)
        if limit < 1:
            limit = 10

        profile_res = (
            supabase.table("profiles")
            .select("university_id")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]

        offset = (page - 1) * limit

        query = (
            supabase.table("items")
            .select(
                "id, title, description, status, category, location, contact_info, image_url, thumbnail_url, created_at, user_id, profiles!items_user_id_fkey(id, full_name, email)",
                count="exact",
            )
            .eq("university_id", university_id)
            .eq("moderation_status", "approved")
            .neq("status", "recovered")  # Exclude recovered items from browse
        )

        if status and status != "All":
            query = query.eq("status", status)
        if category and category != "All":
            query = query.eq("category", category)
        if search:
            query = query.or_(
                f"title.ilike.%{search}%,description.ilike.%{search}%,category.ilike.%{search}%"
            )

        valid_sort_fields = ["created_at", "title", "status", "category"]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"

        desc = sort_order.lower() == "desc"
        query = query.order(sort_by, desc=desc)
        query = query.range(offset, offset + limit - 1)

        result = query.execute()

        return {
            "items": result.data or [],
            "total_items": result.count or 0,
            "current_page": page,
            "total_pages": ((result.count or 0) + limit - 1) // limit,
            "items_per_page": limit,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")

@router.get("/leaderboard")
async def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = (
            supabase.table("profiles")
            .select("university_id")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data.get("university_id")
        if not university_id:
            return []

        try:
            profiles_res = (
                supabase.table("profiles")
                .select("id, full_name, email, avatar_url, returns_count")
                .eq("university_id", university_id)
                .gt("returns_count", 0)
                .order("returns_count", desc=True)
                .limit(10)
                .execute()
            )
            results = []
            if profiles_res.data:
                for p in profiles_res.data:
                    p["successful_returns"] = p.get("returns_count", 0)
                    results.append(p)
            return results
        except Exception as e:
            print(f"Leaderboard query error: {str(e)}")
            return []

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"Leaderboard error: {str(e)}")
        return []

@router.post("/generate-description")
async def generate_description(payload: DescriptionRequest):
    ensure_ai_model()
    if not shared.model:
        raise HTTPException(status_code=503, detail="AI features are not available. Check server logs for API Key issues.")

    try:
        prompt = f"""
        A user in a Philippine university provided a draft description for a lost or found item. 
        Rewrite and enhance it to be clear, detailed, and effective.
        Use simple English but feel free to use common Taglish (Tagalog-English) words.

        Original Information:
        - Item Title: "{payload.title}"
        - Category: "{payload.category}"
        - User's Draft Description: "{payload.draft_description}"

        Your task:
        - Refine the language to be clear and concise.
        - Organize the details logically.
        - Add placeholders like [Specify Color] if missing.
        - Return only the improved description text.
        """
        response = await shared.model.generate_content_async(prompt)
        return {"description": response.text.strip()}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")

@router.post("/ai/suggest-details-from-image")
async def suggest_details_from_image(
    image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)
):
    ensure_ai_model()
    if not shared.model:
        raise HTTPException(status_code=503, detail="AI features are not available. Model failed to load.")

    try:
        print("\n🤖 [AI SUGGEST] Analyzing image...")
        image_bytes = await image_file.read()
        max_image_size = int(os.getenv("MAX_IMAGE_SIZE", "5242880"))

        if len(image_bytes) > max_image_size:
            image_bytes = await run_in_threadpool(process_image_efficiently, image_bytes)

        pil_image = Image.open(io.BytesIO(image_bytes))

        prompt = """
        Analyze this image of a lost or found item.
        Provide response in exact format:
        Object: [type]
        Color: [color]
        Keywords: [comma-separated keywords]
        """

        response = await shared.model.generate_content_async([prompt, pil_image])
        analysis_text = response.text.strip()
        lines = analysis_text.split("\n")
        object_type = ""
        color = ""
        keywords = []
        for line in lines:
            line = line.strip()
            if line.startswith("Object:"):
                object_type = line.replace("Object:", "").strip()
            elif line.startswith("Color:"):
                color = line.replace("Color:", "").strip()
            elif line.startswith("Keywords:"):
                k_str = line.replace("Keywords:", "").strip()
                keywords = [k.strip() for k in k_str.split(",") if k.strip()]

        if color and object_type:
            suggested_title = f"{color} {object_type}".title()
        elif object_type:
            suggested_title = object_type.title()
        else:
            suggested_title = "Item"

        suggested_category = "Others"
        category_mapping = {
            "phone": "Electronics", "laptop": "Electronics", "wallet": "Accessories",
            "id": "Documents", "umbrella": "Accessories", "bag": "Bags", "key": "Keys"
        }
        obj_lower = object_type.lower()
        for k, v in category_mapping.items():
            if k in obj_lower:
                suggested_category = v
                break

        pil_image.close()

        return {
            "suggestedTitle": suggested_title,
            "suggestedCategory": suggested_category,
            "analysis": analysis_text,
            "confidence": "high" if object_type else "low",
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@router.post("/create")
async def create_item(
    item_data: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id),
):
    try:
        item = ItemCreate.parse_raw(item_data)

        profile_res = (
            supabase.table("profiles")
            .select("university_id, full_name")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")

        university_id = profile_res.data["university_id"]
        user_full_name = profile_res.data.get("full_name", "A user")
        uni_settings = await get_university_settings(university_id)

        moderation_status = "pending"
        post_content = f"{item.title.lower()} {item.description.lower()}"
        if uni_settings["keyword_blacklist"] and any(k in post_content for k in uni_settings["keyword_blacklist"]):
            moderation_status = "pending"
        elif uni_settings["auto_approve_posts"]:
            moderation_status = "approved"

        ensure_ai_model()
        ai_tags = await generate_ai_tags(item.title, item.description)
        combined_text = f"Title: {item.title}. Description: {item.description}. Location: {item.location}. Category: {item.category}."
        image_url = None
        thumbnail_url = None
        image_embedding = None
        text_embedding = None

        if image_file:
            image_bytes = await image_file.read()
            max_image_size = int(os.getenv("MAX_IMAGE_SIZE", "5242880"))

            if len(image_bytes) > max_image_size:
                image_bytes = await run_in_threadpool(process_image_efficiently, image_bytes)

            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            pil_image.thumbnail((800, 800), Image.Resampling.LANCZOS)
            output_bytes_io = io.BytesIO()
            pil_image.save(output_bytes_io, format="JPEG", quality=90)
            image_bytes_for_storage = output_bytes_io.getvalue()

            thumb = pil_image.copy()
            thumb.thumbnail((200, 200), Image.Resampling.LANCZOS)
            thumb_io = io.BytesIO()
            thumb.save(thumb_io, format="JPEG", quality=85)
            thumb_bytes = thumb_io.getvalue()

            file_suffix = Path(image_file.filename or ".jpg").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            thumb_path = f"public/{user_id}/{uuid4().hex}_thumb{file_suffix}"

            supabase.storage.from_("item_images").upload(file_path, image_bytes_for_storage, {"content-type": "image/jpeg"})
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

            supabase.storage.from_("item_images").upload(thumb_path, thumb_bytes, {"content-type": "image/jpeg"})
            thumbnail_url = supabase.storage.from_("item_images").get_public_url(thumb_path)

            image_embedding = await jina_embedding_util.get_multimodal_embedding(text=None, image=pil_image)
            if image_embedding and all(v == 0.0 for v in image_embedding):
                image_embedding = None

            pil_image.close()

        text_embedding = await jina_embedding_util.get_multimodal_embedding(text=combined_text, image=None)
        if text_embedding and all(v == 0.0 for v in text_embedding):
            text_embedding = None

        post_data = {
            "title": item.title,
            "description": item.description,
            "status": item.status,
            "category": item.category,
            "location": item.location,
            "contact_info": item.contact_info,
            "ai_tags": ai_tags,
            "image_url": image_url,
            "thumbnail_url": thumbnail_url,
            "user_id": user_id,
            "university_id": university_id,
            "moderation_status": moderation_status,
            "text_embedding": text_embedding,
            "image_embedding": image_embedding,
        }

        insert_res = supabase.table("items").insert(post_data).execute()
        new_item = insert_res.data[0]

        if moderation_status == "pending":
            admins_res = supabase.table("profiles").select("id").eq("university_id", university_id).eq("role", "admin").execute()
            if admins_res.data:
                msg = f"New item '{item.title}' from {user_full_name} awaiting moderation."
                for admin in admins_res.data:
                    create_notification(admin["id"], university_id, msg, "/admin/post-moderation", "moderation")

        count_res = supabase.table("items").select("id", count="exact").eq("user_id", user_id).execute()
        if count_res.count == 1:
            award_badge(user_id, "New Member", university_id)

        if item.status == "Found":
            found_res = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "Found").execute()
            if found_res.count == 10:
                award_badge(user_id, "Eagle Eye", university_id)
            if moderation_status == "approved":
                asyncio.create_task(find_proactive_matches(new_item, university_id))

        return {"data": new_item}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/image-search")
async def search_by_image(
    image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)
):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]

        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        max_size = (800, 800)
        if pil_image.size[0] > max_size[0] or pil_image.size[1] > max_size[1]:
            pil_image.thumbnail(max_size, Image.Resampling.LANCZOS)

        query_embedding = await jina_embedding_util.get_multimodal_embedding(text=None, image=pil_image)
        pil_image.close()

        if not query_embedding or all(v == 0.0 for v in query_embedding):
             return {"results": [], "message": "Failed to generate image embedding"}

        try:
            matches = supabase.rpc(
                "match_items_by_image_embedding",
                {
                    "p_university_id": university_id,
                    "p_query_embedding": query_embedding,
                    "p_match_threshold": 0.7,
                    "p_match_count": 10,
                },
            ).execute()

            if matches.data:
                return {"results": matches.data, "message": f"Found {len(matches.data)} results"}
            else:
                return {"results": [], "message": "No similar items found"}
        except Exception as rpc_error:
            print(f"RPC Error: {rpc_error}")
            return {"results": [], "message": "Search failed"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@router.get("/find-matches/{item_id}")
async def find_matches(item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        item_res = (
            supabase.table("items")
            .select("university_id, user_id, status")
            .eq("id", item_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        if item_res.data["status"] != "Lost":
            return []

        matches_res = supabase.rpc(
            "find_matches_for_lost_item",
            {
                "p_item_id": item_id,
                "p_text_weight": 0.6,
                "p_image_weight": 0.4,
                "p_match_threshold": 0.7,
                "p_match_count": 4,
            },
        ).execute()

        return matches_res.data or []

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match error: {str(e)}")

@router.put("/{item_id}/recover")
async def mark_as_recovered(item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")

        finder_id = item_res.data["user_id"]
        university_id = item_res.data["university_id"]

        claim_res = supabase.table("claims").select("claimant_id").eq("item_id", item_id).eq("status", "approved").execute()
        approved_claimant_id = claim_res.data[0]["claimant_id"] if claim_res.data else None

        if user_id not in [finder_id, approved_claimant_id]:
            raise HTTPException(status_code=403, detail="Not authorized.")

        supabase.table("items").update({"moderation_status": "recovered", "status": "recovered"}).eq("id", item_id).execute()

        msg = f"The item '{item_res.data['title']}' has been marked as recovered. This case is now closed."
        if finder_id:
            create_notification(finder_id, university_id, msg, "/dashboard/my-posts", "moderation")
        if approved_claimant_id and approved_claimant_id != finder_id:
            create_notification(approved_claimant_id, university_id, msg, "/dashboard/my-posts", "moderation")

        return {"message": "Item marked as recovered."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-summary")
async def get_dashboard_summary(user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]

        my_posts_res = supabase.table("items").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
        all_my_posts_res = supabase.table("items").select("category, status, created_at").eq("user_id", user_id).execute()
        recent_activity_res = supabase.table("items").select("*, profiles(id, full_name, email)").eq("university_id", university_id).eq("moderation_status", "approved").neq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
        found = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "Found").execute()
        lost = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "Lost").execute()
        pending = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("moderation_status", "pending").execute()
        recovered = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "recovered").execute()
        unread = supabase.table("notifications").select("id", count="exact").eq("recipient_id", user_id).eq("status", "unread").execute()

        ai_matches = []
        user_lost_items = supabase.table("items").select("id").eq("user_id", user_id).eq("status", "Lost").eq("moderation_status", "approved").order("created_at", desc=True).limit(1).execute()

        if user_lost_items.data:
            try:
                matches = supabase.rpc(
                    "find_matches_for_lost_item",
                    {"p_item_id": user_lost_items.data[0]["id"], "p_match_count": 3, "p_text_weight": 0.4, "p_image_weight": 0.6, "p_match_threshold": 0.7}
                ).execute()
                ai_matches = matches.data or []
            except:
                pass

        return {
            "myRecentPosts": my_posts_res.data or [],
            "allMyPosts": all_my_posts_res.data or [],
            "recentActivity": recent_activity_res.data or [],
            "userStats": {
                "found": found.count or 0,
                "lost": lost.count or 0,
                "pending": pending.count or 0,
                "recovered": recovered.count or 0
            },
            "unreadNotifications": unread.count or 0,
            "aiMatches": ai_matches
        }
    except Exception as e:
        traceback.print_exc()
        return {"myRecentPosts": [], "allMyPosts": [], "recentActivity": [], "userStats": {"found":0,"lost":0,"pending":0,"recovered":0}, "unreadNotifications": 0, "aiMatches": []}
