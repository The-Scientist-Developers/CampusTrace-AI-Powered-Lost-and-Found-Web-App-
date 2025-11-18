from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from uuid import uuid4
from pathlib import Path
import traceback

from app.dependencies import get_current_user_id, supabase
from app.models import UserPreferences
from app.utils import process_image_efficiently

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.put("/")
async def update_profile(
    full_name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user_id: str = Depends(get_current_user_id),
):
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
            max_avatar_size = int(os.getenv("MAX_AVATAR_SIZE", "2097152"))
            if len(file_bytes) > max_avatar_size:
                file_bytes = process_image_efficiently(file_bytes, max_size=(400, 400))

            # Upload with upsert to replace old avatar
            supabase.storage.from_("other_images").upload(
                path=filename,
                file=file_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )
            public_url = supabase.storage.from_("other_images").get_public_url(
                filename
            )
            updates["avatar_url"] = f"{public_url}?t={uuid4().hex}"

        if not updates:
            raise HTTPException(
                status_code=400, detail="No update information provided."
            )

        # Apply updates
        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()
        profile_result = (
            supabase.table("profiles")
            .select("id, full_name, email, avatar_url, role, is_banned")
            .eq("id", current_user_id)
            .single()
            .execute()
        )
        return {"profile": profile_result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences")
async def get_user_preferences(current_user_id: str = Depends(get_current_user_id)):
    """
    Get user notification preferences.
    Returns default values if no preferences are set.
    """
    try:
        profile_result = (
            supabase.table("profiles")
            .select(
                "match_notifications, claim_notifications, message_notifications, "
                "moderation_notifications, email_notifications_enabled"
            )
            .eq("id", current_user_id)
            .single()
            .execute()
        )

        if not profile_result.data:
            return {
                "preferences": {
                    "match_notifications": True,
                    "claim_notifications": True,
                    "message_notifications": True,
                    "moderation_notifications": True,
                    "email_notifications_enabled": True,
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
                "email_notifications_enabled": True,
            }
        }


@router.put("/preferences")
async def update_user_preferences(
    preferences: UserPreferences, current_user_id: str = Depends(get_current_user_id)
):
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
            "email_notifications_enabled": preferences.email_notifications_enabled,
        }

        supabase.table("profiles").update(updates).eq("id", current_user_id).execute()

        return {"message": "Preferences updated successfully", "preferences": updates}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to update preferences: {str(e)}"
        )


@router.get("/my-posts")
async def get_user_posts(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    moderation_status: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Get user's own posts with strict pagination.
    Supports backend filtering by status and moderation_status.
    Returns only necessary fields (10-20 items max).
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)
        if limit < 1:
            limit = 10

        offset = (page - 1) * limit

        # Select only necessary fields
        query = (
            supabase.table("items")
            .select(
                "id, title, status, category, moderation_status, location, image_url, created_at",
                count="exact",
            )
            .eq("user_id", current_user_id)
        )

        # Apply backend filters
        if status and status != "All":
            query = query.eq("status", status)
        if moderation_status and moderation_status != "All":
            query = query.eq("moderation_status", moderation_status)

        # Apply backend sorting
        valid_sort_fields = ["created_at", "title", "status"]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"

        desc = sort_order.lower() == "desc"
        query = query.order(sort_by, desc=desc).range(offset, offset + limit - 1)

        result = query.execute()

        return {
            "items": result.data or [],
            "total_items": result.count or 0,
            "current_page": page,
            "total_pages": ((result.count or 0) + limit - 1) // limit,
            "items_per_page": limit,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch posts: {str(e)}")
