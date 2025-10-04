import os
from fastapi import FastAPI, HTTPException, Body, Depends
from pydantic import BaseModel, EmailStr
import os
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware 
from fastapi import APIRouter
from typing import List
from config import get_settings  

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

router = APIRouter(prefix="/api/items", tags=["Items"])

async def get_current_user_id():
    try:
        res = supabase.auth.get_user()
        user = res.user
        if not user:
            raise HTTPException(status_code=401, detail="User not authenticated")
        return user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.get("/recent-activity")
async def get_recent_activity(current_user_id: str = Depends(get_current_user_id)):
    try:
        # This is the full Supabase query.
        response = (
            supabase.from_("items")                # Target the 'items' table
            .select("*")                           # Select all columns
            .eq("user_id", current_user_id)        # Filter to get posts where user_id matches
            .order("created_at", desc=True)        # Order results to get the newest first
            .limit(5)                              # Limit the results to the top 5
            .execute()                             # Send the query to the database
        )

        if response.error:
            raise response.error

        # Return the fetched data to the frontend
        return response.data
        
    except Exception as e:
        # If there's any database error, let the frontend know.
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

@app.get("/")
def read_root():
    return {"status": "Campus Trace backend is running!"}
