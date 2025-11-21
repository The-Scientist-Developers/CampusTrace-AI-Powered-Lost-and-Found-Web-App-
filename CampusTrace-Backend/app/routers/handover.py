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
    The person RECEIVING the item generates the code.
    - Found Item Post (Loser is claiming): Claimant (Receiver) generates code.
    - Lost Item Post (Finder is reporting): Post Owner (Receiver) generates code.
    """
    try:
        # 1. Get Item
        item_res = supabase.table("items").select("*").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found")
        item = item_res.data
        
        claimant_id = None
        status = item.get("status")
        
        # 2. Determine Logic based on Status
        
        # CASE A: Standard Claim (Found Item -> Loser Claims)
        if status in ["Found", "pending handover", "Pending Handover"]:
            print(f"DEBUG: Found Item {item_id} flow. Looking for approved claim...")
            claim_res = supabase.table("claims").select("*").eq("item_id", item_id).eq("status", "approved").single().execute()
            
            if not claim_res.data:
                # Fallback: If user is the owner (testing purposes or edge case)
                if item.get("user_id") == user_id:
                     claimant_id = user_id
                else:
                     raise HTTPException(status_code=400, detail="No approved claim found. Handover cannot start.")
            else:
                # The Claimant (Loser) receives the item, so they generate code
                claimant_id = claim_res.data.get("claimant_id")
                if claimant_id != user_id:
                    raise HTTPException(status_code=403, detail="Only the approved claimant (receiver) can generate the code.")

        # CASE B: Found Report (Lost Item -> Finder Reports -> Loser Approves)
        elif status in ["Lost", "pending recovery"]:
            # The Post Owner (Loser) receives the item, so they generate code
            if item.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Only the item owner (receiver) can generate the handover code.")
            claimant_id = user_id
        
        else:
             # Fallback for manual recovery/testing
             if item.get("user_id") == user_id:
                claimant_id = user_id 
             else:
                raise HTTPException(status_code=400, detail=f"Item status '{status}' invalid for handover start.")

        # 3. Generate and Store Code
        code = generate_handover_code()
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        handover_data = {
            "item_id": item_id,
            "code": code,
            "claimant_id": claimant_id, # This is always the person generating/receiving
            "expires_at": expires_at.isoformat(),
            "verified": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Delete old unverified handovers
        supabase.table("handovers").delete().eq("item_id", item_id).eq("verified", False).execute()
        
        # Insert new handover
        supabase.table("handovers").insert(handover_data).execute()

        # Update status if strictly in 'Found' or 'Lost' to pending states
        new_status = None
        if status == "Found":
            new_status = "pending handover"
        elif status == "Lost":
            new_status = "pending recovery"
            
        if new_status:
            supabase.table("items").update({"status": new_status}).eq("id", item_id).execute()

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
    The person GIVING the item enters the code.
    - Found Item: Finder (Poster) enters code.
    - Lost Item: Finder (Claimant) enters code.
    """
    try:
        current_user_id = user_id 

        item_res = supabase.table("items").select("*").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found")
        item = item_res.data
        status = item.get("status")

        # Logic Validation: Who is allowed to verify?
        
        # CASE A: Lost Item Flow (pending recovery)
        # The Post Owner generated code. The Finder (Claimant) must verify.
        if status in ["Lost", "pending recovery"]:
            if item.get("user_id") == current_user_id:
                raise HTTPException(status_code=403, detail="You cannot verify your own code. The finder must enter it.")
            
            # Optionally verify if current_user is the approved claimant (Finder)
            # This adds extra security but might fail if we allow ad-hoc handovers. 
            # For now, we assume possessing the code + allowed logic is enough, 
            # or we check against approved claims.
            
        # CASE B: Found Item Flow (pending handover)
        # The Claimant generated code. The Post Owner (Finder) must verify.
        elif status in ["Found", "pending handover", "Pending Handover"]:
            if item.get("user_id") != current_user_id:
                raise HTTPException(status_code=403, detail="Only the item poster (finder) can verify the code.")

        # Fetch Code
        handover_res = supabase.table("handovers").select("*").eq("item_id", item_id).eq("verified", False).order("created_at", desc=True).limit(1).execute()
        if not handover_res.data:
            raise HTTPException(status_code=404, detail="No active handover code found. The receiver must generate a code first.")
        handover = handover_res.data[0]

        if handover["code"] != request.code:
            raise HTTPException(status_code=400, detail="Invalid handover code.")

        try:
            expires_at = datetime.fromisoformat(handover["expires_at"].replace('Z', ''))
            if datetime.utcnow() > expires_at:
                raise HTTPException(status_code=400, detail="Code has expired.")
        except:
            pass 

        # Mark verified
        supabase.table("handovers").update({
            "verified": True,
            "verified_at": datetime.utcnow().isoformat(),
            "verified_by": current_user_id
        }).eq("id", handover["id"]).execute()

        # Mark recovered
        supabase.table("items").update({
            "status": "recovered"
        }).eq("id", item_id).execute()

        print(f"✅ Item {item_id} marked as recovered.")

        # --- POINTS & BADGES LOGIC ---
        # We credit the "Finder" (The one who gave the item back)
        
        person_to_credit = None
        
        if status in ["Lost", "pending recovery"]:
            # Finder is the current_user_id (the one entering the code)
            person_to_credit = current_user_id
        else:
            # Finder is the item post owner (current_user_id)
            person_to_credit = item.get("user_id")

        if person_to_credit:
            try:
                profile_res = supabase.table("profiles").select("returns_count").eq("id", person_to_credit).single().execute()
                if profile_res.data:
                    current_count = profile_res.data.get("returns_count", 0)
                    new_count = current_count + 1
                    
                    supabase.table("profiles").update({
                        "returns_count": new_count
                    }).eq("id", person_to_credit).execute()
                    
                    print(f"✅ Credited finder {person_to_credit}: returns_count {current_count} → {new_count}")
                    
                    if new_count == 1:
                        supabase.table("user_badges").insert({
                            "user_id": person_to_credit,
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