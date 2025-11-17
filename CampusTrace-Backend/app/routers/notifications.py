"""
Notifications Router
Handles user notifications with strict pagination
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    type: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    user_id: str = Depends(get_current_user_id)
):
    """
    Get paginated notifications for the current user with strict pagination.
    Supports backend filtering by status and type.
    Returns only necessary fields (10-20 notifications max per page).
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (max: 20, default: 20)
    - status: Filter by status ('read', 'unread', or None for all)
    - type: Filter by notification type (optional)
    - sort_order: 'asc' or 'desc' (default: 'desc')
    """
    try:
        # Enforce strict pagination limits
        limit = min(limit, 20)
        if limit < 1:
            limit = 10
        
        offset = (page - 1) * limit
        
        # Select only necessary fields
        query = supabase.table("notifications").select(
            "id, message, type, status, link_to, created_at",
            count="exact"
        ).eq("recipient_id", user_id)
        
        # Apply backend filters
        if status and status in ["read", "unread"]:
            query = query.eq("status", status)
        if type:
            query = query.eq("type", type)
        
        # Apply backend sorting (always by created_at)
        desc = sort_order.lower() == "desc"
        query = query.order("created_at", desc=desc)
        
        # Apply strict pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total_items = result.count or 0
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
        
        return {
            "notifications": result.data or [],
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
        print(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.get("/unread-count")
async def get_unread_count(user_id: str = Depends(get_current_user_id)):
    """
    Get count of unread notifications for the current user.
    Lightweight endpoint for badge display.
    """
    try:
        result = supabase.table("notifications").select(
            "id", count="exact"
        ).eq("recipient_id", user_id).eq("status", "unread").execute()
        
        return {"unread_count": result.count or 0}
    except Exception as e:
        print(f"Error fetching unread count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch unread count: {str(e)}")


@router.put("/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark a specific notification as read.
    Only the recipient can mark their own notifications.
    """
    try:
        # Verify ownership
        check_res = supabase.table("notifications").select("id").eq(
            "id", notification_id
        ).eq("recipient_id", user_id).execute()
        
        if not check_res.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Update status
        supabase.table("notifications").update({
            "status": "read"
        }).eq("id", notification_id).execute()
        
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update notification: {str(e)}")


@router.put("/mark-all-read")
async def mark_all_notifications_read(user_id: str = Depends(get_current_user_id)):
    """
    Mark all unread notifications as read for the current user.
    """
    try:
        supabase.table("notifications").update({
            "status": "read"
        }).eq("recipient_id", user_id).eq("status", "unread").execute()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update notifications: {str(e)}")
