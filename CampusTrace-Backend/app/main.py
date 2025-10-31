import os
import gc
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from typing import List, Optional
import traceback
from PIL import Image
import io
import google.generativeai as genai
import httpx
import json
import resend
import asyncio
from fastapi.concurrency import run_in_threadpool

from app.config import get_settings
from app.dependencies import get_current_user_id, supabase
from app import jina_embedding_util  # <-- UPDATED from clip_util

# --- Configuration ---
settings = get_settings()
model = None

app = FastAPI(
    title="CampusTrace API",
    description="Lost and Found Platform for Universities",
    version="2.1.0" # <-- UPDATED version
)

# Configure Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    print("Resend client configured.")
else:
    print("WARNING: RESEND_API_KEY not found. Email notifications disabled.")

@app.on_event("startup")
async def startup_event():
    """Load AI models on application startup."""
    global model
    
    # Load Gemini generation/vision model (still used for descriptions/tags)
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.5-flash")
            print("✅ Gemini AI generation/vision model (gemini-2.5-flash) configured successfully.")
        except Exception as e:
            print(f"❌ ERROR: Could not configure Gemini AI: {e}")
    else:
        print("⚠️ WARNING: GEMINI_API_KEY not found. AI generation features disabled.")
    
    # Test Jina embedding model with comprehensive test
    if settings.JINA_API_KEY:
        try:
            await jina_embedding_util.test_jina_embedding()
        except Exception as e:
            print(f"❌ ERROR: Could not test Jina embedding model: {e}")
    else:
        print("⚠️ WARNING: JINA_API_KEY not found. Embedding features will be disabled.")
        
    print(f"Max image size: {int(os.getenv('MAX_IMAGE_SIZE', '5242880')) / 1024 / 1024:.1f}MB")
    print("🚀 Running API with Jina embedding pipeline") # <-- UPDATED message


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global model
    model = None
    gc.collect()
    print("Shutting down gracefully...")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS], # <-- UPDATED to use settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optimize image processing
def process_image_efficiently(image_bytes: bytes, max_size=(1920, 1920)):
    """Process images efficiently."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        # Resize if larger than max_size
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes with good quality
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=90, optimize=True)
        return output.getvalue()

# ============= Pydantic Models =============
class UniversityRegistrationRequest(BaseModel):
    university_name: str
    full_name: str
    email: EmailStr
    password: str

class ManualSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    university_id: int
    captchaToken: str

class UserPreferences(BaseModel):
    match_notifications: bool
    claim_notifications: bool
    message_notifications: bool
    moderation_notifications: bool
    email_notifications_enabled: bool

class VerificationAction(BaseModel):
    approve: bool
    user_id: str

class DescriptionRequest(BaseModel):
    title: str
    category: str
    draft_description: str

class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    captchaToken: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    captchaToken: str

class ItemCreate(BaseModel):
    title: str
    description: str
    status: str
    category: str
    location: str
    contact_info: Optional[str] = None

class ClaimCreate(BaseModel):
    item_id: int
    verification_message: str

class ClaimRespond(BaseModel):
    approved: bool 

class BanUpdate(BaseModel): 
    is_banned: bool
    
class RoleUpdate(BaseModel): 
    role: str
    
class StatusUpdate(BaseModel): 
    moderation_status: str

# ============= Routers =============
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
item_router = APIRouter(prefix="/api/items", tags=["Items"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])
onboarding_router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
claims_router = APIRouter(prefix="/api/claims", tags=["Claims"])
conversations_router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

# ============= Helper Functions =============
async def get_university_settings(university_id: int):
    """Fetches and processes site settings for a given university."""
    try:
        settings_res = supabase.table("site_settings").select("setting_key, setting_value").eq("university_id", university_id).execute()
        if not settings_res.data:
            return {
                "auto_approve_posts": False,
                "keyword_blacklist": []
            }

        settings_map = {item['setting_key']: item['setting_value'] for item in settings_res.data}
        
        return {
            "auto_approve_posts": settings_map.get("auto_approve_posts", "false").lower() == "true",
            "keyword_blacklist": json.loads(settings_map.get("keyword_blacklist", "[]"))
        }
    except Exception as e:
        print(f"Error fetching university settings: {e}")
        return {
            "auto_approve_posts": False,
            "keyword_blacklist": []
        }

async def verify_captcha(token: str, client_ip: Optional[str]):
    if not settings.RECAPTCHA_SECRET_KEY:
        print("WARNING: RECAPTCHA_SECRET_KEY not set. Skipping verification for development.")
        return True 

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
            print(f"CAPTCHA verification failed: {result.get('error-codes')}")
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed.")
        print("CAPTCHA verified successfully.")
        return True

def create_notification(recipient_id: str, university_id: int, message: str, link_to: Optional[str] = None, type: str = 'general'):
    try:
        supabase.table("notifications").insert({
            "recipient_id": recipient_id,
            "university_id": university_id,
            "message": message,
            "link_to": link_to,
            "type": type,
        }).execute()
        print(f"Notification created for user {recipient_id}")
    except Exception as e:
        print(f"Error creating notification: {e}")

async def generate_ai_tags(title: str, description: str) -> Optional[List[str]]:
    """Generate AI tags using Gemini model."""
    if not model:
        return []
    try:
        # <-- UPDATED Taglish/Local context prompt -->
        prompt = f"""
        Generate 5-7 relevant, comma-separated keywords (tags) for a lost or found item in a Philippine university.
        Include item type, color, brand, and potential Taglish (Tagalog-English) terms.
        Do not use hashtags.
        
        Title: '{title}'
        Description: '{description}'
        
        Example:
        Title: 'Black Jansport backpack'
        Description: 'Naiwan sa library, may libro sa loob.'
        Tags: backpack, itim, jansport, bag, library, libro
        """
        response = await model.generate_content_async(prompt)
        tags_string = response.text.strip().replace("#", "")
        tags_list = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        return tags_list[:7]
    except Exception as e:
        print(f"Error generating AI tags: {e}")
        return []

def calculate_simple_match_score(lost_item: dict, found_item: dict) -> int:
    """Calculate a simple text-based similarity score (0-100)."""
    score = 0
    
    if lost_item.get("category") == found_item.get("category"):
        score += 40
    
    lost_title = lost_item.get("title", "").lower()
    found_title = found_item.get("title", "").lower()
    lost_keywords = set(lost_title.split())
    found_keywords = set(found_title.split())
    keyword_overlap = len(lost_keywords & found_keywords)
    if keyword_overlap > 0:
        score += min(30, keyword_overlap * 10)
    
    lost_desc = lost_item.get("description", "").lower()
    found_desc = found_item.get("description", "").lower()
    lost_desc_keywords = set(lost_desc.split())
    found_desc_keywords = set(found_desc.split())
    desc_overlap = len(lost_desc_keywords & found_desc_keywords)
    if desc_overlap > 0:
        score += min(20, desc_overlap * 5)
    
    if lost_item.get("location") == found_item.get("location"):
        score += 10
    
    return min(100, score)

# ============= Onboarding Route =============
@onboarding_router.post("/register-university")
async def register_university(payload: UniversityRegistrationRequest):
    new_university_id = None
    new_user_id = None
    try:
        uni_exists = supabase.table("universities").select("id").eq("name", payload.university_name).execute()
        if uni_exists.data:
            raise HTTPException(status_code=400, detail="A university with this name already exists.")
        
        user_exists_res = supabase.from_("profiles").select("id").eq("email", payload.email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        new_university_res = supabase.table("universities").insert({"name": payload.university_name, "status": "pending"}).execute()
        new_university_id = new_university_res.data[0]['id']

        admin_domain = payload.email.split('@')[1]
        supabase.table("allowed_domains").insert({
            "university_id": new_university_id,
            "domain_name": admin_domain
        }).execute()

        sign_up_res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        new_user = sign_up_res.user
        new_user_id = new_user.id

        # Use update instead of upsert since trigger should create it
        supabase.table("profiles").update({
            "full_name": payload.full_name,
            "role": "admin",
            "university_id": new_university_id
        }).eq("id", new_user.id).execute()

        supabase.table("universities").update({"status": "active"}).eq("id", new_university_id).execute()

        return {"message": "University created successfully. Please check your email to verify your account."}

    except HTTPException as http_exc:
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass
        raise HTTPException(status_code=500, detail="An internal error occurred during university registration.")

# ============= Auth Routes =============

# <-- ENTIRELY REPLACED signup_manual WITH THE NEW FIXED VERSION -->
@auth_router.post("/signup-manual")
async def signup_manual(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    university_id: int = Form(...),
    captchaToken: str = Form(...),
    id_file: UploadFile = File(...)
):
    """Handles the entire signup and manual verification submission process for users with personal emails."""
    await verify_captcha(captchaToken, request.client.host)
    
    user = None
    try:
        # Check if user already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # Get the redirect URL - handle both list and string
        redirect_url = None
        if settings.PENDING_APPROVAL_REDIRECT_URL: # <-- Fixed to match config.py
            if isinstance(settings.PENDING_APPROVAL_REDIRECT_URL, list):
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL[0]
            else:
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL

        # Pass metadata (full_name, university_id) in options.data
        signup_options = {
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "university_id": university_id,
                    "is_verified": False,
                    "role": "member"
                }
            }
        }
        
        # Only add redirect_to if we have a valid URL
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        sign_up_res = supabase.auth.sign_up(signup_options)
        
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        user = sign_up_res.user

        # This upsert is now a fallback, as the trigger should handle it.
        supabase.table("profiles").upsert({
            "id": user.id,
            "full_name": full_name,
            "university_id": university_id,
            "role": "member",
            "is_verified": False 
        }).execute()

        # Process and upload the ID image
        file_bytes = await id_file.read()
        
        # Use settings.MAX_ID_IMAGE_SIZE
        max_id_size = settings.MAX_ID_IMAGE_SIZE
        
        if len(file_bytes) > max_id_size:
            file_bytes = process_image_efficiently(file_bytes)
        
        file_suffix = Path(id_file.filename or "").suffix
        file_path = f"manual_verifications/{user.id}/{uuid4().hex}{file_suffix}"
        
        supabase.storage.from_("other_images").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": id_file.content_type or "application/octet-stream"}
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # Create verification record
        supabase.table("user_verifications").insert({
            "user_id": user.id,
            "university_id": university_id,
            "id_image_url": id_image_url,
            "status": "pending"
        }).execute()

        # Notify admins
        admins_res = supabase.table("profiles").select("id").eq("university_id", university_id).eq("role", "admin").execute()
        
        if admins_res.data:
            message = f"New manual verification request from {full_name} is awaiting review."
            for admin in admins_res.data:
                create_notification(
                    recipient_id=admin['id'],
                    university_id=university_id,
                    message=message,
                    link_to="/admin/manual-verification",
                    type='verification'
                )

        return {"message": "Registration successful! Please confirm your email. Your account will be usable after an admin approves your ID."}

    except HTTPException as http_exc:
        # Clean up if user was created
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise HTTPException(status_code=500, detail=str(e))

# <-- ENTIRELY REPLACED signup_user WITH THE NEW FIXED VERSION -->
@auth_router.post("/signup")
async def signup_user(payload: SignupRequest, request: Request):
    await verify_captcha(payload.captchaToken, request.client.host)
    domain = payload.email.split("@")[-1]
    domain_res = supabase.table("allowed_domains").select("university_id").eq("domain_name", domain).single().execute()
    if not domain_res.data:
        raise HTTPException(status_code=400, detail="This email domain is not registered on CampusTrace.")
    
    try:
        # Get the redirect URL - handle both list and string
        redirect_url = None
        if settings.EMAIL_CONFIRM_REDIRECT:
            if isinstance(settings.EMAIL_CONFIRM_REDIRECT, list):
                redirect_url = settings.EMAIL_CONFIRM_REDIRECT[0]
            else:
                redirect_url = settings.EMAIL_CONFIRM_REDIRECT

        university_id = domain_res.data["university_id"]

        signup_options = {
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name,
                    "university_id": university_id,
                    "is_verified": True,  # Verified by domain
                    "role": "member"
                }
            }
        }
        
        # Only add options if we have a redirect URL
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        result = supabase.auth.sign_up(signup_options)
        
        print(f"Signup result: {result}")
        
        if result.user:
            if hasattr(result.user, 'confirmed_at') and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please sign in instead."
                )
            
            if hasattr(result.user, 'identities') and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account."
                )
            
            # This upsert is also now a fallback
            supabase.table("profiles").upsert({
                "id": result.user.id,
                "full_name": payload.full_name,
                "university_id": domain_res.data["university_id"],
                "role": "member",
                "is_verified": True
            }).execute()
            
            return {"message": "Check your inbox to confirm your email before signing in."}
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unable to create account. An account with this email may already exist."
            )
            
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Signup failure - Full exception: {exc}")
        error_message = str(exc).lower()
        
        if "user already registered" in error_message:
            raise HTTPException(
                status_code=400, 
                detail="An account with this email already exists. Please sign in instead."
            )
        elif "invalid email" in error_message:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        elif "weak password" in error_message:
            raise HTTPException(status_code=400, detail="Password is too weak. Please use a stronger password.")
        else:
            raise HTTPException(status_code=400, detail=f"Signup failed: {str(exc)}")

# ============= Item Routes =============
@item_router.get("/leaderboard")
async def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        
        university_id = profile_res.data['university_id']

        leaderboard_res = supabase.rpc('get_leaderboard_for_university', {
            'p_university_id': university_id,
            'p_limit': 10
        }).execute()
        
        return leaderboard_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@item_router.post("/generate-description")
async def generate_description(payload: DescriptionRequest):
    """Rewrites and enhances a user's draft description using the AI model."""
    if not model:
        raise HTTPException(status_code=503, detail="AI features are not available.")
    
    try:
        # <-- UPDATED Taglish/Local context prompt -->
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
        raise HTTPException(status_code=500, detail=f"Failed to generate AI description: {str(e)}")

# <-- ENTIRELY REPLACED create_item WITH THE NEW JINA VERSION -->
@item_router.post("/create")
async def create_item(
    item_data: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id)
):
    try:
        print("\n🧩 --- [CREATE ITEM] ---")

        # Parse input
        item = ItemCreate.parse_raw(item_data)

        # Fetch profile + university
        profile_res = supabase.table("profiles").select("university_id, full_name").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]
        user_full_name = profile_res.data.get("full_name", "A user")

        # Get university settings
        uni_settings = await get_university_settings(university_id)

        # Moderation
        moderation_status = "pending"
        post_content = f"{item.title.lower()} {item.description.lower()}"
        if uni_settings["keyword_blacklist"] and any(keyword in post_content for keyword in uni_settings["keyword_blacklist"]):
            moderation_status = "pending"
        elif uni_settings["auto_approve_posts"]:
            moderation_status = "approved"

        # AI tags
        ai_tags = await generate_ai_tags(item.title, item.description)

        # Prepare text
        combined_text = f"Title: {item.title}. Description: {item.description}. Location: {item.location}. Category: {item.category}."

        image_url = None
        pil_image = None
        image_embedding = None
        text_embedding = None

        # --- Upload + process image ---
        if image_file:
            image_bytes = await image_file.read()
            max_image_size = int(os.getenv("MAX_IMAGE_SIZE", "5242880"))

            # --- [JINA SPEED FIX: START] ---
            # ALWAYS resize the image for Jina, not just if it's over the limit.
            if len(image_bytes) > max_image_size:
                # If it's huge, do the efficient resize first
                image_bytes = await run_in_threadpool(process_image_efficiently, image_bytes)
            
            # Now, load into PIL and resize to a standard embedding size
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # Resize to a max of 800x800 for Jina (fast and effective)
            pil_image.thumbnail((800, 800), Image.Resampling.LANCZOS)
            print(f"📸 Image resized for embedding: {type(pil_image)} Size: {pil_image.size}")
            # --- [JINA SPEED FIX: END] ---

            # --- [JINA SPEED FIX: Re-save the resized image for storage] ---
            # We need to get the bytes from our resized pil_image
            output_bytes_io = io.BytesIO()
            pil_image.save(output_bytes_io, format="JPEG", quality=90)
            image_bytes_for_storage = output_bytes_io.getvalue()
            # --- [END FIX] ---

            file_suffix = Path(image_file.filename or ".jpg").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"

            supabase.storage.from_("item_images").upload(
                path=file_path,
                file=image_bytes_for_storage, # <-- Use the resized bytes
                file_options={"content-type": "image/jpeg"} # <-- We know it's a JPEG now
            )
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

            # Generate IMAGE embedding (image only, no text)
            print("🔹 Generating image embedding...")
            image_embedding = await jina_embedding_util.get_multimodal_embedding(
                text=None,
                image=pil_image # <-- Pass the resized PIL image to Jina
            )
            if image_embedding and not all(v == 0.0 for v in image_embedding):
                print(f"✅ Image embedding successful (dim={len(image_embedding)})")
            else:
                print("⚠️ Image embedding failed")
                image_embedding = None

            pil_image.close()
        
        # Generate TEXT embedding (always, text only)
        print("🔹 Generating text embedding...")
        text_embedding = await jina_embedding_util.get_multimodal_embedding(
            text=combined_text,
            image=None
        )
        if text_embedding and not all(v == 0.0 for v in text_embedding):
            print(f"✅ Text embedding successful (dim={len(text_embedding)})")
        else:
            print("⚠️ Text embedding failed")
            text_embedding = None

        # --- Save to Supabase ---
        post_data = {
            "title": item.title,
            "description": item.description,
            "status": item.status,
            "category": item.category,
            "location": item.location,
            "contact_info": item.contact_info,
            "ai_tags": ai_tags,
            "image_url": image_url,
            "user_id": user_id,
            "university_id": university_id,
            "moderation_status": moderation_status,
            "text_embedding": text_embedding,
            "image_embedding": image_embedding
        }

        insert_response = supabase.table("items").insert(post_data).execute()
        new_item = insert_response.data[0]

        # --- Notify admins if pending ---
        if moderation_status == "pending":
            admins_res = supabase.table("profiles").select("id").eq("university_id", university_id).eq("role", "admin").execute()
            if admins_res.data:
                message = f"New item '{item.title}' from {user_full_name} is awaiting moderation."
                for admin in admins_res.data:
                    create_notification(
                        recipient_id=admin["id"],
                        university_id=university_id,
                        message=message,
                        link_to="/admin/post-moderation",
                        type="moderation"
                    )

        print(f"✅ Item created with text_embedding (dim={len(text_embedding) if text_embedding else 0}) and image_embedding (dim={len(image_embedding) if image_embedding else 0})")
        return {"data": new_item}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# <-- ENTIRELY REPLACED image-search WITH THE NEW JINA VERSION -->
@item_router.post("/image-search")
async def search_by_image(image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    try:
        print("\n🔍 --- [IMAGE SEARCH DEBUG] ---")

        # Get university
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]
        print(f"🏫 University ID: {university_id}")

        # Check how many items exist with image embeddings
        count_check = supabase.table("items")\
            .select("id", count="exact")\
            .eq("university_id", university_id)\
            .not_.is_("image_embedding", "null")\
            .eq("moderation_status", "approved")\
            .execute()
        print(f"📊 Total items with image embeddings in this university: {count_check.count}")

        # Read + convert image
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print(f"📸 Search image: {pil_image.size} - {pil_image.mode}")

        # Resize if too large (helps with API timeouts)
        max_search_size = (800, 800)
        if pil_image.size[0] > max_search_size[0] or pil_image.size[1] > max_search_size[1]:
            pil_image.thumbnail(max_search_size, Image.Resampling.LANCZOS)
            print(f"📐 Resized search image to: {pil_image.size}")

        # Generate IMAGE embedding only (no text)
        print("🔹 Generating Jina image embedding for search...")
        query_embedding = await jina_embedding_util.get_multimodal_embedding(
            text=None,
            image=pil_image
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

        # Only use threshold=0.6, do NOT fallback to lower threshold
        try:
            print(f"🔍 Calling RPC with threshold=0.6, count=10...")
            matches = supabase.rpc("match_items_by_image_embedding", {
                "p_university_id": university_id,
                "p_query_embedding": query_embedding,
                "p_match_threshold": 0.6,
                "p_match_count": 10
            }).execute()
            
            print(f"✅ RPC returned {len(matches.data) if matches.data else 0} matches")
            
            if matches.data and len(matches.data) > 0:
                for idx, match in enumerate(matches.data[:3]):
                    print(f"  Match {idx+1}: {match.get('title')} - similarity: {match.get('similarity', 'N/A'):.4f}")
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
                    "error": "The database function expects a different embedding dimension"
                }
            
            return {"results": [], "message": f"Search failed: {str(rpc_error)}"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

# <-- ENTIRELY REPLACED find-matches WITH THE NEW RPC VERSION -->
@item_router.get("/find-matches/{item_id}")
async def find_matches(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Finds AI-powered matches for a specific 'Lost' item owned by the user.
    It calls a Supabase RPC function that calculates a weighted score
    based on both text and image similarity.
    """
    try:
        # 1. Security Check: Verify the item belongs to the user and is 'Lost'
        item_res = supabase.table("items").select("university_id, user_id, status") \
            .eq("id", item_id) \
            .eq("user_id", user_id) \
            .single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found or you are not the owner.")
        
        if item_res.data['status'] != 'Lost':
            # Don't return matches for 'Found' items in this UI
            print(f"Match check skipped: Item {item_id} is not a 'Lost' item.")
            return []

        # 2. Call the new RPC function
        # These weights can be tuned over time
        TEXT_WEIGHT = 0.6
        IMAGE_WEIGHT = 0.4
        MATCH_THRESHOLD = 0.5 # 50% combined score (can be adjusted)
        MATCH_COUNT = 4       # Frontend is designed to show 4

        print(f"🔍 Finding matches for Lost Item ID: {item_id}...")
        matches_res = supabase.rpc("find_matches_for_lost_item", {
            "p_item_id": item_id,
            "p_text_weight": TEXT_WEIGHT,
            "p_image_weight": IMAGE_WEIGHT,
            "p_match_threshold": MATCH_THRESHOLD,
            "p_match_count": MATCH_COUNT
        }).execute()

        if matches_res.data:
            print(f"✅ Found {len(matches_res.data)} matches for item {item_id}.")
            # The RPC function returns the data in the exact format needed by the frontend
            return matches_res.data
        else:
            print(f"❌ No matches found for item {item_id} above threshold {MATCH_THRESHOLD}.")
            return []

    except HTTPException as http_exc:
        # Re-raise known exceptions
        raise http_exc
    except Exception as e:
        # Log and raise a generic error for everything else
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while finding matches: {str(e)}")

@item_router.put("/{item_id}/recover")
async def mark_as_recovered(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Marks an item as 'recovered' by either the poster or the approved claimant.
    """
    try:
        # Get item details
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        finder_id = item_res.data['user_id']
        university_id = item_res.data['university_id']
        
        # Find who the approved claimant is (if any)
        claim_res = supabase.table("claims").select("claimant_id").eq("item_id", item_id).eq("status", "approved").execute()
        
        approved_claimant_id = claim_res.data[0]['claimant_id'] if claim_res.data else None

        # Security check: Only the poster or the approved claimant can mark as recovered
        if user_id not in [finder_id, approved_claimant_id]:
            raise HTTPException(status_code=403, detail="You are not authorized to perform this action.")
            
        # Update the item status
        supabase.table("items").update({"moderation_status": "recovered"}).eq("id", item_id).execute()

        # Notify both parties
        message = f"The item '{item_res.data['title']}' has been marked as recovered. This case is now closed."
        if finder_id:
            create_notification(recipient_id=finder_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
        if approved_claimant_id and approved_claimant_id != finder_id:
            create_notification(recipient_id=approved_claimant_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
            
        return {"message": "Item marked as recovered."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
# ============= Conversations Router =============
@conversations_router.post("/")
async def get_or_create_conversation(item_id: int = Form(...), user_id: str = Depends(get_current_user_id)):
    """
    Gets an existing conversation ID or creates a new one for a specific item.
    """
    try:
        # Get the item details
        item_res = supabase.table("items").select("user_id, status").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        poster_id = item_res.data['user_id']
        message_sender_id = user_id

        # Prevent a user from starting a chat on their own post
        if poster_id == message_sender_id:
            raise HTTPException(status_code=400, detail="You cannot start a conversation on your own item.")

        item_status = item_res.data['status']
        
        # Determine who is the 'finder' and who is the 'claimant'
        finder_id = poster_id if item_status == 'Found' else message_sender_id
        claimant_id = message_sender_id if item_status == 'Found' else poster_id
        
        # Check if a conversation already exists
        existing_convo_res = supabase.table("conversations") \
            .select("id") \
            .eq("item_id", item_id) \
            .eq("finder_id", finder_id) \
            .eq("claimant_id", claimant_id) \
            .execute()

        # If it exists, return the existing ID
        if existing_convo_res.data:
            return {"conversation_id": existing_convo_res.data[0]['id']}

        # If not, create a new conversation
        new_convo_res = supabase.table("conversations").insert({
            "item_id": item_id,
            "finder_id": finder_id,
            "claimant_id": claimant_id
        }).execute()

        if not new_convo_res.data:
            raise Exception("Failed to create conversation and get ID back.")

        return {"conversation_id": new_convo_res.data[0]['id']}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============= Conversations Router =============
@conversations_router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, user_id: str = Depends(get_current_user_id)):
    """Deletes a conversation and its associated messages if the user is a participant."""
    try:
        convo_res = supabase.table("conversations")\
            .select("id, finder_id, claimant_id")\
            .eq("id", conversation_id)\
            .single()\
            .execute()

        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        conversation = convo_res.data

        if user_id not in [conversation.get("finder_id"), conversation.get("claimant_id")]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation.")

        messages_delete_res = supabase.table("messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        print(f"Deleted messages associated with conversation {conversation_id}")

        convo_delete_res = supabase.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .execute()

        return {"message": "Conversation deleted successfully."}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the conversation: {str(e)}")

# ============= Claims Routes =============
@claims_router.post("/create")
async def submit_claim(payload: ClaimCreate, claimant_id: str = Depends(get_current_user_id)):
    try:
        item_res = supabase.table("items").select("user_id, title, status, university_id").eq("id", payload.item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        if item_res.data['status'] != 'Found':
            raise HTTPException(status_code=400, detail="You can only claim 'Found' items.")
        
        finder_id = item_res.data['user_id']
        item_title = item_res.data['title']
        item_university_id = item_res.data['university_id']
        
        if finder_id == claimant_id:
             raise HTTPException(status_code=400, detail="You cannot claim your own item.")

        claim_data = {
            "item_id": payload.item_id,
            "claimant_id": claimant_id,
            "finder_id": finder_id,
            "verification_message": payload.verification_message,
            "status": "pending"
        }
        supabase.table("claims").insert(claim_data).execute()
        
        claimant_profile_res = supabase.table("profiles").select("full_name").eq("id", claimant_id).single().execute()
        claimant_name = claimant_profile_res.data.get('full_name', 'A user') if claimant_profile_res.data else 'A user'

        message = f"{claimant_name} has submitted a claim on your found item: '{item_title}'."
        create_notification(recipient_id=finder_id, university_id=item_university_id, message=message, link_to="/dashboard/my-posts", type='claim')
        
        return {"message": "Claim submitted successfully. The finder has been notified."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@claims_router.get("/item/{item_id}")
async def get_claims_for_item(item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        item_res = supabase.table("items").select("user_id").eq("id", item_id).eq("user_id", user_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=403, detail="You are not the owner of this item.")
            
        claims_res = supabase.table("claims").select("*, claimant:profiles!claimant_id(full_name, email)").eq("item_id", item_id).eq("status", "pending").execute()
        
        return claims_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# app/main.py

@claims_router.put("/{claim_id}/respond")
async def respond_to_claim(claim_id: int, payload: ClaimRespond, finder_id: str = Depends(get_current_user_id)):
    try:
        claim_res = supabase.table("claims").select("*, item:items(id, title, user_id, university_id)").eq("id", claim_id).single().execute()
        if not claim_res.data or claim_res.data['finder_id'] != finder_id:
            raise HTTPException(status_code=403, detail="You are not authorized to respond to this claim.")
        
        claim = claim_res.data
        item_id = claim['item']['id']
        item_title = claim['item']['title']
        claimant_id = claim['claimant_id']
        item_university_id = claim['item']['university_id']

        new_status = 'approved' if payload.approved else 'rejected'
        
        supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()
        
        if payload.approved:
            supabase.table("items").update({"moderation_status": "pending_return"}).eq("id", claim['item_id']).execute()
            
            # --- [FIX APPLIED HERE] ---
            # Check if a conversation already exists before creating one
            existing_convo_res = supabase.table("conversations") \
                .select("id") \
                .eq("item_id", item_id) \
                .eq("finder_id", finder_id) \
                .eq("claimant_id", claimant_id) \
                .execute()

            conversation_id = None
            if existing_convo_res.data:
                # Use the existing conversation ID
                conversation_id = existing_convo_res.data[0]['id']
                print(f"Claim approval: Found existing conversation {conversation_id}")
            else:
                # No conversation exists, so create a new one
                print(f"Claim approval: No conversation found, creating new one...")
                new_convo_res = supabase.table("conversations").insert({
                    "item_id": item_id,
                    "finder_id": finder_id,
                    "claimant_id": claimant_id
                }).execute()
                
                if not new_convo_res.data:
                     raise Exception("Failed to create conversation after claim approval.")
                conversation_id = new_convo_res.data[0]['id']
            # --- [END FIX] ---

            finder_profile_res = supabase.table("profiles").select("email").eq("id", finder_id).single().execute()
            claimant_profile_res = supabase.table("profiles").select("email").eq("id", claimant_id).single().execute()
            finder_email = finder_profile_res.data.get('email', 'N/A')
            claimant_email = claimant_profile_res.data.get('email', 'N/A')

            finder_message = f"You approved the claim for '{item_title}'. You can now chat with the claimant to arrange the return."
            claimant_message = f"Great news! Your claim for '{item_title}' has been approved. You can now chat with the finder to arrange the return."
            
            chat_link = f"/dashboard/messages/{conversation_id}"
            create_notification(recipient_id=finder_id, university_id=item_university_id, message=finder_message, link_to=chat_link, type='claim_response')
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=claimant_message, link_to=chat_link, type='claim_response')  # Fixed typo

            supabase.table("claims").update({"status": "rejected"}).eq("item_id", claim['item_id']).eq("status", "pending").execute()

        else:
            message = f"Unfortunately, your claim for '{item_title}' was not approved by the finder."
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=message, type='claim_response')
            
        return {"message": f"Claim has been {new_status}."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
# ============= Admin Routes =============
@admin_router.get("/manual-verifications")
async def get_manual_verifications(admin_id: str = Depends(get_current_user_id)):
    """Fetches all pending manual verification requests for the admin's university."""
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", admin_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Admin profile not found.")
        university_id = profile_res.data['university_id']

        verifications_res = supabase.table("user_verifications").select("*").eq("university_id", university_id).eq("status", "pending").execute()

        if not verifications_res.data:
            return []

        user_ids = [req['user_id'] for req in verifications_res.data]

        profiles_res = supabase.table("profiles").select("id, full_name, email").in_("id", user_ids).execute()
        if not profiles_res.data:
            return verifications_res.data

        profiles_map = {profile['id']: profile for profile in profiles_res.data}

        combined_data = []
        for req in verifications_res.data:
            req['user'] = profiles_map.get(req['user_id'])
            combined_data.append(req)

        return combined_data
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/manual-verifications/{verification_id}/respond")
async def respond_to_verification(
    verification_id: int,
    action: VerificationAction,
    admin_id: str = Depends(get_current_user_id)
):
    """Allows an admin to approve or reject a manual verification request."""
    try:
        # Get admin's profile to verify they are an admin
        admin_profile_res = supabase.table("profiles").select("university_id, role").eq("id", admin_id).single().execute()
        if not admin_profile_res.data or admin_profile_res.data.get('role') != 'admin':
             raise HTTPException(status_code=403, detail="User is not an authorized administrator.")
        admin_university_id = admin_profile_res.data['university_id']

        # Get the verification request
        verification_res = supabase.table("user_verifications").select("university_id, user_id").eq("id", verification_id).single().execute()
        if not verification_res.data:
            raise HTTPException(status_code=404, detail="Verification request not found.")
        
        # Check if admin is authorized for this university
        if verification_res.data['university_id'] != admin_university_id:
             raise HTTPException(status_code=403, detail="Admin not authorized for this university's request.")

        user_id_to_verify = verification_res.data['user_id']
        if action.user_id != user_id_to_verify:
             raise HTTPException(status_code=400, detail="User ID mismatch between request body and verification record.")

        # --- [THIS IS THE FIX] ---
        # Use the university ID from the ORIGINAL verification request, not the admin's ID
        university_id_for_user = verification_res.data['university_id']
        # --- [END FIX] ---

        if action.approve:
            # Update the user's profile with their CHOSEN university ID
            update_res = supabase.table("profiles").update({
                "university_id": university_id_for_user, # <-- Use the correct ID
                "is_verified": True
            }).eq("id", user_id_to_verify).execute()

            # Update the verification request status
            supabase.table("user_verifications").update({"status": "approved"}).eq("id", verification_id).execute()

            # Get user's email/name for the notification email
            user_profile_res = supabase.table("profiles").select("email, full_name").eq("id", user_id_to_verify).single().execute()
            user_email, user_name = None, "there"
            if user_profile_res.data:
                user_email = user_profile_res.data.get('email')
                user_name = user_profile_res.data.get('full_name', user_name)

            if user_email and settings.RESEND_API_KEY:
                try:
                    login_url = "https://campustrace.site/login" 

                    email_html = f"""
                    <p>Hi {user_name},</p>
                    <p>Good news! Your account for CampusTrace has been approved by an administrator.</p>
                    <p>You can now log in and start using the platform:</p>
                    <p><a href="{login_url}" style="padding: 10px 15px; background-color: #674CC4; color: white; text-decoration: none; border-radius: 5px;">Login to CampusTrace</a></p>
                    <p>If the button doesn't work, copy and paste this link into your browser: {login_url}</p>
                    <p>Welcome aboard!</p>
                    <p><em>- The CampusTrace Team</em></p>
                    """

                    params_to_send = {
                        "from": settings.RESEND_SENDER_EMAIL,
                        "to": [user_email],
                        "subject": "Your CampusTrace Account is Approved!",
                        "html": email_html,
                    }

                    email_response = resend.Emails.send(params_to_send)
                    print(f"Approval email sent to {user_email}, ID: {email_response['id']}")
                except Exception as email_error:
                    print(f"Failed to send approval email to {user_email}: {email_error}")

            # Send in-app notification
            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_user, # <-- Use the correct ID here too
                message="Congratulations! Your account has been manually verified. You can now log in.",
                link_to="/login",
                type="verification_success"
            )
            return {"message": "User approved successfully."}
        
        else:
            # If the action is 'reject'
            supabase.table("user_verifications").update({"status": "rejected"}).eq("id", verification_id).execute()

            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_user, # <-- Use the correct ID here too
                message="Your manual verification request was not approved. Please ensure your ID image is clear and valid.",
                link_to=None,
                type="verification_failure"
            )
            return {"message": "User rejected."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
    
@admin_router.post("/items/{item_id}/status")
async def set_item_status(item_id: int, data: StatusUpdate, admin_id: str = Depends(get_current_user_id)): # <-- Fixed item_id type
    try:
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        item_owner_id = item_res.data['user_id']
        item_title = item_res.data['title']
        university_id = item_res.data['university_id']
        resp = supabase.table("items").update({"moderation_status": data.moderation_status}).eq("id", item_id).execute()
        
        message = f"An admin has updated your post '{item_title}' to a status of: {data.moderation_status}."
        create_notification(recipient_id=item_owner_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
        
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users/{user_id}/ban")
async def set_user_ban(user_id: str, data: BanUpdate, admin_id: str = Depends(get_current_user_id)):
    try:
        resp = supabase.table("profiles").update({"is_banned": data.is_banned}).eq("id", user_id).execute()
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users/{user_id}/role")
async def set_user_role(user_id: str, data: RoleUpdate, admin_id: str = Depends(get_current_user_id)):
    try:
        resp = supabase.table("profiles").update({"role": data.role}).eq("id", user_id).execute()
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============= Profile Routes =============
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
            
            max_avatar_size = int(os.getenv('MAX_AVATAR_SIZE', '2097152'))
            if len(file_bytes) > max_avatar_size:
                file_bytes = process_image_efficiently(file_bytes, max_size=(400, 400))
            
            supabase.storage.from_("other_images").upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            public_url = supabase.storage.from_("other_images").get_public_url(filename)
            updates["avatar_url"] = f"{public_url}?t={uuid4().hex}"

        if not updates:
            raise HTTPException(status_code=400, detail="No update information provided.")
        
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        profile_result = supabase.table("profiles").select("id, full_name, email, avatar_url, role, is_banned").eq("id", current_user_id).single().execute()
        return {"profile": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.get("/preferences")
async def get_user_preferences(current_user_id: str = Depends(get_current_user_id)):
    """Get user notification preferences."""
    try:
        profile_result = supabase.table("profiles").select(
            "match_notifications, claim_notifications, message_notifications, "
            "moderation_notifications, email_notifications_enabled"
        ).eq("id", current_user_id).single().execute()
        
        if not profile_result.data:
            return {
                "preferences": {
                    "match_notifications": True,
                    "claim_notifications": True,
                    "message_notifications": True,
                    "moderation_notifications": True,
                    "email_notifications_enabled": True
                }
            }
        return {"preferences": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        return {
            "preferences": {
                "match_notifications": True,
                "claim_notifications": True,
                "message_notifications": True,
                "moderation_notifications": True,
                "email_notifications_enabled": True
            }
        }

@profile_router.put("/preferences")
async def update_user_preferences(preferences: UserPreferences, current_user_id: str = Depends(get_current_user_id)):
    """Update user notification preferences."""
    try:
        updates = {
            "match_notifications": preferences.match_notifications,
            "claim_notifications": preferences.claim_notifications,
            "message_notifications": preferences.message_notifications,
            "moderation_notifications": preferences.moderation_notifications,
            "email_notifications_enabled": preferences.email_notifications_enabled
        }
        
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        
        return {"message": "Preferences updated successfully", "preferences": updates}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")

# ============= Include Routers =============
app.include_router(auth_router)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(notification_router)
app.include_router(onboarding_router)
app.include_router(claims_router) 
app.include_router(conversations_router)

# ============= Health Check & Root =============
@app.get("/health")
async def health_check():
    """Railway health check endpoint."""
    return {
        "status": "healthy",
        "service": "campustrace-api",
        "ai_enabled": model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def read_root():
    return {
        "status": "Campus Trace backend is running!", # <-- UPDATED message
        "ai_enabled": model is not None,
        "environment": "production",
        "docs": "/docs",
        "health": "/health"
    }