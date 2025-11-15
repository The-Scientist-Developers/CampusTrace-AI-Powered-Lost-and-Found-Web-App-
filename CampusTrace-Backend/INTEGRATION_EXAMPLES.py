"""
Push Notification Integration Examples
Copy these examples into your existing endpoints in main.py
"""

# ============================================
# Example 1: Notify on New Message
# ============================================
# Add this to your message creation endpoint (conversations_router)

@conversations_router.post("/{conversation_id}/messages")
async def create_message(
    conversation_id: str,
    message_content: str,
    user_id: str = Depends(get_current_user_id)
):
    # ... your existing message creation code ...
    
    # Get recipient user ID (the other person in the conversation)
    conversation = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    recipient_id = conversation.data["user1_id"] if conversation.data["user2_id"] == user_id else conversation.data["user2_id"]
    
    # Get sender name
    sender = supabase.table("profiles").select("full_name").eq("id", user_id).single().execute()
    sender_name = sender.data["full_name"]
    
    # Send push notification
    await PushNotificationService.notify_new_message(
        recipient_id=recipient_id,
        sender_name=sender_name,
        message_preview=message_content[:100],  # First 100 chars
        conversation_id=conversation_id
    )
    
    return {"success": True, "message": "Message sent"}


# ============================================
# Example 2: Notify on Item Match
# ============================================
# Add this to your item search/matching endpoint

@item_router.post("/search")
async def search_items(
    search_query: str,
    user_id: str = Depends(get_current_user_id)
):
    # ... your existing search/matching code ...
    
    # If you find a potential match
    if potential_match_found:
        # Get the user who posted the original item
        original_item = supabase.table("items").select("*").eq("id", original_item_id).single().execute()
        owner_id = original_item.data["user_id"]
        
        # Send notification
        await PushNotificationService.notify_item_match(
            user_id=owner_id,
            item_title=original_item.data["title"],
            match_type="found",  # or "lost"
            item_id=matched_item_id
        )
    
    return {"matches": matches}


# ============================================
# Example 3: Notify on Claim Request
# ============================================
# Add this to your claims creation endpoint

@claims_router.post("/")
async def create_claim(
    claim: ClaimCreate,
    user_id: str = Depends(get_current_user_id)
):
    # ... your existing claim creation code ...
    
    # Get item details
    item = supabase.table("items").select("*").eq("id", claim.item_id).single().execute()
    owner_id = item.data["user_id"]
    
    # Get claimer name
    claimer = supabase.table("profiles").select("full_name").eq("id", user_id).single().execute()
    claimer_name = claimer.data["full_name"]
    
    # Send notification to item owner
    await PushNotificationService.notify_claim_request(
        owner_id=owner_id,
        claimer_name=claimer_name,
        item_title=item.data["title"],
        item_id=claim.item_id
    )
    
    return {"success": True, "claim_id": new_claim_id}


# ============================================
# Example 4: Notify on Item Status Change (Admin)
# ============================================
# Add this to your admin moderation endpoint

@admin_router.patch("/items/{item_id}/status")
async def update_item_status(
    item_id: int,
    status_update: StatusUpdate,
    admin_id: str = Depends(get_current_user_id)
):
    # ... your existing status update code ...
    
    # Get item and owner details
    item = supabase.table("items").select("*").eq("id", item_id).single().execute()
    owner_id = item.data["user_id"]
    
    # Send notification to item owner
    await PushNotificationService.notify_item_status_change(
        user_id=owner_id,
        item_title=item.data["title"],
        new_status=status_update.moderation_status,
        item_id=item_id
    )
    
    return {"success": True, "new_status": status_update.moderation_status}


# ============================================
# Example 5: Notify When Item is Found
# ============================================
# Add this when someone reports finding a lost item

@item_router.post("/report-found")
async def report_item_found(
    lost_item_id: int,
    found_item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    # ... your existing code ...
    
    # Get lost item owner
    lost_item = supabase.table("items").select("*").eq("id", lost_item_id).single().execute()
    owner_id = lost_item.data["user_id"]
    
    # Get finder name
    finder = supabase.table("profiles").select("full_name").eq("id", user_id).single().execute()
    finder_name = finder.data["full_name"]
    
    # Send notification
    await PushNotificationService.notify_item_found(
        user_id=owner_id,
        item_title=lost_item.data["title"],
        finder_name=finder_name,
        item_id=found_item_id
    )
    
    return {"success": True}


# ============================================
# Example 6: Custom Notification
# ============================================
# For any custom notification needs

async def send_custom_notification_example(user_id: str):
    """Send a custom notification with any content."""
    await PushNotificationService.notify_user(
        user_id=user_id,
        title="Custom Title",
        body="Custom message body",
        data={
            "type": "custom",
            "customField": "customValue",
            "url": "/custom-page"
        }
    )


# ============================================
# Example 7: Batch Notifications
# ============================================
# Send notifications to multiple users at once

async def notify_multiple_users_example():
    """Send the same notification to multiple users."""
    user_ids = ["user1_id", "user2_id", "user3_id"]
    
    # Get all push tokens
    response = supabase.table("profiles").select("id, push_token").in_("id", user_ids).execute()
    
    # Build messages
    messages = []
    for profile in response.data:
        if profile.get("push_token"):
            messages.append({
                "to": profile["push_token"],
                "sound": "default",
                "title": "Announcement",
                "body": "Important update for all users!",
                "data": {"type": "announcement"}
            })
    
    # Send batch
    results = await PushNotificationService.send_batch_notifications(messages)
    return results
