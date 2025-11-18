from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user_id, supabase
from app.push_notification_service import PushNotificationService

router = APIRouter(prefix="/api/push", tags=["Push Notifications"])


@router.post("/test")
async def send_test_push_notification(
    title: str = "Test Notification",
    body: str = "This is a test notification from CampusTrace!",
    user_id: str = Depends(get_current_user_id),
):
    """
    Send a test push notification to the current user.
    Useful for testing if push notifications are working.
    """
    try:
        success = await PushNotificationService.notify_user(
            user_id=user_id,
            title=title,
            body=body,
            data={"type": "test", "url": "/dashboard"},
        )

        if success:
            return {"success": True, "message": "Test notification sent successfully"}
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to send notification. Make sure you have a valid push token registered.",
            )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error sending test notification: {str(e)}"
        )


@router.get("/status")
async def get_push_notification_status(
    user_id: str = Depends(get_current_user_id),
):
    """
    Check if the current user has push notifications enabled.
    Returns whether a push token is registered.
    """
    try:
        response = (
            supabase.table("profiles")
            .select("push_token")
            .eq("id", user_id)
            .single()
            .execute()
        )

        has_token = bool(response.data and response.data.get("push_token"))

        return {
            "enabled": has_token,
            "message": "Push notifications are enabled"
            if has_token
            else "No push token registered",
            "token_preview": response.data.get("push_token")[:30] + "..."
            if has_token
            else None,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking push notification status: {str(e)}",
        )
