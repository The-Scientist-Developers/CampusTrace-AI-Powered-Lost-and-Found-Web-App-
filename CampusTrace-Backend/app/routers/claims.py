# from fastapi import APIRouter, Depends, HTTPException
# from typing import Optional
# import traceback

# from app.dependencies import get_current_user_id, supabase
# from app.models import ClaimCreate, ClaimRespond, UpdateClaimRequest
# from app.utils import create_notification

# router = APIRouter(prefix="/api/claims", tags=["Claims"])

# @router.post("/")
# async def submit_claim(
#     payload: ClaimCreate, claimant_id: str = Depends(get_current_user_id)
# ):
#     try:
#         item_res = (
#             supabase.table("items")
#             .select("user_id, title, status, university_id")
#             .eq("id", payload.item_id)
#             .single()
#             .execute()
#         )
#         if not item_res.data:
#             raise HTTPException(status_code=404, detail="Item not found.")
        
#         item_data = item_res.data
#         item_status = item_data["status"]
        
#         # Allow claiming on 'Found' items (standard claim) OR 'Lost' items (reporting found)
#         if item_status not in ["Found", "Lost"]:
#             raise HTTPException(status_code=400, detail="Item is not available for claiming or reporting.")

#         finder_id = item_data["user_id"] # The owner of the post
#         item_title = item_data["title"]
#         item_university_id = item_data["university_id"]

#         if finder_id == claimant_id:
#             raise HTTPException(status_code=400, detail="You cannot interact with your own item.")

#         # Check if a pending claim already exists for this user and item
#         existing_claim = (
#             supabase.table("claims")
#             .select("id")
#             .eq("item_id", payload.item_id)
#             .eq("claimant_id", claimant_id)
#             .eq("status", "pending")
#             .execute()
#         )
#         if existing_claim.data:
#              raise HTTPException(status_code=400, detail="You already have a pending claim on this item.")

#         # For Lost items, auto-approve since finder is helping (no approval needed)
#         # For Found items, require approval from the finder
#         auto_approve = (item_status == "Lost")
#         claim_status = "approved" if auto_approve else "pending"

#         claim_data = {
#             "item_id": payload.item_id,
#             "claimant_id": claimant_id,
#             "finder_id": finder_id,
#             "verification_message": payload.verification_message,
#             "status": claim_status,
#         }
#         claim_insert = supabase.table("claims").insert(claim_data).execute()
        
#         # If auto-approved, update item status and create conversation
#         if auto_approve:
#             supabase.table("items").update({"status": "pending recovery"}).eq("id", payload.item_id).execute()
            
#             # Create conversation for direct communication
#             existing_convo_res = (
#                 supabase.table("conversations")
#                 .select("id")
#                 .eq("item_id", payload.item_id)
#                 .eq("finder_id", finder_id)
#                 .eq("claimant_id", claimant_id)
#                 .execute()
#             )

#             conversation_id = None
#             if existing_convo_res.data:
#                 conversation_id = existing_convo_res.data[0]["id"]
#             else:
#                 new_convo_res = (
#                     supabase.table("conversations")
#                     .insert(
#                         {
#                             "item_id": payload.item_id,
#                             "finder_id": finder_id,
#                             "claimant_id": claimant_id,
#                         }
#                     )
#                     .execute()
#                 )
#                 if new_convo_res.data:
#                     conversation_id = new_convo_res.data[0]["id"]

#         claimant_profile_res = (
#             supabase.table("profiles")
#             .select("full_name")
#             .eq("id", claimant_id)
#             .single()
#             .execute()
#         )
#         claimant_name = (
#             claimant_profile_res.data.get("full_name", "A user")
#             if claimant_profile_res.data
#             else "A user"
#         )

#         # Dynamic notification message based on flow
#         if item_status == "Lost":
#             # Auto-approved: Claimant found the lost item - notify both parties
#             chat_link = f"/dashboard/messages/{conversation_id}" if auto_approve and conversation_id else "/dashboard/my-posts"
            
#             # Notify the loser (post owner)
#             message_loser = f"Great news! {claimant_name} found your lost item: '{item_title}'. You can now chat to arrange pickup."
#             create_notification(
#                 recipient_id=finder_id,
#                 university_id=item_university_id,
#                 message=message_loser,
#                 link_to=chat_link,
#                 type="found_report",
#             )
            
#             # Notify the finder (claimant)
#             message_finder = f"You've successfully reported finding '{item_title}'. You can now chat with the owner to arrange handover."
#             create_notification(
#                 recipient_id=claimant_id,
#                 university_id=item_university_id,
#                 message=message_finder,
#                 link_to=chat_link,
#                 type="found_report",
#             )
            
#             return {
#                 "message": "Success! You can now chat with the owner to arrange the handover.",
#                 "conversation_id": conversation_id
#             }
#         else:
#             # Standard: Claimant wants the found item - needs approval
#             message = f"{claimant_name} has submitted a claim on your found item: '{item_title}'."
#             create_notification(
#                 recipient_id=finder_id,
#                 university_id=item_university_id,
#                 message=message,
#                 link_to="/dashboard/my-posts",
#                 type="claim",
#             )

#             return {
#                 "message": "Submission successful. The user has been notified."
#             }
#     except HTTPException:
#         raise
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/item/{item_id}")
# async def get_claims_for_item(
#     item_id: int, user_id: str = Depends(get_current_user_id)
# ):
#     try:
#         item_res = (
#             supabase.table("items")
#             .select("user_id")
#             .eq("id", item_id)
#             .eq("user_id", user_id)
#             .single()
#             .execute()
#         )
#         if not item_res.data:
#             raise HTTPException(status_code=403, detail="You are not the owner of this item.")

#         claims_res = (
#             supabase.table("claims")
#             .select("*, claimant:profiles!claimant_id(full_name, email)")
#             .eq("item_id", item_id)
#             .eq("status", "pending")
#             .execute()
#         )
#         return claims_res.data
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# @router.put("/{claim_id}/respond")
# async def respond_to_claim(
#     claim_id: int, payload: ClaimRespond, finder_id: str = Depends(get_current_user_id)
# ):
#     try:
#         claim_res = (
#             supabase.table("claims")
#             .select("*, item:items(id, title, user_id, university_id, status)")
#             .eq("id", claim_id)
#             .single()
#             .execute()
#         )
#         if not claim_res.data or claim_res.data["finder_id"] != finder_id:
#             raise HTTPException(status_code=403, detail="You are not authorized to respond to this claim.")

#         claim = claim_res.data
#         item_id = claim["item"]["id"]
#         item_title = claim["item"]["title"]
#         claimant_id = claim["claimant_id"]
#         item_university_id = claim["item"]["university_id"]
#         current_item_status = claim["item"]["status"]

#         new_status = "approved" if payload.approved else "rejected"

#         supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()

#         if payload.approved:
#             # Determine next item status based on whether it was Lost or Found
#             if current_item_status == "Lost":
#                 new_item_status = "pending recovery"
#             else:
#                 new_item_status = "pending handover"

#             supabase.table("items").update({"status": new_item_status}).eq("id", claim["item_id"]).execute()
            
#             existing_convo_res = (
#                 supabase.table("conversations")
#                 .select("id")
#                 .eq("item_id", item_id)
#                 .eq("finder_id", finder_id)
#                 .eq("claimant_id", claimant_id)
#                 .execute()
#             )

#             conversation_id = None
#             if existing_convo_res.data:
#                 conversation_id = existing_convo_res.data[0]["id"]
#             else:
#                 new_convo_res = (
#                     supabase.table("conversations")
#                     .insert(
#                         {
#                             "item_id": item_id,
#                             "finder_id": finder_id,
#                             "claimant_id": claimant_id,
#                         }
#                     )
#                     .execute()
#                 )
#                 if not new_convo_res.data:
#                     raise Exception("Failed to create conversation after claim approval.")
#                 conversation_id = new_convo_res.data[0]["id"]

#             finder_profile_res = (
#                 supabase.table("profiles")
#                 .select("email")
#                 .eq("id", finder_id)
#                 .single()
#                 .execute()
#             )
#             claimant_profile_res = (
#                 supabase.table("profiles")
#                 .select("email")
#                 .eq("id", claimant_id)
#                 .single()
#                 .execute()
#             )
#             finder_email = finder_profile_res.data.get("email", "N/A")
#             claimant_email = claimant_profile_res.data.get("email", "N/A")

#             finder_message = f"You approved the interaction for '{item_title}'. You can now chat to arrange the meetup."
#             claimant_message = f"Great news! Your interaction for '{item_title}' has been approved. You can now chat to arrange the meetup."

#             chat_link = f"/dashboard/messages/{conversation_id}"
#             create_notification(
#                 recipient_id=finder_id,
#                 university_id=item_university_id,
#                 message=finder_message,
#                 link_to=chat_link,
#                 type="claim_response",
#             )
#             create_notification(
#                 recipient_id=claimant_id,
#                 university_id=item_university_id,
#                 message=claimant_message,
#                 link_to=chat_link,
#                 type="claim_response",
#             )

#             # Reject all other pending claims for this item
#             supabase.table("claims").update({"status": "rejected"}).eq(
#                 "item_id", claim["item_id"]
#             ).eq("status", "pending").execute()
#         else:
#             message = f"Unfortunately, the interaction for '{item_title}' was not approved."
#             create_notification(
#                 recipient_id=claimant_id,
#                 university_id=item_university_id,
#                 message=message,
#                 type="claim_response",
#             )

#         return {"message": f"Claim has been {new_status}."}
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# @router.delete("/{claim_id}")
# async def cancel_claim(claim_id: int, user_id: str = Depends(get_current_user_id)):
#     try:
#         claim_res = (
#             supabase.table("claims")
#             .select("claimant_id, item_id, status")
#             .eq("id", claim_id)
#             .single()
#             .execute()
#         )
#         if not claim_res.data:
#             raise HTTPException(status_code=404, detail="Claim not found")
#         claim = claim_res.data
#         if claim["claimant_id"] != user_id:
#             raise HTTPException(status_code=403, detail="You can only cancel your own claims")
#         if claim["status"] == "approved":
#             raise HTTPException(status_code=400, detail="Cannot cancel an approved claim. Please complete the handover process.")

#         supabase.table("claims").delete().eq("id", claim_id).execute()
#         return {"message": "Claim canceled successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Failed to cancel claim: {str(e)}")

# @router.post("/create")
# async def create_claim_error_handler(user_id: str = Depends(get_current_user_id)):
#     raise HTTPException(
#         status_code=410,
#         detail=(
#             "This endpoint has been removed. "
#             "To SUBMIT a new claim, use: POST /api/claims/ with {item_id, verification_message}. "
#             "To UPDATE a claim status, use: PUT /api/claims/{claim_id}/respond with {approved: boolean}."
#         ),
#     )

# @router.post("/update-status")
# async def update_claim_status_legacy(
#     request: UpdateClaimRequest, user_id: str = Depends(get_current_user_id)
# ):
#     print(f"⚠️  [DEPRECATED] /api/claims/update-status called")
#     print(f"📥 [CLAIMS/UPDATE-STATUS] Received request:")
#     print(f"   - claim_id: {request.claim_id}")
#     print(f"   - status: {request.status}")
#     print(f"   - user_id: {user_id}")

#     if not request.status:
#         raise HTTPException(status_code=422, detail="status field is required")

#     if request.status not in ["accepted", "rejected"]:
#         raise HTTPException(
#             status_code=422,
#             detail=f"status must be 'accepted' or 'rejected', got '{request.status}'",
#         )

#     return await update_claim_status(request.claim_id, request, user_id)

# @router.put("/{claim_id}/status")
# async def update_claim_status(
#     claim_id: int,
#     request: UpdateClaimRequest,
#     user_id: str = Depends(get_current_user_id),
# ):
#     try:
#         actual_claim_id = claim_id or request.claim_id
#         if not actual_claim_id:
#             raise HTTPException(status_code=400, detail="claim_id is required")

#         claim_response = (
#             supabase.table("claims")
#             .select("*, item:items(*)")
#             .eq("id", actual_claim_id)
#             .single()
#             .execute()
#         )

#         if not claim_response.data:
#             raise HTTPException(status_code=404, detail="Claim not found")

#         claim = claim_response.data

#         if claim["item"]["user_id"] != user_id:
#             raise HTTPException(
#                 status_code=403, detail="Only the item owner can update claim status"
#             )

#         new_status = request.status
#         supabase.table("claims").update({"status": new_status}).eq(
#             "id", actual_claim_id
#         ).execute()

#         if new_status == "accepted":
#             try:
#                 # Default fallback, though 'respond' endpoint handles logic better
#                 supabase.table("items").update(
#                     {"status": "pending handover"}
#                 ).eq("id", claim["item_id"]).execute()
#             except Exception as item_error:
#                 print(f"⚠️ Could not update item status: {item_error}")

#         print(f"✅ Claim {actual_claim_id} {new_status}")

#         return {
#             "success": True,
#             "message": f"Claim {new_status} successfully",
#             "claim_id": actual_claim_id,
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating claim: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Failed to update claim: {str(e)}")

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
        
        item_data = item_res.data
        item_status = item_data["status"]
        
        # Allow claiming on 'Found' items (standard claim) OR 'Lost' items (reporting found)
        if item_status not in ["Found", "Lost"]:
            raise HTTPException(status_code=400, detail="Item is not available for claiming or reporting.")

        finder_id = item_data["user_id"] # The owner of the post
        item_title = item_data["title"]
        item_university_id = item_data["university_id"]

        if finder_id == claimant_id:
            raise HTTPException(status_code=400, detail="You cannot interact with your own item.")

        # Check if a pending claim already exists for this user and item
        existing_claim = (
            supabase.table("claims")
            .select("id")
            .eq("item_id", payload.item_id)
            .eq("claimant_id", claimant_id)
            .eq("status", "pending")
            .execute()
        )
        if existing_claim.data:
             raise HTTPException(status_code=400, detail="You already have a pending claim on this item.")

        # For Lost items, auto-approve since finder is helping (no approval needed)
        # For Found items, require approval from the finder
        auto_approve = (item_status == "Lost")
        claim_status = "approved" if auto_approve else "pending"

        claim_data = {
            "item_id": payload.item_id,
            "claimant_id": claimant_id,
            "finder_id": finder_id,
            "verification_message": payload.verification_message,
            "status": claim_status,
        }
        claim_insert = supabase.table("claims").insert(claim_data).execute()
        
        # If auto-approved, update item status and create conversation
        if auto_approve:
            supabase.table("items").update({"status": "pending recovery"}).eq("id", payload.item_id).execute()
            
            # Create conversation for direct communication
            existing_convo_res = (
                supabase.table("conversations")
                .select("id")
                .eq("item_id", payload.item_id)
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
                            "item_id": payload.item_id,
                            "finder_id": finder_id,
                            "claimant_id": claimant_id,
                        }
                    )
                    .execute()
                )
                if new_convo_res.data:
                    conversation_id = new_convo_res.data[0]["id"]

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

        # Dynamic notification message based on flow
        if item_status == "Lost":
            # Auto-approved: Claimant found the lost item - notify both parties
            chat_link = f"/dashboard/messages/{conversation_id}" if auto_approve and conversation_id else "/dashboard/my-posts"
            
            # Notify the loser (post owner)
            message_loser = f"Great news! {claimant_name} found your lost item: '{item_title}'. You can now chat to arrange pickup."
            create_notification(
                recipient_id=finder_id,
                university_id=item_university_id,
                message=message_loser,
                link_to=chat_link,
                type="found_report",
            )
            
            # Notify the finder (claimant)
            message_finder = f"You've successfully reported finding '{item_title}'. You can now chat with the owner to arrange handover."
            create_notification(
                recipient_id=claimant_id,
                university_id=item_university_id,
                message=message_finder,
                link_to=chat_link,
                type="found_report",
            )
            
            return {
                "message": "Success! You can now chat with the owner to arrange the handover.",
                "conversation_id": conversation_id
            }
        else:
            # Standard: Claimant wants the found item - needs approval
            message = f"{claimant_name} has submitted a claim on your found item: '{item_title}'."
            create_notification(
                recipient_id=finder_id,
                university_id=item_university_id,
                message=message,
                link_to="/dashboard/my-posts",
                type="claim",
            )

            return {
                "message": "Submission successful. The user has been notified."
            }
    except HTTPException:
        raise
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
            .order("created_at", desc=True)
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
            .select("*, item:items(id, title, user_id, university_id, status)")
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
        current_item_status = claim["item"]["status"]

        new_status = "approved" if payload.approved else "rejected"

        supabase.table("claims").update({"status": new_status}).eq("id", claim_id).execute()

        if payload.approved:
            # Determine next item status based on whether it was Lost or Found
            if current_item_status == "Lost":
                new_item_status = "pending recovery"
            else:
                new_item_status = "pending handover"

            supabase.table("items").update({"status": new_item_status}).eq("id", claim["item_id"]).execute()
            
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

            finder_message = f"You approved the interaction for '{item_title}'. You can now chat to arrange the meetup."
            claimant_message = f"Great news! Your interaction for '{item_title}' has been approved. You can now chat to arrange the meetup."

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

            # Reject all other pending claims for this item
            supabase.table("claims").update({"status": "rejected"}).eq(
                "item_id", claim["item_id"]
            ).eq("status", "pending").execute()
        else:
            message = f"Unfortunately, the interaction for '{item_title}' was not approved."
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
                # Default fallback, though 'respond' endpoint handles logic better
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