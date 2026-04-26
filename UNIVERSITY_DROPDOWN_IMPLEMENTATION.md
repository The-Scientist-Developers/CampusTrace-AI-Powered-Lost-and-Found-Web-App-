# University Dropdown Implementation

## Requirements

1. Add university dropdown to login AND signup screens (both mobile and web)
2. Show specific error messages like "Your email is not registered in {University Name}"
3. Validate email domain against selected university

## Changes Needed

### Mobile App (`LoginScreen.js`)

- ✅ Already has university dropdown for manual registration
- ❌ Need to add university dropdown for regular login/signup
- ❌ Need to add email domain validation
- ❌ Need to improve error messages

### Web App (Login/Signup pages)

- ❌ Need to add university dropdown
- ❌ Need to add email domain validation
- ❌ Need to improve error messages

### Backend

- ❌ Need to update auth endpoints to accept university_id
- ❌ Need to validate email domain against university
- ❌ Need to return specific error messages

## Implementation Plan

1. **Backend Changes** (Priority 1)
   - Update `/api/auth/signup-mobile` to accept `university_id`
   - Update `/api/auth/login` to accept `university_id`
   - Add email domain validation
   - Return specific error messages

2. **Mobile Changes** (Priority 2)
   - Add university dropdown to regular login/signup
   - Update API calls to include university_id
   - Handle new error messages

3. **Web Changes** (Priority 3)
   - Add university dropdown component
   - Update login/signup forms
   - Handle new error messages

## Error Messages to Implement

- "Your email domain '{domain}' is not registered with {University Name}"
- "Please select the correct university for your email address"
- "Your account is registered with {University Name}, not {Selected University}"
