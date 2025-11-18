from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
import traceback
import asyncio
from uuid import uuid4
from pathlib import Path
from PIL import Image
import io


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
from app.shared import model
from fastapi.concurrency import run_in_threadpool


router = APIRouter(prefix="/api/items", tags=["Items"])


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
    """
    Get paginated items for the user's university with strict pagination.
    Supports backend filtering, searching, and sorting.
    Returns only necessary fields for list view (10-20 items max).
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)  # Never return more than 20 items
        if limit < 1:
            limit = 10

        # Get user's university
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

        # Calculate offset
        offset = (page - 1) * limit

        # Select only necessary fields for browse list
        query = (
            supabase.table("items")
            .select(
                "id, title, status, category, location, image_url, thumbnail_url, created_at, user_id, profiles!items_user_id_fkey(id, full_name)",
                count="exact",
            )
            .eq("university_id", university_id)
            .eq("moderation_status", "approved")
        )

        # Apply backend filters
        if status and status != "All":
            query = query.eq("status", status)
        if category and category != "All":
            query = query.eq("category", category)
        if search:
            # Backend search on indexed columns
            query = query.or_(
                f"title.ilike.%{search}%,description.ilike.%{search}%,category.ilike.%{search}%"
            )

        # Apply backend sorting
        valid_sort_fields = ["created_at", "title", "status", "category"]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"

        desc = sort_order.lower() == "desc"
        query = query.order(sort_by, desc=desc)

        # Apply strict pagination
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
    """
    Get the top users leaderboard for the current user's university.
    Returns top 10 users ranked by successful returns.
    """
    try:
        # Get user's university with timeout protection
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
            # Return empty leaderboard if no university set
            return []

        # Try RPC first, fallback to direct query if it fails
        try:
            leaderboard_res = supabase.rpc(
                "get_leaderboard_for_university",
                {"p_university_id": university_id, "p_limit": 10},
            ).execute()

            return leaderboard_res.data if leaderboard_res.data else []
        except Exception as rpc_error:
            # Log the specific RPC error and try fallback
            print(f"Leaderboard RPC error (trying fallback): {str(rpc_error)}")

            # Fallback: Direct query approach
            try:
                # Get profiles from same university with their stats
                profiles_res = (
                    supabase.table("profiles")
                    .select("id, full_name, email, avatar_url, successful_returns")
                    .eq("university_id", university_id)
                    .order("successful_returns", desc=True)
                    .limit(10)
                    .execute()
                )

                return profiles_res.data if profiles_res.data else []
            except Exception as fallback_error:
                print(f"Leaderboard fallback error: {str(fallback_error)}")
                return []

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"Leaderboard error: {str(e)}")
        # Return empty leaderboard gracefully instead of 500 error
        return []


@router.post("/generate-description")
async def generate_description(payload: DescriptionRequest):
    """
    Rewrite and enhance user's draft description using AI.
    Makes descriptions clearer and more helpful for matching.
    Supports Taglish for Philippine universities.
    """
    if not model:
        raise HTTPException(status_code=503, detail="AI features are not available.")

    try:
        prompt = f"""
        A user in a Philippine university provided a draft description for a lost or found item.
        Rewrite and enhance it to be clear, detailed, and effective.
        Use simple English but feel free to use common Taglish (Tagalog-English) words if it makes sense (e.g., 'cellphone', 'keychain', 'tumbler').

        Original Information:
        - Item Title: "{payload.title}"
        - Category: "{payload.category}"
        - User's Draft Description: "{payload.draft_description}"

        Your task:
        - Refine the language to be clear and concise.
        - Organize the details logically.
        - If key details (brand, color, size, unique marks) are missing, add placeholders like [Specify Color] or [Describe any unique marks/stickers].
        - Ensure the tone is helpful.
        - Return only the improved description text.
        """
        response = await model.generate_content_async(prompt)
        return {"description": response.text.strip()}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to generate AI description: {str(e)}"
        )


@router.post("/ai/suggest-details-from-image")
async def suggest_details_from_image(
    image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)
):
    """
    TASK 3: Analyze an uploaded image to suggest title and category.
    Uses Gemini Vision AI to extract descriptive keywords from the image.
    """
    if not model:
        raise HTTPException(status_code=503, detail="AI features are not available.")

    try:
        print("\n🤖 [AI SUGGEST] Analyzing image for suggestions...")

        # Read and process the image
        image_bytes = await image_file.read()
        max_image_size = int(os.getenv("MAX_IMAGE_SIZE", "5242880"))

        # Resize if too large
        if len(image_bytes) > max_image_size:
            image_bytes = await run_in_threadpool(
                process_image_efficiently, image_bytes
            )

        # Load image for AI analysis
        pil_image = Image.open(io.BytesIO(image_bytes))

        # Use Gemini Vision to analyze the image
        prompt = """
        Analyze this image of a lost or found item. Describe what you see in a concise way.
        Focus on:
        - Object type (e.g., wallet, phone, backpack, ID card, water bottle)
        - Color(s)
        - Brand (if visible)
        - Any distinguishing features

        Provide your response in this exact format:
        Object: [type]
        Color: [color]
        Keywords: [comma-separated relevant keywords]

        Be specific but brief.
        """

        response = await model.generate_content_async([prompt, pil_image])
        analysis_text = response.text.strip()

        print(f"📸 AI Analysis: {analysis_text}")

        # Parse the response to extract object type and keywords
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
                keywords_str = line.replace("Keywords:", "").strip()
                keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]

        # Generate suggested title
        if color and object_type:
            suggested_title = f"{color} {object_type}".title()
        elif object_type:
            suggested_title = object_type.title()
        else:
            suggested_title = "Item"

        # Map to category
        # Common categories: Electronics, Accessories, Documents, Clothing, Bags, Books, Keys, Others
        category_mapping = {
            "phone": "Electronics",
            "cellphone": "Electronics",
            "smartphone": "Electronics",
            "laptop": "Electronics",
            "tablet": "Electronics",
            "earphone": "Electronics",
            "headphone": "Electronics",
            "charger": "Electronics",
            "powerbank": "Electronics",
            "wallet": "Accessories",
            "watch": "Accessories",
            "bracelet": "Accessories",
            "necklace": "Accessories",
            "ring": "Accessories",
            "glasses": "Accessories",
            "sunglasses": "Accessories",
            "umbrella": "Accessories",
            "id": "Documents",
            "card": "Documents",
            "license": "Documents",
            "certificate": "Documents",
            "notebook": "Books",
            "book": "Books",
            "textbook": "Books",
            "jacket": "Clothing",
            "shirt": "Clothing",
            "pants": "Clothing",
            "shoes": "Clothing",
            "bag": "Bags",
            "backpack": "Bags",
            "purse": "Bags",
            "pouch": "Bags",
            "key": "Keys",
            "keychain": "Keys",
            "bottle": "Others",
            "tumbler": "Others",
            "lunchbox": "Others",
        }

        suggested_category = "Others"  # Default
        object_lower = object_type.lower()

        # Check for matches in category mapping
        for keyword, category in category_mapping.items():
            if keyword in object_lower:
                suggested_category = category
                break

        # Also check keywords
        if suggested_category == "Others":
            for kw in keywords:
                kw_lower = kw.lower()
                for keyword, category in category_mapping.items():
                    if keyword in kw_lower:
                        suggested_category = category
                        break
                if suggested_category != "Others":
                    break

        pil_image.close()

        result = {
            "suggestedTitle": suggested_title,
            "suggestedCategory": suggested_category,
            "analysis": analysis_text,
            "confidence": "high" if object_type else "low",
        }

        print(f"✅ Suggestions: {result}")
        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")


@router.post("/create")
async def create_item(
    item_data: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new lost or found item post.
    Generates AI tags and embeddings for smart matching.
    Applies university moderation settings before publishing.
    """
    try:
        print("\n🧩 --- [CREATE ITEM] ---")

        # Parse the item data from form
        item = ItemCreate.parse_raw(item_data)

        # Fetch profile + university
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

        # Get university moderation settings
        uni_settings = await get_university_settings(university_id)

        # Apply moderation rules
        moderation_status = "pending"
        post_content = f"{item.title.lower()} {item.description.lower()}"
        if uni_settings["keyword_blacklist"] and any(
            keyword in post_content for keyword in uni_settings["keyword_blacklist"]
        ):
            moderation_status = "pending"
        elif uni_settings["auto_approve_posts"]:
            moderation_status = "approved"

        # Generate AI tags for better searchability
        ai_tags = await generate_ai_tags(item.title, item.description)

        # Prepare text for embedding
        combined_text = f"Title: {item.title}. Description: {item.description}. Location: {item.location}. Category: {item.category}."

        image_url = None
        thumbnail_url = None
        pil_image = None
        image_embedding = None
        text_embedding = None

        # Upload and process image if provided
        if image_file:
            image_bytes = await image_file.read()
            max_image_size = int(os.getenv("MAX_IMAGE_SIZE", "5242880"))

            # Optimize image for embedding: resize first if too large
            if len(image_bytes) > max_image_size:
                image_bytes = await run_in_threadpool(
                    process_image_efficiently, image_bytes
                )

            # Load and resize to optimal size for Jina (800x800 max)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            pil_image.thumbnail((800, 800), Image.Resampling.LANCZOS)
            print(
                f"📸 Image resized for embedding: {type(pil_image)} Size: {pil_image.size}"
            )

            # Re-save the resized image for storage
            output_bytes_io = io.BytesIO()
            pil_image.save(output_bytes_io, format="JPEG", quality=90)
            image_bytes_for_storage = output_bytes_io.getvalue()

            # Create thumbnail (200x200) for list views
            thumbnail_image = pil_image.copy()
            thumbnail_image.thumbnail((200, 200), Image.Resampling.LANCZOS)
            thumbnail_bytes_io = io.BytesIO()
            thumbnail_image.save(thumbnail_bytes_io, format="JPEG", quality=85)
            thumbnail_bytes = thumbnail_bytes_io.getvalue()

            file_suffix = Path(image_file.filename or ".jpg").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            thumbnail_path = f"public/{user_id}/{uuid4().hex}_thumb{file_suffix}"

            # Upload original image
            supabase.storage.from_("item_images").upload(
                path=file_path,
                file=image_bytes_for_storage,
                file_options={"content-type": "image/jpeg"},
            )
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

            # Upload thumbnail
            supabase.storage.from_("item_images").upload(
                path=thumbnail_path,
                file=thumbnail_bytes,
                file_options={"content-type": "image/jpeg"},
            )
            thumbnail_url = supabase.storage.from_("item_images").get_public_url(
                thumbnail_path
            )

            # Generate image embedding (image only, no text)
            print("🔹 Generating image embedding...")
            image_embedding = await jina_embedding_util.get_multimodal_embedding(
                text=None, image=pil_image
            )
            if image_embedding and not all(v == 0.0 for v in image_embedding):
                print(f"✅ Image embedding successful (dim={len(image_embedding)})")
            else:
                print("⚠️ Image embedding failed")
                image_embedding = None

            pil_image.close()

        # Generate text embedding (always, text only)
        print("🔹 Generating text embedding...")
        text_embedding = await jina_embedding_util.get_multimodal_embedding(
            text=combined_text, image=None
        )
        if text_embedding and not all(v == 0.0 for v in text_embedding):
            print(f"✅ Text embedding successful (dim={len(text_embedding)})")
        else:
            print("⚠️ Text embedding failed")
            text_embedding = None

        # Save item to database
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

        insert_response = supabase.table("items").insert(post_data).execute()
        new_item = insert_response.data[0]

        # Notify admins if post needs moderation
        if moderation_status == "pending":
            admins_res = (
                supabase.table("profiles")
                .select("id")
                .eq("university_id", university_id)
                .eq("role", "admin")
                .execute()
            )
            if admins_res.data:
                message = f"New item '{item.title}' from {user_full_name} is awaiting moderation."
                for admin in admins_res.data:
                    create_notification(
                        recipient_id=admin["id"],
                        university_id=university_id,
                        message=message,
                        link_to="/admin/post-moderation",
                        type="moderation",
                    )

        # TASK 2: Award badges for posting achievements
        # Check if this is user's first post
        user_post_count_res = (
            supabase.table("items")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        if user_post_count_res.count == 1:  # Just posted their first item
            award_badge(user_id, "New Member", university_id)

        # Check if user reached 10 Found items for Eagle Eye badge
        if item.status == "Found":
            found_count_res = (
                supabase.table("items")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("status", "Found")
                .execute()
            )
            if found_count_res.count == 10:
                award_badge(user_id, "Eagle Eye", university_id)

        # TASK 1: Trigger proactive matching if this is a "Found" item and it's approved
        if item.status == "Found" and moderation_status == "approved":
            # Run proactive matching asynchronously (non-blocking)
            asyncio.create_task(find_proactive_matches(new_item, university_id))

        print(
            f"✅ Item created with text_embedding (dim={len(text_embedding) if text_embedding else 0}) and image_embedding (dim={len(image_embedding) if image_embedding else 0})"
        )
        return {"data": new_item}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-search")
async def search_by_image(
    image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)
):
    """
    Search for similar items using an uploaded image.
    Uses AI-powered image embeddings for visual matching.
    """
    try:
        print("\n🔍 --- [IMAGE SEARCH DEBUG] ---")

        # Get user's university
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
        print(f"🏫 University ID: {university_id}")

        # Check how many items exist with image embeddings
        count_check = (
            supabase.table("items")
            .select("id", count="exact")
            .eq("university_id", university_id)
            .not_.is_("image_embedding", "null")
            .eq("moderation_status", "approved")
            .execute()
        )
        print(
            f"📊 Total items with image embeddings in this university: {count_check.count}"
        )

        # Read and convert uploaded image
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print(f"📸 Search image: {pil_image.size} - {pil_image.mode}")

        # Resize if too large (helps with API timeouts)
        max_search_size = (800, 800)
        if (
            pil_image.size[0] > max_search_size[0]
            or pil_image.size[1] > max_search_size[1]
        ):
            pil_image.thumbnail(max_search_size, Image.Resampling.LANCZOS)
            print(f"📐 Resized search image to: {pil_image.size}")

        # Generate image embedding (image only, no text)
        print("🔹 Generating Jina image embedding for search...")
        query_embedding = await jina_embedding_util.get_multimodal_embedding(
            text=None, image=pil_image
        )
        pil_image.close()

        if not query_embedding:
            print("❌ Embedding generation returned None")
            return {"results": [], "message": "Failed to generate image embedding"}

        if all(v == 0.0 for v in query_embedding):
            print("❌ Embedding is all zeros")
            return {"results": [], "message": "Invalid embedding generated"}

        print(f"✅ Query embedding generated (dim={len(query_embedding)})")
        print(f"🔢 First 5 values: {query_embedding[:5]}")

        # Search using RPC with threshold of 0.6
        try:
            print(f"🔍 Calling RPC with threshold=0.6, count=10...")
            matches = supabase.rpc(
                "match_items_by_image_embedding",
                {
                    "p_university_id": university_id,
                    "p_query_embedding": query_embedding,
                    "p_match_threshold": 0.7,
                    "p_match_count": 10,
                },
            ).execute()

            print(f"✅ RPC returned {len(matches.data) if matches.data else 0} matches")

            if matches.data and len(matches.data) > 0:
                for idx, match in enumerate(matches.data[:3]):
                    print(
                        f"  Match {idx+1}: {match.get('title')} - similarity: {match.get('similarity', 'N/A'):.4f}"
                    )
                return {"results": matches.data, "message": f"Found {len(matches.data)} results"}
            else:
                print("❌ No matches found with similarity >= 0.6")
                return {"results": [], "message": "No similar items found"}

        except Exception as rpc_error:
            print(f"❌ RPC call failed: {str(rpc_error)}")
            traceback.print_exc()

            # Check if it's a dimension mismatch error
            error_str = str(rpc_error).lower()
            if "dimension" in error_str or "expected" in error_str:
                return {
                    "results": [],
                    "message": "Database dimension mismatch - please contact admin",
                    "error": "The database function expects a different embedding dimension",
                }

            return {"results": [], "message": f"Search failed: {str(rpc_error)}"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")


@router.get("/find-matches/{item_id}")
async def find_matches(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Find AI-powered matches for a specific 'Lost' item.
    Uses weighted scoring based on both text and image similarity.
    Returns up to 4 potential matches.
    """
    try:
        # Security check: Verify the item belongs to the user and is 'Lost'
        item_res = (
            supabase.table("items")
            .select("university_id, user_id, status")
            .eq("id", item_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if not item_res.data:
            raise HTTPException(
                status_code=404, detail="Item not found or you are not the owner."
            )

        if item_res.data["status"] != "Lost":
            print(f"Match check skipped: Item {item_id} is not a 'Lost' item.")
            return []

        # Call RPC function to find matches
        TEXT_WEIGHT = 0.6  # Weight for text similarity
        IMAGE_WEIGHT = 0.4  # Weight for image similarity
        MATCH_THRESHOLD = 0.7  # Minimum combined score (70%)
        MATCH_COUNT = 4  # Number of matches to return

        print(f"🔍 Finding matches for Lost Item ID: {item_id}...")
        matches_res = supabase.rpc(
            "find_matches_for_lost_item",
            {
                "p_item_id": item_id,
                "p_text_weight": TEXT_WEIGHT,
                "p_image_weight": IMAGE_WEIGHT,
                "p_match_threshold": MATCH_THRESHOLD,
                "p_match_count": MATCH_COUNT,
            },
        ).execute()

        if matches_res.data:
            print(f"✅ Found {len(matches_res.data)} matches for item {item_id}.")
            return matches_res.data
        else:
            print(
                f"❌ No matches found for item {item_id} above threshold {MATCH_THRESHOLD}."
            )
            return []

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"An error occurred while finding matches: {str(e)}"
        )


@router.put("/{item_id}/recover")
async def mark_as_recovered(
    item_id: int, user_id: str = Depends(get_current_user_id)
):
    """
    Mark an item as 'recovered' and close the case.
    Can only be done by the poster or the approved claimant.
    """
    try:
        # Get item details
        item_res = (
            supabase.table("items")
            .select("user_id, title, university_id")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")

        finder_id = item_res.data["user_id"]
        university_id = item_res.data["university_id"]

        # Find the approved claimant (if any)
        claim_res = (
            supabase.table("claims")
            .select("claimant_id")
            .eq("item_id", item_id)
            .eq("status", "approved")
            .execute()
        )

        approved_claimant_id = claim_res.data[0]["claimant_id"] if claim_res.data else None

        # Security check: Only poster or approved claimant can mark as recovered
        if user_id not in [finder_id, approved_claimant_id]:
            raise HTTPException(
                status_code=403, detail="You are not authorized to perform this action."
            )

        # Update the item status to recovered
        supabase.table("items").update({"moderation_status": "recovered"}).eq(
            "id", item_id
        ).execute()

        # Notify both parties
        message = f"The item '{item_res.data['title']}' has been marked as recovered. This case is now closed."
        if finder_id:
            create_notification(
                recipient_id=finder_id,
                university_id=university_id,
                message=message,
                link_to="/dashboard/my-posts",
                type="moderation",
            )
        if approved_claimant_id and approved_claimant_id != finder_id:
            create_notification(
                recipient_id=approved_claimant_id,
                university_id=university_id,
                message=message,
                link_to="/dashboard/my-posts",
                type="moderation",
            )

        return {"message": "Item marked as recovered."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
