# Handover Flow Testing Guide

## Complete Flow for "Found" Items

### Step 1: Create a Found Item

- User A posts a "Found" item
- Item status: `"Found"`
- Item moderation_status: `"approved"` (after admin approval)

### Step 2: Submit a Claim

- User B submits a claim on the item
- Claim status: `"pending"`

### Step 3: Approve the Claim

**Endpoint:** `PUT /api/claims/{claim_id}/respond`
**Body:** `{ "approved": true }`
**What happens:**

- Claim status → `"approved"`
- **Item status → `"pending handover"`** ✅ (This is the key change!)
- Conversation created between User A (finder) and User B (claimant)

### Step 4: Generate Handover Code (Claimant)

**Endpoint:** `POST /api/handover/items/{item_id}/start-handover`
**Who:** User B (the claimant who got their claim approved)
**What happens:**

- Generates a 4-digit code
- Creates handover record in database
- Item status remains `"pending handover"`

**Requirements:**

- Item status must be: `"Found"`, `"pending handover"`, or `"Pending Handover"` ✅
- Must have an approved claim for this item ✅
- Only the approved claimant can generate the code ✅

### Step 5: Verify Handover Code (Finder)

**Endpoint:** `POST /api/handover/items/{item_id}/verify-handover`
**Body:** `{ "code": "1234" }`
**Who:** User A (the finder who posted the item)
**What happens:**

- Verifies the code matches
- Item status → `"recovered"`
- Claim status remains `"approved"` (item status indicates completion)
- Finder gets credit (returns_count++)

**Requirements:**

- Must have an active handover code ✅
- Only the finder (item poster) can verify ✅
- Code must match and not be expired ✅

## Troubleshooting

### Error: "Item status invalid for handover start"

**Cause:** Item status is not one of: `"Found"`, `"pending handover"`, `"Pending Handover"`

**Common reasons:**

- Item is already "recovered" (handover already completed - use a fresh item)
- Item status is "Lost" but you're trying the Found item flow
- Claim hasn't been approved yet

**Solution:** Use a fresh item with an approved claim, or check the item's current status in the database

### Error: "No approved claim found for this item"

**Cause:** No claim with status `"approved"` exists for this item
**Solution:** Approve a claim first using `/api/claims/{claim_id}/respond`

### Error: "Only the approved claimant can generate the code"

**Cause:** Wrong user trying to generate code
**Solution:** The claimant (User B) must generate the code, not the finder

### Error: "No active handover code found"

**Cause:** No handover record exists in the database
**Solution:** The claimant must generate a code first (Step 4)

### Error: "Only the item poster (finder) can verify the code"

**Cause:** Wrong user trying to verify
**Solution:** The finder (User A) must verify the code, not the claimant

## Database Schema

### items table

- `status`: `"Found"` → `"pending handover"` → `"recovered"`
- `moderation_status`: Used for admin approval, separate from handover flow

### claims table

- `status`: `"pending"` → `"approved"` (stays approved after handover)
- Valid statuses: `"pending"`, `"approved"`, `"rejected"` only

### handovers table

- `item_id`: Reference to item
- `code`: 4-digit verification code
- `claimant_id`: User who generated the code
- `verified`: Boolean flag
- `expires_at`: 24 hours from creation

## Key Changes Made

1. **Backend (handover.py):**

   - Now explicitly accepts `"pending handover"` status ✅
   - Fixed database constraint violation: Claims stay as "approved" (not "resolved") ✅
   - Removed dependency on `moderation_status = "pending_return"` ✅
   - Added debug logging for troubleshooting ✅

2. **Backend (claims.py):**

   - Sets `status = "pending handover"` when claim is approved ✅

3. **Frontend (Web & Mobile):**
   - Updated to check `status` field instead of `moderation_status` ✅
   - Added "pending handover" status badge styling ✅
   - Updated queries to include items with "pending handover" status ✅

## Testing Checklist

- [ ] Create a Found item
- [ ] Submit a claim on the item
- [ ] Approve the claim (verify item status becomes "pending handover")
- [ ] Claimant generates handover code
- [ ] Finder verifies the code
- [ ] Verify item status becomes "recovered"
- [ ] Verify claim status remains "approved"
- [ ] Verify finder gets credit (returns_count incremented)
