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
        model = genai.GenerativeModel('gemini-2.5-flash') 
        print(" Gemini AI model configured successfully.")
    except Exception as e:
        print(f" ERROR: Could not configure Gemini AI: {e}")
else:
    print(" WARNING: GEMINI_API_KEY not found. AI features disabled.")

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



@item_router.post("/create")
async def create_item_with_tags(
    item_data: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id)
):
    try:
        item = ItemCreate.parse_raw(item_data)
        image_url = None
        image_embedding = None

        if image_file:
            # Generate embedding from the image
            image_bytes = await image_file.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
            image_embedding = get_image_embedding(pil_image)
            
            # Upload image to storage
            file_suffix = Path(image_file.filename or "").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            supabase.storage.from_("item_images").upload(path=file_path, file=image_bytes, file_options={"content-type": image_file.content_type})
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data: raise HTTPException(status_code=404, detail="User profile not found.")
        
        post_data = {
            "title": item.title, "description": item.description, "status": item.status,
            "category": item.category, "location": item.location, "contact_info": item.contact_info,
            "image_url": image_url, "user_id": user_id,
            "university_id": profile_res.data['university_id'],
            "image_embedding": image_embedding, # Save the embedding
        }

        insert_response = supabase.table("items").insert(post_data).execute()
        return {"data": insert_response.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: CLIP Image Search Endpoint ---
@item_router.post("/image-search")
async def search_by_image_clip(
    image_file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    try:
        # 1. Get user's university to scope the search
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data['university_id']

        # 2. Generate embedding for the search image
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes))
        query_embedding = get_image_embedding(pil_image)

        # 3. Call the updated database function with all parameters
        print(f"➡️ Searching in university {university_id} with similarity > 0.75...")
        matches = supabase.rpc('match_items_by_embedding', {
            'p_university_id': university_id, # Pass the university ID
            'p_query_embedding': query_embedding,
            'p_match_threshold': 0.75,  # Lowered threshold for better testing
            'p_match_count': 10
        }).execute()
        
        print(f"✅ Found {len(matches.data)} matches.")
        return matches.data

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@item_router.post("/create")
async def create_item_with_tags(item_data: str = Form(...), image_file: Optional[UploadFile] = File(None), user_id: str = Depends(get_current_user_id)):
    try:
        item = ItemCreate.parse_raw(item_data)
        ai_tags = await generate_ai_tags(item.title, item.description)
        image_url = None
        if image_file:
            file_suffix = Path(image_file.filename or "").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            supabase.storage.from_("item_images").upload(path=file_path, file=await image_file.read(), file_options={"content-type": image_file.content_type})
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data: raise HTTPException(status_code=404, detail="User profile not found.")
        post_data = {
            "title": item.title, "description": item.description, "status": item.status,
            "category": item.category, "location": item.location, "contact_info": item.contact_info,
            "ai_tags": ai_tags, "image_url": image_url, "user_id": user_id,
            "university_id": profile_res.data['university_id'],
        }
        insert_response = supabase.table("items").insert(post_data).execute()
        return {"data": insert_response.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: Matching Algorithm Endpoint ---
@item_router.get("/find-matches/{lost_item_id}")
async def find_matches(lost_item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        # 1. Fetch the original lost item
        lost_item_res = supabase.table("items").select("*").eq("id", lost_item_id).eq("user_id", user_id).single().execute()
        if not lost_item_res.data:
            raise HTTPException(status_code=404, detail="Lost item not found or does not belong to user.")
        lost_item = lost_item_res.data

        # 2. Fetch all potential 'Found' items from the same university
        found_items_res = supabase.table("items").select("*").eq("university_id", lost_item['university_id']).eq("status", "Found").eq("moderation_status", "approved").execute()
        
        matches = []
        # 3. Calculate score for each potential match
        for found_item in found_items_res.data:
            score = calculate_match_score(lost_item, found_item)
            if score > 40: # Set a threshold to only show relevant matches
                matches.append({**found_item, "match_score": score})
        
        # 4. Sort by score and return the top 5
        sorted_matches = sorted(matches, key=lambda x: x['match_score'], reverse=True)
        return sorted_matches[:5]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# (All other endpoints remain the same)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
@app.get("/")
def read_root(): return {"status": "Campus Trace backend is running!"}
