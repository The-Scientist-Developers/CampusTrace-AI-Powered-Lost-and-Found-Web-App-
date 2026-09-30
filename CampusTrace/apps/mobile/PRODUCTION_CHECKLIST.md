# CampusTrace Mobile App - Production Checklist v1.0.0

## 📱 App Information

- **App Name**: CampusTrace
- **Package Name**: `app.campustrace.site`
- **Version**: 1.0.0
- **Platform**: Android (Google Play Store)
- **API URL**: https://campustrace-ai-powered-lost-and-found-bcho.onrender.com
- **Privacy Policy**: https://campustrace.site/privacy

---

## ✅ Pre-Build Checklist

### 1. Configuration Files

- [x] Updated `app.config.js` with production package name `app.campustrace.site`
- [x] Updated `eas.json` with production build configuration
- [x] Verified `package.json` version is 1.0.0
- [x] Added privacy policy URL to app.config.js
- [x] Configured Android permissions (CAMERA, STORAGE, NOTIFICATIONS)
- [x] Set up notification plugin configuration

### 2. Code Quality

- [x] Removed all debug console.log statements from LoginScreen.js
- [ ] Run linter to check for code quality issues
- [ ] Verify no hardcoded credentials or API keys in code
- [ ] Check all error handling is production-ready

### 3. Environment Variables

- [x] Production API URL configured in .env and eas.json
- [x] Supabase URL and keys configured
- [ ] Verify all environment variables are correct

### 4. Assets

- [ ] App icon (Icon.png) is optimized and high quality (1024x1024)
- [ ] Splash screen (splash-icon.png) is optimized
- [ ] Notification icon is prepared
- [ ] All images are compressed and optimized

### 5. Features Testing

- [ ] Login with university email works
- [ ] Login with public email (Gmail) works
- [ ] Registration with university email works
- [ ] Manual registration with ID photo works
- [ ] Password reset flow works
- [ ] All main features tested (Browse, Post, Messages, Profile)
- [ ] Push notifications work correctly
- [ ] Image upload works
- [ ] Camera capture works

### 6. Performance

- [ ] App loads quickly on low-end devices
- [ ] No memory leaks detected
- [ ] Images load efficiently
- [ ] Smooth scrolling in lists

---

## 🚀 Build Instructions

### Prerequisites

1. Install EAS CLI globally:

   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo account:

   ```bash
   eas login
   ```

3. Configure EAS project (if not already done):
   ```bash
   cd CampusTrace-AI-Powered-Lost-and-Found-Web-App-/CampusTrace/apps/mobile
   eas build:configure
   ```

### Build for Production

#### Option 1: Build AAB (App Bundle) for Play Store

```bash
cd CampusTrace-AI-Powered-Lost-and-Found-Web-App-/CampusTrace/apps/mobile
eas build --platform android --profile production
```

This will create an `.aab` file optimized for Play Store submission.

#### Option 2: Build APK for Testing/Sideloading

```bash
cd CampusTrace-AI-Powered-Lost-and-Found-Web-App-/CampusTrace/apps/mobile
eas build --platform android --profile sideload
```

This will create an `.apk` file for direct installation.

### Monitor Build Progress

- Check build status at: https://expo.dev/accounts/[your-account]/projects/campustrace-monorepo/builds
- Download the build artifact when complete

---

## 📦 Play Store Submission Requirements

### 1. App Bundle

- [x] AAB file built with production profile
- [ ] AAB file tested on multiple devices

### 2. Store Listing Assets

#### Screenshots (Required)

- [ ] At least 2 screenshots (up to 8 recommended)
- [ ] Minimum dimension: 320px
- [ ] Maximum dimension: 3840px
- [ ] Recommended: 1080x1920 (portrait) or 1920x1080 (landscape)

**Recommended Screenshots:**

1. Login/Registration screen
2. Dashboard with items
3. Browse items screen
4. Post item screen
5. Messages screen
6. Profile/Leaderboard screen

#### Feature Graphic (Required)

- [ ] Size: 1024 x 500 pixels
- [ ] Format: PNG or JPEG
- [ ] No transparency

#### App Icon (Required)

- [x] Size: 512 x 512 pixels
- [x] Format: PNG (32-bit)
- [x] Already configured in app.config.js

### 3. Store Listing Information

#### Short Description (80 characters max)

```
AI-powered lost and found platform for university campuses
```

#### Full Description (4000 characters max)

```
CampusTrace - Never Lose Track of Your Belongings Again!

🎓 DESIGNED FOR UNIVERSITY STUDENTS

CampusTrace is the ultimate lost and found solution for university campuses. Whether you've lost your keys, found a forgotten laptop, or want to help reunite items with their owners, CampusTrace makes it simple and rewarding.

✨ KEY FEATURES

📸 AI-Powered Matching
- Upload photos of lost or found items
- Our AI automatically matches lost items with found items
- Get instant notifications when there's a potential match

🏆 Gamification & Rewards
- Earn points for helping others
- Climb the leaderboard
- Unlock badges and achievements
- Build your reputation as a helpful community member

💬 Secure Messaging
- Chat directly with item owners/finders
- Coordinate safe handovers
- Keep your contact information private

🔍 Smart Search & Browse
- Filter by category, location, and date
- Search with keywords
- View detailed item descriptions and photos

🎯 Easy Item Posting
- Quick photo upload
- Auto-categorization
- Location tagging
- Status tracking (Lost/Found/Claimed)

🔔 Real-Time Notifications
- Get alerted about potential matches
- Receive messages instantly
- Stay updated on your items

🏫 University-Specific
- Connect with your campus community
- University-verified accounts
- Campus-specific locations

🔒 PRIVACY & SECURITY

- University email verification
- Secure authentication
- Private messaging system
- Safe handover coordination
- Privacy policy compliant

👥 COMMUNITY-DRIVEN

Join thousands of students helping each other recover lost items. Every item returned strengthens our campus community!

📱 PERFECT FOR

- Students who've lost items on campus
- Good Samaritans who find items
- Campus security and lost & found offices
- Anyone who wants to help their community

🌟 WHY CAMPUSTRACE?

Traditional lost and found systems are inefficient and hard to navigate. CampusTrace brings the process into the modern age with AI matching, gamification, and a user-friendly mobile experience.

Download CampusTrace today and never lose track of your belongings again!

---

Need help? Visit https://campustrace.site
Privacy Policy: https://campustrace.site/privacy
Terms of Service: https://campustrace.site/terms
```

#### Category

- **Primary**: Lifestyle or Social
- **Secondary**: Productivity

#### Content Rating

- Complete the content rating questionnaire
- Expected rating: Everyone or Teen

#### Contact Information

- [ ] Email address for support
- [ ] Privacy policy URL: https://campustrace.site/privacy
- [ ] Website URL: https://campustrace.site

### 4. App Content

#### Privacy Policy (Required)

- [x] URL: https://campustrace.site/privacy
- [x] Accessible and complete

#### Target Audience

- [ ] Select age groups (13+, 18+, etc.)
- [ ] Declare if app is designed for children

#### Permissions Justification

Prepare explanations for:

- **CAMERA**: To capture photos of lost/found items and university ID
- **READ_EXTERNAL_STORAGE**: To select photos from gallery for item posts
- **WRITE_EXTERNAL_STORAGE**: To save downloaded images
- **NOTIFICATIONS**: To alert users about matches and messages

---

## 🧪 Testing Before Submission

### Device Testing

- [ ] Test on Android 8.0+ devices
- [ ] Test on different screen sizes (phone, tablet)
- [ ] Test on low-end devices
- [ ] Test with slow internet connection

### Functionality Testing

- [ ] Complete user registration flow
- [ ] Login with different email types
- [ ] Post lost and found items
- [ ] Upload photos from camera and gallery
- [ ] Send and receive messages
- [ ] Receive push notifications
- [ ] Test all navigation flows
- [ ] Test dark mode

### Edge Cases

- [ ] No internet connection handling
- [ ] Invalid credentials
- [ ] Expired sessions
- [ ] Large image uploads
- [ ] Empty states

---

## 📋 Play Store Console Steps

1. **Create App**
   - Go to Google Play Console
   - Create new app
   - Fill in app details

2. **Upload App Bundle**
   - Go to Production → Releases
   - Create new release
   - Upload AAB file
   - Add release notes

3. **Complete Store Listing**
   - Add all required assets
   - Fill in descriptions
   - Set pricing (Free)
   - Select countries

4. **Content Rating**
   - Complete questionnaire
   - Get rating certificate

5. **App Content**
   - Privacy policy
   - Ads declaration (if applicable)
   - Target audience
   - Data safety

6. **Submit for Review**
   - Review all sections
   - Submit app for review
   - Wait for approval (typically 1-7 days)

---

## 🔄 Post-Launch

### Monitoring

- [ ] Monitor crash reports in Play Console
- [ ] Check user reviews and ratings
- [ ] Monitor app performance metrics
- [ ] Track download numbers

### Updates

- [ ] Plan regular updates
- [ ] Fix reported bugs
- [ ] Add requested features
- [ ] Keep dependencies updated

---

## 📞 Support

For build issues or questions:

- Check Expo documentation: https://docs.expo.dev
- EAS Build docs: https://docs.expo.dev/build/introduction/
- Play Store guidelines: https://play.google.com/console/about/guides/

---

## 🎉 Launch Checklist

Final checks before going live:

- [ ] All features working correctly
- [ ] No critical bugs
- [ ] Privacy policy accessible
- [ ] Support email set up
- [ ] Marketing materials ready
- [ ] Social media announcement prepared
- [ ] University partnerships confirmed

---

**Version**: 1.0.0  
**Last Updated**: April 26, 2026  
**Package**: app.campustrace.site
