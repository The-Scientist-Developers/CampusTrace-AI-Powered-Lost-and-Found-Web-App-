@router.get("/admin/restorable-items")
async def get_restorable_items_old(current_user: str = Depends(get_current_user_id)):
    """DEPRECATED: Use /admin/restorable-items from routers/admin.py instead - Get all items with modified status (claimed/recovered)"""
    # This endpoint is deprecated - use the one from routers/admin.py which includes deleted posts
    raise HTTPException(status_code=410, detail="This endpoint is deprecated. Use /admin/restorable-items from the admin router.")


# @router.post("/admin/restore-item/{item_id}")
# async def restore_item_old(item_id: str, data: dict, current_user: str = Depends(get_current_user_id)):
#     """DEPRECATED: Use /admin/restore-item/{item_id} from routers/admin.py instead - Restore claimed or recovered items back to lost status"""
#     try:
#         item_type = data.get("item_type")
#         print(f"🔄 Restoring item {item_id} of type {item_type}")
#         
#         if item_type in ["marked_claimed", "recovered_item"]:
#             result = supabase.from_("items").update({"status": "lost"}).eq("id", item_id).execute()
#             print(f"✅ Item {item_id} restored successfully")
#         else:
#             print(f"⚠️ Unknown item type: {item_type}")
#         
#         return {"message": "Item restored successfully"}
#     except Exception as e:
#         print(f"❌ ERROR in restore_item: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# KEPT FOR REFERENCE - OLD IMPLEMENTATION BELOW
# Replaced with better version in routers/admin.py that includes deleted posts
"""
@router.get("/admin/restorable-items")
async def get_restorable_items(current_user: str = Depends(get_current_user_id)):
    \"\"\"Get all items with modified status (claimed/recovered)\"\"\"
    try:
        admin_university_id = get_admin_university_id(current_user)
        
        print(f"🔍 Fetching restorable items for university: {admin_university_id}")
        
        # Items marked as "claimed"
        try:
            claimed_items = supabase.from_("items").select(
                "id,title,description,status,created_at,user_id,profiles(full_name,email)"
            ).eq("university_id", admin_university_id).eq("status", "claimed").execute()
            print(f"✅ Claimed items found: {len(claimed_items.data or [])}")
        except Exception as e:
            print(f"❌ Error fetching claimed items: {e}")
            claimed_items = type('obj', (object,), {'data': []})()
        
        # Items marked as "recovered"
        try:
            recovered_items = supabase.from_("items").select(
                "id,title,description,status,created_at,user_id,profiles(full_name,email)"
            ).eq("university_id", admin_university_id).eq("status", "recovered").execute()
            print(f"✅ Recovered items found: {len(recovered_items.data or [])}")
        except Exception as e:
            print(f"❌ Error fetching recovered items: {e}")
            recovered_items = type('obj', (object,), {'data': []})()
        
        result = []
        
        # Process claimed items
        for item in (claimed_items.data or []):
            try:
                result.append({
                    "id": item["id"],
                    "type": "marked_claimed",
                    "title": item.get("title", "Untitled"),
                    "description": item.get("description", "No description"),
                    "marked_at": item.get("created_at"),
                    "user_info": item.get("profiles", {})
                })
            except Exception as e:
                print(f"Error processing claimed item {item.get('id')}: {e}")
        
        # Process recovered items
        for item in (recovered_items.data or []):
            try:
                result.append({
                    "id": item["id"],
                    "type": "recovered_item",
                    "title": item.get("title", "Untitled"),
                    "description": item.get("description", "No description"),
                    "marked_at": item.get("created_at"),
                    "user_info": item.get("profiles", {})
                })
            except Exception as e:
                print(f"Error processing recovered item {item.get('id')}: {e}")
        
        print(f"📊 Total restorable items: {len(result)}")
        return result
        
    except Exception as e:
        print(f"❌ ERROR in get_restorable_items: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/admin/restore-item/{item_id}")
async def restore_item(item_id: str, data: dict, current_user: str = Depends(get_current_user_id)):
    \"\"\"Restore claimed or recovered items back to lost status\"\"\"
    try:
        item_type = data.get("item_type")
        print(f"🔄 Restoring item {item_id} of type {item_type}")
        
        if item_type in ["marked_claimed", "recovered_item"]:
            result = supabase.from_("items").update({"status": "lost"}).eq("id", item_id).execute()
            print(f"✅ Item {item_id} restored successfully")
        else:
            print(f"⚠️ Unknown item type: {item_type}")
        
        return {"message": "Item restored successfully"}
    except Exception as e:
        print(f"❌ ERROR in restore_item: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
"""