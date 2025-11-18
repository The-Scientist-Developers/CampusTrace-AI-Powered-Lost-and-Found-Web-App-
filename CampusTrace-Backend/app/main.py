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
from app.push_notification_service import PushNotificationService
from app.routers import dashboard, notifications, messages, handover, auth, public, items, admin, profile, onboarding, notification, claims, conversations, backup, badges, push
from app.models import (
    UniversityRegistrationRequest,
    ManualSignupRequest,
    UserPreferences,
    VerificationAction,
    DescriptionRequest,
    AuthRequest,
    SignupRequest,
    ItemCreate,
    ClaimCreate,
    ClaimRespond,
    BanUpdate,
    RoleUpdate,
    StatusUpdate
)
from app.utils import (
    get_university_settings,
    verify_captcha,
    create_notification,
    generate_ai_tags,
    find_proactive_matches,
    award_badge,
    process_image_efficiently
)

# Load application settings and initialize global variables
settings = get_settings()

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

# Include routers
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(handover.router)
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

from app.shared import model

@app.on_event("startup")
async def startup_event():
    """Load AI models on application startup."""
    
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

# ============= Routers =============







    



# ============= Dashboard Summary Endpoint =============
@app.get("/api/dashboard-summary")
async def get_dashboard_summary(user_id: str = Depends(get_current_user_id)):
    """
    Get consolidated dashboard data in a single API call.
    Returns: recent items, user stats, unread notifications, AI matches.
    Optimized for fast dashboard loading.
    """
    try:
        # Get user's university with error handling
        try:
            profile_res = supabase.table("profiles").select("university_id, full_name").eq("id", user_id).single().execute()
            if not profile_res.data:
                raise HTTPException(status_code=404, detail="User profile not found.")
            
            university_id = profile_res.data.get('university_id')
        except Exception as profile_error:
            print(f"Dashboard profile error: {str(profile_error)}")
            raise HTTPException(status_code=500, detail="Failed to fetch user profile")
        
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
                    'p_match_count': 3,
                    'p_text_weight': 0.4,
                    'p_image_weight': 0.6,
                    'p_match_threshold': 0.7
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
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"Dashboard summary error: {str(e)}")
        # Return minimal data instead of crashing
        return {
            "myRecentPosts": [],
            "allMyPosts": [],
            "recentActivity": [],
            "userStats": {
                "found": 0,
                "lost": 0,
                "pending": 0,
                "recovered": 0
            },
            "unreadNotifications": 0,
            "aiMatches": []
        }






# ============= Include Routers =============
# Register all API routers with the main app
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(items.router)
app.include_router(admin.router)
app.include_router(profile.router)
app.include_router(notification.router)
app.include_router(onboarding.router)
app.include_router(claims.router)
app.include_router(conversations.router)
app.include_router(backup.router)
app.include_router(badges.router)


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


# Include push notification router
app.include_router(push.router)



# Import and include user actions router for secure deletion operations
from app.routers.user_actions import router as user_actions_router
app.include_router(user_actions_router)

