# 🚀 Complete Push Notifications Deployment Guide

This guide ensures push notifications work properly when deployed to production.

## 📋 Pre-Deployment Checklist

### ✅ Step 1: Database Setup (Supabase)

1. **Add push_token column to profiles table**

Go to your Supabase SQL Editor and run:

```sql
-- Add push_token column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON profiles(push_token)
WHERE push_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.push_token IS 'Expo push notification token for mobile app';
```

2. **Verify the column exists**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'push_token';
```

You should see: `push_token | text`

---

### ✅ Step 2: Backend Deployment (Python/FastAPI)

1. **Verify all files are in place:**

   - ✅ `app/push_notification_service.py`
   - ✅ `app/main.py` (with push notification imports and endpoints)
   - ✅ `requirements.txt` (has `httpx`)

2. **Deploy your backend to Render/Railway/etc.**

3. **Test the endpoints after deployment:**

```bash
# Replace with your production URL
BACKEND_URL="https://your-backend.onrender.com"

# Test push notification status (requires auth token)
curl -X GET "$BACKEND_URL/api/push/status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Should return: {"enabled": false, "message": "No push token registered"}
# This is normal before mobile app registers
```

---

### ✅ Step 3: Mobile App Build & Deployment

#### 3.1 Verify EAS Configuration

Check `apps/mobile/app.config.js`:

```javascript
extra: {
  eas: {
    projectId: "8d3dfad3-5b4f-4fea-ab86-59762edd8083"; // ✅ Already set
  }
}
```

#### 3.2 Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

#### 3.3 Login to Expo

```bash
eas login
```

#### 3.4 Configure EAS Build (if first time)

```bash
cd apps/mobile
eas build:configure
```

This will:

- Link your project to Expo
- Set up build profiles
- Configure credentials

#### 3.5 Build for Android

**For Testing (Internal Distribution):**

```bash
eas build --platform android --profile preview
```

**For Production (Google Play Store):**

```bash
eas build --platform android --profile production
```

**For iOS:**

```bash
eas build --platform ios --profile production
```

#### 3.6 Wait for Build to Complete

- Check build status: https://expo.dev/accounts/[your-account]/projects/campustrace-monorepo/builds
- Download the APK/AAB when ready
- Or submit directly to stores: `eas submit --platform android`

---

### ✅ Step 4: Testing Push Notifications

#### 4.1 Install Production Build

1. Download the built APK from Expo
2. Install on a physical device (not emulator for best results)
3. **Important:** Push notifications don't work reliably in Expo Go - you MUST use a production build

#### 4.2 Test Token Registration

1. **Open the app and login**
2. **Check if token was registered:**

```bash
# In your Supabase SQL Editor
SELECT id, email, push_token
FROM profiles
WHERE push_token IS NOT NULL
LIMIT 5;
```

You should see tokens like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

#### 4.3 Send Test Notification

**Method 1: Using your API**

```bash
# Get your auth token from the app (login response)
AUTH_TOKEN="your_jwt_token_here"
BACKEND_URL="https://your-backend.onrender.com"

# Send test notification
curl -X POST "$BACKEND_URL/api/push/test?title=Hello&body=Testing%20notifications" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Method 2: Using Expo's Push Notification Tool**

1. Go to: https://expo.dev/notifications
2. Copy a push token from your database
3. Paste it in the tool
4. Send a test notification

**Method 3: Using Python Script**

Create `test_push.py`:

```python
import requests

# Get token from your database
PUSH_TOKEN = "ExponentPushToken[your-token-here]"

response = requests.post(
    "https://exp.host/--/api/v2/push/send",
    json={
        "to": PUSH_TOKEN,
        "title": "Test Notification",
        "body": "Hello from CampusTrace!",
        "sound": "default",
        "priority": "high"
    }
)

print(response.json())
```

Run: `python test_push.py`

---

### ✅ Step 5: Integrate Notifications into Your App

Now that everything works, add notifications to your endpoints. Here are the most important ones:

#### 5.1 New Message Notifications

Find your message creation endpoint in `main.py` and add:

```python
# After creating a message
await PushNotificationService.notify_new_message(
    recipient_id=recipient_user_id,
    sender_name=sender_name,
    message_preview=message_content[:100],
    conversation_id=conversation_id
)
```

#### 5.2 Item Match Notifications

When your AI finds a potential match:

```python
await PushNotificationService.notify_item_match(
    user_id=item_owner_id,
    item_title=item_title,
    match_type="found",
    item_id=matched_item_id
)
```

#### 5.3 Claim Notifications

When someone claims an item:

```python
await PushNotificationService.notify_claim_request(
    owner_id=item_owner_id,
    claimer_name=claimer_name,
    item_title=item_title,
    item_id=item_id
)
```

#### 5.4 Admin Approval/Rejection

When admin approves or rejects an item:

```python
await PushNotificationService.notify_item_status_change(
    user_id=item_owner_id,
    item_title=item_title,
    new_status="approved",  # or "rejected"
    item_id=item_id
)
```

---

## 🔍 Troubleshooting

### Problem: No push token in database

**Solution:**

1. Make sure you're using a production build (not Expo Go)
2. Check mobile app console logs for errors
3. Verify user is logged in
4. Check if permissions were granted

### Problem: Notifications not received

**Checklist:**

- [ ] Using production build (not Expo Go)
- [ ] Push token exists in database
- [ ] Token format is correct: `ExponentPushToken[...]`
- [ ] Device has internet connection
- [ ] Notifications are enabled in device settings
- [ ] Backend logs show "✅ Push notification sent successfully"

**Debug:**

```bash
# Check if token is valid
curl -X GET "https://your-backend.com/api/push/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Try Expo's tool: https://expo.dev/notifications
```

### Problem: Token format error

**Symptoms:** Backend logs show "Invalid push token format"

**Solution:**

- Token must start with `ExponentPushToken[`
- Check if token was saved correctly in database
- Re-login to the app to refresh token

### Problem: Expo API returns error

**Common errors:**

1. **"DeviceNotRegistered"**

   - Token is invalid or expired
   - User uninstalled the app
   - Solution: User needs to login again

2. **"MessageTooBig"**

   - Notification payload is too large
   - Solution: Reduce message body length

3. **"MessageRateExceeded"**
   - Sending too many notifications
   - Solution: Implement rate limiting

---

## 📊 Monitoring & Maintenance

### Check Notification Delivery

1. **Expo Dashboard**

   - Visit: https://expo.dev/accounts/[your-account]/projects/campustrace-monorepo
   - Check "Push Notifications" tab
   - View delivery statistics

2. **Backend Logs**

   - Look for: "✅ Push notification sent successfully"
   - Or: "❌ Failed to send push notification"

3. **Database Query**

```sql
-- Count users with push tokens
SELECT COUNT(*) as users_with_notifications
FROM profiles
WHERE push_token IS NOT NULL;

-- Find users without tokens
SELECT id, email, created_at
FROM profiles
WHERE push_token IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Regular Maintenance

1. **Clean up invalid tokens** (monthly)

```sql
-- Remove tokens that haven't been updated in 90 days
UPDATE profiles
SET push_token = NULL
WHERE push_token IS NOT NULL
AND updated_at < NOW() - INTERVAL '90 days';
```

2. **Monitor delivery rates**
   - Check Expo dashboard weekly
   - Aim for >95% delivery rate

---

## 🎯 Production Deployment Checklist

Before going live, verify:

- [ ] Database migration completed (push_token column exists)
- [ ] Backend deployed with push notification code
- [ ] Mobile app built with EAS (production profile)
- [ ] Test notification sent and received successfully
- [ ] Push tokens being saved to database
- [ ] Backend logs show successful sends
- [ ] Notifications integrated into key endpoints:
  - [ ] New messages
  - [ ] Item matches
  - [ ] Claims
  - [ ] Admin actions
- [ ] Tested on both Android and iOS (if applicable)
- [ ] Monitoring set up (Expo dashboard)

---

## 📱 User Experience

### What Users Will See

1. **First Time:**

   - App requests notification permission
   - User grants permission
   - Token registered automatically

2. **When Notification Arrives:**

   - Sound plays (if enabled)
   - Notification appears in tray
   - Tapping opens the app to relevant screen

3. **Settings:**
   - Users can disable notifications in device settings
   - App will still work normally

---

## 🆘 Need Help?

### Resources

- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Expo Push Tool: https://expo.dev/notifications
- Expo Status: https://status.expo.dev/

### Common Commands

```bash
# Check EAS build status
eas build:list

# View build logs
eas build:view [build-id]

# Submit to stores
eas submit --platform android

# Check project info
eas project:info
```

---

## ✅ Success Criteria

Your push notifications are working correctly when:

1. ✅ Users can receive test notifications
2. ✅ Tokens are being saved to database
3. ✅ Backend logs show successful sends
4. ✅ Notifications appear on devices
5. ✅ Tapping notifications navigates correctly
6. ✅ No errors in Expo dashboard

**You're ready for production! 🎉**
