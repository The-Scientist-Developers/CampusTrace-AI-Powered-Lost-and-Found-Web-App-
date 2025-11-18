from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import traceback

from app.dependencies import get_current_user_id, supabase
from app.models import ClaimCreate, ClaimRespond, UpdateClaimRequest
from app.utils import create_notification

router = APIRouter(prefix="/api/claims", tags=["Claims"])

@router.post("/")
async def submit_claim(
    payload: ClaimCreate, claimant_id: str = Depends(get_current_user_id)
):
    try:
        item_res = (
            supabase.table("items")
            .select("user_id, title, status, university_id")
            .eq("id", payload.item_id)
            .single()
            .execute()
        )
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")
        if item_res.data["status"] != "Found":
            raise HTTPException(status_code=400, detail="You can only claim 'Found' items.")

        finder_id = item_res.data["user_id"]
        item_title = item_res.data["title"]
        item_university_id = item_res.data["university_id"]

        if finder_id == claimant_id:
            raise HTTPException(status_code=400, detail="You cannot claim your own item.")

        claim_data = {
            "item_id": payload.item_id,
            "claimant_id": claimant_id,
            "finder_id": finder_id,
            "verification_message": payload.verification_message,
            "status": "pending",
        }
        supabase.table("claims").insert(claim_data).execute()

        claimant_profile_res = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", claimant_id)
            .single()
            .execute()
        )
        claimant_name = (
            claimant_profile_res.data.get("full_name", "A user")
            if claimant_profile_res.data
            else "A user"
        )

        message = f"{claimant_name} has submitted a claim on your found item: '{item_title}'."
        create_notification(
            recipient_id=finder_id,
            university_id=item_university_id,
            message=message,
            link_to="/dashboard/my-posts",
            type="claim",
        )

        return {
            "message": "Claim submitted successfully. The finder has been notified."
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/item/{item_id}")
async def get_claims_for_item(
    item_id: int, user_id: str = Depends(get_current_user_id)
):
    try:
        item_res = (
            supabase.table("items")
            .select("user_id")
            .eq("id", item_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not item_res.data:
            raise HTTPException(status_code=403, detail="You are not the owner of this item.")

        claims_res = (
            supabase.table("claims")
            .select("*, claimant:profiles!claimant_id(full_name, email)")
            .eq("item_id", item_id)
            .eq("status", "pending")
            .execute()
        )
        return claims_res.data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{claim_id}/respond")
async def respond_to_claim(
    claim_id: int, payload: ClaimRespond, finder_id: str = Depends(get_current_user_id)
):
    try:
        claim_res = (
            supabase.table("claims")
            .select("*, item:items(id, title, user_id, university_id)")
            .eq("id", claim_id)
            .single()
            .execute()
        )
        if not claim_res.data or claim_res.data["finder_id"] != finder_id:
            raise HTTPException(status_code=403, detail="You are not authorized to respond to this claim.")

        claim = claim_res.data
        item_id = claim["item"]["id"]
        item_title = claim["item"]["title"]
        claimant_id = claim["claimant_id"]
        item_university_id = claim["item"]["university_id"]

        new_status = "approved" if payload.approved else "rejected"

        supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()

        if payload.approved:
            supabase.table("items").update({"status": "pending handover"}).eq("id", claim["item_id"]).execute()
            existing_convo_res = (
                supabase.table("conversations")
                .select("id")
                .eq("item_id", item_id)
                .eq("finder_id", finder_id)
                .eq("claimant_id", claimant_id)
                .execute()
            )

            conversation_id = None
            if existing_convo_res.data:
                conversation_id = existing_convo_res.data[0]["id"]
            else:
                new_convo_res = (
                    supabase.table("conversations")
                    .insert(
                        {
                            "item_id": item_id,
                            "finder_id": finder_id,
                            "claimant_id": claimant_id,
                        }
                    )
                    .execute()
                )
                if not new_convo_res.data:
                    raise Exception("Failed to create conversation after claim approval.")
                conversation_id = new_convo_res.data[0]["id"]

            finder_profile_res = (
                supabase.table("profiles")
                .select("email")
                .eq("id", finder_id)
                .single()
                .execute()
            )
            claimant_profile_res = (
                supabase.table("profiles")
                .select("email")
                .eq("id", claimant_id)
                .single()
                .execute()
            )
            finder_email = finder_profile_res.data.get("email", "N/A")
            claimant_email = claimant_profile_res.data.get("email", "N/A")

            finder_message = f"You approved the claim for '{item_title}'. You can now chat with the claimant to arrange the return."
            claimant_message = f"Great news! Your claim for '{item_title}' has been approved. You can now chat with the finder to arrange the return."

            chat_link = f"/dashboard/messages/{conversation_id}"
            create_notification(
                recipient_id=finder_id,
                university_id=item_university_id,
                message=finder_message,
                link_to=chat_link,
                type="claim_response",
            )
            create_notification(
                recipient_id=claimant_id,
                university_id=item_university_id,
                message=claimant_message,
                link_to=chat_link,
                type="claim_response",
            )

            supabase.table("claims").update({"status": "rejected"}).eq(
                "item_id", claim["item_id"]
            ).eq("status", "pending").execute()
        else:
            message = f"Unfortunately, your claim for '{item_title}' was not approved by the finder."
            create_notification(
                recipient_id=claimant_id,
                university_id=item_university_id,
                message=message,
                type="claim_response",
            )

        return {"message": f"Claim has been {new_status}."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{claim_id}")
async def cancel_claim(claim_id: int, user_id: str = Depends(get_current_user_id)):
    try:
        claim_res = (
            supabase.table("claims")
            .select("claimant_id, item_id, status")
            .eq("id", claim_id)
            .single()
            .execute()
        )
        if not claim_res.data:
            raise HTTPException(status_code=404, detail="Claim not found")
        claim = claim_res.data
        if claim["claimant_id"] != user_id:
            raise HTTPException(status_code=403, detail="You can only cancel your own claims")
        if claim["status"] == "approved":
            raise HTTPException(status_code=400, detail="Cannot cancel an approved claim. Please complete the handover process.")

        supabase.table("claims").delete().eq("id", claim_id).execute()
        return {"message": "Claim canceled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to cancel claim: {str(e)}")

@router.post("/create")
async def create_claim_error_handler(user_id: str = Depends(get_current_user_id)):
    raise HTTPException(
        status_code=410,
        detail=(
            "This endpoint has been removed. "
            "To SUBMIT a new claim, use: POST /api/claims/ with {item_id, verification_message}. "
            "To UPDATE a claim status, use: PUT /api/claims/{claim_id}/respond with {approved: boolean}."
        ),
    )

@router.post("/update-status")
async def update_claim_status_legacy(
    request: UpdateClaimRequest, user_id: str = Depends(get_current_user_id)
):
    print(f"⚠️  [DEPRECATED] /api/claims/update-status called")
    print(f"📥 [CLAIMS/UPDATE-STATUS] Received request:")
    print(f"   - claim_id: {request.claim_id}")
    print(f"   - status: {request.status}")
    print(f"   - user_id: {user_id}")

    if not request.status:
        raise HTTPException(status_code=422, detail="status field is required")

    if request.status not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=422,
            detail=f"status must be 'accepted' or 'rejected', got '{request.status}'",
        )

    return await update_claim_status(request.claim_id, request, user_id)

@router.put("/{claim_id}/status")
async def update_claim_status(
    claim_id: int,
    request: UpdateClaimRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        actual_claim_id = claim_id or request.claim_id
        if not actual_claim_id:
            raise HTTPException(status_code=400, detail="claim_id is required")

        claim_response = (
            supabase.table("claims")
            .select("*, item:items(*)")
            .eq("id", actual_claim_id)
            .single()
            .execute()
        )

        if not claim_response.data:
            raise HTTPException(status_code=404, detail="Claim not found")

        claim = claim_response.data

        if claim["item"]["user_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="Only the item owner can update claim status"
            )

        new_status = request.status
        supabase.table("claims").update({"status": new_status}).eq(
            "id", actual_claim_id
        ).execute()

        if new_status == "accepted":
            try:
                supabase.table("items").update(
                    {"status": "pending handover"}
                ).eq("id", claim["item_id"]).execute()
            except Exception as item_error:
                print(f"⚠️ Could not update item status: {item_error}")

        print(f"✅ Claim {actual_claim_id} {new_status}")

        return {
            "success": True,
            "message": f"Claim {new_status} successfully",
            "claim_id": actual_claim_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating claim: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update claim: {str(e)}")
