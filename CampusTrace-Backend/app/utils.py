import os
import io
import json
import traceback
import asyncio
from typing import List, Optional

import httpx
import numpy as np
from PIL import Image
from fastapi import HTTPException

from app.config import get_settings
from app.dependencies import supabase

# Import the shared module to access the AI model
from app import shared


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
            "data": { "url": link_to }, # Send link_to in data payload
            "body": message,
            "image": image_url
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
    if not shared.model:
        print("⚠️ AI model not available for tag generation")
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
        response = await shared.model.generate_content_async(prompt)
        tags_string = response.text.strip().replace("#", "")
        tags_list = [tag.strip().lower() for tag in tags_string.split(',') if tag.strip()]
        print(f"✅ Generated AI tags: {tags_list}")
        return tags_list[:7]
    except Exception as e:
        print(f"❌ Error generating AI tags: {e}")
        traceback.print_exc()
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
        print(f"\n[PROACTIVE MATCH] Checking for matches for new Found item: {new_item['title']}")

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
