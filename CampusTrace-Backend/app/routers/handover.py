from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import random
import string
from datetime import datetime, timedelta
from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api/handover", tags=["Handover"])

class HandoverCodeResponse(BaseModel):
    code: str
    expires_at: str
    item_id: int

class VerifyHandoverRequest(BaseModel):
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
    Generates a verification code.
    - Found Item: Claimant (User who submitted claim) generates code.
    - Lost Item: Owner (User who posted item) generates code.
    Sets item status to 'pending handover'.
    """
    try:
        # 1. Get Item
        item_res = supabase.table("items").select("*").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found")
        item = item_res.data
        
        claimant_id = None
        status = item.get("status")
        moderation_status = item.get("moderation_status")

        # 2. Determine Logic based on Status
        # Explicitly accept "pending handover" as valid status for Found item flow
        if status in ["Found", "pending handover", "Pending Handover"]:
            print(f"DEBUG: Item {item_id} has status '{status}'. Looking for approved claim...")
            claim_res = supabase.table("claims").select("*").eq("item_id", item_id).eq("status", "approved").single().execute()
            if not claim_res.data:
                print(f"DEBUG: No approved claim found for item {item_id}")
                if item.get("user_id") == user_id:
                     claimant_id = user_id
                else:
                     raise HTTPException(status_code=400, detail="No approved claim found for this item. Handover cannot start.")
            else:
                print(f"DEBUG: Found approved claim for item {item_id}. Claimant: {claim_res.data.get('claimant_id')}")
                claimant_id = claim_res.data.get("claimant_id")
                if claimant_id != user_id:
                    raise HTTPException(status_code=403, detail="Only the approved claimant can generate the code.")

        elif status == "Lost":
            if item.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Only the item owner can start the handover.")
            claimant_id = user_id
        
        else:
             if item.get("user_id") == user_id:
                claimant_id = user_id # Assume Owner recovering lost item
             else:
                print(f"DEBUG: Handover failed. Status: {status}, ModStatus: {moderation_status}")
                raise HTTPException(status_code=400, detail=f"Item status '{status}' invalid for handover start.")

        # 3. Generate and Store Code
        code = generate_handover_code()
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        handover_data = {
            "item_id": item_id,
            "code": code,
            "claimant_id": claimant_id,
            "expires_at": expires_at.isoformat(),
            "verified": False,
            "created_at": datetime.utcnow().isoformat()
        }
        # Delete old unverified handovers for this item to prevent duplicates
        supabase.table("handovers").delete().eq("item_id", item_id).eq("verified", False).execute()
        # Insert new handover
        supabase.table("handovers").insert(handover_data).execute()

        # **Set item status to 'pending handover'**
        supabase.table("items").update({
            "status": "pending handover"
        }).eq("id", item_id).execute()

        return {
            "code": code,
            "expires_at": expires_at.isoformat(),
            "item_id": item_id,
            "message": "Handover code generated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/items/{item_id}/verify-handover")
async def verify_handover(
    item_id: int,
    request: VerifyHandoverRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Verifies the handover code.
    - Found Item: Finder (Poster) enters code.
    - Lost Item: Finder (User B) enters code.
    Sets item status to 'recovered'.
    """
    try:
        item_res = supabase.table("items").select("*").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found")
        item = item_res.data

        finder_id = user_id 
        
        # Security Check: The Code Generator cannot verify their own code.
        if item.get("status") == "Lost":
            # For lost items, Owner generated code. Owner cannot verify.
            if item.get("user_id") == user_id:
                raise HTTPException(status_code=403, detail="You cannot verify your own code. The finder must enter it.")
        
        # For Found items or items in "pending handover" state, only the finder (poster) can verify
        if item.get("status") in ["Found", "pending handover", "Pending Handover"]:
            if item.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Only the item poster (finder) can verify the code.")

        handover_res = supabase.table("handovers").select("*").eq("item_id", item_id).eq("verified", False).order("created_at", desc=True).limit(1).execute()
        if not handover_res.data:
            print(f"DEBUG: No handover found for item {item_id}. Item status: {item.get('status')}")
            raise HTTPException(status_code=404, detail="No active handover code found. The claimant must generate a code first.")
        handover = handover_res.data[0]

        if handover["code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid handover code.")

        try:
            expires_at = datetime.fromisoformat(handover["expires_at"].replace('Z', ''))
            if datetime.utcnow() > expires_at:
                raise HTTPException(status_code=400, detail="Code has expired.")
        except:
            pass 

        # Mark handover as verified
        supabase.table("handovers").update({
            "verified": True,
            "verified_at": datetime.utcnow().isoformat(),
            "verified_by": finder_id
        }).eq("id", handover["id"]).execute()

        # **Set item status to 'recovered'**
        supabase.table("items").update({
            "status": "recovered"
        }).eq("id", item_id).execute()

        # Note: Claim stays as "approved" - the item status "recovered" indicates completion
        print(f"✅ Item {item_id} marked as recovered. Claim remains approved.")

        # Award Points/Badges to Finder
        try:
            profile_res = supabase.table("profiles").select("returns_count").eq("id", finder_id).single().execute()
            if profile_res.data:
                new_count = (profile_res.data.get("returns_count") or 0) + 1
                supabase.table("profiles").update({"returns_count": new_count}).eq("id", finder_id).execute()
                print(f"✅ Credited finder {finder_id} with return #{new_count}")
                if new_count == 1:
                    supabase.table("user_badges").insert({
                        "user_id": finder_id,
                        "badge_type": "helper",
                        "earned_at": datetime.utcnow().isoformat()
                    }).execute()
        except Exception as e:
            print(f"⚠️ Error updating stats: {e}")

        return {
            "success": True,
            "message": "Handover verified successfully. Item marked as recovered.",
            "item_id": item_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items/{item_id}/handover-status")
async def get_handover_status(
    item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get the current handover status for an item.
    """
    try:
        handover_res = supabase.table("handovers").select("*").eq("item_id", item_id).order("created_at", desc=True).limit(1).execute()
        if not handover_res.data:
            return {"has_handover": False}
        handover = handover_res.data[0]
        return {
            "has_handover": True,
            "verified": handover.get("verified", False),
            "expires_at": handover.get("expires_at")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
