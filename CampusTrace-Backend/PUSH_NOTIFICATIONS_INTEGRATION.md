# Push Notifications Integration Guide

## ✅ What's Been Set Up

### 1. Push Notification Service (`app/push_notification_service.py`)

A complete service for sending push notifications via Expo's Push Notification API.

**Features:**

- Send single notifications
- Send batch notifications
- Helper methods for common notification types:
  - New messages
  - Item matches
  - Claim requests
  - Item status changes
  - Item found notifications

### 2. API Router (`app/routers/push_notifications.py`)

Test endpoints for push notifications:

- `POST /api/push/test` - Send a test notification
- `GET /api/push/status` - Check if user has push notifications enabled

### 3. Dependencies

- `httpx` - Already in requirements.txt ✅
- Push tokens stored in `profiles.push_token` column

## 🔧 How to Integrate

### Step 1: Add Push Notification Endpoints to main.py

Add these endpoints after your existing routers:

```python
# Push Notification Endpoints
@push_router.post("/test")
async def send_test_notification(
    title: str = "Test Notification",
    body: str = "This is a test notification from CampusTrace!",
    user_id: str = Depends(get_current_user_id)
):
    """Send a test push notification to the current user."""
    try:
        success = await PushNotificationService.notify_user(
            user_id=user_id,
            title=title,
            body=body,
            data={"type": "test", "url": "/dashboard"}
        )

        if success:
            return {"success": True, "message": "Test notification sent"}
        else:
            raise HTTPException(400, "Failed to send notification")
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@push_router.get("/status")
async def get_push_status(user_id: str = Depends(get_current_user_id)):
    """Check if user has push notifications enabled."""
    try:
        response = supabase.table("profiles").select("push_token").eq("id", user_id).single().execute()
        has_token = bool(response.data and response.data.get("push_token"))

        return {
            "enabled": has_token,
            "message": "Push notifications enabled" if has_token else "No push token"
        }
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")
```

### Step 2: Integrate into Existing Endpoints

#### Example 1: Send notification when new message is created

Find your message creation endpoint and add:

```python
# After creating a message in your conversations endpoint
await PushNotificationService.notify_new_message(
    recipient_id=recipient_user_id,
    sender_name=sender_name,
    message_preview=message_content,
    conversation_id=conversation_id
)
```

#### Example 2: Notify when item matches are found

In your item matching/search endpoint:

```python
# After finding a potential match
await PushNotificationService.notify_item_match(
    user_id=item_owner_id,
    item_title=item_title,
    match_type="found",  # or "lost"
    item_id=matched_item_id
)
```

#### Example 3: Notify when someone claims an item

In your claims endpoint:

```python
# After a claim is created
await PushNotificationService.notify_claim_request(
    owner_id=item_owner_id,
    claimer_name=claimer_full_name,
    item_title=item_title,
    item_id=item_id
)
```

#### Example 4: Notify when item status changes (admin approval/rejection)

In your admin moderation endpoint:

```python
# After updating item status
await PushNotificationService.notify_item_status_change(
    user_id=item_owner_id,
    item_title=item_title,
    new_status=new_status,  # "approved" or "rejected"
    item_id=item_id
)
```

### Step 3: Register the Router

At the end of main.py, before `if __name__ == "__main__":`, add:

```python
# Include all routers
app.include_router(auth_router)
app.include_router(public_router)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(profile_router)
app.include_router(onboarding_router)
app.include_router(notification_router)
app.include_router(claims_router)
app.include_router(conversations_router)
app.include_router(backup_router)
app.include_router(badges_router)
app.include_router(handover_router)
app.include_router(push_router)  # Add this line
```

## 📝 Database Schema

Make sure your `profiles` table has the `push_token` column:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
```

## 🧪 Testing

### 1. Test from Mobile App

1. Login to the mobile app
2. The app will automatically register for push notifications
3. Check the console logs to see if token was saved

### 2. Test from API

```bash
# Get your auth token first, then:
curl -X POST "http://localhost:8000/api/push/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "Hello from CampusTrace!"
  }'
```

### 3. Check Status

```bash
curl -X GET "http://localhost:8000/api/push/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment Checklist

- [x] Push notification service created
- [x] API endpoints created
- [x] Mobile app configured with EAS project ID
- [x] Mobile app registers push tokens
- [ ] Add push notification calls to your existing endpoints
- [ ] Test notifications in development
- [ ] Test notifications in production build
- [ ] Verify database has push_token column

## 📱 Mobile App Status

The mobile app is already configured and ready:

- ✅ Expo notifications package installed
- ✅ Push token registration implemented
- ✅ Notification handler configured
- ✅ EAS project ID configured
- ✅ Tokens saved to Supabase profiles table

## 🔍 Troubleshooting

### Notifications not received?

1. Check if user has a push token: `GET /api/push/status`
2. Check backend logs for errors
3. Verify the token format starts with `ExponentPushToken[`
4. Make sure the app is built with EAS (not Expo Go for production)

### Token not saving?

1. Check mobile app console logs
2. Verify Supabase connection
3. Check if profiles table has push_token column

### Expo Push API errors?

1. Check if token is valid
2. Verify EAS project ID matches
3. Check Expo dashboard for delivery status

## 📚 Additional Resources

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications) - Test notifications manually
- [Push Notification Status](https://status.expo.dev/) - Check Expo service status
