"""
Handover API Routes
Handles secure item handover with verification codes
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import random
import string
from datetime import datetime, timedelta
from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/handover", tags=["Handover"])


class HandoverCodeResponse(BaseModel):
    """Response model for handover code generation."""
    code: str
    expires_at: str
    item_id: int


class VerifyHandoverRequest(BaseModel):
    """Request model for verifying handover code."""
    code: str


def generate_handover_code() -> str:
    """Generate a random 4-digit handover code."""
    return ''.join(random.choices(string.digits, k=4))


@router.post("/items/{item_id}/start-handover")
async def start_handover(
    item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Start the handover process by generating a verification code.
    Only the claimant can start the handover.
    """
    try:
        # Get the item and verify it's in pending_return status
        item_response = supabase.table("items").select("*").eq("id", item_id).single().execute()
        
        if not item_response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item = item_response.data
        
        # Verify item is in pending_return status
        if item.get("moderation_status") != "pending_return":
            raise HTTPException(
                status_code=400,
                detail="Item must be in pending_return status to start handover"
            )
        
        # Get the claim to verify user is the claimant
        claim_response = supabase.table("claims").select("*").eq("item_id", item_id).eq("status", "approved").single().execute()
        
        if not claim_response.data:
            raise HTTPException(status_code=404, detail="No approved claim found for this item")
        
        claim = claim_response.data
        
        if claim.get("claimant_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="Only the claimant can start the handover process"
            )
        
        # Generate handover code
        code = generate_handover_code()
        expires_at = datetime.utcnow() + timedelta(hours=24)  # Code expires in 24 hours
        
        # Store the handover code in the database
        handover_data = {
            "item_id": item_id,
            "code": code,
            "claimant_id": user_id,
            "expires_at": expires_at.isoformat(),
            "verified": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Check if handover record already exists
        existing_handover = supabase.table("handovers").select("*").eq("item_id", item_id).eq("verified", False).execute()
        
        if existing_handover.data:
            # Update existing handover
            supabase.table("handovers").update({
                "code": code,
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }).eq("id", existing_handover.data[0]["id"]).execute()
        else:
            # Create new handover record
            supabase.table("handovers").insert(handover_data).execute()
        
        return {
            "code": code,
            "expires_at": expires_at.isoformat(),
            "item_id": item_id,
            "message": "Handover code generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting handover: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start handover: {str(e)}")


@router.post("/items/{item_id}/verify-handover")
async def verify_handover(
    item_id: int,
    request: VerifyHandoverRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Verify the handover code and complete the handover.
    Only the item owner (finder) can verify the code.
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
        
        # Get the handover record
        handover_response = supabase.table("handovers").select("*").eq("item_id", item_id).eq("verified", False).single().execute()
        
        if not handover_response.data:
            raise HTTPException(status_code=404, detail="No active handover found for this item")
        
        handover = handover_response.data
        
        # Check if code has expired
        expires_at = datetime.fromisoformat(handover["expires_at"].replace('Z', '+00:00'))
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=400, detail="Handover code has expired")
        
        # Verify the code
        if handover["code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid handover code")
        
        # Mark handover as verified
        supabase.table("handovers").update({
            "verified": True,
            "verified_at": datetime.utcnow().isoformat(),
            "verified_by": user_id
        }).eq("id", handover["id"]).execute()
        
        # Update item status to returned
        supabase.table("items").update({
            "moderation_status": "returned",
            "updated_at": datetime.utcnow().isoformat()
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


@router.get("/items/{item_id}/handover-status")
async def get_handover_status(
    item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get the current handover status for an item.
    """
    try:
        # Get the handover record
        handover_response = supabase.table("handovers").select("*").eq("item_id", item_id).order("created_at", desc=True).limit(1).execute()
        
        if not handover_response.data:
            return {
                "has_handover": False,
                "message": "No handover initiated for this item"
            }
        
        handover = handover_response.data[0]
        
        # Check if expired
        expires_at = datetime.fromisoformat(handover["expires_at"].replace('Z', '+00:00'))
        is_expired = datetime.utcnow() > expires_at
        
        return {
            "has_handover": True,
            "verified": handover.get("verified", False),
            "expired": is_expired,
            "created_at": handover.get("created_at"),
            "expires_at": handover.get("expires_at"),
            "verified_at": handover.get("verified_at")
        }
        
    except Exception as e:
        print(f"Error getting handover status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get handover status: {str(e)}")
