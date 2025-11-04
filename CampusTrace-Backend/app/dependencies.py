from fastapi import Request, HTTPException, Depends
from supabase import create_client, Client
from app.config import get_settings

# Get application settings
settings = get_settings()

# Initialize the Supabase client here
supabase: Client = create_client(settings.PYTHON_SUPABASE_URL, settings.PYTHON_SUPABASE_KEY)

async def get_current_user_id(request: Request):
    """
    Dependency function to get the current user's ID from the JWT in the Authorization header.
    """
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = token.split("Bearer ")[1]
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user.id
    except Exception as e:
        print(f"Authentication Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_university_id(current_user_id: str = Depends(get_current_user_id)):
    """
    Dependency function to verify the user is an admin and return their university_id.
    Used for admin-only endpoints that need tenant isolation.
    """
    try:
        # Query the profiles table to get the user's role and university_id
        profile_response = supabase.table("profiles").select("role, university_id").eq("id", current_user_id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        profile = profile_response.data
        
        # Check if user is an admin
        if profile.get("role", "").lower() != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if university_id exists
        university_id = profile.get("university_id")
        if not university_id:
            raise HTTPException(status_code=404, detail="Admin university not found")
        
        return university_id
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_admin_university_id: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify admin status")