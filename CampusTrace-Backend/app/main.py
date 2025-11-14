import os
import gc
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
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
from app.dependencies import get_current_user_id, get_admin_university_id, supabase
from app import jina_embedding_util

# Load application settings and initialize global variables
settings = get_settings()
model = None  # Will hold the Gemini AI model after startup

# List of blacklisted public email domains
PUBLIC_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'gmx.com', 'inbox.com', 'live.com', 'msn.com', 'yahoo.co.uk',
    'yahoo.co.in', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it',
    'googlemail.com', 'me.com', 'mac.com', 'rediffmail.com', 'fastmail.com',
    'hushmail.com', 'tutanota.com', 'mailfence.com', 'runbox.com'
}

def is_public_email_domain(email: str) -> bool:
    """Check if email domain is a public email service."""
    domain = email.split('@')[1].lower() if '@' in email else ''
    return domain in PUBLIC_EMAIL_DOMAINS

app = FastAPI(
    title="CampusTrace API",
    description="Lost and Found Platform for Universities",
    version="2.1.0"
)

# Configure Resend email service
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    print("Resend client configured.")
else:
    print("WARNING: RESEND_API_KEY not found. Email notifications disabled.")

@app.on_event("startup")
async def startup_event():
    """Load AI models on application startup."""
    global model
    
    # Initialize Gemini AI for generating descriptions and tags
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.5-flash")
            print("✅ Gemini AI generation/vision model (gemini-2.5-flash) configured successfully.")
        except Exception as e:
            print(f"❌ ERROR: Could not configure Gemini AI: {e}")
    else:
        print("⚠️ WARNING: GEMINI_API_KEY not found. AI generation features disabled.")
    
    # Test Jina embedding model for image and text matching
    if settings.JINA_API_KEY:
        try:
            await jina_embedding_util.test_jina_embedding()
        except Exception as e:
            print(f"❌ ERROR: Could not test Jina embedding model: {e}")
    else:
        print("⚠️ WARNING: JINA_API_KEY not found. Embedding features will be disabled.")
        
    print(f"Max image size: {int(os.getenv('MAX_IMAGE_SIZE', '5242880')) / 1024 / 1024:.1f}MB")
    print("🚀 Running API with Jina embedding pipeline")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global model
    model = None
    gc.collect()
    print("Shutting down gracefully...")

# Configure CORS - handle wildcard for development
cors_origins = settings.CORS_ORIGINS
if "*" in cors_origins:
    # For development, allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Must be False when allow_origins is ["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # For production, use specific origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Optimize images for faster processing and storage
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
public_router = APIRouter(prefix="/api/public", tags=["Public"])
item_router = APIRouter(prefix="/api/items", tags=["Items"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])
onboarding_router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
claims_router = APIRouter(prefix="/api/claims", tags=["Claims"])
conversations_router = APIRouter(prefix="/api/conversations", tags=["Conversations"])
backup_router = APIRouter(prefix="/api/backup", tags=["Backup & Restore"])
badges_router = APIRouter(prefix="/api/badges", tags=["Badges"])
handover_router = APIRouter(prefix="/api/handover", tags=["Handover"])

# ============= Helper Functions =============
async def get_university_settings(university_id: int):
    """
    Fetches and processes site settings for a given university.
    Returns settings like auto-approval status and keyword blacklist for moderation.
    """
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
    """
    Verify Google reCAPTCHA token to prevent spam and bot submissions.
    In development mode (no key), it will skip verification.
    """
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
    """
    Create an in-app notification for a user.
    Types: 'general', 'claim', 'moderation', 'verification', 'message', etc.
    """
    try:
        # 1. (Existing) Create the in-app notification
        supabase.table("notifications").insert({
            "recipient_id": recipient_id,
            "university_id": university_id,
            "message": message,
            "link_to": link_to,
            "type": type,
        }).execute()
        print(f"In-app notification created for user {recipient_id}")

        # 2. (NEW) Trigger a push notification asynchronously
        asyncio.create_task(
            send_push_notification(recipient_id, message, type, link_to)
        )

    except Exception as e:
        print(f"Error creating notification: {e}")

# === ADD THIS NEW ASYNC FUNCTION ===
async def send_push_notification(recipient_id: str, message: str, notification_type: str, link_to: Optional[str] = None):
    """
    Fetches user's push token and sends a push notification via Expo.
    """
    try:
        # Get user's push token and notification preferences
        profile_res = supabase.table("profiles").select(
            "push_token, message_notifications, claim_notifications, moderation_notifications"
        ).eq("id", recipient_id).single().execute()

        if not profile_res.data or not profile_res.data.get("push_token"):
            print(f"No push token for user {recipient_id}, skipping push.")
            return

        profile = profile_res.data
        push_token = profile["push_token"]

        # Check user preferences (based on your profiles table)
        if notification_type == 'message' and not profile.get('message_notifications', True):
            print(f"User {recipient_id} has message push notifications disabled.")
            return
        if notification_type in ['claim', 'claim_response'] and not profile.get('claim_notifications', True):
            print(f"User {recipient_id} has claim push notifications disabled.")
            return

        # Prepare the push message payload
        push_payload = {
            "to": push_token,
            "sound": "default",
            "title": "CampusTrace", # You can customize this
            "body": message,
            "data": { "url": link_to } # Send link_to in data payload
        }

        # Send the request to Expo's push API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.expo.dev/v2/push/send",
                json=push_payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    # You can add an Expo Access Token here for security if needed
                },
            )

        response.raise_for_status() # Raises an error if status code is 4xx/5xx
        print(f"Push notification sent successfully to user {recipient_id}. Response: {response.json()}")

    except httpx.HTTPStatusError as e:
        print(f"Error sending push notification to {recipient_id}: {e.response.text}")
    except Exception as e:
        print(f"General error in send_push_notification: {e}")

async def generate_ai_tags(title: str, description: str) -> Optional[List[str]]:
    """
    Generate AI-powered tags using Gemini model.
    Supports Taglish (Tagalog-English mix) for Philippine universities.
    Returns up to 7 relevant keywords.
    """
    if not model:
        return []
    try:
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
    """
    Calculate a simple text-based similarity score (0-100) between lost and found items.
    Scoring breakdown:
    - Category match: 40 points
    - Title keyword overlap: up to 30 points
    - Description keyword overlap: up to 20 points
    - Location match: 10 points
    """
    score = 0
    
    # Check if categories match
    if lost_item.get("category") == found_item.get("category"):
        score += 40
    # Check for keyword overlap in titles
    lost_title = lost_item.get("title", "").lower()
    found_title = found_item.get("title", "").lower()
    lost_keywords = set(lost_title.split())
    found_keywords = set(found_title.split())
    keyword_overlap = len(lost_keywords & found_keywords)
    if keyword_overlap > 0:
        score += min(30, keyword_overlap * 10)
    
    # Check for keyword overlap in descriptions
    lost_desc = lost_item.get("description", "").lower()
    found_desc = found_item.get("description", "").lower()
    lost_desc_keywords = set(lost_desc.split())
    found_desc_keywords = set(found_desc.split())
    desc_overlap = len(lost_desc_keywords & found_desc_keywords)
    if desc_overlap > 0:
        score += min(20, desc_overlap * 5)
    
    # Check if locations match
    if lost_item.get("location") == found_item.get("location"):
        score += 10
    
    return min(100, score)

def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    import numpy as np
    vec1_array = np.array(vec1)
    vec2_array = np.array(vec2)
    
    norm1 = np.linalg.norm(vec1_array)
    norm2 = np.linalg.norm(vec2_array)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(np.dot(vec1_array, vec2_array) / (norm1 * norm2))

async def find_proactive_matches(new_item: dict, university_id: int):
    """
    Find proactive matches when a new "Found" item is posted.
    Notifies users with "Lost" items about high-confidence matches.
    """
    try:
        print(f"\n🔍 [PROACTIVE MATCH] Checking for matches for new Found item: {new_item['title']}")
        
        # Fetch all "Lost" items from the same university with approved moderation status
        lost_items_res = supabase.table("items").select(
            "id, title, user_id, text_embedding, image_embedding, category, location"
        ).eq("university_id", university_id).eq("status", "Lost").eq("moderation_status", "approved").execute()
        
        if not lost_items_res.data:
            print("📭 No Lost items found to match against.")
            return
        
        print(f"📊 Found {len(lost_items_res.data)} Lost items to compare.")
        
        # Get embeddings for the new Found item
        new_text_embedding = new_item.get('text_embedding')
        new_image_embedding = new_item.get('image_embedding')
        
        high_confidence_threshold = 0.90  # 90% similarity threshold
        matches_found = 0
        
        for lost_item in lost_items_res.data:
            max_similarity = 0.0
            
            # Compare text embeddings if both exist
            if new_text_embedding and lost_item.get('text_embedding'):
                text_similarity = calculate_cosine_similarity(new_text_embedding, lost_item['text_embedding'])
                max_similarity = max(max_similarity, text_similarity)
                print(f"  📝 Text similarity with '{lost_item['title']}': {text_similarity:.3f}")
            
            # Compare image embeddings if both exist
            if new_image_embedding and lost_item.get('image_embedding'):
                image_similarity = calculate_cosine_similarity(new_image_embedding, lost_item['image_embedding'])
                max_similarity = max(max_similarity, image_similarity)
                print(f"  🖼️ Image similarity with '{lost_item['title']}': {image_similarity:.3f}")
            
            # If similarity is above threshold, create notification
            if max_similarity >= high_confidence_threshold:
                print(f"  ✅ HIGH MATCH! Notifying user {lost_item['user_id']}")
                
                notification_message = f"We think someone just found your {lost_item['title']}! 🎉"
                create_notification(
                    recipient_id=lost_item['user_id'],
                    university_id=university_id,
                    message=notification_message,
                    link_to=f"/item/{new_item['id']}",
                    type='ai_match'
                )
                matches_found += 1
        
        print(f"✅ Proactive matching complete. {matches_found} high-confidence matches found.\n")
    
    except Exception as e:
        print(f"❌ Error in find_proactive_matches: {e}")
        traceback.print_exc()

def award_badge(user_id: str, badge_name: str, university_id: int):
    """
    Award a badge to a user if they don't already have it.
    Returns True if badge was awarded, False if user already has it.
    """
    try:
        # Get badge ID by name
        badge_res = supabase.table("badges").select("id").eq("name", badge_name).single().execute()
        if not badge_res.data:
            print(f"⚠️ Badge '{badge_name}' not found in database.")
            return False
        
        badge_id = badge_res.data['id']
        
        # Check if user already has this badge
        existing_badge = supabase.table("user_badges").select("id").eq(
            "user_id", user_id
        ).eq("badge_id", badge_id).execute()
        
        if existing_badge.data:
            print(f"ℹ️ User {user_id} already has badge '{badge_name}'")
            return False
        
        # Award the badge
        supabase.table("user_badges").insert({
            "user_id": user_id,
            "badge_id": badge_id
        }).execute()
        
        # Send notification to user
        create_notification(
            recipient_id=user_id,
            university_id=university_id,
            message=f"🏆 You earned the '{badge_name}' badge!",
            link_to="/profile",
            type="badge"
        )
        
        print(f"🏆 Awarded '{badge_name}' badge to user {user_id}")
        return True
    
    except Exception as e:
        print(f"❌ Error awarding badge: {e}")
        traceback.print_exc()
        return False

# ============= Onboarding Route =============
@onboarding_router.post("/register-university")
async def register_university(payload: UniversityRegistrationRequest):
    """
    Register a new university and create its first admin user.
    This is a transactional operation - if any step fails, everything is rolled back.
    """
    new_university_id = None
    new_user_id = None
    try:
        # Check if email uses a public domain (not allowed for university registration)
        if is_public_email_domain(payload.email):
            raise HTTPException(
                status_code=400, 
                detail="Please use your official university email address, not a public email service (Gmail, Yahoo, etc.)."
            )
        
        # Check if university name already exists
        uni_exists = supabase.table("universities").select("id").eq("name", payload.university_name).execute()
        if uni_exists.data:
            raise HTTPException(status_code=400, detail="A university with this name already exists.")
        
        # Check if user email already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", payload.email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # Check if the email domain is already registered to another university
        admin_domain = payload.email.split('@')[1]
        domain_exists = supabase.table("allowed_domains").select("university_id, universities(name)").eq("domain_name", admin_domain).execute()
        if domain_exists.data:
            existing_uni_name = domain_exists.data[0].get('universities', {}).get('name', 'another university')
            raise HTTPException(
                status_code=400, 
                detail=f"The email domain '{admin_domain}' is already registered to {existing_uni_name}. Each university domain can only be registered once."
            )

        # Create the new university (initially pending)
        new_university_res = supabase.table("universities").insert({"name": payload.university_name, "status": "pending"}).execute()
        new_university_id = new_university_res.data[0]['id']

        # Add the admin's email domain to allowed domains
        supabase.table("allowed_domains").insert({
            "university_id": new_university_id,
            "domain_name": admin_domain
        }).execute()

        # Create the admin user in Supabase Auth
        sign_up_res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        new_user = sign_up_res.user
        new_user_id = new_user.id

        # Update the profile with admin details (trigger should have created it)
        supabase.table("profiles").update({
            "full_name": payload.full_name,
            "role": "admin",
            "university_id": new_university_id
        }).eq("id", new_user.id).execute()

        # Activate the university
        supabase.table("universities").update({"status": "active"}).eq("id", new_university_id).execute()

        return {"message": "University created successfully. Please check your email to verify your account."}

    except HTTPException as http_exc:
        # Rollback: Delete created resources if something went wrong
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        # Rollback on any error
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass
        
        # Handle specific database constraint errors
        error_message = str(e)
        if "duplicate key value violates unique constraint" in error_message and "allowed_domains_domain_name_key" in error_message:
            # Extract domain from error if possible
            admin_domain = payload.email.split('@')[1] if '@' in payload.email else 'this domain'
            raise HTTPException(
                status_code=400, 
                detail=f"The email domain '{admin_domain}' is already registered to another university. Each university domain can only be registered once."
            )
        
        raise HTTPException(status_code=500, detail="An internal error occurred during university registration.")

# ============= Auth Routes =============

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
    """
    Handle signup for users with personal emails (not university domain).
    Requires manual verification by admin using uploaded ID.
    """
    await verify_captcha(captchaToken, request.client.host)
    
    user = None
    try:
        # Check if user already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # Prepare redirect URL for email confirmation
        redirect_url = None
        if settings.PENDING_APPROVAL_REDIRECT_URL:
            if isinstance(settings.PENDING_APPROVAL_REDIRECT_URL, list):
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL[0]
            else:
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL

        # Create user with metadata (will trigger profile creation)
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
        
        # Add email redirect only if URL is configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        sign_up_res = supabase.auth.sign_up(signup_options)
        
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        user = sign_up_res.user

        # Fallback: ensure profile exists (trigger should handle this)
        supabase.table("profiles").upsert({
            "id": user.id,
            "full_name": full_name,
            "university_id": university_id,
            "role": "member",
            "is_verified": False 
        }).execute()

        # Process and upload the ID image
        file_bytes = await id_file.read()
        
        max_id_size = settings.MAX_ID_IMAGE_SIZE
        
        # Resize image if it's too large
        if len(file_bytes) > max_id_size:
            file_bytes = process_image_efficiently(file_bytes)
        
        file_suffix = Path(id_file.filename or "").suffix
        file_path = f"manual_verifications/{user.id}/{uuid4().hex}{file_suffix}"
        
        # Upload to Supabase storage
        supabase.storage.from_("other_images").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": id_file.content_type or "application/octet-stream"}
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # Create verification record for admin review
        supabase.table("user_verifications").insert({
            "user_id": user.id,
            "university_id": university_id,
            "id_image_url": id_image_url,
            "status": "pending"
        }).execute()

        # Notify all admins of the university about new verification request
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
        # Clean up user if created
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        # Rollback: delete user on any error
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.post("/signup")
async def signup_user(payload: SignupRequest, request: Request):
    """
    Handle signup for users with university email domains.
    Automatically verified if domain is registered.
    """
    await verify_captcha(payload.captchaToken, request.client.host)
    
    # Verify that email domain is registered
    domain = payload.email.split("@")[-1]
    domain_res = supabase.table("allowed_domains").select("university_id").eq("domain_name", domain).single().execute()
    if not domain_res.data:
        raise HTTPException(status_code=400, detail="This email domain is not registered on CampusTrace.")
    
    try:
        # Prepare redirect URL for email confirmation
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
                    "is_verified": True,  # Auto-verified by domain
                    "role": "member"
                }
            }
        }
        
        # Add email redirect only if configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        result = supabase.auth.sign_up(signup_options)
        
        print(f"Signup result: {result}")
        
        if result.user:
            # Check if user already confirmed
            if hasattr(result.user, 'confirmed_at') and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please sign in instead."
                )
            
            # Check if user has no identities (already exists but unconfirmed)
            if hasattr(result.user, 'identities') and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account."
                )
            
            # Fallback: ensure profile exists (trigger should handle this)
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
        
        # Handle common signup errors
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

@auth_router.post("/signup-mobile")
async def signup_user_mobile(payload: SignupRequest, request: Request):
    """
    Handle signup for mobile app users with university email domains.
    No CAPTCHA verification required for mobile apps.
    Automatically verified if domain is registered.
    """
    # Skip CAPTCHA verification for mobile
    
    # Extract and validate email domain
    email_parts = payload.email.split("@")
    if len(email_parts) != 2:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )
    
    domain = email_parts[1].lower()
    
    # Check if domain is registered (use execute() without single() to avoid exception)
    domain_res = supabase.table("allowed_domains").select("university_id").eq("domain_name", domain).execute()
    
    if not domain_res.data or len(domain_res.data) == 0:
        raise HTTPException(
            status_code=400, 
            detail=f"The email domain '{domain}' is not registered with CampusTrace. Please use your official university email address, or register manually using the 'Manual (University ID)' option with a personal email and your university ID photo."
        )
    
    try:
        # Prepare redirect URL for email confirmation
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
                    "is_verified": True,  # Auto-verified by domain
                    "role": "member"
                }
            }
        }
        
        # Add email redirect only if configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        result = supabase.auth.sign_up(signup_options)
        
        print(f"Mobile signup result: {result}")
        
        if result.user:
            # Check if user already confirmed
            if hasattr(result.user, 'confirmed_at') and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please sign in instead."
                )
            
            # Check if user has no identities (already exists but unconfirmed)
            if hasattr(result.user, 'identities') and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account."
                )
            
            # Fallback: ensure profile exists (trigger should handle this)
            supabase.table("profiles").upsert({
                "id": result.user.id,
                "full_name": payload.full_name,
                "university_id": university_id,
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
        print(f"Mobile signup failure - Full exception: {exc}")
        error_message = str(exc).lower()
        
        # Handle common signup errors
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


@auth_router.post("/signup-manual-mobile")
async def signup_manual_mobile(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    university_id: int = Form(...),
    id_file: UploadFile = File(...)
):
    """
    Handle signup for mobile app users with personal emails (not university domain).
    No CAPTCHA verification required for mobile apps.
    Requires manual verification by admin using uploaded ID.
    """
    # Skip CAPTCHA verification for mobile
    
    user = None
    try:
        # Check if user already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # Verify university exists
        university_check = supabase.table("universities").select("id").eq("id", university_id).maybeSingle().execute()
        if not university_check.data:
            raise HTTPException(status_code=400, detail="Invalid university selected.")

        # Prepare redirect URL for email confirmation
        redirect_url = None
        if settings.PENDING_APPROVAL_REDIRECT_URL:
            if isinstance(settings.PENDING_APPROVAL_REDIRECT_URL, list):
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL[0]
            else:
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL

        # Create user with metadata (will trigger profile creation)
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
        
        # Add email redirect only if URL is configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url
        
        sign_up_res = supabase.auth.sign_up(signup_options)
        
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        user = sign_up_res.user

        # Fallback: ensure profile exists (trigger should handle this)
        supabase.table("profiles").upsert({
            "id": user.id,
            "full_name": full_name,
            "university_id": university_id,
            "role": "member",
            "is_verified": False 
        }).execute()

        # Process and upload the ID image
        file_bytes = await id_file.read()
        
        max_id_size = settings.MAX_ID_IMAGE_SIZE
        
        # Resize image if it's too large
        if len(file_bytes) > max_id_size:
            file_bytes = process_image_efficiently(file_bytes)
        
        file_suffix = Path(id_file.filename or "").suffix
        file_path = f"manual_verifications/{user.id}/{uuid4().hex}{file_suffix}"
        
        # Upload to Supabase storage
        supabase.storage.from_("other_images").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": id_file.content_type or "application/octet-stream"}
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # Create verification record for admin review
        supabase.table("user_verifications").insert({
            "user_id": user.id,
            "university_id": university_id,
            "id_image_url": id_image_url,
            "status": "pending"
        }).execute()

        # Notify all admins of the university about new verification request
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
        # Clean up user if created
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        # Rollback: delete user on any error
        if user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= Public Routes (No Auth Required) =============
@public_router.get("/universities")
async def get_universities():
    """
    Get list of all active universities for signup selection.
    Public endpoint - no authentication required.
    """
    try:
        universities_res = supabase.table("universities").select(
            "id, name"
        ).eq("status", "active").order("name").execute()
        
        return {
            "universities": universities_res.data or []
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch universities: {str(e)}")

# Register public router with app
app.include_router(public_router)

# ============= Item Routes =============
@item_router.get("")
async def get_items_paginated(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get paginated items for the user's university.
    Supports filtering by status, category, and search term.
    Returns items with total count for pagination.
    """
    try:
        # Get user's university
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        
        university_id = profile_res.data['university_id']
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query
        query = supabase.table("items").select(
            "*, profiles(id, full_name, email)",
            count="exact"
        ).eq("university_id", university_id).eq("moderation_status", "approved")
        
        # Apply filters
        if status and status != "All":
            query = query.eq("status", status)
        if category:
            query = query.eq("category", category)
        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
        
        # Apply pagination and sorting
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return {
            "items": result.data or [],
            "total_items": result.count or 0,
            "current_page": page,
            "total_pages": ((result.count or 0) + limit - 1) // limit,
            "items_per_page": limit
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")

@item_router.get("/leaderboard")
async def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    """
    Get the top users leaderboard for the current user's university.
    Returns top 10 users ranked by successful returns.
    """
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
        raise HTTPException(status_code=500, detail=f"Failed to generate AI description: {str(e)}")

@item_router.post("/ai/suggest-details-from-image")
async def suggest_details_from_image(
    image_file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
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
            image_bytes = await run_in_threadpool(process_image_efficiently, image_bytes)
        
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
        lines = analysis_text.split('\n')
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
                keywords = [k.strip() for k in keywords_str.split(',') if k.strip()]
        
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
            "confidence": "high" if object_type else "low"
        }
        
        print(f"✅ Suggestions: {result}")
        return result
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@item_router.post("/create")
async def create_item(
    item_data: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id)
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
        profile_res = supabase.table("profiles").select("university_id, full_name").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data["university_id"]
        user_full_name = profile_res.data.get("full_name", "A user")

        # Get university moderation settings
        uni_settings = await get_university_settings(university_id)

        # Apply moderation rules
        moderation_status = "pending"
        post_content = f"{item.title.lower()} {item.description.lower()}"
        if uni_settings["keyword_blacklist"] and any(keyword in post_content for keyword in uni_settings["keyword_blacklist"]):
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
                image_bytes = await run_in_threadpool(process_image_efficiently, image_bytes)
            
            # Load and resize to optimal size for Jina (800x800 max)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            pil_image.thumbnail((800, 800), Image.Resampling.LANCZOS)
            print(f"📸 Image resized for embedding: {type(pil_image)} Size: {pil_image.size}")

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
                file_options={"content-type": "image/jpeg"}
            )
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

            # Upload thumbnail
            supabase.storage.from_("item_images").upload(
                path=thumbnail_path,
                file=thumbnail_bytes,
                file_options={"content-type": "image/jpeg"}
            )
            thumbnail_url = supabase.storage.from_("item_images").get_public_url(thumbnail_path)

            # Generate image embedding (image only, no text)
            print("🔹 Generating image embedding...")
            image_embedding = await jina_embedding_util.get_multimodal_embedding(
                text=None,
                image=pil_image
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
            text=combined_text,
            image=None
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
            "image_embedding": image_embedding
        }

        insert_response = supabase.table("items").insert(post_data).execute()
        new_item = insert_response.data[0]

        # Notify admins if post needs moderation
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

        # TASK 2: Award badges for posting achievements
        # Check if this is user's first post
        user_post_count_res = supabase.table("items").select("id", count="exact").eq("user_id", user_id).execute()
        if user_post_count_res.count == 1:  # Just posted their first item
            award_badge(user_id, "New Member", university_id)
        
        # Check if user reached 10 Found items for Eagle Eye badge
        if item.status == "Found":
            found_count_res = supabase.table("items").select("id", count="exact").eq(
                "user_id", user_id
            ).eq("status", "Found").execute()
            if found_count_res.count == 10:
                award_badge(user_id, "Eagle Eye", university_id)

        # TASK 1: Trigger proactive matching if this is a "Found" item and it's approved
        if item.status == "Found" and moderation_status == "approved":
            # Run proactive matching asynchronously (non-blocking)
            asyncio.create_task(find_proactive_matches(new_item, university_id))

        print(f"✅ Item created with text_embedding (dim={len(text_embedding) if text_embedding else 0}) and image_embedding (dim={len(image_embedding) if image_embedding else 0})")
        return {"data": new_item}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@item_router.post("/image-search")
async def search_by_image(image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """
    Search for similar items using an uploaded image.
    Uses AI-powered image embeddings for visual matching.
    """
    try:
        print("\n🔍 --- [IMAGE SEARCH DEBUG] ---")

        # Get user's university
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

        # Read and convert uploaded image
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        print(f"📸 Search image: {pil_image.size} - {pil_image.mode}")

        # Resize if too large (helps with API timeouts)
        max_search_size = (800, 800)
        if pil_image.size[0] > max_search_size[0] or pil_image.size[1] > max_search_size[1]:
            pil_image.thumbnail(max_search_size, Image.Resampling.LANCZOS)
            print(f"📐 Resized search image to: {pil_image.size}")

        # Generate image embedding (image only, no text)
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

        # Search using RPC with threshold of 0.6
        try:
            print(f"🔍 Calling RPC with threshold=0.6, count=10...")
            matches = supabase.rpc("match_items_by_image_embedding", {
                "p_university_id": university_id,
                "p_query_embedding": query_embedding,
                "p_match_threshold": 0.7,
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

@item_router.get("/find-matches/{item_id}")
async def find_matches(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Find AI-powered matches for a specific 'Lost' item.
    Uses weighted scoring based on both text and image similarity.
    Returns up to 4 potential matches.
    """
    try:
        # Security check: Verify the item belongs to the user and is 'Lost'
        item_res = supabase.table("items").select("university_id, user_id, status") \
            .eq("id", item_id) \
            .eq("user_id", user_id) \
            .single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found or you are not the owner.")
        
        if item_res.data['status'] != 'Lost':
            print(f"Match check skipped: Item {item_id} is not a 'Lost' item.")
            return []

        # Call RPC function to find matches
        TEXT_WEIGHT = 0.6  # Weight for text similarity
        IMAGE_WEIGHT = 0.4  # Weight for image similarity
        MATCH_THRESHOLD = 0.7  # Minimum combined score (70%)
        MATCH_COUNT = 4  # Number of matches to return

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
            return matches_res.data
        else:
            print(f"❌ No matches found for item {item_id} above threshold {MATCH_THRESHOLD}.")
            return []

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while finding matches: {str(e)}")

@item_router.put("/{item_id}/recover")
async def mark_as_recovered(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Mark an item as 'recovered' and close the case.
    Can only be done by the poster or the approved claimant.
    """
    try:
        # Get item details
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        finder_id = item_res.data['user_id']
        university_id = item_res.data['university_id']
        
        # Find the approved claimant (if any)
        claim_res = supabase.table("claims").select("claimant_id").eq("item_id", item_id).eq("status", "approved").execute()
        
        approved_claimant_id = claim_res.data[0]['claimant_id'] if claim_res.data else None

        # Security check: Only poster or approved claimant can mark as recovered
        if user_id not in [finder_id, approved_claimant_id]:
            raise HTTPException(status_code=403, detail="You are not authorized to perform this action.")
            
        # Update the item status to recovered
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
    Get an existing conversation or create a new one for an item.
    Prevents users from starting conversations on their own posts.
    """
    try:
        # Get the item details
        item_res = supabase.table("items").select("user_id, status").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        poster_id = item_res.data['user_id']
        message_sender_id = user_id

        # Prevent self-messaging
        if poster_id == message_sender_id:
            raise HTTPException(status_code=400, detail="You cannot start a conversation on your own item.")

        item_status = item_res.data['status']
        
        # Determine conversation participants based on item status
        finder_id = poster_id if item_status == 'Found' else message_sender_id
        claimant_id = message_sender_id if item_status == 'Found' else poster_id
        
        # Check if a conversation already exists
        existing_convo_res = supabase.table("conversations") \
            .select("id") \
            .eq("item_id", item_id) \
            .eq("finder_id", finder_id) \
            .eq("claimant_id", claimant_id) \
            .execute()

        # Return existing conversation ID if found
        if existing_convo_res.data:
            return {"conversation_id": existing_convo_res.data[0]['id']}

        # Create a new conversation
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

@conversations_router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Delete a conversation and all its messages.
    Only participants in the conversation can delete it.
    """
    try:
        # Verify user is a participant
        convo_res = supabase.table("conversations")\
            .select("id, finder_id, claimant_id")\
            .eq("id", conversation_id)\
            .single()\
            .execute()

        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        conversation = convo_res.data

        # Check authorization
        if user_id not in [conversation.get("finder_id"), conversation.get("claimant_id")]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation.")

        # Delete all messages in the conversation first
        messages_delete_res = supabase.table("messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        print(f"Deleted messages associated with conversation {conversation_id}")

        # Delete the conversation
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
    """
    Submit a claim for a 'Found' item.
    Includes verification message to prove ownership.
    """
    try:
        # Get item details and verify it's a 'Found' item
        item_res = supabase.table("items").select("user_id, title, status, university_id").eq("id", payload.item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        if item_res.data['status'] != 'Found':
            raise HTTPException(status_code=400, detail="You can only claim 'Found' items.")
        
        finder_id = item_res.data['user_id']
        item_title = item_res.data['title']
        item_university_id = item_res.data['university_id']
        
        # Prevent claiming own items
        if finder_id == claimant_id:
             raise HTTPException(status_code=400, detail="You cannot claim your own item.")

        # Create the claim record
        claim_data = {
            "item_id": payload.item_id,
            "claimant_id": claimant_id,
            "finder_id": finder_id,
            "verification_message": payload.verification_message,
            "status": "pending"
        }
        supabase.table("claims").insert(claim_data).execute()
        
        # Get claimant's name for notification
        claimant_profile_res = supabase.table("profiles").select("full_name").eq("id", claimant_id).single().execute()
        claimant_name = claimant_profile_res.data.get('full_name', 'A user') if claimant_profile_res.data else 'A user'

        # Notify the finder
        message = f"{claimant_name} has submitted a claim on your found item: '{item_title}'."
        create_notification(recipient_id=finder_id, university_id=item_university_id, message=message, link_to="/dashboard/my-posts", type='claim')
        
        return {"message": "Claim submitted successfully. The finder has been notified."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@claims_router.get("/item/{item_id}")
async def get_claims_for_item(item_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Get all pending claims for an item.
    Only the item owner can view claims.
    """
    try:
        # Verify ownership
        item_res = supabase.table("items").select("user_id").eq("id", item_id).eq("user_id", user_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=403, detail="You are not the owner of this item.")
            
        # Get all pending claims with claimant details
        claims_res = supabase.table("claims").select("*, claimant:profiles!claimant_id(full_name, email)").eq("item_id", item_id).eq("status", "pending").execute()
        
        return claims_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@claims_router.put("/{claim_id}/respond")
async def respond_to_claim(claim_id: int, payload: ClaimRespond, finder_id: str = Depends(get_current_user_id)):
    """
    Approve or reject a claim on a found item.
    If approved, creates a conversation and rejects other pending claims.
    """
    try:
        # Get claim details and verify authorization
        claim_res = supabase.table("claims").select("*, item:items(id, title, user_id, university_id)").eq("id", claim_id).single().execute()
        if not claim_res.data or claim_res.data['finder_id'] != finder_id:
            raise HTTPException(status_code=403, detail="You are not authorized to respond to this claim.")
        
        claim = claim_res.data
        item_id = claim['item']['id']
        item_title = claim['item']['title']
        claimant_id = claim['claimant_id']
        item_university_id = claim['item']['university_id']

        new_status = 'approved' if payload.approved else 'rejected'
        
        # Update claim status
        supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()
        
        if payload.approved:
            # Change item status to pending return
            supabase.table("items").update({"moderation_status": "pending_return"}).eq("id", claim['item_id']).execute()
            
            # Check if conversation already exists, otherwise create one
            existing_convo_res = supabase.table("conversations") \
                .select("id") \
                .eq("item_id", item_id) \
                .eq("finder_id", finder_id) \
                .eq("claimant_id", claimant_id) \
                .execute()

            conversation_id = None
            if existing_convo_res.data:
                # Use existing conversation
                conversation_id = existing_convo_res.data[0]['id']
                print(f"Claim approval: Found existing conversation {conversation_id}")
            else:
                # Create new conversation
                print(f"Claim approval: No conversation found, creating new one...")
                new_convo_res = supabase.table("conversations").insert({
                    "item_id": item_id,
                    "finder_id": finder_id,
                    "claimant_id": claimant_id
                }).execute()
                
                if not new_convo_res.data:
                     raise Exception("Failed to create conversation after claim approval.")
                conversation_id = new_convo_res.data[0]['id']

            # Get email addresses for notifications
            finder_profile_res = supabase.table("profiles").select("email").eq("id", finder_id).single().execute()
            claimant_profile_res = supabase.table("profiles").select("email").eq("id", claimant_id).single().execute()
            finder_email = finder_profile_res.data.get('email', 'N/A')
            claimant_email = claimant_profile_res.data.get('email', 'N/A')

            finder_message = f"You approved the claim for '{item_title}'. You can now chat with the claimant to arrange the return."
            claimant_message = f"Great news! Your claim for '{item_title}' has been approved. You can now chat with the finder to arrange the return."
            
            chat_link = f"/dashboard/messages/{conversation_id}"
            create_notification(recipient_id=finder_id, university_id=item_university_id, message=finder_message, link_to=chat_link, type='claim_response')
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=claimant_message, link_to=chat_link, type='claim_response')

            # Auto-reject other pending claims for this item
            supabase.table("claims").update({"status": "rejected"}).eq("item_id", claim['item_id']).eq("status", "pending").execute()

        else:
            # Notify claimant of rejection
            message = f"Unfortunately, your claim for '{item_title}' was not approved by the finder."
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=message, type='claim_response')
            
        return {"message": f"Claim has been {new_status}."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
# ============= Admin Routes =============
@admin_router.get("/manual-verifications")
async def get_manual_verifications(admin_id: str = Depends(get_current_user_id)):
    """
    Get all pending manual verification requests for admin's university.
    Returns user details along with verification information.
    """
    try:
        # Get admin's university
        profile_res = supabase.table("profiles").select("university_id").eq("id", admin_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Admin profile not found.")
        university_id = profile_res.data['university_id']

        # Get all pending verifications for this university
        verifications_res = supabase.table("user_verifications").select("*").eq("university_id", university_id).eq("status", "pending").execute()

        if not verifications_res.data:
            return []

        # Get user profiles for these verifications
        user_ids = [req['user_id'] for req in verifications_res.data]

        profiles_res = supabase.table("profiles").select("id, full_name, email").in_("id", user_ids).execute()
        if not profiles_res.data:
            return verifications_res.data

        # Combine verification data with user profiles
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
    """
    Approve or reject a manual verification request.
    If approved, sends confirmation email and enables user account.
    """
    try:
        # Verify admin authorization
        admin_profile_res = supabase.table("profiles").select("university_id, role").eq("id", admin_id).single().execute()
        if not admin_profile_res.data or admin_profile_res.data.get('role') != 'admin':
             raise HTTPException(status_code=403, detail="User is not an authorized administrator.")
        admin_university_id = admin_profile_res.data['university_id']

        # Get the verification request
        verification_res = supabase.table("user_verifications").select("university_id, user_id").eq("id", verification_id).single().execute()
        if not verification_res.data:
            raise HTTPException(status_code=404, detail="Verification request not found.")
        
        # Check if admin has authority for this university
        if verification_res.data['university_id'] != admin_university_id:
             raise HTTPException(status_code=403, detail="Admin not authorized for this university's request.")

        user_id_to_verify = verification_res.data['user_id']
        if action.user_id != user_id_to_verify:
             raise HTTPException(status_code=400, detail="User ID mismatch between request body and verification record.")

        # Use the university ID from the verification request
        university_id_for_user = verification_res.data['university_id']

        if action.approve:
            # Approve: Update user profile
            update_res = supabase.table("profiles").update({
                "university_id": university_id_for_user,
                "is_verified": True
            }).eq("id", user_id_to_verify).execute()

            # Update verification status
            supabase.table("user_verifications").update({"status": "approved"}).eq("id", verification_id).execute()

            # Get user details for email
            user_profile_res = supabase.table("profiles").select("email, full_name").eq("id", user_id_to_verify).single().execute()
            user_email, user_name = None, "there"
            if user_profile_res.data:
                user_email = user_profile_res.data.get('email')
                user_name = user_profile_res.data.get('full_name', user_name)

            # Send approval email if configured
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
                university_id=university_id_for_user,
                message="Congratulations! Your account has been manually verified. You can now log in.",
                link_to="/login",
                type="verification_success"
            )
            return {"message": "User approved successfully."}
        
        else:
            # Reject the verification request
            supabase.table("user_verifications").update({"status": "rejected"}).eq("id", verification_id).execute()

            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_user,
                message="Your manual verification request was not approved. Please ensure your ID image is clear and valid.",
                link_to=None,
                type="verification_failure"
            )
            return {"message": "User rejected."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
    
@admin_router.post("/items/{item_id}/status")
async def set_item_status(item_id: int, data: StatusUpdate, admin_id: str = Depends(get_current_user_id)):
    """
    Update an item's moderation status (admin only).
    Notifies the item owner of the status change.
    """
    try:
        # Get item details
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        item_owner_id = item_res.data['user_id']
        item_title = item_res.data['title']
        university_id = item_res.data['university_id']
        
        # Update item status
        resp = supabase.table("items").update({"moderation_status": data.moderation_status}).eq("id", item_id).execute()
        
        # Notify item owner
        message = f"An admin has updated your post '{item_title}' to a status of: {data.moderation_status}."
        create_notification(recipient_id=item_owner_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
        
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users/{user_id}/ban")
async def set_user_ban(user_id: str, data: BanUpdate, admin_id: str = Depends(get_current_user_id)):
    """Ban or unban a user (admin only)."""
    try:
        resp = supabase.table("profiles").update({"is_banned": data.is_banned}).eq("id", user_id).execute()
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/users/{user_id}/role")
async def set_user_role(user_id: str, data: RoleUpdate, admin_id: str = Depends(get_current_user_id)):
    """Change a user's role (admin only)."""
    try:
        resp = supabase.table("profiles").update({"role": data.role}).eq("id", user_id).execute()
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============= Profile Routes =============
@profile_router.put("/")
async def update_profile(full_name: Optional[str] = Form(None), avatar: Optional[UploadFile] = File(None), current_user_id: str = Depends(get_current_user_id)):
    """
    Update user profile information (name and/or avatar).
    Avatar images are automatically resized for efficiency.
    """
    try:
        updates = {}
        if full_name is not None:
            updates["full_name"] = full_name.strip()
        if avatar is not None:
            file_suffix = Path(avatar.filename or "other_images").suffix
            filename = f"{current_user_id}/{uuid4().hex}{file_suffix}"
            file_bytes = await avatar.read()
            
            # Resize avatar if too large
            max_avatar_size = int(os.getenv('MAX_AVATAR_SIZE', '2097152'))
            if len(file_bytes) > max_avatar_size:
                file_bytes = process_image_efficiently(file_bytes, max_size=(400, 400))
            
            # Upload with upsert to replace old avatar
            supabase.storage.from_("other_images").upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            public_url = supabase.storage.from_("other_images").get_public_url(filename)
            updates["avatar_url"] = f"{public_url}?t={uuid4().hex}"

        if not updates:
            raise HTTPException(status_code=400, detail="No update information provided.")
        
        # Apply updates
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        profile_result = supabase.table("profiles").select("id, full_name, email, avatar_url, role, is_banned").eq("id", current_user_id).single().execute()
        return {"profile": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@profile_router.get("/preferences")
async def get_user_preferences(current_user_id: str = Depends(get_current_user_id)):
    """
    Get user notification preferences.
    Returns default values if no preferences are set.
    """
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
    """
    Update user notification preferences.
    Controls which types of notifications the user receives.
    """
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

# ============= Backup & Restore Endpoints =============
@backup_router.post("/create")
async def create_backup(university_id: int = Depends(get_admin_university_id)):
    """
    Create a complete backup of all data for the admin's university.
    Only includes data associated with their university_id.
    """
    try:
        backup_data = {}
        
        # Tables that have direct university_id foreign key
        tenant_tables = ["profiles", "items", "allowed_domains", "site_settings", "user_verifications", "notifications"]
        
        # Fetch data from all tenant tables
        for table in tenant_tables:
            try:
                result = supabase.table(table).select("*").eq("university_id", university_id).execute()
                backup_data[table] = result.data if result.data else []
            except Exception as e:
                print(f"Error fetching {table}: {e}")
                backup_data[table] = []
        
        # Get all item_ids from this university's items
        item_ids = [item["id"] for item in backup_data.get("items", []) if "id" in item]
        
        # Fetch related claims
        if item_ids:
            try:
                claims_result = supabase.table("claims").select("*").in_("item_id", item_ids).execute()
                backup_data["claims"] = claims_result.data if claims_result.data else []
            except Exception as e:
                print(f"Error fetching claims: {e}")
                backup_data["claims"] = []
        else:
            backup_data["claims"] = []
        
        # Fetch related conversations
        if item_ids:
            try:
                conversations_result = supabase.table("conversations").select("*").in_("item_id", item_ids).execute()
                backup_data["conversations"] = conversations_result.data if conversations_result.data else []
            except Exception as e:
                print(f"Error fetching conversations: {e}")
                backup_data["conversations"] = []
        else:
            backup_data["conversations"] = []
        
        # Get all conversation_ids from the fetched conversations
        convo_ids = [convo["id"] for convo in backup_data.get("conversations", []) if "id" in convo]
        
        # Fetch related messages
        if convo_ids:
            try:
                messages_result = supabase.table("messages").select("*").in_("conversation_id", convo_ids).execute()
                backup_data["messages"] = messages_result.data if messages_result.data else []
            except Exception as e:
                print(f"Error fetching messages: {e}")
                backup_data["messages"] = []
        else:
            backup_data["messages"] = []
        
        # Serialize to JSON
        json_data = json.dumps(backup_data, indent=2, default=str)
        
        # Create in-memory file
        file_io = io.BytesIO(json_data.encode('utf-8'))
        
        # Generate timestamp and storage path
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        storage_path = f"university_{university_id}/backup_{timestamp}.json"
        
        # Upload to Supabase storage
        try:
            supabase.storage.from_("backups").upload(
                path=storage_path,
                file=file_io.getvalue(),
                file_options={"content-type": "application/json"}
            )
        except Exception as e:
            print(f"Error uploading to storage: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload backup: {str(e)}")
        
        return {
            "message": "Backup created successfully",
            "file_name": f"backup_{timestamp}.json",
            "storage_path": storage_path,
            "timestamp": timestamp
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")

@backup_router.get("/list")
async def list_backups(university_id: int = Depends(get_admin_university_id)):
    """
    List all available backups for the admin's university.
    """
    try:
        # List files in the university's folder
        folder_path = f"university_{university_id}"
        
        try:
            result = supabase.storage.from_("backups").list(folder_path)
        except Exception as e:
            print(f"Error listing backups: {e}")
            # If folder doesn't exist yet, return empty list
            return {"backups": []}
        
        # Sort by name (timestamp) in descending order
        if result:
            sorted_backups = sorted(result, key=lambda x: x.get("name", ""), reverse=True)
            return {"backups": sorted_backups}
        
        return {"backups": []}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@backup_router.get("/download/{file_name}")
async def download_backup(file_name: str, university_id: int = Depends(get_admin_university_id)):
    """
    Download a specific backup file.
    Includes security check to prevent path traversal attacks.
    """
    try:
        # Construct the storage path
        storage_path = f"university_{university_id}/{file_name}"
        
        # Security check: List files and verify the requested file exists
        try:
            folder_path = f"university_{university_id}"
            file_list = supabase.storage.from_("backups").list(folder_path)
            
            # Check if file exists in the list
            file_exists = any(f.get("name") == file_name for f in file_list)
            
            if not file_exists:
                raise HTTPException(status_code=404, detail="Backup file not found")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying file: {e}")
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        # Download the file
        try:
            file_bytes = supabase.storage.from_("backups").download(storage_path)
        except Exception as e:
            print(f"Error downloading file: {e}")
            raise HTTPException(status_code=500, detail="Failed to download backup file")
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename={file_name}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to download backup: {str(e)}")

# ============= Dashboard Summary Endpoint =============
@app.get("/api/dashboard-summary")
async def get_dashboard_summary(user_id: str = Depends(get_current_user_id)):
    """
    Get consolidated dashboard data in a single API call.
    Returns: recent items, user stats, unread notifications, AI matches.
    Optimized for fast dashboard loading.
    """
    try:
        # Get user's university
        profile_res = supabase.table("profiles").select("university_id, full_name").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        
        university_id = profile_res.data['university_id']
        
        # 1. Get user's recent posts (5 most recent for display)
        my_posts_res = supabase.table("items").select("*").eq("user_id", user_id).order(
            "created_at", desc=True
        ).limit(5).execute()
        
        # 1b. Get ALL user posts for chart data
        all_my_posts_res = supabase.table("items").select("category, status, created_at").eq(
            "user_id", user_id
        ).execute()
        
        # 2. Get recent campus activity (5 most recent approved items from others)
        recent_activity_res = supabase.table("items").select(
            "*, profiles(id, full_name, email)"
        ).eq("university_id", university_id).eq("moderation_status", "approved").neq(
            "user_id", user_id
        ).order("created_at", desc=True).limit(5).execute()
        
        # 3. Get user's item counts
        found_count_res = supabase.table("items").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("status", "Found").execute()
        
        lost_count_res = supabase.table("items").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("status", "Lost").execute()
        
        pending_count_res = supabase.table("items").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("moderation_status", "pending").execute()
        
        recovered_count_res = supabase.table("items").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("moderation_status", "recovered").execute()
        
        # 4. Get unread notifications count
        unread_notif_res = supabase.table("notifications").select("id", count="exact").eq(
            "recipient_id", user_id
        ).eq("status", "unread").execute()
        
        # 5. Get AI matches for user's lost items (top 3 matches)
        user_lost_items = supabase.table("items").select("id, title").eq(
            "user_id", user_id
        ).eq("status", "Lost").eq("moderation_status", "approved").order(
            "created_at", desc=True
        ).limit(1).execute()
        
        ai_matches = []
        if user_lost_items.data and len(user_lost_items.data) > 0:
            # Get matches for the most recent lost item
            lost_item_id = user_lost_items.data[0]["id"]
            try:
                matches_res = supabase.rpc('find_matches_for_lost_item', {
                    'p_item_id': lost_item_id,
                    'p_limit': 3
                }).execute()
                ai_matches = matches_res.data or []
            except Exception as match_err:
                print(f"Error fetching AI matches: {match_err}")
                ai_matches = []
        
        return {
            "myRecentPosts": my_posts_res.data or [],
            "allMyPosts": all_my_posts_res.data or [],
            "recentActivity": recent_activity_res.data or [],
            "userStats": {
                "found": found_count_res.count or 0,
                "lost": lost_count_res.count or 0,
                "pending": pending_count_res.count or 0,
                "recovered": recovered_count_res.count or 0
            },
            "unreadNotifications": unread_notif_res.count or 0,
            "aiMatches": ai_matches
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard summary: {str(e)}")

# ============= Badge Routes (Task 2) =============
@badges_router.get("/user/{target_user_id}/badges")
async def get_user_badges(target_user_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Get all badges earned by a specific user.
    Returns badge details with earned timestamp.
    """
    try:
        # Fetch user badges with badge details using the view
        badges_res = supabase.from_("user_badges_view").select("*").eq(
            "user_id", target_user_id
        ).order("earned_at", desc=True).execute()
        
        return {"badges": badges_res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch user badges: {str(e)}")

@badges_router.get("/all")
async def get_all_badges(user_id: str = Depends(get_current_user_id)):
    """Get all available badges in the system."""
    try:
        badges_res = supabase.table("badges").select("*").order("name").execute()
        return {"badges": badges_res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")

# ============= Handover Routes (Task 4) =============
@handover_router.post("/items/{item_id}/start-handover")
async def start_handover(item_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Start secure handover process (claimant only).
    Generates a 4-digit code for verification.
    """
    try:
        import random
        
        # Get item details
        item_res = supabase.table("items").select(
            "id, title, user_id, status"
        ).eq("id", item_id).single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        item = item_res.data
        
        # TODO: In a real implementation, check if user is the claimant
        # For now, we'll allow any authenticated user to start handover
        # You would need a claims table to track who claimed what
        
        # Generate 4-digit code
        handover_code = str(random.randint(1000, 9999))
        
        # Update item with handover code and change status
        supabase.table("items").update({
            "handover_code": handover_code,
            "status": "Pending Handover"
        }).eq("id", item_id).execute()
        
        print(f"🔐 Handover started for item {item_id}, code: {handover_code}")
        
        return {
            "success": True,
            "code": handover_code,
            "message": "Handover code generated. Share this code with the finder."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start handover: {str(e)}")

@handover_router.post("/items/{item_id}/complete-handover")
async def complete_handover(item_id: str, code: str = Form(...), user_id: str = Depends(get_current_user_id)):
    """
    Complete handover process (finder only).
    Verifies the 4-digit code and marks item as recovered.
    """
    try:
        # Get item details
        item_res = supabase.table("items").select(
            "id, title, user_id, handover_code, university_id"
        ).eq("id", item_id).single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        item = item_res.data
        
        # Verify the user is the finder (item owner)
        if item['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="Only the finder can complete handover.")
        
        # Verify the code
        if item.get('handover_code') != code:
            raise HTTPException(status_code=400, detail="Invalid handover code.")
        
        # Update item status to Recovered
        supabase.table("items").update({
            "status": "Recovered",
            "handover_code": None  # Clear the code
        }).eq("id", item_id).execute()
        
        # TODO: Get claimant_id from claims table
        # For now, we'll just notify the finder
        # In a real implementation, you'd:
        # 1. Get the claimant from claims table
        # 2. Notify them to send a thank you note
        # 3. Award badges based on return count
        
        # Award badges to finder
        # Count returned items (Found items that are now Recovered)
        returned_count_res = supabase.table("items").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("status", "Recovered").execute()
        
        returned_count = returned_count_res.count or 0
        
        if returned_count == 1:
            award_badge(user_id, "Good Samaritan", item['university_id'])
        elif returned_count >= 5:
            award_badge(user_id, "Campus Hero", item['university_id'])
        
        print(f"✅ Handover completed for item {item_id}")
        
        return {
            "success": True,
            "message": "Item successfully returned! Thank you for being a campus hero! 🎉"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to complete handover: {str(e)}")

@handover_router.post("/items/{item_id}/thank-you")
async def send_thank_you_note(
    item_id: str, 
    message: str = Form(...), 
    user_id: str = Depends(get_current_user_id)
):
    """
    Send a thank you note to the finder (claimant only).
    """
    try:
        # Get item details
        item_res = supabase.table("items").select(
            "id, title, user_id"
        ).eq("id", item_id).single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        item = item_res.data
        finder_id = item['user_id']
        
        # TODO: Verify user is the claimant
        # For now, allow any authenticated user to send thank you note
        
        # Insert thank you note
        supabase.table("thank_you_notes").insert({
            "item_id": item_id,
            "finder_id": finder_id,
            "claimant_id": user_id,
            "message": message
        }).execute()
        
        # Notify finder
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if profile_res.data:
            university_id = profile_res.data['university_id']
            create_notification(
                recipient_id=finder_id,
                university_id=university_id,
                message=f"You received a thank you note for returning {item['title']}!",
                link_to="/profile",
                type="thank_you"
            )
        
        print(f"💌 Thank you note sent for item {item_id}")
        
        return {
            "success": True,
            "message": "Thank you note sent successfully!"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send thank you note: {str(e)}")

@handover_router.get("/user/{target_user_id}/thank-you-notes")
async def get_user_thank_you_notes(target_user_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Get all thank you notes received by a user.
    """
    try:
        # Fetch thank you notes using the view
        notes_res = supabase.from_("thank_you_notes_view").select("*").eq(
            "finder_id", target_user_id
        ).order("created_at", desc=True).execute()
        
        return {"notes": notes_res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch thank you notes: {str(e)}")

# ============= Include Routers =============
# Register all API routers with the main app
app.include_router(auth_router)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(notification_router)
app.include_router(onboarding_router)
app.include_router(claims_router) 
app.include_router(conversations_router)
app.include_router(backup_router)
app.include_router(badges_router)
app.include_router(handover_router)
app.include_router(badges_router)
app.include_router(handover_router)

# ============= Health Check & Root =============
@app.get("/health")
async def health_check():
    """
    Health check endpoint for deployment platforms (e.g., Railway).
    Returns service status and AI availability.
    """
    return {
        "status": "healthy",
        "service": "campustrace-api",
        "ai_enabled": model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def read_root():
    """Root endpoint with basic API information."""
    return {
        "status": "Campus Trace backend is running!",
        "ai_enabled": model is not None,
        "environment": "production",
        "docs": "/docs",
        "health": "/health"
    }