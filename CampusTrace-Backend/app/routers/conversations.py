from fastapi import APIRouter, Depends, HTTPException, Form
import traceback

from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

@router.post("/")
async def get_or_create_conversation(item_id: int = Form(...), user_id: str = Depends(get_current_user_id)):
    """
    Get an existing conversation or create a new one for an item.
    Prevents users from starting conversations on their own posts.
    """
    try:
        # Get the item details
        item_res = supabase.table("items").select("user_id, status").eq("id", item_id).single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Item not found.")

        poster_id = item_res.data['user_id']
        message_sender_id = user_id

        # Prevent self-messaging
        if poster_id == message_sender_id:
            raise HTTPException(status_code=400, detail="You cannot start a conversation on your own item.")

        item_status = item_res.data['status']

        # Determine conversation participants based on item status
        finder_id = poster_id if item_status == 'Found' else message_sender_id
        claimant_id = message_sender_id if item_status == 'Found' else poster_id

        # Check if a conversation already exists
        existing_convo_res = supabase.table("conversations") \
            .select("id") \
            .eq("item_id", item_id) \
            .eq("finder_id", finder_id) \
            .eq("claimant_id", claimant_id) \
            .execute()

        # Return existing conversation ID if found
        if existing_convo_res.data:
            return {"conversation_id": existing_convo_res.data[0]['id']}

        # Create a new conversation
        new_convo_res = supabase.table("conversations").insert({
            "item_id": item_id,
            "finder_id": finder_id,
            "claimant_id": claimant_id
        }).execute()

        if not new_convo_res.data:
            raise Exception("Failed to create conversation and get ID back.")

        return {"conversation_id": new_convo_res.data[0]['id']}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, user_id: str = Depends(get_current_user_id)):
    """
    Delete a conversation and all its messages.
    Only participants in the conversation can delete it.
    """
    try:
        # Verify user is a participant
        convo_res = supabase.table("conversations")\
            .select("id, finder_id, claimant_id")\
            .eq("id", conversation_id)\
            .single()\
            .execute()

        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        conversation = convo_res.data

        # Check authorization
        if user_id not in [conversation.get("finder_id"), conversation.get("claimant_id")]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation.")

        # Delete all messages in the conversation first
        messages_delete_res = supabase.table("messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        print(f"Deleted messages associated with conversation {conversation_id}")

        # Delete the conversation
        convo_delete_res = supabase.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .execute()

        return {"message": "Conversation deleted successfully."}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the conversation: {str(e)}")
