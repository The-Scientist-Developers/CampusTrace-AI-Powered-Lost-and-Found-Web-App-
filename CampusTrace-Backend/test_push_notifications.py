#!/usr/bin/env python3
"""
Test Push Notifications Script
Run this to test if push notifications are working correctly
"""

import asyncio
import sys
from app.push_notification_service import PushNotificationService
from app.dependencies import supabase


async def test_push_notifications():
    """Test push notification system."""
    
    print("🔔 Testing Push Notification System")
    print("=" * 50)
    
    # Test 1: Check if users have push tokens
    print("\n1️⃣  Checking for registered push tokens...")
    try:
        response = supabase.table("profiles").select("id, email, push_token").limit(5).execute()
        
        users_with_tokens = [u for u in response.data if u.get("push_token")]
        
        if users_with_tokens:
            print(f"✅ Found {len(users_with_tokens)} users with push tokens")
            for user in users_with_tokens:
                token_preview = user["push_token"][:30] + "..." if user["push_token"] else "None"
                print(f"   - {user['email']}: {token_preview}")
        else:
            print("❌ No users with push tokens found")
            print("   Make sure users have logged into the mobile app")
            return False
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False
    
    # Test 2: Send test notification
    if users_with_tokens:
        print("\n2️⃣  Sending test notification...")
        test_user = users_with_tokens[0]
        
        try:
            success = await PushNotificationService.notify_user(
                user_id=test_user["id"],
                title="🎉 Test Notification",
                body="If you see this, push notifications are working!",
                data={"type": "test", "timestamp": str(asyncio.get_event_loop().time())}
            )
            
            if success:
                print(f"✅ Test notification sent to {test_user['email']}")
                print("   Check the mobile device for the notification")
            else:
                print(f"❌ Failed to send notification to {test_user['email']}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending notification: {e}")
            return False
    
    # Test 3: Verify Expo API connectivity
    print("\n3️⃣  Testing Expo Push API connectivity...")
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("https://exp.host/--/api/v2/push/getReceipts", timeout=5.0)
            if response.status_code in [200, 400]:  # 400 is ok, means API is reachable
                print("✅ Expo Push API is reachable")
            else:
                print(f"⚠️  Unexpected response from Expo API: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach Expo Push API: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("✅ All tests passed!")
    print("\nNext steps:")
    print("1. Check the mobile device for the test notification")
    print("2. If received, push notifications are working correctly")
    print("3. If not received, check:")
    print("   - Device has internet connection")
    print("   - Notifications are enabled in device settings")
    print("   - Using production build (not Expo Go)")
    print("=" * 50)
    
    return True


async def send_custom_test(user_email: str, title: str, body: str):
    """Send a custom test notification to a specific user."""
    
    print(f"\n📤 Sending custom notification to {user_email}...")
    
    try:
        # Get user by email
        response = supabase.table("profiles").select("id, push_token").eq("email", user_email).single().execute()
        
        if not response.data:
            print(f"❌ User not found: {user_email}")
            return False
        
        if not response.data.get("push_token"):
            print(f"❌ User has no push token registered")
            return False
        
        # Send notification
        success = await PushNotificationService.notify_user(
            user_id=response.data["id"],
            title=title,
            body=body,
            data={"type": "custom_test"}
        )
        
        if success:
            print(f"✅ Notification sent successfully")
        else:
            print(f"❌ Failed to send notification")
        
        return success
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Main entry point."""
    
    if len(sys.argv) > 1:
        # Custom test mode
        if len(sys.argv) < 4:
            print("Usage: python test_push_notifications.py <email> <title> <body>")
            print("Example: python test_push_notifications.py user@example.com 'Hello' 'Test message'")
            sys.exit(1)
        
        email = sys.argv[1]
        title = sys.argv[2]
        body = sys.argv[3]
        
        asyncio.run(send_custom_test(email, title, body))
    else:
        # Run full test suite
        asyncio.run(test_push_notifications())


if __name__ == "__main__":
    main()
