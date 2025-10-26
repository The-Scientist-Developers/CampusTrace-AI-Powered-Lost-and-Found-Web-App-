import os
from pathlib import Path
from uuid import uuid4
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

from app.config import get_settings
from app.dependencies import get_current_user_id, supabase # Import dependencies
from app import clip_util, text_embedding_util

# --- Configuration ---
settings = get_settings()
model = None

app = FastAPI()

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    print("✅ Resend client configured.")
else:
    print("⚠️ WARNING: RESEND_API_KEY not found. Email notifications disabled.")

@app.on_event("startup")
async def startup_event():
    """Load AI models on application startup."""
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            global model
            model = genai.GenerativeModel('gemini-2.5-flash')
            print("✅ Gemini AI model configured successfully.")
        except Exception as e:
            print(f"❌ ERROR: Could not configure Gemini AI: {e}")
    else:
        print("⚠️ WARNING: GEMINI_API_KEY not found. AI features disabled.")
    
    # Load other ML models
clip_util.load_model()
text_embedding_util.load_model()


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

class ManualSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    university_id: int
    captchaToken: str

class VerificationAction(BaseModel):
    approve: bool
    user_id: str

class DescriptionRequest(BaseModel):
    title: str
    category: str
    draft_description: str

class VerificationAction(BaseModel):
    approve: bool
    user_id: str

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

# --- Pydantic models for the Claim Process ---
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


# ============= Onboarding Route =============
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

        # 4. Create the user with email verification
        sign_up_res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        new_user = sign_up_res.user
        new_user_id = new_user.id

        # 5. Update the profile with admin role and full name
        supabase.table("profiles").update({
            "full_name": payload.full_name,
            "role": "admin",
            "university_id": new_university_id
        }).eq("id", new_user.id).execute()

        # 6. Activate the university
        supabase.table("universities").update({"status": "active"}).eq("id", new_university_id).execute()

        return {"message": "University created successfully. Please check your email to verify your account."}

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
        # Return default safe values in case of error
        return {
            "auto_approve_posts": False,
            "keyword_blacklist": []
        }

async def verify_captcha(token: str, client_ip: Optional[str]):
    if not settings.RECAPTCHA_SECRET_KEY:
        print("⚠️ WARNING: RECAPTCHA_SECRET_KEY not set. Skipping verification for development.")
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
            print(f"❌ CAPTCHA verification failed: {result.get('error-codes')}")
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed.")
        print("✅ CAPTCHA verified successfully.")
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
        print(f"📬 Notification created for user {recipient_id}")
    except Exception as e:
        print(f"❌ Error creating notification: {e}")

async def generate_ai_tags(title: str, description: str) -> Optional[List[str]]:
    if not model: 
        return []
    try:
        prompt = f"Generate 5-7 relevant, comma-separated keywords for this item. Do not use hashtags. Keywords should include item type, color, brand, and features. Title: '{title}'. Description: '{description}'"
        response = await model.generate_content_async(prompt)
        tags_string = response.text.strip().replace("#", "")
        tags_list = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        return tags_list[:7]
    except Exception as e:
        print(f"❌ Error generating AI tags: {e}")
        return []

def calculate_simple_match_score(lost_item: dict, found_item: dict) -> int:
    """Calculate a simple text-based similarity score (0-100)."""
    score = 0
    
    # Category match (40 points)
    if lost_item.get("category") == found_item.get("category"):
        score += 40
    
    # Title keyword match (30 points)
    lost_title = lost_item.get("title", "").lower()
    found_title = found_item.get("title", "").lower()
    lost_keywords = set(lost_title.split())
    found_keywords = set(found_title.split())
    keyword_overlap = len(lost_keywords & found_keywords)
    if keyword_overlap > 0:
        score += min(30, keyword_overlap * 10)
    
    # Description keyword match (20 points)
    lost_desc = lost_item.get("description", "").lower()
    found_desc = found_item.get("description", "").lower()
    lost_desc_keywords = set(lost_desc.split())
    found_desc_keywords = set(found_desc.split())
    desc_overlap = len(lost_desc_keywords & found_desc_keywords)
    if desc_overlap > 0:
        score += min(20, desc_overlap * 5)
    
    # Location match (10 points)
    if lost_item.get("location") == found_item.get("location"):
        score += 10
    
    return min(100, score)

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
    Handles the entire signup and manual verification submission process for users with personal emails.
    """
    await verify_captcha(captchaToken, request.client.host)
    
    try:
        # 1. Check if user already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # 2. Create the user in Supabase Auth (they will get a confirmation email)
        sign_up_res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": { "email_redirect_to": settings.PENDING_APPROVAL_REDIRECT}
        })
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")
        
        user = sign_up_res.user

        # *** MODIFIED SECTION: Use upsert instead of update ***
        # 3. Create or update the user's profile to ensure it exists
        supabase.table("profiles").upsert({
            "id": user.id, # Include the user ID for the upsert
            "full_name": full_name,
            "university_id": university_id,
            "role": "member",
            "is_verified": False 
        }).execute()
        # *** END OF MODIFICATION ***

        # 4. Upload the user's ID image to secure storage
        file_bytes = await id_file.read()
        file_suffix = Path(id_file.filename or "").suffix
        file_path = f"manual_verifications/{user.id}/{uuid4().hex}{file_suffix}"
        
        supabase.storage.from_("other_images").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": id_file.content_type or "application/octet-stream"}
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # 5. Create a record of the verification request for admins to review
        # This will now succeed because the profile is guaranteed to exist.
        supabase.table("user_verifications").insert({
            "user_id": user.id,
            "university_id": university_id,
            "id_image_url": id_image_url,
            "status": "pending"
        }).execute()

        # 6. Notify the relevant university admins
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

    except Exception as e:
        traceback.print_exc()
        # Clean up failed user creation if something goes wrong
        if 'user' in locals() and user:
            try:
                supabase.auth.admin.delete_user(user.id)
            except Exception as delete_e:
                print(f"Failed to clean up user during signup error: {delete_e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@auth_router.post("/signup")
async def signup_user(payload: SignupRequest, request: Request):
    await verify_captcha(payload.captchaToken, request.client.host)
    domain = payload.email.split("@")[-1]
    domain_res = supabase.table("allowed_domains").select("university_id").eq("domain_name", domain).single().execute()
    if not domain_res.data:
        raise HTTPException(status_code=400, detail="This email domain is not registered on CampusTrace.")
    
    try:
        # Attempt to sign up the user
        result = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {"full_name": payload.full_name},
                "email_redirect_to": settings.EMAIL_CONFIRM_REDIRECT
            }
        })
        
        # Log the full result for debugging
        print(f"Signup result: {result}")
        
        # Check various response scenarios
        if result.user:
            # Check if email is already confirmed (existing user)
            if hasattr(result.user, 'confirmed_at') and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please sign in instead."
                )
            
            # Check if the user has an identities array (another way to check for existing users)
            if hasattr(result.user, 'identities') and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account."
                )
            
            # New user created successfully but needs email confirmation
            # Update profile after user is created in auth
            supabase.table("profiles").update({
                "full_name": payload.full_name,
                "university_id": domain_res.data["university_id"],
                "role": "member"  # Set default role to member
            }).eq("id", result.user.id).execute()
            
            return {"message": "Check your inbox to confirm your email before signing in."}
        else:
            # If no user object returned, likely means user exists
            raise HTTPException(
                status_code=400, 
                detail="Unable to create account. An account with this email may already exist."
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as exc:
        # Log the full exception details
        print(f"✗ Signup failure - Full exception: {exc}")
        print(f"✗ Exception type: {type(exc).__name__}")
        print(f"✗ Exception args: {exc.args if hasattr(exc, 'args') else 'No args'}")
        
        error_message = str(exc).lower()
        
        # Check for specific error messages
        if "user already registered" in error_message:
            raise HTTPException(
                status_code=400, 
                detail="An account with this email already exists. Please sign in instead."
            )
        elif "duplicate" in error_message or "already exists" in error_message:
            raise HTTPException(
                status_code=400, 
                detail="An account with this email already exists. Please sign in instead."
            )
        elif "invalid email" in error_message:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        elif "weak password" in error_message:
            raise HTTPException(status_code=400, detail="Password is too weak. Please use a stronger password.")
        else:
            # Include more detail in the error for debugging
            raise HTTPException(
                status_code=400, 
                detail=f"Signup failed: {str(exc)}"  # Temporarily show the actual error
            )

# ============= Item Routes =============

@item_router.get("/leaderboard")
async def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found.")
        
        university_id = profile_res.data['university_id']

        # Call the database function
        leaderboard_res = supabase.rpc('get_leaderboard_for_university', {
            'p_university_id': university_id,
            'p_limit': 10
        }).execute()
        
        # The 'if leaderboard_res.error:' check is removed. 
        # The try/except block will catch any errors from the RPC call.

        return leaderboard_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@item_router.post("/generate-description")
async def generate_description(payload: DescriptionRequest):
    """
    Rewrites and enhances a user's draft description using the AI model.
    """
    if not model:
        raise HTTPException(status_code=503, detail="AI features are not available.")
    try:
        # This new prompt focuses on improving the user's text
        prompt = f"""
        A user has provided a draft description for a lost or found item. Rewrite and enhance it to be more clear, detailed, and effective.

        Original Information:
        - Item Title: "{payload.title}"
        - Category: "{payload.category}"
        - User's Draft Description: "{payload.draft_description}"

        Your task:
        - Refine the language to be clear and concise.
        - Organize the details logically.
        - If key details like brand, color, size, or unique marks are missing, add placeholders like [Specify Color] or [Describe any unique marks] to prompt the user to add them.
        - Ensure the tone is helpful.
        - Return only the improved description text, without any introductory phrases like "Here's the improved description:".
        """
        response = await model.generate_content_async(prompt)
        return {"description": response.text.strip()}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate AI description: {str(e)}")
    
@item_router.post("/create")
async def create_item(item_data: str = Form(...), image_file: Optional[UploadFile] = File(None), user_id: str = Depends(get_current_user_id)):
    try:
        item = ItemCreate.parse_raw(item_data)
        
        profile_res = supabase.table("profiles").select("university_id, full_name").eq("id", user_id).single().execute()
        if not profile_res.data: 
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data['university_id']
        user_full_name = profile_res.data.get('full_name', 'A user')

        uni_settings = await get_university_settings(university_id)
        
        moderation_status = "pending"
        post_content = f"{item.title.lower()} {item.description.lower()}"
        
        if uni_settings["keyword_blacklist"] and any(keyword in post_content for keyword in uni_settings["keyword_blacklist"]):
            moderation_status = "pending"
        elif uni_settings["auto_approve_posts"]:
            moderation_status = "approved"
        
        ai_tags = await generate_ai_tags(item.title, item.description)
        image_url, image_embedding = None, None
        combined_text = f"{item.title}. {item.description}"
        text_embedding = text_embedding_util.get_text_embedding(combined_text)

        if image_file:
            image_bytes = await image_file.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
            image_embedding = clip_util.get_image_embedding(pil_image)
            
            file_suffix = Path(image_file.filename or "").suffix
            file_path = f"public/{user_id}/{uuid4().hex}{file_suffix}"
            supabase.storage.from_("item_images").upload(path=file_path, file=image_bytes, file_options={"content-type": image_file.content_type or "application/octet-stream"})
            image_url = supabase.storage.from_("item_images").get_public_url(file_path)

        post_data = {
            "title": item.title, "description": item.description, "status": item.status,
            "category": item.category, "location": item.location, "contact_info": item.contact_info,
            "ai_tags": ai_tags, "image_url": image_url, "user_id": user_id,
            "university_id": university_id, "image_embedding": image_embedding, "text_embedding": text_embedding,
            "moderation_status": moderation_status
        }
        insert_response = supabase.table("items").insert(post_data).execute()
        new_item = insert_response.data[0]

        if moderation_status == "pending":
            admins_res = supabase.table("profiles").select("id").eq("university_id", university_id).eq("role", "admin").execute()
            if admins_res.data:
                message = f"New item '{item.title}' from {user_full_name} is awaiting moderation."
                for admin in admins_res.data:
                    create_notification(
                        recipient_id=admin['id'],
                        university_id=university_id,
                        message=message,
                        link_to="/admin/post-moderation",
                        type='moderation'
                    )
        
        return {"data": new_item}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@item_router.post("/image-search")
async def search_by_image(image_file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    try:
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data: 
            raise HTTPException(status_code=404, detail="User profile not found.")
        university_id = profile_res.data['university_id']
        image_bytes = await image_file.read()
        pil_image = Image.open(io.BytesIO(image_bytes))
        query_embedding = clip_util.get_image_embedding(pil_image)
        matches = supabase.rpc('match_items_by_embedding', {'p_university_id': university_id, 'p_query_embedding': query_embedding, 'p_match_threshold': 0.75, 'p_match_count': 10}).execute()
        return matches.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

@item_router.get("/find-matches/{item_id}")
async def find_matches_for_item(
    item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    try:
        item_response = supabase.table("items").select("*").eq("id", item_id).execute()
        if not item_response.data:
            return []
        
        lost_item = item_response.data[0]
        if lost_item["status"] != "Lost":
            return []
        
        found_items_response = supabase.table("items")\
            .select("*")\
            .eq("university_id", lost_item["university_id"])\
            .eq("status", "Found")\
            .eq("moderation_status", "approved")\
            .execute()
        
        if not found_items_response.data:
            return []
        
        matches = []
        for found_item in found_items_response.data:
            score = calculate_simple_match_score(lost_item, found_item)
            if score > 50:
                found_item["match_score"] = score
                matches.append(found_item)
        
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches[:5]
        
    except Exception as e:
        traceback.print_exc()
        return []

# Endpoint to mark an item as recovered
@item_router.put("/{item_id}/recover")
async def mark_as_recovered(item_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        item_res = supabase.table("items").select("user_id, title, university_id").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        finder_id = item_res.data['user_id']
        university_id = item_res.data['university_id']
        
        claim_res = supabase.table("claims").select("claimant_id").eq("item_id", item_id).eq("status", "approved").execute()
        
        approved_claimant_id = claim_res.data[0]['claimant_id'] if claim_res.data else None

        if user_id not in [finder_id, approved_claimant_id]:
            raise HTTPException(status_code=403, detail="You are not authorized to perform this action.")
            
        supabase.table("items").update({"moderation_status": "recovered"}).eq("id", item_id).execute()

        message = f"The item '{item_res.data['title']}' has been marked as recovered. This case is now closed."
        if finder_id:
            create_notification(recipient_id=finder_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
        if approved_claimant_id and approved_claimant_id != finder_id:
            create_notification(recipient_id=approved_claimant_id, university_id=university_id, message=message, link_to="/dashboard/my-posts", type='moderation')
            
        return {"message": "Item marked as recovered."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


#======conversations router=======

@conversations_router.post("/")
async def get_or_create_conversation(item_id: int = Form(...), user_id: str = Depends(get_current_user_id)):
    try:
        item_res = supabase.table("items").select("user_id, status").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        
        poster_id = item_res.data['user_id']
        message_sender_id = user_id

        if poster_id == message_sender_id:
            raise HTTPException(status_code=400, detail="You cannot start a conversation on your own item.")

        item_status = item_res.data['status']
        finder_id = poster_id if item_status == 'Found' else message_sender_id
        claimant_id = message_sender_id if item_status == 'Found' else poster_id
        
        existing_convo_res = supabase.table("conversations") \
            .select("id") \
            .eq("item_id", item_id) \
            .eq("finder_id", finder_id) \
            .eq("claimant_id", claimant_id) \
            .execute()

        if existing_convo_res.data:
            return {"conversation_id": existing_convo_res.data[0]['id']}

        # --- THIS IS THE CORRECTED CODE ---
        new_convo_res = supabase.table("conversations").insert({
            "item_id": item_id,
            "finder_id": finder_id,
            "claimant_id": claimant_id
        }).execute()
        # --- END OF CORRECTION ---

        if not new_convo_res.data:
            raise Exception("Failed to create conversation and get ID back.")

        return {"conversation_id": new_convo_res.data[0]['id']}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@conversations_router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, user_id: str = Depends(get_current_user_id)):
    """Deletes a conversation and its associated messages if the user is a participant."""
    try:
        # 1. Fetch the conversation to verify ownership
        convo_res = supabase.table("conversations")\
            .select("id, finder_id, claimant_id")\
            .eq("id", conversation_id)\
            .single()\
            .execute()

        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        conversation = convo_res.data

        # 2. Check if the current user is part of this conversation
        if user_id not in [conversation.get("finder_id"), conversation.get("claimant_id")]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation.")

        # 3. Delete associated messages first
        messages_delete_res = supabase.table("messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        # Log if message deletion fails but don't necessarily stop the process
        # if messages_delete_res.error:
        #     print(f"Warning: Failed to delete messages for conversation {conversation_id}: {messages_delete_res.error.message}")
        print(f"Deleted messages associated with conversation {conversation_id}")


        # 4. Delete the conversation itself
        convo_delete_res = supabase.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .execute()

        # Check if the conversation deletion failed
        # Depending on Supabase client, might need to check data or error
        # if convo_delete_res.error:
        #      raise Exception(f"Failed to delete conversation: {convo_delete_res.error.message}")
        # Assuming success if no exception is raised

        return {"message": "Conversation deleted successfully."}

    except HTTPException as http_exc:
        raise http_exc # Re-raise HTTP exceptions directly
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the conversation: {str(e)}")

# ============= Claims Routes =============

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
            
            # --- NEW LOGIC: CREATE CONVERSATION ---
            conversation_res = supabase.table("conversations").insert({
                "item_id": item_id,
                "finder_id": finder_id,
                "claimant_id": claimant_id
            }).execute()
            conversation_id = conversation_res.data[0]['id']
            # --- END OF NEW LOGIC ---

            finder_profile_res = supabase.table("profiles").select("email").eq("id", finder_id).single().execute()
            claimant_profile_res = supabase.table("profiles").select("email").eq("id", claimant_id).single().execute()
            finder_email = finder_profile_res.data['email']
            claimant_email = claimant_profile_res.data['email']

            # Update notifications to link to the new chat
            finder_message = f"You approved the claim for '{item_title}'. You can now chat with the claimant to arrange the return."
            claimant_message = f"Great news! Your claim for '{item_title}' has been approved. You can now chat with the finder to arrange the return."
            
            # --- MODIFIED NOTIFICATIONS ---
            chat_link = f"/dashboard/messages/{conversation_id}"
            create_notification(recipient_id=finder_id, university_id=item_university_id, message=finder_message, link_to=chat_link, type='claim_response')
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=claimant_message, link_to=chat_link, type='claim_response')
            # --- END OF MODIFICATION ---

            supabase.table("claims").update({"status": "rejected"}).eq("item_id", claim['item_id']).eq("status", "pending").execute()

        else:
            message = f"Unfortunately, your claim for '{item_title}' was not approved by the finder."
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=message, type='claim_response')
            
        return {"message": f"Claim has been {new_status}."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
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

@claims_router.put("/{claim_id}/respond")
async def respond_to_claim(claim_id: int, payload: ClaimRespond, finder_id: str = Depends(get_current_user_id)):
    try:
        claim_res = supabase.table("claims").select("*, item:items(title, user_id, university_id)").eq("id", claim_id).single().execute()
        if not claim_res.data or claim_res.data['finder_id'] != finder_id:
            raise HTTPException(status_code=403, detail="You are not authorized to respond to this claim.")
        
        claim = claim_res.data
        item_title = claim['item']['title']
        claimant_id = claim['claimant_id']
        item_university_id = claim['item']['university_id']

        new_status = 'approved' if payload.approved else 'rejected'
        
        supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()
        
        if payload.approved:
            supabase.table("items").update({"moderation_status": "pending_return"}).eq("id", claim['item_id']).execute()
            
            finder_profile_res = supabase.table("profiles").select("email").eq("id", finder_id).single().execute()
            claimant_profile_res = supabase.table("profiles").select("email").eq("id", claimant_id).single().execute()
            finder_email = finder_profile_res.data['email']
            claimant_email = claimant_profile_res.data['email']

            finder_message = f"You approved the claim for '{item_title}'. You can now contact the claimant at {claimant_email} to arrange the return."
            claimant_message = f"Great news! Your claim for '{item_title}' has been approved. You can contact the finder at {finder_email} to arrange the return."
            
            create_notification(recipient_id=finder_id, university_id=item_university_id, message=finder_message, type='claim_response')
            create_notification(recipient_id=claimant_id, university_id=item_university_id, message=claimant_message, type='claim_response')

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
    """
    Fetches all pending manual verification requests for the admin's university.
    """
    try:
        # Get admin's university
        profile_res = supabase.table("profiles").select("university_id").eq("id", admin_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Admin profile not found.")
        university_id = profile_res.data['university_id']

        # 1. Fetch pending verification requests
        verifications_res = supabase.table("user_verifications").select("*").eq("university_id", university_id).eq("status", "pending").execute()

        if not verifications_res.data:
            return []

        # 2. Get the user IDs from the requests
        user_ids = [req['user_id'] for req in verifications_res.data]

        # 3. Fetch the corresponding user profiles
        profiles_res = supabase.table("profiles").select("id, full_name, email").in_("id", user_ids).execute()
        if not profiles_res.data:
            return verifications_res.data # Return requests even if profiles are missing

        # 4. Create a map for easy lookup
        profiles_map = {profile['id']: profile for profile in profiles_res.data}

        # 5. Combine the verification request with the user's profile information
        combined_data = []
        for req in verifications_res.data:
            req['user'] = profiles_map.get(req['user_id'])
            combined_data.append(req)

        return combined_data
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/manual-verifications/{verification_id}/respond") # Verify path matches your router setup
async def respond_to_verification(
    verification_id: int,
    action: VerificationAction,
    admin_id: str = Depends(get_current_user_id) # Ensure admin_id is fetched
):
    """
    Allows an admin to approve or reject a manual verification request.
    Sends an email notification using direct HTML content upon approval.
    """
    try:
        # 1. Verify admin role and get admin's university
        admin_profile_res = supabase.table("profiles").select("university_id, role").eq("id", admin_id).single().execute()
        if not admin_profile_res.data or admin_profile_res.data.get('role') != 'admin':
             raise HTTPException(status_code=403, detail="User is not an authorized administrator.")
        admin_university_id = admin_profile_res.data['university_id']

        # 2. Verify the verification request belongs to the admin's university
        verification_res = supabase.table("user_verifications").select("university_id, user_id").eq("id", verification_id).single().execute()
        if not verification_res.data:
            raise HTTPException(status_code=404, detail="Verification request not found.")
        if verification_res.data['university_id'] != admin_university_id:
             raise HTTPException(status_code=403, detail="Admin not authorized for this university's request.")

        user_id_to_verify = verification_res.data['user_id'] # Get user ID from verification record
        # Ensure the user ID in the body matches the one in the verification record
        if action.user_id != user_id_to_verify:
             raise HTTPException(status_code=400, detail="User ID mismatch between request body and verification record.")

        university_id_for_notif = admin_university_id # Use admin's uni ID for consistency

        # 3. Process Approval or Rejection
        if action.approve:
            # Update profile: set is_verified = True and ensure university_id matches
            update_res = supabase.table("profiles").update({
                "university_id": university_id_for_notif,
                "is_verified": True
            }).eq("id", user_id_to_verify).execute()
            # Basic check: If the update response itself indicates an error, raise it.
            # More robust check might involve `.select()` and checking data, but depends on client behavior.
            # if update_res.error:
            #    raise HTTPException(status_code=500, detail=f"Failed to update user profile: {update_res.error.message}")

            supabase.table("user_verifications").update({"status": "approved"}).eq("id", verification_id).execute()

            # --- Start: Send Approval Email (Direct HTML Method) ---
            user_profile_res = supabase.table("profiles").select("email, full_name").eq("id", user_id_to_verify).single().execute()
            user_email, user_name = None, "there" # Default name
            if user_profile_res.data:
                user_email = user_profile_res.data.get('email')
                user_name = user_profile_res.data.get('full_name', user_name)

            if user_email and settings.RESEND_API_KEY:
                try:
                    login_url = "http://localhost:5173/login" # Adjust as needed

                    # --- Define the email's HTML content directly ---
                    email_html = f"""
                    <p>Hi {user_name},</p>
                    <p>Good news! Your account for CampusTrace has been approved by an administrator.</p>
                    <p>You can now log in and start using the platform:</p>
                    <p><a href="{login_url}" style="padding: 10px 15px; background-color: #674CC4; color: white; text-decoration: none; border-radius: 5px;">Login to CampusTrace</a></p>
                    <p>If the button doesn't work, copy and paste this link into your browser: {login_url}</p>
                    <p>Welcome aboard!</p>
                    <p><em>- The CampusTrace Team</em></p>
                    """ # <-- You can customize this HTML

                    params_to_send = {
                        "from": settings.RESEND_SENDER_EMAIL, # Use sender from config
                        "to": [user_email],
                        "subject": "✅ Your CampusTrace Account is Approved!", # Subject remains customizable
                        "html": email_html, # Use the HTML defined above
                    }

                    email_response = resend.Emails.send(params_to_send)
                    print(f"✅ Approval email (direct HTML) sent to {user_email}, ID: {email_response['id']}")
                except Exception as email_error:
                    print(f"❌ Failed to send approval email to {user_email}: {email_error}")
            else:
                missing = []
                if not user_email: missing.append("user email")
                if not settings.RESEND_API_KEY: missing.append("Resend API key")
                print(f"⚠️ User {user_id_to_verify} approved, but skipping email due to missing: {', '.join(missing)}.")
            # --- End: Send Approval Email ---

            # Create In-App Notification
            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_notif,
                message="Congratulations! Your account has been manually verified. You can now log in.",
                link_to="/login", # Link to login page
                type="verification_success"
            )
            return {"message": "User approved successfully."}
        else: # If rejecting
            supabase.table("user_verifications").update({"status": "rejected"}).eq("id", verification_id).execute()

            # Create In-App Notification for Rejection
            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_notif,
                message="Your manual verification request was not approved. Please ensure your ID image is clear and valid.",
                link_to=None, # No specific link for rejection might be best
                type="verification_failure"
            )
            return {"message": "User rejected."}
    except Exception as e:
        traceback.print_exc() # Log the full error to the console
        # Provide a more generic error to the client
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
    
@admin_router.post("/items/{item_id}/status")
async def set_item_status(item_id: str, data: StatusUpdate, admin_id: str = Depends(get_current_user_id)):
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
app.include_router(claims_router) 
app.include_router(conversations_router)
# ============= Root Route =============
@app.get("/")
def read_root():
    return {"status": "✅ Campus Trace backend is running!", "ai_enabled": model is not None}