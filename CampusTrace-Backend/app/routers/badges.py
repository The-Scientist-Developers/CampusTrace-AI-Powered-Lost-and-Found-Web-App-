from fastapi import APIRouter, Depends, HTTPException
import traceback

from app.dependencies import get_current_user_id, supabase

router = APIRouter(prefix="/api/badges", tags=["Badges"])


@router.get("/user/{target_user_id}/badges")
async def get_user_badges(
    target_user_id: str, user_id: str = Depends(get_current_user_id)
):
    """
    Get all badges earned by a specific user.
    Returns badge details with earned timestamp.
    """
    try:
        # Try to fetch user badges using the view
        try:
            badges_res = (
                supabase.from_("user_badges_view")
                .select("*")
                .eq("user_id", target_user_id)
                .order("earned_at", desc=True)
                .execute()
            )

            return {"badges": badges_res.data or []}
        except Exception as view_error:
            # If view doesn't exist, try direct table query as fallback
            print(f"Badges view error (trying fallback): {str(view_error)}")

            try:
                # Fallback: Direct query from user_badges table with join
                badges_res = (
                    supabase.table("user_badges")
                    .select("*, badges(name, description, icon_url, criteria)")
                    .eq("user_id", target_user_id)
                    .order("earned_at", desc=True)
                    .execute()
                )

                return {"badges": badges_res.data or []}
            except Exception as fallback_error:
                print(f"Badges fallback error: {str(fallback_error)}")
                # Return empty array instead of crashing
                return {"badges": []}

    except Exception as e:
        traceback.print_exc()
        print(f"Badges error: {str(e)}")
        # Return empty array gracefully instead of 500 error
        return {"badges": []}


@router.get("/all")
async def get_all_badges(user_id: str = Depends(get_current_user_id)):
    """Get all available badges in the system."""
    try:
        badges_res = supabase.table("badges").select("*").order("name").execute()
        return {"badges": badges_res.data or []}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")


@router.delete("/user/{user_id}/badges/{badge_id}")
async def remove_badge(
    user_id: str, 
    badge_id: str, 
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Remove a badge from a user.
    """
    # Security check: Ensure user is modifying their own data
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this badge")

    try:
        # Perform the delete operation on the user_badges table
        # We match both id (the record unique ID) and user_id (security)
        result = (
            supabase.table("user_badges")
            .delete()
            .match({"id": badge_id, "user_id": user_id})
            .execute()
        )

        # Check if anything was actually deleted
        if not result.data:
            raise HTTPException(status_code=404, detail="Badge not found or already removed")

        return {"message": "Badge removed successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error removing badge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove badge: {str(e)}")