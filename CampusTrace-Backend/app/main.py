import os
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from typing import List, Optional
import traceback
from PIL import Image
import io
import google.generativeai as genai
import httpx

# Corrected relative imports for the 'app' directory structure
from app.config import get_settings
from app.matching_algorithm import calculate_match_score
from app.clip_util import get_image_embedding

# --- Configuration ---
settings = get_settings()
supabase: Client = create_client(settings.PYTHON_SUPABASE_URL, settings.PYTHON_SUPABASE_KEY)
model = None
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("Gemini AI model configured successfully.")
    except Exception as e:
        print(f"ERROR: Could not configure Gemini AI: {e}")
else:
    print("WARNING: GEMINI_API_KEY not found. AI features disabled.")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Pydantic Models =============
class UniversityRegistrationRequest(BaseModel):
    university_name: str
    full_name: str
    email: EmailStr
    password: str

class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    captchaToken: str

class ItemCreate(BaseModel):
    title: str
    description: str
    status: str
    category: str
    location: str
    contact_info: Optional[str] = None

class BanUpdate(BaseModel): is_banned: bool
class RoleUpdate(BaseModel): role: str
class StatusUpdate(BaseModel): moderation_status: str

# ============= Routers =============
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
item_router = APIRouter(prefix="/api/items", tags=["Items"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])
onboarding_router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ============= Onboarding Route (NEW) =============
@onboarding_router.post("/register-university")
async def register_university(payload: UniversityRegistrationRequest):
    new_university_id = None
    new_user_id = None
    try:
        # 1. Check if university or email already exists
        uni_exists = supabase.table("universities").select("id").eq("name", payload.university_name).execute()
        if uni_exists.data:
            raise HTTPException(status_code=400, detail="A university with this name already exists.")
        
        user_exists_res = supabase.from_("profiles").select("id").eq("email", payload.email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # 2. Create the new university with 'pending' status
        new_university_res = supabase.table("universities").insert({"name": payload.university_name, "status": "pending"}).execute()
        new_university_id = new_university_res.data[0]['id']

        # 3. Add the admin's email domain BEFORE creating the user
        admin_domain = payload.email.split('@')[1]
        supabase.table("allowed_domains").insert({
            "university_id": new_university_id,
            "domain_name": admin_domain
        }).execute()

        # 4. Create the admin user in Supabase Auth (trigger will now find the domain)
        created_user_res = supabase.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True
        })
        new_user = created_user_res.user
        new_user_id = new_user.id

        # 5. Update the profile with admin role and full name (trigger already created it)
        supabase.table("profiles").update({
            "full_name": payload.full_name,
            "role": "admin"
        }).eq("id", new_user.id).execute()

        # 6. Activate the university
        supabase.table("universities").update({"status": "active"}).eq("id", new_university_id).execute()

        return {"message": f"University '{payload.university_name}' created successfully. The admin can now log in."}

    except HTTPException as http_exc:
        if new_user_id:
            supabase.auth.admin.delete_user(new_user_id)
        if new_university_id:
            supabase.table("universities").delete().eq("id", new_university_id).execute()
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        if new_user_id:
            supabase.auth.admin.delete_user(new_user_id)
        if new_university_id:
            supabase.table("universities").delete().eq("id", new_university_id).execute()
        raise HTTPException(status_code=500, detail="An internal error occurred during university registration.")
    
# ============= Helper Functions =============
async def get_current_user_id(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = token.split("Bearer ")[1]
    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_captcha(token: str, client_ip: Optional[str]):
    if not settings.RECAPTCHA_SECRET_KEY:
        print("⚠️ WARNING: RECAPTCHA_SECRET_KEY not set. Skipping verification for development.")
        return True # Skip in dev if key is not set

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": settings.RECAPTCHA_SECRET_KEY,
                "response": token,
                "remoteip": client_ip,
            },
        )
        result = response.json()
        if not result.get("success"):
            print(f"❌ CAPTCHA verification failed: {result.get('error-codes')}")
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed.")
        print("✅ CAPTCHA verified successfully.")
        return True

def create_notification(recipient_id: str, message: str, link_to: Optional[str] = None, type: str = 'general'):
    try:
        supabase.table("notifications").insert({
            "recipient_id": recipient_id,
            "message": message,
            "link_to": link_to,
            "type": type,
        }).execute()
        print(f"✅ Notification created for user {recipient_id}")
    except Exception as e:
        print(f"❌ Error creating notification: {e}")

async def generate_ai_tags(title: str, description: str) -> Optional[List[str]]:
    if not model: return []
    try:
        prompt = f"Generate 5-7 relevant, comma-separated keywords for this item. Do not use hashtags. Keywords should include item type, color, brand, and features. Title: '{title}'. Description: '{description}'"
        response = await model.generate_content_async(prompt)
        tags_string = response.text.strip().replace("#", "")
        tags_list = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        return tags_list[:7]
    except Exception as e:
        print(f"❌ Error generating AI tags: {e}")
        return []

# ============= Auth Routes =============
@auth_router.post("/signup")
async def handle_signup(payload: AuthRequest, request: Request):
    await verify_captcha(payload.captchaToken, request.client.host)
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
        return response
    except Exception as e:
        if hasattr(e, 'message'):
            raise HTTPException(status_code=400, detail=e.message)
        raise HTTPException(status_code=500, detail="An internal error occurred during sign-up.")

# ============= Item Routes =============
@item_router.post("/create")
async def create_item(item_data: str = Form(...), image_file: Optional[UploadFile] = File(None), user_id: str = Depends(get_current_user_id)):
    try:
        item = ItemCreate.parse_raw(item_data)
        ai_tags = await generate_ai_tags(item.title, item.description)
        image_url, image_embedding = None, None

        if image_file:
            image_bytes = await image_file.read()
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

        if new_item['status'] == 'Found':
            lost_items_res = supabase.table("items").select("*, profiles(id, full_name, email)").eq("university_id", new_item['university_id']).eq("status", "Lost").execute()
            for lost_item in lost_items_res.data:
                if lost_item['user_id'] != new_item['user_id']:
                    score = calculate_match_score(lost_item, new_item)
                    if score > 70:
                        message = f"Potential Match Found! A recently found item, '{new_item['title']}', is a {score}% match for your lost item: '{lost_item['title']}'."
                        create_notification(recipient_id=lost_item['user_id'], message=message, link_to="/dashboard/browse-all", type='match')
        
        return {"data": new_item}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@item_router.post("/image-search")
async def search_by_image(image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
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
        found_items_res = supabase.table("items").select("*, profiles(id, full_name, email)").eq("university_id", lost_item['university_id']).eq("status", "Found").eq("moderation_status", "approved").execute()
        matches = []
        for found_item in found_items_res.data:
            score = calculate_match_score(lost_item, found_item)
            if score > 40: matches.append({**found_item, "match_score": score})
        return sorted(matches, key=lambda x: x['match_score'], reverse=True)[:5]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============= Admin Routes =============
@admin_router.post("/items/{item_id}/status")
async def set_item_status(item_id: str, data: StatusUpdate, admin_id: str = Depends(get_current_user_id)):
    item_res = supabase.table("items").select("user_id, title").eq("id", item_id).single().execute()
    if not item_res.data:
        raise HTTPException(status_code=404, detail="Item not found.")
    
    item_owner_id = item_res.data['user_id']
    item_title = item_res.data['title']
    resp = supabase.table("items").update({"moderation_status": data.moderation_status}).eq("id", item_id).execute()
    
    message = f"An admin has updated your post '{item_title}' to a status of: {data.moderation_status}."
    create_notification(recipient_id=item_owner_id, message=message, link_to="/dashboard/my-posts", type='moderation')
    
    return {"updated": resp.data}

@admin_router.post("/users/{user_id}/ban")
async def set_user_ban(user_id: str, data: BanUpdate, admin_id: str = Depends(get_current_user_id)):
    resp = supabase.table("profiles").update({"is_banned": data.is_banned}).eq("id", user_id).execute()
    return {"updated": resp.data}

@admin_router.post("/users/{user_id}/role")
async def set_user_role(user_id: str, data: RoleUpdate, admin_id: str = Depends(get_current_user_id)):
    resp = supabase.table("profiles").update({"role": data.role}).eq("id", user_id).execute()
    return {"updated": resp.data}

# ============= Profile Route =============
@profile_router.put("/")
async def update_profile(full_name: Optional[str] = Form(None), avatar: Optional[UploadFile] = File(None), current_user_id: str = Depends(get_current_user_id)):
    try:
        updates = {}
        if full_name is not None:
            updates["full_name"] = full_name.strip()
        if avatar is not None:
            file_suffix = Path(avatar.filename or "other_images").suffix
            filename = f"{current_user_id}/{uuid4().hex}{file_suffix}"
            file_bytes = await avatar.read()
            supabase.storage.from_("other_images").upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": avatar.content_type or "application/octet-stream", "upsert": "true"}
            )
            public_url = supabase.storage.from_("other_images").get_public_url(filename)
            # Add a timestamp to bust the cache
            updates["avatar_url"] = f"{public_url}?t={uuid4().hex}"

        if not updates:
            raise HTTPException(status_code=400, detail="No update information provided.")
        
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        profile_result = supabase.table("profiles").select("id, full_name, email, avatar_url, role, is_banned").eq("id", current_user_id).single().execute()
        return {"profile": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============= Include Routers =============
app.include_router(auth_router)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(notification_router)
app.include_router(onboarding_router)

# ============= Root Route =============
@app.get("/")
def read_root():
    return {"status": "Campus Trace backend is running!", "ai_enabled": model is not None}