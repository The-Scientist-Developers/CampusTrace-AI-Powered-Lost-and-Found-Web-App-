# Deleted Conversations Fix - Verification Guide

## Changes Made

### 1. Backend Fix: user_actions.py DELETE /api/conversations/{conversation_id}
**File:** `app/routers/user_actions.py` (Lines 537-591)

**What was wrong:**
- Was checking for `user1_id` and `user2_id` fields that don't exist
- Conversations table uses `finder_id` and `claimant_id`
- `.or_()` syntax wasn't working properly

**What was fixed:**
- Now fetches conversation first
- Extracts `finder_id` and `claimant_id`
- Verifies user is one of these two participants
- Then properly soft-deletes with `is_deleted = True`

**Code:**
```python
@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    request: Request
):
    """Delete a conversation (user can only delete conversations they're part of)"""
    authorization = request.headers.get("authorization", "")
    user_id = await verify_user_token(authorization)
    
    print(f"🗑️ DELETE conversation request - conversation_id: {conversation_id}, user_id: {user_id}")
    
    try:
        # Check if conversation exists
        check_response = supabase.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .execute()
        
        if not check_response.data:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
        
        conv = check_response.data[0]
        finder_id = conv.get("finder_id")
        claimant_id = conv.get("claimant_id")
        
        # Verify user is one of the participants
        if user_id != finder_id and user_id != claimant_id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this conversation"
            )
        
        # Soft delete
        print(f"🗑️ Soft-deleting conversation {conversation_id}...")
        supabase.table("conversations")\
            .update({"is_deleted": True})\
            .eq("id", conversation_id)\
            .execute()
        
        print(f"✅ Conversation {conversation_id} soft deleted successfully")
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception in delete_conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete conversation: {str(e)}"
        )
```

### 2. Backend Fix: admin.py GET /admin/restorable-items - Deleted Chat Fetching
**File:** `app/routers/admin.py` (Lines 1025-1070)

**What was changed:**
- Now properly fetches conversations with `is_deleted = True`
- Instead of doing a join that might not work, does separate queries:
  1. Gets all conversations where `is_deleted = True`
  2. For each conversation, fetches the item separately
  3. Checks if item's university matches admin's university
  4. Gets the finder profile for display

**Key Code:**
```python
# Get all conversations with is_deleted = True
all_conversations = (
    supabase.table("conversations")
    .select("id,item_id,finder_id,claimant_id,created_at,is_deleted")
    .eq("is_deleted", True)
    .execute()
)

print(f"✅ All deleted conversations found: {len(all_conversations.data or [])}")

# For each deleted conversation, fetch the item details
for chat in all_conversations.data or []:
    try:
        item_id = chat.get("item_id")
        print(f"🔍 Processing deleted chat {chat['id']}, item_id: {item_id}")
        
        # Fetch item details to verify university
        if item_id:
            item_res = (
                supabase.table("items")
                .select("title,description,university_id")
                .eq("id", item_id)
                .single()
                .execute()
            )
            item_info = item_res.data if item_res.data else {}
            
            if item_info.get("university_id") == admin_university_id:
                # Get finder profile
                finder_res = supabase.table("profiles").select("full_name,email").eq("id", chat.get("finder_id")).single().execute()
                finder_info = finder_res.data if finder_res.data else {}
                
                result.append({
                    "id": chat["id"],
                    "type": "deleted_chat",
                    "title": item_info.get("title", "Chat"),
                    "description": item_info.get("description", "Deleted conversation"),
                    "created_at": chat.get("created_at"),
                    "user_info": finder_info
                })
                print(f"✅ Added deleted chat {chat['id']} from item {item_id}")
    except Exception as chat_err:
        print(f"⚠️ Error processing chat {chat.get('id')}: {chat_err}")
```

### 3. Backend Fix: app/main.py - Make resend import optional
**File:** `app/main.py` (Lines 17-19)

**What was changed:**
- Made resend import optional so backend doesn't crash if package isn't installed
- Added try/except block with warning message

**Code:**
```python
try:
    import resend
except ImportError:
    resend = None
    print("⚠️ Warning: resend module not installed, email features may be unavailable")
```

## How to Test

### Step 1: Start Backend
Open PowerShell and run:
```powershell
cd 'c:\Users\Jericho Mico\Documents\GitHub\CampusTrace-AI-Powered-Lost-and-Found-Web-App-\CampusTrace-Backend'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Navigate to Messages Page
1. Go to the user dashboard
2. Click on "Messages" 
3. You should see conversations

### Step 3: Delete a Conversation
1. Click the trash icon on a conversation
2. Confirm deletion in the modal
3. Should see "Conversation deleted" toast

### Step 4: Go to Admin Restore Page
1. Go to Admin Dashboard
2. Click "Restore Items"
3. Look for the "Deleted Chats" card (yellow)
4. Should show "1" or more conversations
5. The deleted conversation should appear in the list below

### Step 5: Click Refresh
1. If it doesn't show immediately, click the "Refresh" button
2. Should now show the deleted conversation

## Verification Checklist

- [ ] Backend starts without `ModuleNotFoundError: No module named 'resend'`
- [ ] Can delete a conversation from Messages page
- [ ] Toast shows "Conversation deleted successfully"
- [ ] Can see "Deleted Chats" card on Admin Restore page showing count
- [ ] Deleted conversation appears in the restored items list
- [ ] Can restore the deleted conversation
- [ ] After restore, conversation no longer shows in Deleted Chats

## Database Schema Assumptions

The fix assumes the database has:

**conversations table:**
- `id` - primary key
- `item_id` - foreign key to items
- `finder_id` - user ID of finder
- `claimant_id` - user ID of claimant
- `created_at` - timestamp
- `is_deleted` - boolean (soft delete flag)

**items table:**
- `id` - primary key
- `title` - string
- `description` - string
- `university_id` - to filter by admin's university

**profiles table:**
- `id` - user ID
- `full_name` - user name
- `email` - user email

## Logs to Check

When deleting a conversation, you should see in backend console:
```
🗑️ DELETE conversation request - conversation_id: <id>, user_id: <user_id>
🗑️ Soft-deleting conversation <id>...
✅ Conversation <id> soft deleted successfully
```

When fetching admin restore page, you should see:
```
🔍 Fetching deleted conversations (is_deleted=True)...
✅ All deleted conversations found: <count>
🔍 Processing deleted chat <chat_id>, item_id: <item_id>
✅ Added deleted chat <chat_id> from item <item_id>
```

## If Still Not Working

1. **Check backend is running**: Go to http://localhost:8000/docs - should see Swagger UI
2. **Check frontend is calling correct endpoint**: Open browser DevTools, Network tab, delete a conversation - should see DELETE request to `/api/conversations/{id}`
3. **Check admin endpoint returns data**: In DevTools Network tab, go to admin restore page, look for request to `/admin/restorable-items` - should have `deleted_chat` items in response
4. **Check database has `is_deleted` column**: The query will fail if column doesn't exist
5. **Check frontend filtering**: The adminRestorePage.jsx should filter items where `type === "deleted_chat"`
