# """
# User Actions Router
# Handles secure user-initiated actions like deletions, updates, etc.
# All endpoints verify user ownership before allowing operations.
# """

# from fastapi import APIRouter, HTTPException, Depends, status, Request
# from pydantic import BaseModel
# from typing import Optional
# from app.dependencies import supabase

# router = APIRouter(prefix="/api", tags=["User Actions"])

# # ============= Helper Functions =============

# async def verify_user_token(authorization: str) -> str:
#     """Extract and verify user ID from JWT token"""
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Missing or invalid authorization header"
#         )
    
#     token = authorization.replace("Bearer ", "")
#     try:
#         user_response = supabase.auth.get_user(token)
#         if not user_response or not user_response.user:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token"
#             )
#         return user_response.user.id
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail=f"Authentication failed: {str(e)}"
#         )

# # ============= Badge Endpoints =============

# @router.get("/badges/user/{user_id}/badges")
# async def get_user_badges(user_id: str, authorization: str = Depends(lambda: None)):
#     """Get all badges for a user"""
#     try:
#         # Fetch user badges with badge details
#         response = supabase.table("user_badges")\
#             .select("*, badges(*)")\
#             .eq("user_id", user_id)\
#             .execute()
        
#         # Format the response
#         badges = []
#         for item in response.data:
#             badge_data = item.get("badges", {})
#             badges.append({
#                 "id": item.get("id"),
#                 "user_id": item.get("user_id"),
#                 "badge_id": item.get("badge_id"),
#                 "earned_at": item.get("earned_at"),
#                 "badge_name": badge_data.get("name"),
#                 "badge_description": badge_data.get("description"),
#                 "badge_icon_url": badge_data.get("icon_url"),
#                 "name": badge_data.get("name"),
#                 "description": badge_data.get("description"),
#                 "icon_url": badge_data.get("icon_url"),
#             })
        
#         return {"badges": badges}
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to fetch badges: {str(e)}"
#         )

# @router.delete("/badges/user/{user_id}/badges/{badge_id}")
# async def remove_user_badge(
#     user_id: str,
#     badge_id: str,  # Changed from int to str to accept UUID
#     request: Request
# ):
#     """Remove a badge from a user (user can only remove their own badges)"""
#     print(f"🗑️ DELETE badge request - user_id: {user_id}, badge_id: {badge_id}, type: {type(badge_id)}")
    
#     # Verify the requesting user
#     authorization = request.headers.get("authorization", "")
#     requesting_user_id = await verify_user_token(authorization)
#     print(f"🔐 Requesting user: {requesting_user_id}")
    
#     # Verify user is removing their own badge
#     if requesting_user_id != user_id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You can only remove your own badges"
#         )
    
#     try:
#         # Check if badge exists for this user
#         print(f"🔍 Checking if badge exists - badge_id: {badge_id}, user_id: {user_id}")
#         check_response = supabase.table("user_badges")\
#             .select("*")\
#             .eq("id", badge_id)\
#             .eq("user_id", user_id)\
#             .execute()
        
#         print(f"📊 Check response data: {check_response.data}")
        
#         if not check_response.data:
#             print(f"❌ Badge not found")
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Badge not found"
#             )
        
#         # Delete the badge
#         print(f"🗑️ Deleting badge...")
#         delete_response = supabase.table("user_badges")\
#             .delete()\
#             .eq("id", badge_id)\
#             .eq("user_id", user_id)\
#             .execute()
        
#         print(f"✅ Delete response: {delete_response}")
#         print(f"✅ Badge removed successfully")
        
#         return {"message": "Badge removed successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Exception in remove_user_badge: {str(e)}")
#         print(f"❌ Exception type: {type(e)}")
#         import traceback
#         print(f"❌ Traceback: {traceback.format_exc()}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to remove badge: {str(e)}"
#         )

# # ============= Notification Endpoints =============

# @router.delete("/notifications/{notification_id}")
# async def delete_notification(
#     notification_id: int,
#     request: Request
# ):
#     """Delete a notification (user can only delete their own notifications)"""
#     # Verify the requesting user
#     authorization = request.headers.get("authorization", "")
#     user_id = await verify_user_token(authorization)
    
#     try:
#         # Check if notification exists and belongs to user
#         check_response = supabase.table("notifications")\
#             .select("*")\
#             .eq("id", notification_id)\
#             .eq("recipient_id", user_id)\
#             .execute()
        
#         if not check_response.data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Notification not found"
#             )
        
#         # Delete the notification
#         supabase.table("notifications")\
#             .delete()\
#             .eq("id", notification_id)\
#             .eq("recipient_id", user_id)\
#             .execute()
        
#         return {"message": "Notification deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to delete notification: {str(e)}"
#         )

# # ============= Item/Post Endpoints =============

# @router.delete("/items/{item_id}")
# async def delete_item(
#     item_id: int,
#     request: Request
# ):
#     """Delete an item/post (user can only delete their own items)"""
#     # Verify the requesting user
#     authorization = request.headers.get("authorization", "")
#     user_id = await verify_user_token(authorization)
    
#     try:
#         # Check if item exists and belongs to user
#         check_response = supabase.table("items")\
#             .select("*")\
#             .eq("id", item_id)\
#             .eq("user_id", user_id)\
#             .execute()
        
#         if not check_response.data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Item not found or you don't have permission to delete it"
#             )
        
#         # Delete related records first (to avoid foreign key constraints)
#         # Delete claims
#         supabase.table("claims").delete().eq("item_id", item_id).execute()
        
#         # Delete notifications related to this item
#         supabase.table("notifications").delete().eq("link_to", f"/items/{item_id}").execute()
        
#         # Delete the item
#         supabase.table("items")\
#             .delete()\
#             .eq("id", item_id)\
#             .eq("user_id", user_id)\
#             .execute()
        
#         return {"message": "Item deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to delete item: {str(e)}"
#         )

# # ============= Conversation/Message Endpoints =============

# @router.delete("/conversations/{conversation_id}")
# async def delete_conversation(
#     conversation_id: int,
#     request: Request
# ):
#     """Delete a conversation (user can only delete conversations they're part of)"""
#     # Verify the requesting user
#     authorization = request.headers.get("authorization", "")
#     user_id = await verify_user_token(authorization)
    
#     try:
#         # Check if conversation exists and user is a participant
#         check_response = supabase.table("conversations")\
#             .select("*")\
#             .eq("id", conversation_id)\
#             .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")\
#             .execute()
        
#         if not check_response.data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Conversation not found or you don't have permission to delete it"
#             )
        
#         # Soft delete: Mark the conversation as deleted instead of removing it
#         # This allows admins to restore deleted chats
#         supabase.table("conversations")\
#             .update({"is_deleted": True})\
#             .eq("id", conversation_id)\
#             .execute()
        
#         return {"message": "Conversation deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to delete conversation: {str(e)}"
#         )

# @router.delete("/messages/{message_id}")
# async def delete_message(
#     message_id: int,
#     request: Request
# ):
#     """Delete a single message (user can only delete their own messages)"""
#     # Verify the requesting user
#     authorization = request.headers.get("authorization", "")
#     user_id = await verify_user_token(authorization)
    
#     try:
#         # Check if message exists and belongs to user
#         check_response = supabase.table("messages")\
#             .select("*")\
#             .eq("id", message_id)\
#             .eq("sender_id", user_id)\
#             .execute()
        
#         if not check_response.data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Message not found or you don't have permission to delete it"
#             )
        
#         # Delete the message
#         supabase.table("messages")\
#             .delete()\
#             .eq("id", message_id)\
#             .eq("sender_id", user_id)\
#             .execute()
        
#         return {"message": "Message deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to delete message: {str(e)}"
#         )


"""
User Actions Router
Handles secure user-initiated actions like deletions, updates, etc.
All endpoints verify user ownership before allowing operations.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional
from app.dependencies import supabase

router = APIRouter(prefix="/api", tags=["User Actions"])

# ============= Helper Functions =============

async def verify_user_token(authorization: str) -> str:
    """Extract and verify user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user_response.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

# ============= Badge Endpoints =============

@router.get("/badges/user/{user_id}/badges")
async def get_user_badges(user_id: str, authorization: str = Depends(lambda: None)):
    """Get all badges for a user"""
    try:
        # Fetch user badges with badge details
        response = supabase.table("user_badges")\
            .select("*, badges(*)")\
            .eq("user_id", user_id)\
            .execute()
        
        # Format the response
        badges = []
        for item in response.data:
            badge_data = item.get("badges", {})
            badges.append({
                "id": item.get("id"),
                "user_id": item.get("user_id"),
                "badge_id": item.get("badge_id"),
                "earned_at": item.get("earned_at"),
                "badge_name": badge_data.get("name"),
                "badge_description": badge_data.get("description"),
                "badge_icon_url": badge_data.get("icon_url"),
                "name": badge_data.get("name"),
                "description": badge_data.get("description"),
                "icon_url": badge_data.get("icon_url"),
            })
        
        return {"badges": badges}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch badges: {str(e)}"
        )

@router.delete("/badges/user/{user_id}/badges/{badge_id}")
async def remove_user_badge(
    user_id: str,
    badge_id: str,  # Changed from int to str to accept UUID
    request: Request
):
    """Remove a badge from a user (user can only remove their own badges)"""
    print(f"🗑️ DELETE badge request - user_id: {user_id}, badge_id: {badge_id}, type: {type(badge_id)}")
    
    # Verify the requesting user
    authorization = request.headers.get("authorization", "")
    requesting_user_id = await verify_user_token(authorization)
    print(f"🔐 Requesting user: {requesting_user_id}")
    
    # Verify user is removing their own badge
    if requesting_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only remove your own badges"
        )
    
    try:
        # Check if badge exists for this user
        print(f"🔍 Checking if badge exists - badge_id: {badge_id}, user_id: {user_id}")
        check_response = supabase.table("user_badges")\
            .select("*")\
            .eq("id", badge_id)\
            .eq("user_id", user_id)\
            .execute()
        
        print(f"📊 Check response data: {check_response.data}")
        
        if not check_response.data:
            print(f"❌ Badge not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        # Delete the badge
        print(f"🗑️ Deleting badge...")
        delete_response = supabase.table("user_badges")\
            .delete()\
            .eq("id", badge_id)\
            .eq("user_id", user_id)\
            .execute()
        
        print(f"✅ Delete response: {delete_response}")
        print(f"✅ Badge removed successfully")
        
        return {"message": "Badge removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception in remove_user_badge: {str(e)}")
        print(f"❌ Exception type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove badge: {str(e)}"
        )

# ============= Notification Endpoints =============

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    request: Request
):
    """Delete a notification (user can only delete their own notifications)"""
    # Verify the requesting user
    authorization = request.headers.get("authorization", "")
    user_id = await verify_user_token(authorization)
    
    try:
        # Check if notification exists and belongs to user
        check_response = supabase.table("notifications")\
            .select("*")\
            .eq("id", notification_id)\
            .eq("recipient_id", user_id)\
            .execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Delete the notification
        supabase.table("notifications")\
            .delete()\
            .eq("id", notification_id)\
            .eq("recipient_id", user_id)\
            .execute()
        
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete notification: {str(e)}"
        )

# ============= Item/Post Endpoints =============

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    request: Request
):
    """Delete an item/post (user can only delete their own items)"""
    # Verify the requesting user
    authorization = request.headers.get("authorization", "")
    user_id = await verify_user_token(authorization)
    
    try:
        # Check if item exists and belongs to user
        check_response = supabase.table("items")\
            .select("*")\
            .eq("id", item_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found or you don't have permission to delete it"
            )
        
        # Soft delete: Mark status as "deleted" instead of hard deleting
        # This allows admins to restore deleted posts via admin restore page
        supabase.table("items")\
            .update({"status": "deleted"})\
            .eq("id", item_id)\
            .eq("user_id", user_id)\
            .execute()
        
        print(f"🗑️ Item {item_id} soft deleted (status set to 'deleted')")
        return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete item: {str(e)}"
        )

# ============= Conversation/Message Endpoints =============

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    request: Request
):
    """Delete a conversation - hard delete since soft delete column doesn't exist"""
    # Verify the requesting user
    authorization = request.headers.get("authorization", "")
    user_id = await verify_user_token(authorization)
    
    print(f"🗑️ DELETE conversation request - conversation_id: {conversation_id}, user_id: {user_id}")
    
    try:
        # Check if conversation exists and user is a participant (finder_id or claimant_id)
        check_response = supabase.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        conv = check_response.data[0]
        finder_id = conv.get("finder_id")
        claimant_id = conv.get("claimant_id")
        
        print(f"🔍 Conversation found. finder_id: {finder_id}, claimant_id: {claimant_id}")
        
        # Verify user is one of the participants
        if user_id != finder_id and user_id != claimant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this conversation"
            )
        
        # Delete messages first
        print(f"🗑️ Deleting messages for conversation {conversation_id}...")
        supabase.table("messages")\
            .delete()\
            .eq("conversation_id", conversation_id)\
            .execute()
        
        # Then delete the conversation
        print(f"🗑️ Deleting conversation {conversation_id}...")
        supabase.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .execute()
        
        print(f"✅ Conversation {conversation_id} deleted successfully")
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception in delete_conversation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}"
        )

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    request: Request
):
    """Delete a single message (user can only delete their own messages)"""
    # Verify the requesting user
    authorization = request.headers.get("authorization", "")
    user_id = await verify_user_token(authorization)
    
    try:
        # Check if message exists and belongs to user
        check_response = supabase.table("messages")\
            .select("*")\
            .eq("id", message_id)\
            .eq("sender_id", user_id)\
            .execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or you don't have permission to delete it"
            )
        
        # Delete the message
        supabase.table("messages")\
            .delete()\
            .eq("id", message_id)\
            .eq("sender_id", user_id)\
            .execute()
        
        return {"message": "Message deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete message: {str(e)}"
        )
