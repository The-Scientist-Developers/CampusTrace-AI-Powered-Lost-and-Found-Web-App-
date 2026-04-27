from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from uuid import uuid4
from pathlib import Path
import traceback


from app.dependencies import get_current_user_id, supabase
from app.models import SignupRequest, ManualSignupRequest, CheckUserRequest
from app.utils import (
    verify_captcha,
    create_notification,
    process_image_efficiently,
)
from app.config import get_settings


settings = get_settings()


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/check-user")
async def check_user(payload: CheckUserRequest):
    """
    Check if an email exists for a specific university.
    Used by the frontend to distinguish between invalid password and unregistered email
    when Supabase returns 'Invalid login credentials'.
    """
    try:
        user_res = (
            supabase.from_("profiles")
            .select("id")
            .ilike("email", payload.email.strip())
            .eq("university_id", payload.university_id)
            .execute()
        )
        if user_res.data and len(user_res.data) > 0:
            return {"exists": True}
        return {"exists": False}
    except Exception as e:
        print(f"Error checking user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/signup-manual")
async def signup_manual(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    university_id: int = Form(...),
    captchaToken: str = Form(...),
    id_file: UploadFile = File(...),
):
    """
    Handle signup for users with personal emails (not university domain).
    Requires manual verification by admin using uploaded ID.
    """
    await verify_captcha(captchaToken, request.client.host)

    user = None
    try:
        # Check if user already exists
        user_exists_res = (
            supabase.from_("profiles").select("id").eq("email", email).execute()
        )
        if user_exists_res.data:
            raise HTTPException(
                status_code=400, detail="A user with this email already exists."
            )

        # Prepare redirect URL for email confirmation based on request origin
        redirect_url = None
        if settings.PENDING_APPROVAL_REDIRECT_URL:
            if isinstance(settings.PENDING_APPROVAL_REDIRECT_URL, list):
                # Try to match the origin from the request
                origin = request.headers.get("origin", "")
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL[0]  # Default to first
                
                # If request is from production, use production URL
                for url in settings.PENDING_APPROVAL_REDIRECT_URL:
                    if origin and origin in url:
                        redirect_url = url
                        break
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
                    "role": "member",
                }
            },
        }

        # Add email redirect only if URL is configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url

        sign_up_res = supabase.auth.sign_up(signup_options)

        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")

        user = sign_up_res.user

        # Fallback: ensure profile exists (trigger should handle this)
        supabase.table("profiles").upsert(
            {
                "id": user.id,
                "full_name": full_name,
                "university_id": university_id,
                "role": "member",
                "is_verified": False,
            }
        ).execute()

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
            file_options={
                "content-type": id_file.content_type or "application/octet-stream"
            },
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # Create verification record for admin review
        supabase.table("user_verifications").insert(
            {
                "user_id": user.id,
                "university_id": university_id,
                "id_image_url": id_image_url,
                "status": "pending",
            }
        ).execute()

        # Notify all admins of the university about new verification request
        admins_res = (
            supabase.table("profiles")
            .select("id")
            .eq("university_id", university_id)
            .eq("role", "admin")
            .execute()
        )

        if admins_res.data:
            message = (
                f"New manual verification request from {full_name} is awaiting review."
            )
            for admin in admins_res.data:
                create_notification(
                    recipient_id=admin["id"],
                    university_id=university_id,
                    message=message,
                    link_to="/admin/manual-verification",
                    type="verification",
                )

        return {
            "message": "Registration successful! Please confirm your email. Your account will be usable after an admin approves your ID."
        }

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


@router.post("/signup")
async def signup_user(payload: SignupRequest, request: Request):
    """
    Handle signup for users with university email domains.
    Automatically verified if domain is registered.
    """
    await verify_captcha(payload.captchaToken, request.client.host)

    # Verify that email domain is registered
    domain = payload.email.split("@")[-1]
    try:
        domain_res = (
            supabase.table("allowed_domains")
            .select("university_id")
            .eq("domain_name", domain)
            .single()
            .execute()
        )
        if not domain_res.data:
            raise HTTPException(
                status_code=400,
                detail="This email domain is not registered on CampusTrace.",
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking domain: {e}")
        raise HTTPException(
            status_code=400, detail="This email domain is not registered on CampusTrace."
        )

    try:
        # Prepare redirect URL for email confirmation based on request origin
        redirect_url = None
        if settings.EMAIL_CONFIRM_REDIRECT:
            if isinstance(settings.EMAIL_CONFIRM_REDIRECT, list):
                # Try to match the origin from the request
                origin = request.headers.get("origin", "")
                redirect_url = settings.EMAIL_CONFIRM_REDIRECT[0]  # Default to first
                
                # If request is from production, use production URL
                for url in settings.EMAIL_CONFIRM_REDIRECT:
                    if origin and origin in url:
                        redirect_url = url
                        break
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
                    "role": "member",
                }
            },
        }

        # Add email redirect only if configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url

        result = supabase.auth.sign_up(signup_options)

        print(f"Signup result: {result}")

        if result.user:
            # Check if user already confirmed
            if hasattr(result.user, "confirmed_at") and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please sign in instead.",
                )

            # Check if user has no identities (already exists but unconfirmed)
            if hasattr(result.user, "identities") and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account.",
                )

            # Fallback: ensure profile exists (trigger should handle this)
            supabase.table("profiles").upsert(
                {
                    "id": result.user.id,
                    "full_name": payload.full_name,
                    "university_id": domain_res.data["university_id"],
                    "role": "member",
                    "is_verified": True,
                }
            ).execute()

            return {
                "message": "Check your inbox to confirm your email before signing in."
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Unable to create account. An account with this email may already exist.",
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
                detail="An account with this email already exists. Please sign in instead.",
            )
        elif "invalid email" in error_message:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        elif "weak password" in error_message:
            raise HTTPException(
                status_code=400,
                detail="Password is too weak. Please use a stronger password.",
            )
        else:
            raise HTTPException(status_code=400, detail=f"Signup failed: {str(exc)}")


@router.post("/signup-mobile")
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
            status_code=400, detail="Please enter a valid email address."
        )

    domain = email_parts[1].lower()

    # Check if domain is registered (use execute() without single() to avoid exception)
    try:
        domain_res = (
            supabase.table("allowed_domains")
            .select("university_id")
            .eq("domain_name", domain)
            .execute()
        )

        if (
            not domain_res.data
            or not isinstance(domain_res.data, list)
            or len(domain_res.data) == 0
        ):
            raise HTTPException(
                status_code=400,
                detail=f"The email domain '{domain}' is not registered with CampusTrace. Please use your official university email address, or register manually using the 'Manual (University ID)' option with a personal email and your university ID photo.",
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking domain: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"The email domain '{domain}' is not registered with CampusTrace. Please use your official university email address, or register manually using the 'Manual (University ID)' option with a personal email and your university ID photo.",
        )

    try:
        # Prepare redirect URL for email confirmation based on request origin
        redirect_url = None
        if settings.EMAIL_CONFIRM_REDIRECT:
            if isinstance(settings.EMAIL_CONFIRM_REDIRECT, list):
                # Try to match the origin from the request
                origin = request.headers.get("origin", "")
                redirect_url = settings.EMAIL_CONFIRM_REDIRECT[0]  # Default to first
                
                # If request is from production, use production URL
                for url in settings.EMAIL_CONFIRM_REDIRECT:
                    if origin and origin in url:
                        redirect_url = url
                        break
            else:
                redirect_url = settings.EMAIL_CONFIRM_REDIRECT

        university_id = domain_res.data[0]["university_id"]

        signup_options = {
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name,
                    "university_id": university_id,
                    "is_verified": True,  # Auto-verified by domain
                    "role": "member",
                }
            },
        }

        # Add email redirect only if configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url

        result = supabase.auth.sign_up(signup_options)

        print(f"Mobile signup result: {result}")

        if result.user:
            # Check if user already confirmed
            if hasattr(result.user, "confirmed_at") and result.user.confirmed_at:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please sign in instead.",
                )

            # Check if user has no identities (already exists but unconfirmed)
            if hasattr(result.user, "identities") and not result.user.identities:
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists. Please check your email to confirm your account.",
                )

            # Fallback: ensure profile exists (trigger should handle this)
            supabase.table("profiles").upsert(
                {
                    "id": result.user.id,
                    "full_name": payload.full_name,
                    "university_id": university_id,
                    "role": "member",
                    "is_verified": True,
                }
            ).execute()

            return {
                "message": "Check your inbox to confirm your email before signing in."
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Unable to create account. An account with this email may already exist.",
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
                detail="An account with this email already exists. Please sign in instead.",
            )
        elif "invalid email" in error_message:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        elif "weak password" in error_message:
            raise HTTPException(
                status_code=400,
                detail="Password is too weak. Please use a stronger password.",
            )
        else:
            raise HTTPException(status_code=400, detail=f"Signup failed: {str(exc)}")


@router.post("/signup-manual-mobile")
async def signup_manual_mobile(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    university_id: int = Form(...),
    id_file: UploadFile = File(...),
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
        user_exists_res = (
            supabase.from_("profiles").select("id").eq("email", email).execute()
        )
        if user_exists_res.data:
            raise HTTPException(
                status_code=400, detail="A user with this email already exists."
            )

        # Verify university exists
        university_check = (
            supabase.table("universities")
            .select("id")
            .eq("id", university_id)
            .maybeSingle()
            .execute()
        )
        if not university_check.data:
            raise HTTPException(status_code=400, detail="Invalid university selected.")

        # Prepare redirect URL for email confirmation based on request origin
        redirect_url = None
        if settings.PENDING_APPROVAL_REDIRECT_URL:
            if isinstance(settings.PENDING_APPROVAL_REDIRECT_URL, list):
                # Try to match the origin from the request
                origin = request.headers.get("origin", "")
                redirect_url = settings.PENDING_APPROVAL_REDIRECT_URL[0]  # Default to first
                
                # If request is from production, use production URL
                for url in settings.PENDING_APPROVAL_REDIRECT_URL:
                    if origin and origin in url:
                        redirect_url = url
                        break
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
                    "role": "member",
                }
            },
        }

        # Add email redirect only if URL is configured
        if redirect_url:
            signup_options["options"]["email_redirect_to"] = redirect_url

        sign_up_res = supabase.auth.sign_up(signup_options)

        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")

        user = sign_up_res.user

        # Fallback: ensure profile exists (trigger should handle this)
        supabase.table("profiles").upsert(
            {
                "id": user.id,
                "full_name": full_name,
                "university_id": university_id,
                "role": "member",
                "is_verified": False,
            }
        ).execute()

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
            file_options={
                "content-type": id_file.content_type or "application/octet-stream"
            },
        )
        id_image_url = supabase.storage.from_("other_images").get_public_url(file_path)

        # Create verification record for admin review
        supabase.table("user_verifications").insert(
            {
                "user_id": user.id,
                "university_id": university_id,
                "id_image_url": id_image_url,
                "status": "pending",
            }
        ).execute()

        # Notify all admins of the university about new verification request
        admins_res = (
            supabase.table("profiles")
            .select("id")
            .eq("university_id", university_id)
            .eq("role", "admin")
            .execute()
        )

        if admins_res.data:
            message = (
                f"New manual verification request from {full_name} is awaiting review."
            )
            for admin in admins_res.data:
                create_notification(
                    recipient_id=admin["id"],
                    university_id=university_id,
                    message=message,
                    link_to="/admin/manual-verification",
                    type="verification",
                )

        return {
            "message": "Registration successful! Please confirm your email. Your account will be usable after an admin approves your ID."
        }

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
