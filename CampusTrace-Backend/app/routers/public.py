from fastapi import APIRouter, HTTPException
import traceback

from app.dependencies import supabase

router = APIRouter(prefix="/api/public", tags=["Public"])

@router.get("/universities")
async def get_universities():
    """
    Get list of all active universities for signup selection.
    Public endpoint - no authentication required.
    """
    try:
        universities_res = supabase.table("universities").select(
            "id, name"
        ).eq("status", "active").order("name").execute()

        return {
            "universities": universities_res.data or []
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch universities: {str(e)}")
