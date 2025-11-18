from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import traceback
import resend

from app.dependencies import get_current_user_id, supabase
from app.models import VerificationAction, StatusUpdate, BanUpdate, RoleUpdate
from app.utils import create_notification
from app.config import get_settings


settings = get_settings()

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/manual-verifications")
async def get_manual_verifications(admin_id: str = Depends(get_current_user_id)):
    """
    Get all pending manual verification requests for admin's university.
    Returns user details along with verification information.
    """
    try:
        # Get admin's university
        profile_res = (
            supabase.table("profiles")
            .select("university_id")
            .eq("id", admin_id)
            .single()
            .execute()
        )
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Admin profile not found.")
        university_id = profile_res.data["university_id"]

        # Get all pending verifications for this university
        verifications_res = (
            supabase.table("user_verifications")
            .select("*")
            .eq("university_id", university_id)
            .eq("status", "pending")
            .execute()
        )

        if not verifications_res.data:
            return []

        # Get user profiles for these verifications
        user_ids = [req["user_id"] for req in verifications_res.data]

        profiles_res = (
            supabase.table("profiles")
            .select("id, full_name, email")
            .in_("id", user_ids)
            .execute()
        )
        if not profiles_res.data:
            return verifications_res.data

        # Combine verification data with user profiles
        profiles_map = {profile["id"]: profile for profile in profiles_res.data}

        combined_data = []
        for req in verifications_res.data:
            req["user"] = profiles_map.get(req["user_id"])
            combined_data.append(req)

        return combined_data

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual-verifications/{verification_id}/respond")
async def respond_to_verification(
    verification_id: int,
    action: VerificationAction,
    admin_id: str = Depends(get_current_user_id),
):
    """
    Approve or reject a manual verification request.
    If approved, sends confirmation email and enables user account.
    """
    try:
        # Verify admin authorization
        admin_profile_res = (
            supabase.table("profiles")
            .select("university_id, role")
            .eq("id", admin_id)
            .single()
            .execute()
        )
        if not admin_profile_res.data or admin_profile_res.data.get("role") != "admin":
            raise HTTPException(
                status_code=403, detail="User is not an authorized administrator."
            )
        admin_university_id = admin_profile_res.data["university_id"]

        # Get the verification request
        verification_res = (
            supabase.table("user_verifications")
            .select("university_id, user_id")
            .eq("id", verification_id)
            .single()
            .execute()
        )
        if not verification_res.data:
            raise HTTPException(
                status_code=404, detail="Verification request not found."
            )

        # Check if admin has authority for this university
        if verification_res.data["university_id"] != admin_university_id:
            raise HTTPException(
                status_code=403,
                detail="Admin not authorized for this university's request.",
            )

        user_id_to_verify = verification_res.data["user_id"]
        if action.user_id != user_id_to_verify:
            raise HTTPException(
                status_code=400,
                detail="User ID mismatch between request body and verification record.",
            )

        # Use the university ID from the verification request
        university_id_for_user = verification_res.data["university_id"]

        if action.approve:
            # Approve: Update user profile
            update_res = (
                supabase.table("profiles")
                .update({"university_id": university_id_for_user, "is_verified": True})
                .eq("id", user_id_to_verify)
                .execute()
            )

            # Update verification status
            supabase.table("user_verifications").update({"status": "approved"}).eq(
                "id", verification_id
            ).execute()

            # Get user details for email
            user_profile_res = (
                supabase.table("profiles")
                .select("email, full_name")
                .eq("id", user_id_to_verify)
                .single()
                .execute()
            )
            user_email, user_name = None, "there"
            if user_profile_res.data:
                user_email = user_profile_res.data.get("email")
                user_name = user_profile_res.data.get("full_name", user_name)

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
                    print(
                        f"Approval email sent to {user_email}, ID: {email_response['id']}"
                    )
                except Exception as email_error:
                    print(f"Failed to send approval email to {user_email}: {email_error}")

            # Send in-app notification
            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_user,
                message="Congratulations! Your account has been manually verified. You can now log in.",
                link_to="/login",
                type="verification_success",
            )
            return {"message": "User approved successfully."}

        else:
            # Reject the verification request
            supabase.table("user_verifications").update({"status": "rejected"}).eq(
                "id", verification_id
            ).execute()

            create_notification(
                recipient_id=user_id_to_verify,
                university_id=university_id_for_user,
                message="Your manual verification request was not approved. Please ensure your ID image is clear and valid.",
                link_to=None,
                type="verification_failure",
            )
            return {"message": "User rejected."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"An internal error occurred: {str(e)}"
        )


@router.post("/items/{item_id}/status")
async def set_item_status(
    item_id: int, data: StatusUpdate, admin_id: str = Depends(get_current_user_id)
):
    """
    Update an item's moderation status (admin only).
    Notifies the item owner of the status change.
    """
    try:
        # Get item details
        item_res = (
            supabase.table("items")
            .select("user_id, title, university_id")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")

        item_owner_id = item_res.data["user_id"]
        item_title = item_res.data["title"]
        university_id = item_res.data["university_id"]

        # Update item status
        resp = (
            supabase.table("items")
            .update({"moderation_status": data.moderation_status})
            .eq("id", item_id)
            .execute()
        )

        # Notify item owner
        message = f"An admin has updated your post '{item_title}' to a status of: {data.moderation_status}."
        create_notification(
            recipient_id=item_owner_id,
            university_id=university_id,
            message=message,
            link_to="/dashboard/my-posts",
            type="moderation",
        )

        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/ban")
async def set_user_ban(
    user_id: str, data: BanUpdate, admin_id: str = Depends(get_current_user_id)
):
    """Ban or unban a user (admin only)."""
    try:
        resp = (
            supabase.table("profiles")
            .update({"is_banned": data.is_banned})
            .eq("id", user_id)
            .execute()
        )
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/role")
async def set_user_role(
    user_id: str, data: RoleUpdate, admin_id: str = Depends(get_current_user_id)
):
    """Change a user's role (admin only)."""
    try:
        resp = (
            supabase.table("profiles")
            .update({"role": data.role})
            .eq("id", user_id)
            .execute()
        )
        return {"updated": resp.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/items")
async def get_admin_items(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    moderation_status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    admin_id: str = Depends(get_current_user_id),
):
    """
    Get paginated items for admin's university with strict pagination.
    Supports backend filtering by status, moderation_status, category, and search.
    Returns only necessary fields (10-20 items max).
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)
        if limit < 1:
            limit = 10

        # Get admin's university
        profile_res = (
            supabase.table("profiles")
            .select("university_id, role")
            .eq("id", admin_id)
            .single()
            .execute()
        )
        if not profile_res.data or profile_res.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required.")

        university_id = profile_res.data["university_id"]
        offset = (page - 1) * limit

        # Select only necessary fields
        query = (
            supabase.table("items")
            .select(
                "id, title, status, category, moderation_status, created_at, user_id, image_url, profiles!items_user_id_fkey(id, full_name, email)",
                count="exact",
            )
            .eq("university_id", university_id)
        )

        # Apply backend filters
        if status and status != "All":
            query = query.eq("status", status)
        if moderation_status and moderation_status != "All":
            query = query.eq("moderation_status", moderation_status)
        if category and category != "All":
            query = query.eq("category", category)
        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

        # Apply backend sorting
        valid_sort_fields = ["created_at", "title", "status", "moderation_status"]
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
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")


@router.get("/users")
async def get_admin_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[str] = None,
    is_verified: Optional[bool] = None,
    is_banned: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    admin_id: str = Depends(get_current_user_id),
):
    """
    Get paginated users for admin's university with strict pagination.
    Supports backend filtering by role, verification status, ban status, and search.
    Returns only necessary fields (10-20 users max).
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)
        if limit < 1:
            limit = 10

        # Get admin's university
        profile_res = (
            supabase.table("profiles")
            .select("university_id, role")
            .eq("id", admin_id)
            .single()
            .execute()
        )
        if not profile_res.data or profile_res.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required.")

        university_id = profile_res.data["university_id"]
        offset = (page - 1) * limit

        # Select only necessary fields
        query = (
            supabase.table("profiles")
            .select(
                "id, full_name, email, role, is_verified, is_banned, created_at, successful_returns",
                count="exact",
            )
            .eq("university_id", university_id)
        )

        # Apply backend filters
        if role and role != "All":
            query = query.eq("role", role)
        if is_verified is not None:
            query = query.eq("is_verified", is_verified)
        if is_banned is not None:
            query = query.eq("is_banned", is_banned)
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")

        # Apply backend sorting
        valid_sort_fields = [
            "created_at",
            "full_name",
            "email",
            "successful_returns",
        ]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"

        desc = sort_order.lower() == "desc"
        query = query.order(sort_by, desc=desc).range(offset, offset + limit - 1)

        result = query.execute()

        return {
            "users": result.data or [],
            "total_users": result.count or 0,
            "current_page": page,
            "total_pages": ((result.count or 0) + limit - 1) // limit,
            "users_per_page": limit,
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")
