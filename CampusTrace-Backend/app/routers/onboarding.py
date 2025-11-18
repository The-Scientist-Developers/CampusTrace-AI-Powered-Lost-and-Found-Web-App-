from fastapi import APIRouter, HTTPException
import traceback

from app.dependencies import supabase
from app.models import UniversityRegistrationRequest
from app.main import is_public_email_domain

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

@router.post("/register-university")
async def register_university(payload: UniversityRegistrationRequest):
    """
    Register a new university and create its first admin user.
    This is a transactional operation - if any step fails, everything is rolled back.
    """
    new_university_id = None
    new_user_id = None
    try:
        # Check if email uses a public domain (not allowed for university registration)
        if is_public_email_domain(payload.email):
            raise HTTPException(
                status_code=400,
                detail="Please use your official university email address, not a public email service (Gmail, Yahoo, etc.)."
            )

        # Check if university name already exists
        uni_exists = supabase.table("universities").select("id").eq("name", payload.university_name).execute()
        if uni_exists.data:
            raise HTTPException(status_code=400, detail="A university with this name already exists.")

        # Check if user email already exists
        user_exists_res = supabase.from_("profiles").select("id").eq("email", payload.email).execute()
        if user_exists_res.data:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        # Check if the email domain is already registered to another university
        admin_domain = payload.email.split('@')[1]
        domain_exists = supabase.table("allowed_domains").select("university_id, universities(name)").eq("domain_name", admin_domain).execute()
        if domain_exists.data:
            existing_uni_name = domain_exists.data[0].get('universities', {}).get('name', 'another university')
            raise HTTPException(
                status_code=400,
                detail=f"The email domain '{admin_domain}' is already registered to {existing_uni_name}. Each university domain can only be registered once."
            )

        # Create the new university (initially pending)
        new_university_res = supabase.table("universities").insert({"name": payload.university_name, "status": "pending"}).execute()
        new_university_id = new_university_res.data[0]['id']

        # Add the admin's email domain to allowed domains
        supabase.table("allowed_domains").insert({
            "university_id": new_university_id,
            "domain_name": admin_domain
        }).execute()

        # Create the admin user in Supabase Auth
        sign_up_res = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        if not sign_up_res.user:
            raise Exception("Failed to create user in Auth.")

        new_user = sign_up_res.user
        new_user_id = new_user.id

        # Update the profile with admin details (trigger should have created it)
        supabase.table("profiles").update({
            "full_name": payload.full_name,
            "role": "admin",
            "university_id": new_university_id
        }).eq("id", new_user.id).execute()

        # Activate the university
        supabase.table("universities").update({"status": "active"}).eq("id", new_university_id).execute()

        return {"message": "University created successfully. Please check your email to verify your account."}

    except HTTPException as http_exc:
        # Rollback: Delete created resources if something went wrong
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        # Rollback on any error
        if new_user_id:
            try: supabase.auth.admin.delete_user(new_user_id)
            except: pass
        if new_university_id:
            try: supabase.table("universities").delete().eq("id", new_university_id).execute()
            except: pass

        # Handle specific database constraint errors
        error_message = str(e)
        if "duplicate key value violates unique constraint" in error_message and "allowed_domains_domain_name_key" in error_message:
            # Extract domain from error if possible
            admin_domain = payload.email.split('@')[1] if '@' in payload.email else 'this domain'
            raise HTTPException(
                status_code=400,
                detail=f"The email domain '{admin_domain}' is already registered to another university. Each university domain can only be registered once."
            )

        raise HTTPException(status_code=500, detail="An internal error occurred during university registration.")
