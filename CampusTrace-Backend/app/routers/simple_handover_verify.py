"""
Simple handover verification using items table
This works with the old handover code that stores codes in the items table
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api/handover", tags=["Handover"])


class VerifyHandoverRequest(BaseModel):
    code: str


@router.post("/items/{item_id}/verify-handover")
async def verify_handover_simple(
    item_id: int,
    request: VerifyHandoverRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Verify handover code stored in items table.
    """
    try:
        # Get the item
        item_response = supabase.table("items").select("*").eq("id", item_id).single().execute()
        
        if not item_response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item = item_response.data
        
        # Verify user is the item owner
        if item.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="Only the item owner can verify the handover code"
            )
        
        # Check if item has a handover code
        if not item.get("handover_code"):
            raise HTTPException(status_code=404, detail="No active handover found for this item")
        
        # Verify the code
        if item["handover_code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid handover code")
        
        # Clear the handover code and update item status
        supabase.table("items").update({
            "handover_code": None,
            "moderation_status": "returned"
        }).eq("id", item_id).execute()
        
        return {
            "success": True,
            "message": "Handover verified successfully. Item marked as returned.",
            "item_id": item_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying handover: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to verify handover: {str(e)}")
