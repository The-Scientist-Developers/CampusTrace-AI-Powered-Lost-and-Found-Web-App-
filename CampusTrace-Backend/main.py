from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, EmailStr
import os
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware 

SUPABASE_URL = "https://cvcxqsdwtcvwgdftsdtp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y3hxc2R3dGN2d2dkZnRzZHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY5NDY1MCwiZXhwIjoyMDcyMjcwNjUwfQ.rJV3LyGdq-EWu_iqcR--Whk986PQch1UfNZ_0TPOZ5Y"
ALLOWED_DOMAIN = "isu.edu.ph" 

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignInRequest(BaseModel):
    email: EmailStr

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
