"""
Push Notification Service for CampusTrace
Handles sending push notifications via Expo Push Notification API
"""
import httpx
import asyncio
from typing import List, Dict, Optional
from app.dependencies import supabase


class PushNotificationService:
    """Service for sending push notifications to mobile devices via Expo."""
    
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    @staticmethod
    async def send_notification(
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        priority: str = "high"
    ) -> Dict:
        """
        Send a single push notification.
        
        Args:
            push_token: Expo push token (starts with ExponentPushToken[...])
            title: Notification title
            body: Notification body text
            data: Optional data payload
            priority: Notification priority ('default', 'normal', 'high')
            
        Returns:
            Response from Expo push service
        """
        if not push_token or not push_token.startswith("ExponentPushToken["):
            print(f"Invalid push token format: {push_token}")
            return {"status": "error", "message": "Invalid token format"}
        
        message = {
            "to": push_token,
            "sound": "default",
            "title": title,
            "body": body,
            "priority": priority,
            "channelId": "default",
        }
        
        if data:
            message["data"] = data
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    PushNotificationService.EXPO_PUSH_URL,
                    json=message,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    timeout=10.0
                )
                
                result = response.json()
                
                if response.status_code == 200:
                    print(f"✅ Push notification sent successfully to {push_token[:20]}...")
                    return {"status": "success", "data": result}
                else:
                    print(f"❌ Failed to send push notification: {result}")
                    return {"status": "error", "data": result}
                    
        except Exception as e:
            print(f"❌ Error sending push notification: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def send_batch_notifications(messages: List[Dict]) -> List[Dict]:
        """
        Send multiple push notifications in batch.
        
        Args:
            messages: List of message dictionaries with 'to', 'title', 'body', etc.
            
        Returns:
            List of responses from Expo push service
        """
        if not messages:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    PushNotificationService.EXPO_PUSH_URL,
                    json=messages,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    timeout=30.0
                )
                
                result = response.json()
                print(f"✅ Batch push notifications sent: {len(messages)} messages")
                return result.get("data", [])
                
        except Exception as e:
            print(f"❌ Error sending batch push notifications: {str(e)}")
            return []
    
    @staticmethod
    async def notify_user(
        user_id: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> bool:
        """
        Send notification to a specific user by their user_id.
        
        Args:
            user_id: User's UUID
            title: Notification title
            body: Notification body
            data: Optional data payload
            
        Returns:
            True if notification was sent successfully
        """
        try:
            # Get user's push token from profiles table
            response = supabase.table("profiles").select("push_token").eq("id", user_id).single().execute()
            
            if not response.data or not response.data.get("push_token"):
                print(f"No push token found for user {user_id}")
                return False
            
            push_token = response.data["push_token"]
            result = await PushNotificationService.send_notification(
                push_token=push_token,
                title=title,
                body=body,
                data=data
            )
            
            return result.get("status") == "success"
            
        except Exception as e:
            print(f"Error notifying user {user_id}: {str(e)}")
            return False
    
    @staticmethod
    async def notify_new_message(
        recipient_id: str,
        sender_name: str,
        message_preview: str,
        conversation_id: str
    ):
        """Send notification for new message."""
        return await PushNotificationService.notify_user(
            user_id=recipient_id,
            title=f"New message from {sender_name}",
            body=message_preview[:100],
            data={
                "type": "message",
                "conversationId": conversation_id,
                "url": "/messages"
            }
        )
    
    @staticmethod
    async def notify_item_match(
        user_id: str,
        item_title: str,
        match_type: str,
        item_id: str
    ):
        """Send notification for potential item match."""
        return await PushNotificationService.notify_user(
            user_id=user_id,
            title="Potential Match Found! 🎯",
            body=f"We found a {match_type} item that matches your '{item_title}'",
            data={
                "type": "match",
                "itemId": item_id,
                "url": f"/items/{item_id}"
            }
        )
    
    @staticmethod
    async def notify_claim_request(
        owner_id: str,
        claimer_name: str,
        item_title: str,
        item_id: str
    ):
        """Send notification when someone claims an item."""
        return await PushNotificationService.notify_user(
            user_id=owner_id,
            title="Someone Claimed Your Item! 📦",
            body=f"{claimer_name} has claimed your '{item_title}'",
            data={
                "type": "claim",
                "itemId": item_id,
                "url": f"/items/{item_id}"
            }
        )
    
    @staticmethod
    async def notify_item_status_change(
        user_id: str,
        item_title: str,
        new_status: str,
        item_id: str
    ):
        """Send notification when item status changes (approved/rejected)."""
        status_emoji = "✅" if new_status == "approved" else "❌"
        return await PushNotificationService.notify_user(
            user_id=user_id,
            title=f"Item {new_status.title()} {status_emoji}",
            body=f"Your item '{item_title}' has been {new_status}",
            data={
                "type": "status_change",
                "itemId": item_id,
                "status": new_status,
                "url": f"/items/{item_id}"
            }
        )
    
    @staticmethod
    async def notify_item_found(
        user_id: str,
        item_title: str,
        finder_name: str,
        item_id: str
    ):
        """Send notification when someone reports finding a lost item."""
        return await PushNotificationService.notify_user(
            user_id=user_id,
            title="Your Item May Have Been Found! 🎉",
            body=f"{finder_name} may have found your '{item_title}'",
            data={
                "type": "found",
                "itemId": item_id,
                "url": f"/items/{item_id}"
            }
        )


# Convenience function for easy import
async def send_push_notification(user_id: str, title: str, body: str, data: Optional[Dict] = None):
    """Quick helper to send a push notification to a user."""
    return await PushNotificationService.notify_user(user_id, title, body, data)
