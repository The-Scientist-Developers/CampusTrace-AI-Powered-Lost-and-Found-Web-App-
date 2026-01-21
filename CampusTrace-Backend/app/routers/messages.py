# """
# Messages and Conversations Router
# Handles messaging with strict pagination
# """

# from fastapi import APIRouter, Depends, HTTPException, Form
# from typing import Optional
# from app.dependencies import get_current_user_id, supabase

# router = APIRouter(prefix="/api", tags=["Messages"])


# @router.get("/conversations")
# async def get_conversations(
#     page: int = 1,
#     limit: int = 20,
#     sort_order: Optional[str] = "desc",
#     user_id: str = Depends(get_current_user_id)
# ):
#     """
#     Get paginated conversations for the current user with strict pagination.
#     Returns conversations where user is either finder or claimant.
#     Includes last message preview and unread count.
    
#     Query Parameters:
#     - page: Page number (default: 1)
#     - limit: Items per page (max: 20, default: 20)
#     - sort_order: 'asc' or 'desc' by updated_at (default: 'desc')
#     """
#     try:
#         # Enforce strict pagination limits
#         limit = min(limit, 20)
#         if limit < 1:
#             limit = 10
        
#         offset = (page - 1) * limit
        
#         # Select only necessary fields with related data
#         query = supabase.table("conversations").select(
#             """
#             id, item_id, finder_id, claimant_id, created_at, updated_at,
#             items(id, title, thumbnail_url, status),
#             finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
#             claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url)
#             """,
#             count="exact"
#         ).or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}")
        
#         # Apply backend sorting (fallback to created_at if updated_at doesn't exist)
#         desc = sort_order.lower() == "desc"
#         try:
#             query = query.order("updated_at", desc=desc)
#         except Exception:
#             # Fallback to created_at if updated_at column doesn't exist
#             query = query.order("created_at", desc=desc)
        
#         # Apply strict pagination
#         query = query.range(offset, offset + limit - 1)
        
#         result = query.execute()
        
#         # Enhance each conversation with last message and unread count
#         conversations = []
#         for convo in (result.data or []):
#             # Get last message
#             last_msg_res = supabase.table("messages").select(
#                 "id, content, created_at, sender_id"
#             ).eq("conversation_id", convo["id"]).order(
#                 "created_at", desc=True
#             ).limit(1).execute()
            
#             last_message = last_msg_res.data[0] if last_msg_res.data else None
            
#             # Get unread count for this user
#             unread_res = supabase.table("messages").select(
#                 "id", count="exact"
#             ).eq("conversation_id", convo["id"]).neq(
#                 "sender_id", user_id
#             ).eq("is_read", False).execute()
            
#             conversations.append({
#                 **convo,
#                 "last_message": last_message,
#                 "unread_count": unread_res.count or 0
#             })
        
#         total_items = result.count or 0
#         total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
        
#         return {
#             "conversations": conversations,
#             "pagination": {
#                 "current_page": page,
#                 "total_pages": total_pages,
#                 "total_items": total_items,
#                 "items_per_page": limit,
#                 "has_next": page < total_pages,
#                 "has_prev": page > 1
#             }
#         }
#     except Exception as e:
#         print(f"Error fetching conversations: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")


# @router.get("/conversations/{conversation_id}/messages")
# async def get_messages(
#     conversation_id: int,
#     page: int = 1,
#     limit: int = 50,
#     user_id: str = Depends(get_current_user_id)
# ):
#     """
#     Get paginated messages for a specific conversation with strict pagination.
#     Only participants can view messages.
    
#     Query Parameters:
#     - page: Page number (default: 1)
#     - limit: Items per page (max: 50, default: 50)
    
#     Note: Messages use higher limit (50) as they're smaller data objects
#     """
#     try:
#         # Verify user is a participant
#         convo_res = supabase.table("conversations").select(
#             "id, finder_id, claimant_id"
#         ).eq("id", conversation_id).single().execute()
        
#         if not convo_res.data:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         convo = convo_res.data
#         if user_id not in [convo["finder_id"], convo["claimant_id"]]:
#             raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
#         # Enforce strict pagination limits
#         limit = min(limit, 50)
#         if limit < 1:
#             limit = 20
        
#         offset = (page - 1) * limit
        
#         # Select only necessary fields
#         query = supabase.table("messages").select(
#             """
#             id, content, sender_id, created_at, is_read,
#             sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
#             """,
#             count="exact"
#         ).eq("conversation_id", conversation_id)
        
#         # Always sort by created_at ascending (oldest first) for chat display
#         query = query.order("created_at", desc=False)
        
#         # Apply strict pagination
#         query = query.range(offset, offset + limit - 1)
        
#         result = query.execute()
        
#         # Mark messages as read for the current user
#         try:
#             supabase.table("messages").update({
#                 "is_read": True
#             }).eq("conversation_id", conversation_id).neq(
#                 "sender_id", user_id
#             ).eq("is_read", False).execute()
#         except Exception as mark_read_error:
#             print(f"Error marking messages as read: {mark_read_error}")
        
#         total_items = result.count or 0
#         total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
        
#         return {
#             "messages": result.data or [],
#             "pagination": {
#                 "current_page": page,
#                 "total_pages": total_pages,
#                 "total_items": total_items,
#                 "items_per_page": limit,
#                 "has_next": page < total_pages,
#                 "has_prev": page > 1
#             }
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error fetching messages: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")


# @router.post("/conversations/{conversation_id}/messages")
# async def send_message(
#     conversation_id: int,
#     content: str = Form(...),
#     user_id: str = Depends(get_current_user_id)
# ):
#     """
#     Send a message in a conversation.
#     Only participants can send messages.
#     """
#     try:
#         # Verify user is a participant
#         convo_res = supabase.table("conversations").select(
#             "id, finder_id, claimant_id, item_id"
#         ).eq("id", conversation_id).single().execute()
        
#         if not convo_res.data:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         convo = convo_res.data
#         if user_id not in [convo["finder_id"], convo["claimant_id"]]:
#             raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")
        
#         # Create message
#         message_data = {
#             "conversation_id": conversation_id,
#             "sender_id": user_id,
#             "content": content.strip(),
#             "is_read": False
#         }
        
#         message_res = supabase.table("messages").insert(message_data).execute()
        
#         # Update conversation's updated_at timestamp (if column exists)
#         try:
#             supabase.table("conversations").update({
#                 "updated_at": "now()"
#             }).eq("id", conversation_id).execute()
#         except Exception as e:
#             # Column might not exist yet, skip update
#             print(f"Could not update conversation timestamp: {e}")
        
#         # Determine recipient
#         recipient_id = convo["claimant_id"] if user_id == convo["finder_id"] else convo["finder_id"]
        
#         # Get item details for notification
#         item_res = supabase.table("items").select(
#             "title, university_id"
#         ).eq("id", convo["item_id"]).single().execute()
        
#         if item_res.data:
#             # Create notification for recipient
#             from app.main import create_notification
#             create_notification(
#                 recipient_id=recipient_id,
#                 university_id=item_res.data["university_id"],
#                 message=f"New message about '{item_res.data['title']}'",
#                 link_to=f"/dashboard/messages/{conversation_id}",
#                 type="message"
#             )
        
#         return {
#             "message": "Message sent successfully",
#             "data": message_res.data[0] if message_res.data else None
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error sending message: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


# @router.get("/conversations/unread-count")
# async def get_unread_messages_count(user_id: str = Depends(get_current_user_id)):
#     """
#     Get total count of unread messages across all conversations.
#     Lightweight endpoint for badge display.
#     """
#     try:
#         # Get all conversations where user is a participant
#         convos_res = supabase.table("conversations").select(
#             "id"
#         ).or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}").execute()
        
#         if not convos_res.data:
#             return {"unread_count": 0}
        
#         conversation_ids = [c["id"] for c in convos_res.data]
        
#         # Count unread messages in these conversations (not sent by user)
#         unread_res = supabase.table("messages").select(
#             "id", count="exact"
#         ).in_("conversation_id", conversation_ids).neq(
#             "sender_id", user_id
#         ).eq("is_read", False).execute()
        
#         return {"unread_count": unread_res.count or 0}
#     except Exception as e:
#         print(f"Error fetching unread messages count: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")


# @router.delete("/conversations/{conversation_id}")
# async def delete_conversation(
#     conversation_id: int,
#     user_id: str = Depends(get_current_user_id)
# ):
#     """
#     Delete a conversation and all its messages. Only participants can delete.
#     """
#     try:
#         # Verify conversation exists and user is a participant
#         convo_res = supabase.table("conversations").select(
#             "id, finder_id, claimant_id"
#         ).eq("id", conversation_id).single().execute()
        
#         if not convo_res.data:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         convo = convo_res.data
        
#         if user_id not in [convo["finder_id"], convo["claimant_id"]]:
#             raise HTTPException(status_code=403, detail="You can only delete your own conversations")
        
#         # Delete all messages in the conversation first
#         supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
        
#         # Delete the conversation
#         supabase.table("conversations").delete().eq("id", conversation_id).execute()
        
#         return {"message": "Conversation deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting conversation: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")


"""
Messages and Conversations Router
Handles messaging with strict pagination
"""

from fastapi import APIRouter, Depends, HTTPException, Form
from typing import Optional
from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api", tags=["Messages"])


@router.get("/conversations")
async def get_conversations(
    page: int = 1,
    limit: int = 20,
    sort_order: Optional[str] = "desc",
    user_id: str = Depends(get_current_user_id)
):
    """
    Get paginated conversations for the current user with strict pagination.
    Returns conversations where user is either finder or claimant.
    Includes last message preview and unread count.
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (max: 20, default: 20)
    - sort_order: 'asc' or 'desc' by updated_at (default: 'desc')
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)
        if limit < 1:
            limit = 10
        
        offset = (page - 1) * limit
        
        # Select only necessary fields with related data
        query = supabase.table("conversations").select(
            """
            id, item_id, finder_id, claimant_id, created_at, updated_at,
            items(id, title, thumbnail_url, status),
            finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
            claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url)
            """,
            count="exact"
        ).or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}").eq("is_deleted", False)
        
        # Apply backend sorting (fallback to created_at if updated_at doesn't exist)
        desc = sort_order.lower() == "desc"
        try:
            query = query.order("updated_at", desc=desc)
        except Exception:
            # Fallback to created_at if updated_at column doesn't exist
            query = query.order("created_at", desc=desc)
        
        # Apply strict pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        # Enhance each conversation with last message and unread count
        conversations = []
        for convo in (result.data or []):
            # Get last message
            last_msg_res = supabase.table("messages").select(
                "id, content, created_at, sender_id"
            ).eq("conversation_id", convo["id"]).order(
                "created_at", desc=True
            ).limit(1).execute()
            
            last_message = last_msg_res.data[0] if last_msg_res.data else None
            
            # Get unread count for this user
            unread_res = supabase.table("messages").select(
                "id", count="exact"
            ).eq("conversation_id", convo["id"]).neq(
                "sender_id", user_id
            ).eq("is_read", False).execute()
            
            conversations.append({
                **convo,
                "last_message": last_message,
                "unread_count": unread_res.count or 0
            })
        
        total_items = result.count or 0
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
        
        return {
            "conversations": conversations,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items,
                "items_per_page": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    page: int = 1,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get paginated messages for a specific conversation with strict pagination.
    Only participants can view messages.
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (max: 50, default: 50)
    
    Note: Messages use higher limit (50) as they're smaller data objects
    """
    try:
        # Verify user is a participant
        convo_res = supabase.table("conversations").select(
            "id, finder_id, claimant_id"
        ).eq("id", conversation_id).single().execute()
        
        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        convo = convo_res.data
        if user_id not in [convo["finder_id"], convo["claimant_id"]]:
            raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
        # Enforce strict pagination limits
        limit = min(limit, 50)
        if limit < 1:
            limit = 20
        
        offset = (page - 1) * limit
        
        # Select only necessary fields
        query = supabase.table("messages").select(
            """
            id, content, sender_id, created_at, is_read,
            sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            """,
            count="exact"
        ).eq("conversation_id", conversation_id)
        
        # Always sort by created_at ascending (oldest first) for chat display
        query = query.order("created_at", desc=False)
        
        # Apply strict pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        # Mark messages as read for the current user
        try:
            supabase.table("messages").update({
                "is_read": True
            }).eq("conversation_id", conversation_id).neq(
                "sender_id", user_id
            ).eq("is_read", False).execute()
        except Exception as mark_read_error:
            print(f"Error marking messages as read: {mark_read_error}")
        
        total_items = result.count or 0
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
        
        return {
            "messages": result.data or [],
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items,
                "items_per_page": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    content: str = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Send a message in a conversation.
    Only participants can send messages.
    """
    try:
        # Verify user is a participant
        convo_res = supabase.table("conversations").select(
            "id, finder_id, claimant_id, item_id"
        ).eq("id", conversation_id).single().execute()
        
        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        convo = convo_res.data
        if user_id not in [convo["finder_id"], convo["claimant_id"]]:
            raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")
        
        # Create message
        message_data = {
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "content": content.strip(),
            "is_read": False
        }
        
        message_res = supabase.table("messages").insert(message_data).execute()
        
        # Update conversation's updated_at timestamp (if column exists)
        try:
            supabase.table("conversations").update({
                "updated_at": "now()"
            }).eq("id", conversation_id).execute()
        except Exception as e:
            # Column might not exist yet, skip update
            print(f"Could not update conversation timestamp: {e}")
        
        # Determine recipient
        recipient_id = convo["claimant_id"] if user_id == convo["finder_id"] else convo["finder_id"]
        
        # Get item details for notification
        item_res = supabase.table("items").select(
            "title, university_id"
        ).eq("id", convo["item_id"]).single().execute()
        
        if item_res.data:
            # Create notification for recipient
            from app.main import create_notification
            create_notification(
                recipient_id=recipient_id,
                university_id=item_res.data["university_id"],
                message=f"New message about '{item_res.data['title']}'",
                link_to=f"/dashboard/messages/{conversation_id}",
                type="message"
            )
        
        return {
            "message": "Message sent successfully",
            "data": message_res.data[0] if message_res.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.get("/conversations/unread-count")
async def get_unread_messages_count(user_id: str = Depends(get_current_user_id)):
    """
    Get total count of unread messages across all conversations.
    Lightweight endpoint for badge display.
    """
    try:
        # Get all conversations where user is a participant
        convos_res = supabase.table("conversations").select(
            "id"
        ).or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}").execute()
        
        if not convos_res.data:
            return {"unread_count": 0}
        
        conversation_ids = [c["id"] for c in convos_res.data]
        
        # Count unread messages in these conversations (not sent by user)
        unread_res = supabase.table("messages").select(
            "id", count="exact"
        ).in_("conversation_id", conversation_ids).neq(
            "sender_id", user_id
        ).eq("is_read", False).execute()
        
        return {"unread_count": unread_res.count or 0}
    except Exception as e:
        print(f"Error fetching unread messages count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a conversation - hard delete since soft delete column doesn't exist in DB
    """
    try:
        print(f"🗑️ DELETE /conversations/{conversation_id} from user {user_id}")
        
        # Verify conversation exists and user is a participant
        convo_res = supabase.table("conversations").select(
            "id, finder_id, claimant_id"
        ).eq("id", conversation_id).execute()
        
        if not convo_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        convo = convo_res.data[0]
        
        if user_id not in [convo["finder_id"], convo["claimant_id"]]:
            raise HTTPException(status_code=403, detail="You can only delete your own conversations")
        
        # Delete messages first
        print(f"🗑️ Deleting messages for conversation {conversation_id}...")
        supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
        
        # Delete the conversation
        print(f"🗑️ Deleting conversation {conversation_id}...")
        supabase.table("conversations").delete().eq("id", conversation_id).execute()
        print(f"✅ Conversation {conversation_id} deleted successfully")
        
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting conversation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")
