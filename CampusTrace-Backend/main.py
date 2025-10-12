import os
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware 
from fastapi import APIRouter
from typing import List, Optional
import traceback
from PIL import Image
import io 
import google.generativeai as genai

# --- FIX: Corrected relative imports ---
from config import get_settings  
from matching_algorithm import calculate_match_score
from clip_util import get_image_embedding 

# --- Configuration ---
settings = get_settings()
supabase: Client = create_client(settings.PYTHON_SUPABASE_URL, settings.PYTHON_SUPABASE_KEY)
model = None
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash') 
        print("✅ Gemini AI model configured successfully.")
    except Exception as e:
        print(f"⚠️ ERROR: Could not configure Gemini AI: {e}")
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found. AI features disabled.")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Demo Mode Hardcoded User ---
DEMO_USER_ID = "d7d24006-3750-4723-82cd-440351fa4495" 
async def get_current_user_id(): return DEMO_USER_ID
async def require_admin(): return DEMO_USER_ID

# --- Pydantic Models ---
class ItemCreate(BaseModel): title: str; description: str; status: str; category: str; location: str; contact_info: Optional[str] = None
class BanUpdate(BaseModel): is_banned: bool
class RoleUpdate(BaseModel): role: str
class StatusUpdate(BaseModel): moderation_status: str

item_router = APIRouter(prefix="/api/items", tags=["Items"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])
profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# --- Helper Function to Create Notifications ---
def create_notification(recipient_id: str, message: str, link_to: Optional[str] = None):
    try:
        supabase.table("notifications").insert({
            "recipient_id": recipient_id,
            "message": message,
            "link_to": link_to
        }).execute()
        print(f"✅ Notification created for user {recipient_id}")
    except Exception as e:
        print(f"❌ Error creating notification: {e}")

async def generate_ai_tags(title: str, description: str) -> Optional[List[str]]:
    if not model: return None
    try:
        prompt = f"Generate 5-7 relevant, comma-separated keywords for this item. Do not use hashtags. Keywords should include item type, color, brand, and features. Title: '{title}'. Description: '{description}'"
        response = await model.generate_content_async(prompt)
        tags_string = response.text.strip().replace("#", "")
        tags_list = [tag.strip() for tag in tags_string.split(',') if tag.strip()]
        return tags_list
    except Exception as e:
        print(f"❌ Error generating AI tags: {e}")
        return None

# --- API Endpoints ---

@item_router.post("/create")
async def create_item_with_tags(item_data: str = Form(...), image_file: Optional[UploadFile] = File(None), user_id: str = Depends(get_current_user_id)):
    try:
        item = ItemCreate.parse_raw(item_data)
        ai_tags = await generate_ai_tags(item.title, item.description)
        image_url, image_embedding = None, None

        if image_file:
            image_bytes = await image_file.read()
            # Reset buffer to the beginning before reading again
            await image_file.seek(0) 
            pil_image = Image.open(io.BytesIO(await image_file.read()))
            image_embedding = get_image_embedding(pil_image)
            
            file_suffix = Path(image_file.filename or "").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            supabase.storage.from_("item_images").upload(path=file_path, file=image_bytes, file_options={"content-type": image_file.content_type or "application/octet-stream"})
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data: raise HTTPException(status_code=404, detail="User profile not found.")
        
        post_data = { "title": item.title, "description": item.description, "status": item.status, "category": item.category, "location": item.location, "contact_info": item.contact_info, "ai_tags": ai_tags, "image_url": image_url, "user_id": user_id, "university_id": profile_res.data['university_id'], "image_embedding": image_embedding }
        insert_response = supabase.table("items").insert(post_data).execute()
        new_item = insert_response.data[0]

        # --- Trigger Matching for Notifications ---
        if new_item['status'] == 'Found':
            lost_items_res = supabase.table("items").select("*").eq("university_id", new_item['university_id']).eq("status", "Lost").execute()
            for lost_item in lost_items_res.data:
                if lost_item['user_id'] != new_item['user_id']:
                    score = calculate_match_score(lost_item, new_item)
                    if score > 70:
                        message = f"Potential Match Found! A new item, '{new_item['title']}', is a {score}% match for your lost item: '{lost_item['title']}'."
                        create_notification(recipient_id=lost_item['user_id'], message=message, link_to="/dashboard/browse-all")
        
        return {"data": new_item}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@item_router.post("/image-search")
async def search_by_image_clip(image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data: raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data['university_id']
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes))
        query_embedding = get_image_embedding(pil_image)
        matches = supabase.rpc('match_items_by_embedding', {'p_university_id': university_id, 'p_query_embedding': query_embedding, 'p_match_threshold': 0.75, 'p_match_count': 10}).execute()
        return matches.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@item_router.get("/find-matches/{lost_item_id}")
async def find_matches(lost_item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        lost_item_res = supabase.table("items").select("*").eq("id", lost_item_id).eq("user_id", user_id).single().execute()
        if not lost_item_res.data: raise HTTPException(status_code=404, detail="Lost item not found.")
        lost_item = lost_item_res.data
        found_items_res = supabase.table("items").select("*").eq("university_id", lost_item['university_id']).eq("status", "Found").eq("moderation_status", "approved").execute()
        matches = []
        for found_item in found_items_res.data:
            score = calculate_match_score(lost_item, found_item)
            if score > 40: matches.append({**found_item, "match_score": score})
        return sorted(matches, key=lambda x: x['match_score'], reverse=True)[:5]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- NOTIFICATION LOGIC FOR MODERATION ---
@admin_router.post("/items/{item_id}/status")
async def set_status(item_id: str, data: StatusUpdate, admin_id: str = Depends(require_admin)):
    item_res = supabase.table("items").select("user_id, title").eq("id", item_id).single().execute()
    if not item_res.data:
        raise HTTPException(status_code=404, detail="Item not found.")
    
    item_owner_id = item_res.data['user_id']
    item_title = item_res.data['title']
    resp = supabase.table("items").update({"moderation_status": data.moderation_status}).eq("id", item_id).execute()
    
    message = f"Your post '{item_title}' has been {data.moderation_status} by an admin."
    create_notification(recipient_id=item_owner_id, message=message, link_to="/dashboard/my-posts")
    
    return {"updated": resp.data}

# (Other admin and profile endpoints)
@admin_router.post("/users/{user_id}/ban")
async def set_ban(user_id: str, data: BanUpdate, admin_id: str = Depends(require_admin)):
    resp = supabase.table("profiles").update({"is_banned": data.is_banned}).eq("id", user_id).execute()
    return {"updated": resp.data}

@admin_router.post("/users/{user_id}/role")
async def set_role(user_id: str, data: RoleUpdate, admin_id: str = Depends(require_admin)):
    resp = supabase.table("profiles").update({"role": data.role}).eq("id", user_id).execute()
    return {"updated": resp.data}
    
@profile_router.put("/")
async def update_profile(full_name: Optional[str] = Form(None), avatar: Optional[UploadFile] = File(None), current_user_id: str = Depends(get_current_user_id)):
    try:
        updates = {}
        if full_name is not None: updates["full_name"] = full_name.strip()
        if avatar is not None:
            file_suffix = Path(avatar.filename or "avatar").suffix
            filename = f"{current_user_id}/{uuid4().hex}{file_suffix}"
            file_bytes = await avatar.read()
            supabase.storage.from_("other_images").upload(path=filename, file=file_bytes, file_options={"content-type": avatar.content_type or "application/octet-stream", "upsert": "true"})
            updates["avatar_url"] = supabase.storage.from_("other_images").get_public_url(filename)
        if not updates: raise HTTPException(status_code=400, detail="No changes supplied")
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        profile_result = supabase.table("profiles").select("id, full_name, email, avatar_url, role, is_banned").eq("id", current_user_id).single().execute()
        return {"profile": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(notification_router)

@app.get("/")
def read_root(): return {"status": "Campus Trace backend is running!"}

