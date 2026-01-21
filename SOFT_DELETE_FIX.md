# Soft Delete Fix for Deleted Chats in Admin Restore Panel

## Problem
When users deleted a chat in the message panel, it was being completely removed from the database. The admin restore feature expected deleted chats to still exist in the database with `is_deleted = True`, but couldn't find them because they were being hard-deleted.

## Root Cause
Two delete endpoints were **hard-deleting** conversations:
1. `DELETE /api/conversations/{conversation_id}` in `routers/messages.py` (lines 621-654)
2. `DELETE /conversations/{conversation_id}` in `routers/user_actions.py` (lines 231-280)

Both endpoints were executing:
```python
supabase.table("conversations").delete().eq("id", conversation_id).execute()
```

## Solution: Soft Delete Pattern
Changed both endpoints to use **soft delete** (mark as deleted instead of removing):

### 1. Updated `routers/messages.py` (DELETE endpoint)
```python
# OLD: supabase.table("conversations").delete().eq("id", conversation_id).execute()
# NEW: Set is_deleted flag instead of hard-deleting
supabase.table("conversations").update({"is_deleted": True}).eq("id", conversation_id).execute()
```

### 2. Updated `routers/user_actions.py` (DELETE endpoint)
```python
# OLD: supabase.table("conversations").delete().eq("id", conversation_id).execute()
# NEW: Set is_deleted flag instead of hard-deleting
supabase.table("conversations").update({"is_deleted": True}).eq("id", conversation_id).execute()
```

### 3. Updated `routers/messages.py` (GET endpoint)
Added filter to exclude soft-deleted conversations from user's normal chat view:
```python
# Before:
.or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}")

# After:
.or_(f"finder_id.eq.{user_id},claimant_id.eq.{user_id}").eq("is_deleted", False)
```

## How It Works

### When User Deletes a Chat:
1. Chat is marked as deleted: `is_deleted = True`
2. Chat is hidden from user's conversation list (filtered out by the GET endpoint)
3. Chat remains in database for admin recovery

### Admin Restore Panel:
1. Backend `GET /admin/restorable-items` queries conversations with `is_deleted = True`
2. Displays them in restore UI with yellow "deleted_chat" badge
3. Admin clicks "Restore" → sets `is_deleted = False`
4. Chat reappears in both users' conversation lists

### Admin Restore Endpoint:
```python
elif item_type == "deleted_chat":
    supabase.table("conversations").update({"is_deleted": False}).eq("id", item_id).execute()
```

## Files Modified
1. `CampusTrace-Backend/app/routers/messages.py`
   - Line ~621-654: Delete endpoint updated to soft delete
   - Line ~369: GET conversations filter updated to exclude deleted

2. `CampusTrace-Backend/app/routers/user_actions.py`
   - Line ~231-280: Delete endpoint updated to soft delete

## Database Schema Requirement
The `conversations` table must have an `is_deleted` boolean column (nullable, default False).
If missing, it should be added via Supabase:
```sql
ALTER TABLE conversations ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

## Testing Checklist
- [ ] User deletes a chat in message panel
- [ ] Chat disappears from user's conversation list
- [ ] Chat appears in admin restore panel with yellow badge
- [ ] Chat title and related item info display correctly
- [ ] Admin clicks "Restore" button
- [ ] Chat reappears in both users' conversation lists
- [ ] No error messages in backend console

## Benefits
✅ Deleted chats can now be restored by admins  
✅ Users can still delete chats from their view  
✅ Data retention for compliance/audit purposes  
✅ Consistent with other soft-deleted items (deleted_post, marked_claimed, recovered_item)
