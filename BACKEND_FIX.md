# Backend Fix: Added GET /api/items/{id} Endpoint

## Issue

The HandoverScreen (both mobile and web) was trying to fetch item details using `GET /api/items/{id}`, but this endpoint didn't exist, resulting in:

```
INFO: 127.0.0.1:50466 - "GET /api/items/131 HTTP/1.1" 405 Method Not Allowed
```

## Solution

Added a new GET endpoint to fetch a single item by ID.

## File Modified

`CampusTrace-Backend/app/routers/items.py`

## Endpoint Details

### Route

```
GET /api/items/{item_id}
```

### Purpose

Fetch a single item's details by ID. Used by HandoverScreen to determine:

- Item status (pending handover vs pending recovery)
- Item owner (user_id)
- Whether current user should generate or verify code

### Parameters

- `item_id` (path parameter): The ID of the item to fetch
- `user_id` (dependency): Current authenticated user ID

### Response

```json
{
  "id": 131,
  "title": "Black Wallet",
  "description": "Found near library",
  "status": "pending recovery",
  "category": "Accessories",
  "location": "Library 2nd floor",
  "contact_info": "555-1234",
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "created_at": "2024-01-15T10:30:00",
  "user_id": "uuid-here",
  "university_id": 1,
  "moderation_status": "approved",
  "profiles": {
    "id": "uuid-here",
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Security

- Verifies user belongs to same university as the item
- Returns 403 if user tries to access item from different university
- Returns 404 if item doesn't exist

### Error Responses

- `404`: Item not found or user profile not found
- `403`: Access denied (different university)
- `500`: Server error

## Why This Was Needed

The HandoverScreen needs to know:

1. **Item status**: Is it `pending handover` or `pending recovery`?
2. **Item owner**: Who posted the item (user_id)?

This information determines:

- **pending recovery** (Lost item): Owner generates code, Finder enters code
- **pending handover** (Found item): Claimant generates code, Owner enters code

Without this endpoint, the HandoverScreen couldn't determine who should generate vs verify the code.

## Testing

### Test the Endpoint

```bash
# Get item details
curl -X GET "http://localhost:8000/api/items/131" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Behavior

1. HandoverScreen loads without errors
2. Correct person sees "Generate Code" button
3. Correct person sees "Enter Code" input
4. No more 405 Method Not Allowed errors

## Impact

- ✅ Fixes HandoverScreen loading issues
- ✅ Enables proper code generation logic
- ✅ No breaking changes to existing functionality
- ✅ Secure (university-scoped access)

## Related Files

- `CampusTrace/apps/mobile/src/screens/main/HandoverScreen.js`
- `CampusTrace/apps/web/src/features/UserDashboard/Pages/HandoverPage.jsx`

Both files call this endpoint in their `fetchItemAndUserData()` function.
