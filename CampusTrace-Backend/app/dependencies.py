from fastapi import Request, HTTPException
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