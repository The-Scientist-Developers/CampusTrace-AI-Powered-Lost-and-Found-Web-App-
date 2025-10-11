import os
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware 
from fastapi import APIRouter
from typing import List, Optional
from config import get_settings  
from fastapi import Header

settings = get_settings()

SUPABASE_URL = settings.PYTHON_SUPABASE_URL
SUPABASE_KEY = settings.PYTHON_SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignInRequest(BaseModel):
    email: EmailStr

class BanUpdate(BaseModel):
    is_banned: bool

class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    moderation_status: str

item_router = APIRouter(prefix="/api/items", tags=["Items"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])
profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])

async def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")

    token = authorization.split(" ", 1)[1]

    try:
        user_res = supabase.auth.get_user(token)
        user = user_res.user if hasattr(user_res, 'user') else None
        if not user:
            raise HTTPException(401, "Invalid token")
        return user.id
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, detail=f"Invalid credentials: {str(e)}")


@item_router.get("/recent-activity")
async def get_recent_activity(current_user_id: str = Depends(get_current_user_id)):
    try:
        response = (
            supabase.from_("items")               
            .select("*")                           
            .eq("user_id", current_user_id)       
            .order("created_at", desc=True)       
            .limit(5)                             
            .execute()                         
        )

        if response.error:
            raise response.error
        
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/signin")
async def handle_magic_link_signin(payload: SignInRequest):
    user_email = payload.email
    domain = user_email.split('@')[1]

    response = supabase.table('allowed_domains').select('university_id').eq('domain_name', domain).execute()
    
    if not response.data:   
        raise HTTPException(
            status_code=403,
            detail="This email domain is not registered with any university on the platform."
        )

    try:
        supabase.auth.sign_in_with_otp({"email": user_email})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Login link sent successfully."}




#Endpoint natin for admin

async def require_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")

    token = authorization.split(" ", 1)[1]

    try:
        user_res = supabase.auth.get_user(token)
        user = user_res.user
        if not user:
            raise HTTPException(401, "Invalid token")

        profile = supabase.table("profiles").select("role").eq("id", user.id).single().execute()
        if not profile.data or profile.data.get("role") != "admin":
            raise HTTPException(403, "Admin access required")

        return user.id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, detail=f"Invalid credentials: {str(e)}")

@admin_router.post("/users/{user_id}/ban")
async def set_ban(user_id: str, data: BanUpdate, admin_id: str = Depends(require_admin)):
    resp = supabase.table("profiles").update({"is_banned": data.is_banned}).eq("id", user_id).execute()
    return {"updated": resp.data}

@admin_router.post("/users/{user_id}/role")
async def set_role(user_id: str, data: RoleUpdate, admin_id: str = Depends(require_admin)):
    resp = supabase.table("profiles").update({"role": data.role}).eq("id", user_id).execute()
    return {"updated": resp.data}

@admin_router.post("/items/{item_id}/status")
async def set_status(item_id: str, data: StatusUpdate, admin_id: str = Depends(require_admin)):
    resp = supabase.table("items").update({"moderation_status": data.moderation_status}).eq("id", item_id).execute()
    return {"updated": resp.data}
    
@profile_router.put("/")
async def update_profile(
    full_name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user_id: str = Depends(get_current_user_id),
):
    try:
        updates = {}

        if full_name is not None:
            updates["full_name"] = full_name.strip()

        if avatar is not None:
            file_suffix = Path(avatar.filename or "avatar").suffix or ""
            filename = f"{current_user_id}/{uuid4().hex}{file_suffix}"
            file_bytes = await avatar.read()

            upload_response = supabase.storage.from_("other_images").upload(
                path=filename,
                file=file_bytes,
                file_options={
                    "content-type": avatar.content_type or "application/octet-stream",
                    "upsert": "true",
                },
            )

            if hasattr(upload_response, "error") and upload_response.error:
                raise HTTPException(status_code=500, detail=f"Upload failed: {upload_response.error}")

            public_url = supabase.storage.from_("other_images").get_public_url(filename)
            
            if not public_url:
                raise HTTPException(status_code=500, detail="Failed to generate avatar URL")

            updates["avatar_url"] = public_url

        if not updates:
            raise HTTPException(status_code=400, detail="No profile changes supplied")

        result = supabase.table("profiles").update(updates).eq("id", current_user_id).execute()

        if hasattr(result, "error") and result.error:
            raise HTTPException(status_code=500, detail=f"Update failed: {result.error}")

        profile_result = (
            supabase.table("profiles")
            .select("id, full_name, email, avatar_url, role, is_banned")
            .eq("id", current_user_id)
            .single()
            .execute()
        )

        if hasattr(profile_result, "error") and profile_result.error:
            raise HTTPException(status_code=500, detail=f"Fetch failed: {profile_result.error}")

        return {"profile": profile_result.data}
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)

@app.get("/")
def read_root():
    return {"status": "Campus Trace backend is running!"}
