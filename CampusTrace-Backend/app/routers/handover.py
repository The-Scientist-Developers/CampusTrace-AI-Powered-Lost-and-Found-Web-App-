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

router = APIRouter(prefix="/api/handover", tags=["Handover"])


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
        # Get the item
        item_response = supabase.table("items").select("*").eq("id", item_id).single().execute()
        
        if not item_response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item = item_response.data
        
        # Verify item is in 'pending handover' status
        if item.get("status") != "pending handover":
            raise HTTPException(
                status_code=400,
                detail="Item must be in 'pending handover' status to start handover"
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
        existing_handover = supabase.table("handovers").select("*").eq("item_id", item_id).order("created_at", desc=True).execute()
        
        # Find the most recent unverified handover
        unverified_handover = None
        if existing_handover.data:
            for h in existing_handover.data:
                if not h.get("verified", False):
                    unverified_handover = h
                    break
        
        if unverified_handover:
            # Delete old handover and create new one (workaround for RLS UPDATE policy)
            print(f"Deleting existing handover {unverified_handover['id']} and creating new one with code: {code}")
            try:
                # Try to delete the old handover
                delete_result = supabase.table("handovers").delete().eq("id", unverified_handover["id"]).execute()
                print(f"Delete result: {delete_result.data}")
            except Exception as e:
                print(f"Could not delete old handover (will create new anyway): {e}")
            
            # Create new handover record
            insert_result = supabase.table("handovers").insert(handover_data).execute()
            print(f"Insert result: {insert_result.data}")
        else:
            # Create new handover record
            print(f"Creating new handover with code: {code}")
            insert_result = supabase.table("handovers").insert(handover_data).execute()
            print(f"Insert result: {insert_result.data}")
        
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
        
        # Get the handover record - order by created_at desc to get the latest one
        handover_response = supabase.table("handovers").select("*").eq("item_id", item_id).order("created_at", desc=True).execute()
        
        print(f"Handover query response for item {item_id}: {handover_response.data}")
        
        if not handover_response.data or len(handover_response.data) == 0:
            # Additional debug info
            print(f"No handover found. User ID: {user_id}, Item ID: {item_id}")
            raise HTTPException(status_code=404, detail="No active handover found for this item")
        
        # Get the most recent unverified handover
        handover = None
        has_verified_handover = False
        for h in handover_response.data:
            if not h.get("verified", False):
                handover = h
                break
            else:
                has_verified_handover = True
        
        if not handover:
            if has_verified_handover:
                raise HTTPException(
                    status_code=400, 
                    detail="This handover has already been completed. The claimant needs to start a new handover if needed."
                )
            else:
                raise HTTPException(status_code=404, detail="No active handover found for this item")
        
        # Check if code has expired
        expires_at_str = handover["expires_at"].replace('Z', '').replace('+00:00', '')
        expires_at = datetime.fromisoformat(expires_at_str)
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
        
        # Update item status to recovered
        supabase.table("items").update({
            "status": "recovered"
        }).eq("id", item_id).execute()
        
        # Mark the approved claim as resolved/completed
        try:
            supabase.table("claims").update({
                "status": "resolved",
                "resolved_at": datetime.utcnow().isoformat()
            }).eq("item_id", item_id).eq("status", "approved").execute()
            print(f"✅ Marked claim as resolved for item {item_id}")
        except Exception as e:
            print(f"⚠️ Error marking claim as resolved: {e}")
        
        # Credit the finder with +1 return count for leaderboard
        try:
            print(f"🔄 [RETURNS_COUNT] Attempting to increment for user: {user_id}")
            
            # Get current profile
            profile_response = supabase.table("profiles").select("returns_count").eq("id", user_id).single().execute()
            
            print(f"📊 [RETURNS_COUNT] Profile query response: {profile_response}")
            
            if profile_response.data:
                current_count = profile_response.data.get("returns_count", 0) or 0
                new_count = current_count + 1
                
                print(f"📈 [RETURNS_COUNT] Current: {current_count}, New: {new_count}")
                
                # Update returns count
                update_response = supabase.table("profiles").update({
                    "returns_count": new_count
                }).eq("id", user_id).execute()
                
                print(f"💾 [RETURNS_COUNT] Update response: {update_response}")
                print(f"✅ Credited finder {user_id} with return count: {current_count} -> {new_count}")
            else:
                print(f"❌ [RETURNS_COUNT] No profile data found for user {user_id}")
        except Exception as e:
            print(f"⚠️ Error updating return count: {e}")
            import traceback
            traceback.print_exc()
        
        # Award badge to the finder (item owner)
        try:
            # Check if finder already has the "Helper" badge
            existing_badge = supabase.table("user_badges").select("*").eq("user_id", user_id).eq("badge_type", "helper").execute()
            
            if not existing_badge.data or len(existing_badge.data) == 0:
                # Award the Helper badge
                supabase.table("user_badges").insert({
                    "user_id": user_id,
                    "badge_type": "helper",
                    "earned_at": datetime.utcnow().isoformat()
                }).execute()
                print(f"✅ Awarded Helper badge to user {user_id}")
        except Exception as e:
            print(f"⚠️ Error awarding badge: {e}")
            # Don't fail the handover if badge awarding fails
        
        return {
            "success": True,
            "message": "Handover verified successfully. Item marked as recovered.",
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