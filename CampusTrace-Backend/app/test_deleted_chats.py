#!/usr/bin/env python3
"""
Test script to verify deleted conversations appear in admin restore page
"""
import httpx
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

BASE_URL = "http://localhost:8000"

async def test_deleted_chats():
    """Test if deleted chats are returned from admin endpoint"""
    
    # You'll need to get a valid admin token - replace with actual admin user's token
    # For now, this is a template for testing
    
    async with httpx.AsyncClient() as client:
        try:
            # Test the admin endpoint directly
            response = await client.get(
                f"{BASE_URL}/admin/restorable-items",
                headers={
                    "Authorization": "Bearer YOUR_ADMIN_TOKEN_HERE"
                }
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                deleted_chats = [i for i in items if i["type"] == "deleted_chat"]
                print(f"\n✅ Total items: {len(items)}")
                print(f"✅ Deleted chats: {len(deleted_chats)}")
                print(f"Deleted chats data: {deleted_chats}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("Starting deleted chats test...")
    print("NOTE: Replace YOUR_ADMIN_TOKEN_HERE with actual admin token")
    asyncio.run(test_deleted_chats())
