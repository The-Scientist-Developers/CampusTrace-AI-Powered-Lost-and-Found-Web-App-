
# import os
# import gc
# from pathlib import Path
# from uuid import uuid4
# from datetime import datetime
# from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
# from pydantic import BaseModel, EmailStr
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi import APIRouter
# from fastapi.responses import StreamingResponse
# from typing import List, Optional
# import traceback
# from PIL import Image
# import io
# import google.generativeai as genai
# import httpx
# import json
# try:
#     import resend
# except ImportError:
#     resend = None
#     print("⚠️ Warning: resend module not installed, email features may be unavailable")
# import asyncio
# from fastapi.concurrency import run_in_threadpool

# from app.config import get_settings
# from app.dependencies import get_current_user_id, get_admin_university_id, supabase
# from app import jina_embedding_util
# from app.push_notification_service import PushNotificationService
# # Import all routers
# from app.routers import (
#     dashboard, 
#     notifications, 
#     messages, 
#     handover, 
#     auth, 
#     public, 
#     items, 
#     admin, 
#     profile, 
#     onboarding, 
#     claims, 
#     conversations, 
#     backup, 
#     badges, 
#     push,
#     user_actions
# )
# # Import the shared module where the AI model is stored
# from app import shared

# # Load application settings and initialize global variables
# settings = get_settings()

# app = FastAPI(
#     title="CampusTrace API",
#     description="Lost and Found Platform for Universities",
#     version="2.1.0"
# )

# # Configure Resend email service
# if settings.RESEND_API_KEY:
#     resend.api_key = settings.RESEND_API_KEY
#     print("Resend client configured.")
# else:
#     print("WARNING: RESEND_API_KEY not found. Email notifications disabled.")

# @app.api_route("/", methods=["GET", "HEAD"])
# async def root():
#     """Fast health check endpoint for load balancers and monitoring."""
#     return {
#         "status": "ok",
#         "service": "CampusTrace API",
#         "version": "1.0.0"
#     }

# @app.get("/health")
# async def health_check():
#     """Detailed health check with service status."""
#     return {
#         "status": "healthy",
#         "timestamp": datetime.now().isoformat(),
#         "services": {
#             "gemini_ai": "enabled" if settings.GEMINI_API_KEY else "disabled",
#             "jina_embedding": "enabled" if settings.JINA_API_KEY else "disabled",
#             "resend_email": "enabled" if settings.RESEND_API_KEY else "disabled"
#         }
#     }

# @app.on_event("startup")
# async def startup_event():
#     """Load AI models on application startup."""
    
#     # Initialize Gemini AI for generating descriptions and tags
#     if settings.GEMINI_API_KEY:
#         try:
#             genai.configure(api_key=settings.GEMINI_API_KEY)
#             # Assign the model to the shared module variable
#             shared.model = genai.GenerativeModel("gemini-2.5-flash")
#             print("✅ Gemini AI generation/vision model (gemini-2.5-flash) configured successfully.")
#         except Exception as e:
#             print(f"❌ ERROR: Could not configure Gemini AI: {e}")
#             traceback.print_exc()
#             shared.model = None
#     else:
#         print("⚠️ WARNING: GEMINI_API_KEY not found. AI generation features disabled.")
#         shared.model = None
    
#     # Note: Jina embedding test removed from startup for faster cold starts
#     # Jina will be tested on first use instead
#     if settings.JINA_API_KEY:
#         print("✅ JINA_API_KEY found. Embedding features enabled (will test on first use).")
#     else:
#         print("⚠️ WARNING: JINA_API_KEY not found. Embedding features will be disabled.")
        
#     print(f"Max image size: {int(os.getenv('MAX_IMAGE_SIZE', '5242880')) / 1024 / 1024:.1f}MB")
#     print("🚀 API startup complete")


# @app.on_event("shutdown")
# async def shutdown_event():
#     """Clean up resources on shutdown."""
#     shared.model = None
#     gc.collect()
#     print("Shutting down gracefully...")

# # Configure CORS - allow credentials for Supabase auth (ignore wildcard from env)
# # Wildcard CORS cannot use allow_credentials=True, so we use specific origins
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "http://192.168.100.14:5173",
#         "http://192.168.56.1:5173",
#         "http://localhost:3000",
#         "https://www.campustrace.site",
#         "https://campustrace.site",
#     ],
#     allow_credentials=True,  # Required for Supabase authentication
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ============= Include Routers =============
# # Register all API routers with the main app
# app.include_router(auth.router)
# app.include_router(public.router)
# app.include_router(items.router)
# app.include_router(admin.router)
# app.include_router(profile.router)
# # Note: notification.router might be a duplicate of notifications.router depending on your file structure. 
# # Assuming notifications.router is the correct one based on imports.
# app.include_router(notifications.router) 
# app.include_router(onboarding.router)
# app.include_router(claims.router)
# app.include_router(conversations.router)
# app.include_router(backup.router)
# app.include_router(badges.router)
# app.include_router(handover.router)
# app.include_router(messages.router)
# app.include_router(dashboard.router)
# app.include_router(push.router)
# app.include_router(user_actions.router)







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
try:
    import resend
except ImportError:
    resend = None
    print("⚠️ Warning: resend module not installed, email features may be unavailable")
import asyncio
from fastapi.concurrency import run_in_threadpool

from app.config import get_settings
from app.dependencies import get_current_user_id, get_admin_university_id, supabase
from app import jina_embedding_util
from app.push_notification_service import PushNotificationService
# Import all routers
from app.routers import (
    dashboard, 
    notifications, 
    messages, 
    handover, 
    auth, 
    public, 
    items,
    chatbot, 
    admin, 
    profile, 
    onboarding, 
    claims, 
    conversations, 
    backup, 
    badges, 
    push,
    user_actions
)
# Import the shared module where the AI model is stored
from app import shared

# Load application settings and initialize global variables
settings = get_settings()

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

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Fast health check endpoint for load balancers and monitoring."""
    return {
        "status": "ok",
        "service": "CampusTrace API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check with service status."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "gemini_ai": "enabled" if settings.GEMINI_API_KEY else "disabled",
            "jina_embedding": "enabled" if settings.JINA_API_KEY else "disabled",
            "resend_email": "enabled" if settings.RESEND_API_KEY else "disabled"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Load AI models on application startup."""
    
    # Initialize Gemini AI for generating descriptions and tags
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Assign the model to the shared module variable
            shared.model = genai.GenerativeModel("gemini-2.5-flash")
            print("✅ Gemini AI generation/vision model (gemini-2.5-flash) configured successfully.")
        except Exception as e:
            print(f"❌ ERROR: Could not configure Gemini AI: {e}")
            traceback.print_exc()
            shared.model = None
    else:
        print("⚠️ WARNING: GEMINI_API_KEY not found. AI generation features disabled.")
        shared.model = None
    
    # Note: Jina embedding test removed from startup for faster cold starts
    # Jina will be tested on first use instead
    if settings.JINA_API_KEY:
        print("✅ JINA_API_KEY found. Embedding features enabled (will test on first use).")
    else:
        print("⚠️ WARNING: JINA_API_KEY not found. Embedding features will be disabled.")
        
    print(f"Max image size: {int(os.getenv('MAX_IMAGE_SIZE', '5242880')) / 1024 / 1024:.1f}MB")
    print("🚀 API startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    shared.model = None
    gc.collect()
    print("Shutting down gracefully...")

# Configure CORS - allow credentials for Supabase auth (ignore wildcard from env)
# Wildcard CORS cannot use allow_credentials=True, so we use specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.100.14:5173",
        "http://192.168.56.1:5173",
        "http://localhost:3000",
        "https://www.campustrace.site",
        "https://campustrace.site",
    ],
    allow_credentials=True,  # Required for Supabase authentication
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= Include Routers =============
# Register all API routers with the main app
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(items.router)
app.include_router(admin.router)
app.include_router(profile.router)
# Note: notification.router might be a duplicate of notifications.router depending on your file structure. 
# Assuming notifications.router is the correct one based on imports.
app.include_router(notifications.router) 
app.include_router(onboarding.router)
app.include_router(claims.router)
app.include_router(conversations.router)
app.include_router(backup.router)
app.include_router(badges.router)
app.include_router(handover.router)
app.include_router(messages.router)
app.include_router(dashboard.router)
app.include_router(push.router)
app.include_router(user_actions.router)
app.include_router(chatbot.router)