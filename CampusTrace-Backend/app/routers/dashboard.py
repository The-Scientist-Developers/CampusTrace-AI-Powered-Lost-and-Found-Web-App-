"""
Optimized Dashboard API Endpoints
Consolidates multiple queries into single endpoints for better performance
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any
from datetime import datetime, timedelta
import logging

from app.dependencies import supabase, get_current_user_id
from app.routers.items import generate_match_explanation

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)


@router.get("/summary")
async def get_dashboard_summary(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Optimized endpoint with strict pagination and minimal data return.
    Returns only necessary fields for dashboard display.
    Uses indexed queries for better performance.
    """
    try:
        
        # Get user profile for university_id
        profile_response = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        university_id = profile_response.data.get("university_id")
        
        # Calculate user stats using COUNT queries (more efficient)
        total_response = supabase.table("items").select("id", count="exact").eq("user_id", user_id).execute()
        lost_response = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "Lost").execute()
        found_response = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("status", "Found").execute()
        recovered_response = supabase.table("items").select("id", count="exact").eq("user_id", user_id).eq("moderation_status", "recovered").execute()
        
        user_stats = {
            "total": total_response.count or 0,
            "lost": lost_response.count or 0,
            "found": found_response.count or 0,
            "recovered": recovered_response.count or 0,
        }
        
        # Get recent active posts (limit 4, only necessary fields)
        # Include items with moderation_status approved/pending OR status "pending handover"
        # Exclude recovered items (both status and moderation_status)
        recent_posts_response = supabase.table("items").select(
            "id, title, status, category, image_url, thumbnail_url, created_at, moderation_status"
        ).eq("user_id", user_id).neq("status", "recovered").neq("moderation_status", "recovered").or_(
            'moderation_status.in.(approved,pending,pending_return),status.eq.pending handover'
        ).order("created_at", desc=True).limit(4).execute()
        
        recent_posts = recent_posts_response.data or []
        
        # Get community activity (limit 5, only necessary fields)
        community_activity = []
        if university_id:
            activity_response = supabase.table("items").select(
                "id, title, status, category, image_url, thumbnail_url, created_at, user_id, profiles!inner(id, full_name)"
            ).eq("university_id", university_id).eq(
                "moderation_status", "approved"
            ).neq("user_id", user_id).order("created_at", desc=True).limit(5).execute()
            
            community_activity = activity_response.data or []
        
        # Get AI matches (limit 4, only if user has lost items)
        ai_matches = []
        latest_lost_response = supabase.table("items").select(
            "id, category, title, description"
        ).eq("user_id", user_id).eq("status", "Lost").eq(
            "moderation_status", "approved"
        ).order("created_at", desc=True).limit(1).execute()
        
        if latest_lost_response.data:
            latest_lost_item = latest_lost_response.data[0]
            try:
                # Use AI-powered matching with RPC
                matches_response = supabase.rpc(
                    "find_matches_for_lost_item",
                    {
                        "p_item_id": latest_lost_item["id"],
                        "p_text_weight": 0.5,
                        "p_image_weight": 0.5,
                        "p_match_threshold": 0.65,
                        "p_match_count": 4
                    }
                ).execute()
                
                if matches_response.data:
                    # Convert similarity to percentage and generate XAI explanations
                    print(f"🔍 Generating XAI explanations for {len(matches_response.data)} matches")
                    for match in matches_response.data:
                        match_score = round(match.get("similarity", 0.0) * 100)
                        match["match_score"] = match_score
                        
                        # Generate XAI explanation for each match
                        try:
                            print(f"📝 Generating explanation for match ID {match.get('id')} (score: {match_score}%)")
                            explanation = await generate_match_explanation(
                                latest_lost_item,
                                match,
                                match_score,
                                match.get("text_similarity", 0.0),
                                match.get("image_similarity", 0.0)
                            )
                            match["match_explanation"] = explanation
                            print(f"✅ Explanation generated: {explanation[:80]}...")
                        except Exception as e:
                            print(f"❌ Failed to generate explanation: {e}")
                            import traceback
                            traceback.print_exc()
                            match["match_explanation"] = "Good potential match"
                    
                    ai_matches = matches_response.data
            except Exception as match_error:
                logger.warning(f"AI matching failed, using fallback: {match_error}")
                # Fallback to category-based matching
                matches_response = supabase.table("items").select(
                    "id, title, status, category, image_url, thumbnail_url, created_at"
                ).neq("id", latest_lost_item["id"]).eq("status", "Found").eq(
                    "moderation_status", "approved"
                ).eq("category", latest_lost_item["category"]).eq(
                    "university_id", university_id
                ).order("created_at", desc=True).limit(4).execute()
                
                # Add default match scores for fallback
                if matches_response.data:
                    for match in matches_response.data:
                        match["match_score"] = 70  # Default score for category match
                    ai_matches = matches_response.data
        
        # Get minimal data for chart (last 30 days only)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        chart_response = supabase.table("items").select(
            "status, category, created_at"
        ).eq("user_id", user_id).gte("created_at", thirty_days_ago).execute()
        
        chart_items = chart_response.data or []
        chart_data = generate_chart_data(chart_items)
        
        # Format response with minimal data
        return {
            "userStats": user_stats,
            "myRecentPosts": [format_item_minimal(item) for item in recent_posts],
            "recentActivity": [format_activity_minimal(item) for item in community_activity],
            "aiMatches": [format_item_minimal(item) for item in ai_matches],
            "chartData": chart_data,
        }
        
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")


def generate_chart_data(items: List[Dict]) -> Dict[str, Any]:
    """Generate chart data from items"""
    # Weekly data
    days_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_data = {day: {"name": day, "Lost": 0, "Found": 0} for day in days_order}
    
    for item in items:
        if item.get("created_at"):
            created_at = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
            day_name = created_at.strftime("%a")
            if day_name in weekly_data:
                if item.get("status") == "Lost":
                    weekly_data[day_name]["Lost"] += 1
                elif item.get("status") == "Found":
                    weekly_data[day_name]["Found"] += 1
    
    # Category data
    category_count = {}
    for item in items:
        if item.get("category"):
            category_count[item["category"]] = category_count.get(item["category"], 0) + 1
    
    categories = [
        {"name": cat, "count": count}
        for cat, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    return {
        "weekly": [weekly_data[day] for day in days_order],
        "categories": categories
    }


def format_item_minimal(item: Dict) -> Dict[str, Any]:
    """Format item with only necessary fields for list view"""
    result = {
        "id": item.get("id"),
        "title": item.get("title"),
        "status": item.get("status"),
        "category": item.get("category"),
        "location": item.get("location"),
        "image_url": item.get("image_url"),
        "thumbnail_url": item.get("thumbnail_url"),
        "created_at": item.get("created_at"),
        "moderation_status": item.get("moderation_status"),
    }
    # Include XAI fields if present (for smart matching)
    if "match_score" in item:
        result["match_score"] = item["match_score"]
    if "match_explanation" in item:
        result["match_explanation"] = item["match_explanation"]
    if "text_similarity" in item:
        result["text_similarity"] = item["text_similarity"]
    if "image_similarity" in item:
        result["image_similarity"] = item["image_similarity"]
    return result


def format_activity_minimal(item: Dict) -> Dict[str, Any]:
    """Format community activity item with minimal profile info"""
    return {
        "id": item.get("id"),
        "title": item.get("title"),
        "status": item.get("status"),
        "category": item.get("category"),
        "image_url": item.get("image_url"),
        "thumbnail_url": item.get("thumbnail_url"),
        "created_at": item.get("created_at"),
        "profiles": item.get("profiles", {})
    }
