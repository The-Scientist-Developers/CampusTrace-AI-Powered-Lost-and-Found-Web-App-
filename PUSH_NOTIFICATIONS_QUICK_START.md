# 🚀 Push Notifications - Quick Start Guide

## For Users Who Want It to "Just Work" in Production

Follow these exact steps to get push notifications working in your deployed app.

---

## Step 1: Database Setup (2 minutes)

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor**
3. Paste this and click **Run**:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;
```

✅ **Done!** Your database is ready.

---

## Step 2: Deploy Backend (5 minutes)

Your backend code is already ready! Just deploy it:

### If using Render:

1. Push your code to GitHub
2. Render will auto-deploy
3. Wait for deployment to complete

### If using Railway:

1. Push your code to GitHub
2. Railway will auto-deploy
3. Wait for deployment to complete

### Verify it's working:

```bash
curl https://your-backend-url.com/api/push/status
```

Should return: `{"detail":"Not authenticated"}` (this is good - means endpoint exists)

✅ **Done!** Backend is deployed.

---

## Step 3: Build Mobile App (10 minutes)

### 3.1 Install EAS CLI (one-time setup)

```bash
npm install -g eas-cli
eas login
```

### 3.2 Build the App

```bash
cd apps/mobile

# For Android
eas build --platform android --profile production

# For iOS (if you have Apple Developer account)
eas build --platform ios --profile production
```

### 3.3 Wait for Build

- Build takes 10-20 minutes
- Check status at: https://expo.dev
- You'll get an email when done

### 3.4 Download & Install

1. Download the APK/IPA from Expo dashboard
2. Install on your phone
3. **Important:** Don't use Expo Go - use the production build!

✅ **Done!** App is built and installed.

---

## Step 4: Test It (2 minutes)

### 4.1 Login to the App

- Open the app on your phone
- Login with your account
- App will automatically register for push notifications

### 4.2 Verify Token Was Saved

Go to Supabase SQL Editor and run:

```sql
SELECT email, push_token FROM profiles WHERE push_token IS NOT NULL LIMIT 5;
```

You should see tokens like: `ExponentPushToken[xxxxxx...]`

### 4.3 Send Test Notification

**Option A: Using Expo's Tool (Easiest)**

1. Go to: https://expo.dev/notifications
2. Copy your push token from the database
3. Paste it and send a test notification
4. Check your phone!

**Option B: Using Backend API**

```bash
# Get your auth token by logging into the app
# Then run:
curl -X POST "https://your-backend-url.com/api/push/test?title=Hello&body=Testing" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Option C: Using Python Script**

```bash
cd CampusTrace-Backend
python test_push_notifications.py
```

✅ **Done!** If you received the notification, everything works!

---

## Step 5: Enable Automatic Notifications (Optional)

To send notifications automatically when events happen, add these to your backend endpoints:

### When someone sends a message:

```python
await PushNotificationService.notify_new_message(
    recipient_id=recipient_id,
    sender_name=sender_name,
    message_preview=message_text,
    conversation_id=conversation_id
)
```

### When item matches are found:

```python
await PushNotificationService.notify_item_match(
    user_id=owner_id,
    item_title=item_title,
    match_type="found",
    item_id=item_id
)
```

### When someone claims an item:

```python
await PushNotificationService.notify_claim_request(
    owner_id=owner_id,
    claimer_name=claimer_name,
    item_title=item_title,
    item_id=item_id
)
```

See `INTEGRATION_EXAMPLES.py` for complete code.

---

## 🎯 That's It!

Your push notifications are now working in production!

### What Happens Now:

1. ✅ Users login → Token automatically registered
2. ✅ Backend sends notification → User receives it
3. ✅ User taps notification → App opens to relevant screen

---

## 🐛 Troubleshooting

### "I don't see any push tokens in the database"

**Fix:**

- Make sure you're using the **production build** (not Expo Go)
- Check if user granted notification permissions
- Try logging out and back in

### "Notifications not received"

**Checklist:**

- [ ] Using production build? (not Expo Go)
- [ ] Push token exists in database?
- [ ] Device has internet?
- [ ] Notifications enabled in phone settings?

**Test with Expo's tool:** https://expo.dev/notifications

### "Backend returns 'Invalid token format'"

**Fix:**

- Token must start with `ExponentPushToken[`
- Re-login to the app to get a fresh token

---

## 📊 Monitoring

### Check Delivery Status

- Expo Dashboard: https://expo.dev/accounts/[your-account]/projects/campustrace-monorepo
- Backend logs: Look for "✅ Push notification sent successfully"

### Count Active Users

```sql
SELECT COUNT(*) FROM profiles WHERE push_token IS NOT NULL;
```

---

## 🆘 Still Having Issues?

1. **Check Expo Status:** https://status.expo.dev/
2. **View Build Logs:** `eas build:list` then `eas build:view [build-id]`
3. **Test Backend:** `curl https://your-backend-url.com/api/push/status`
4. **Run Test Script:** `python test_push_notifications.py`

---

## ✅ Success Checklist

- [ ] Database has push_token column
- [ ] Backend deployed with push notification code
- [ ] Mobile app built with EAS (production profile)
- [ ] App installed on device
- [ ] User logged in
- [ ] Push token appears in database
- [ ] Test notification received

**All checked? You're done! 🎉**

---

## 📚 Additional Resources

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE_PUSH_NOTIFICATIONS.md`
- **Integration Examples:** `INTEGRATION_EXAMPLES.py`
- **Backend Service:** `app/push_notification_service.py`
- **Expo Docs:** https://docs.expo.dev/push-notifications/overview/

---

## 🚀 Deploy Commands Reference

```bash
# Backend
git push origin main  # Auto-deploys on Render/Railway

# Mobile App
cd apps/mobile
eas build --platform android --profile production
eas submit --platform android  # Submit to Play Store

# Test
python test_push_notifications.py
curl https://your-backend-url.com/api/push/test
```

**That's everything you need! Good luck with your deployment! 🎉**
