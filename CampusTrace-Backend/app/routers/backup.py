from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import traceback
import json
import io
from datetime import datetime

from app.dependencies import get_admin_university_id, supabase

router = APIRouter(prefix="/api/backup", tags=["Backup & Restore"])


@router.post("/create")
async def create_backup(university_id: int = Depends(get_admin_university_id)):
    """
    Create a complete backup of all data for the admin's university.
    Only includes data associated with their university_id.
    """
    try:
        backup_data = {}

        # Tables that have direct university_id foreign key
        tenant_tables = [
            "profiles",
            "items",
            "allowed_domains",
            "site_settings",
            "user_verifications",
            "notifications",
        ]

        # Fetch data from all tenant tables
        for table in tenant_tables:
            try:
                result = (
                    supabase.table(table)
                    .select("*")
                    .eq("university_id", university_id)
                    .execute()
                )
                backup_data[table] = result.data if result.data else []
            except Exception as e:
                print(f"Error fetching {table}: {e}")
                backup_data[table] = []

        # Get all item_ids from this university's items
        item_ids = [
            item["id"] for item in backup_data.get("items", []) if "id" in item
        ]

        # Fetch related claims
        if item_ids:
            try:
                claims_result = (
                    supabase.table("claims")
                    .select("*")
                    .in_("item_id", item_ids)
                    .execute()
                )
                backup_data["claims"] = claims_result.data if claims_result.data else []
            except Exception as e:
                print(f"Error fetching claims: {e}")
                backup_data["claims"] = []
        else:
            backup_data["claims"] = []

        # Fetch related conversations
        if item_ids:
            try:
                conversations_result = (
                    supabase.table("conversations")
                    .select("*")
                    .in_("item_id", item_ids)
                    .execute()
                )
                backup_data["conversations"] = (
                    conversations_result.data if conversations_result.data else []
                )
            except Exception as e:
                print(f"Error fetching conversations: {e}")
                backup_data["conversations"] = []
        else:
            backup_data["conversations"] = []

        # Get all conversation_ids from the fetched conversations
        convo_ids = [
            convo["id"]
            for convo in backup_data.get("conversations", [])
            if "id" in convo
        ]

        # Fetch related messages
        if convo_ids:
            try:
                messages_result = (
                    supabase.table("messages")
                    .select("*")
                    .in_("conversation_id", convo_ids)
                    .execute()
                )
                backup_data["messages"] = (
                    messages_result.data if messages_result.data else []
                )
            except Exception as e:
                print(f"Error fetching messages: {e}")
                backup_data["messages"] = []
        else:
            backup_data["messages"] = []

        # Serialize to JSON
        json_data = json.dumps(backup_data, indent=2, default=str)

        # Create in-memory file
        file_io = io.BytesIO(json_data.encode("utf-8"))

        # Generate timestamp and storage path
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        storage_path = f"university_{university_id}/backup_{timestamp}.json"

        # Upload to Supabase storage
        try:
            supabase.storage.from_("backups").upload(
                path=storage_path,
                file=file_io.getvalue(),
                file_options={"content-type": "application/json"},
            )
        except Exception as e:
            print(f"Error uploading to storage: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to upload backup: {str(e)}"
            )

        return {
            "message": "Backup created successfully",
            "file_name": f"backup_{timestamp}.json",
            "storage_path": storage_path,
            "timestamp": timestamp,
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.get("/list")
async def list_backups(university_id: int = Depends(get_admin_university_id)):
    """
    List all available backups for the admin's university.
    """
    try:
        # List files in the university's folder
        folder_path = f"university_{university_id}"

        try:
            result = supabase.storage.from_("backups").list(folder_path)
        except Exception as e:
            print(f"Error listing backups: {e}")
            # If folder doesn't exist yet, return empty list
            return {"backups": []}

        # Sort by name (timestamp) in descending order
        if result:
            sorted_backups = sorted(result, key=lambda x: x.get("name", ""), reverse=True)
            return {"backups": sorted_backups}

        return {"backups": []}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.get("/download/{file_name}")
async def download_backup(
    file_name: str, university_id: int = Depends(get_admin_university_id)
):
    """
    Download a specific backup file.
    Includes security check to prevent path traversal attacks.
    """
    try:
        # Construct the storage path
        storage_path = f"university_{university_id}/{file_name}"

        # Security check: List files and verify the requested file exists
        try:
            folder_path = f"university_{university_id}"
            file_list = supabase.storage.from_("backups").list(folder_path)

            # Check if file exists in the list
            file_exists = any(f.get("name") == file_name for f in file_list)

            if not file_exists:
                raise HTTPException(status_code=404, detail="Backup file not found")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying file: {e}")
            raise HTTPException(status_code=404, detail="Backup file not found")

        # Download the file
        try:
            file_bytes = supabase.storage.from_("backups").download(storage_path)
        except Exception as e:
            print(f"Error downloading file: {e}")
            raise HTTPException(status_code=500, detail="Failed to download backup file")

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={file_name}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to download backup: {str(e)}"
        )
