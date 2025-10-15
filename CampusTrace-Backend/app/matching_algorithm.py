# import datetime
# from math import radians, cos, sin, asin, sqrt
# from typing import List, Dict, Any

# def jaccard_similarity(list1: List[str], list2: List[str]) -> float:
#     """Calculates the Jaccard similarity between two lists of tags."""
#     if not list1 and not list2:
#         return 1.0
#     if not list1 or not list2:
#         return 0.0

#     set1 = set(list1)
#     set2 = set(list2)
#     intersection = len(set1.intersection(set2))
#     union = len(set1.union(set2))
#     return float(intersection) / union if union != 0 else 0.0

# def calculate_match_score(lost_item: Dict[str, Any], found_item: Dict[str, Any]) -> int:
#     """
#     Calculates a match score (0-100) between a lost and found item.
#     The score is based on category, time, keywords, and location similarity.
#     """
    
#     # --- 1. Category Match (Weight: 40%) ---
#     category_score = 1.0 if lost_item.get('category') == found_item.get('category') else 0.0
    
#     # --- 2. Time Proximity (Weight: 20%) ---
#     time_score = 0.0
#     try:
#         # Timestamps from Supabase are in ISO 8601 format with timezone
#         lost_date = datetime.datetime.fromisoformat(lost_item['created_at'])
#         found_date = datetime.datetime.fromisoformat(found_item['created_at'])
        
#         # A found item cannot be reported before a lost item
#         if found_date >= lost_date:
#             time_difference_hours = abs((found_date - lost_date).total_seconds() / 3600)
#             # Exponential decay: score is high initially and drops off.
#             time_score = 0.95 ** (time_difference_hours / 6)
#     except (ValueError, TypeError, KeyError):
#         time_score = 0.1 # Assign a low score if dates are invalid

#     # --- 3. Keyword Similarity (Weight: 40%) ---
#     lost_tags = lost_item.get('ai_tags') or []
#     found_tags = found_item.get('ai_tags') or []
#     keyword_score = jaccard_similarity(lost_tags, found_tags)

#     # --- 4. Location Bonus (Bonus 10 points) ---
#     # Simplified for text-based locations. Gives a bonus if they match.
#     location_bonus = 0.0
#     lost_loc = (lost_item.get('location') or "").strip().lower()
#     found_loc = (found_item.get('location') or "").strip().lower()
#     if lost_loc and found_loc and lost_loc in found_loc or found_loc in lost_loc:
#         location_bonus = 10.0

#     # --- 5. Final Weighted Score ---
#     total_score = (
#         (category_score * 40) +
#         (time_score * 20) +
#         (keyword_score * 40)
#     )
    
#     # Add bonus points and cap the score at 100
#     final_score = min(100, round(total_score + location_bonus))
    
#     return final_score



import datetime
from math import radians, cos, sin, asin, sqrt
from typing import List, Dict, Any

def jaccard_similarity(list1: List[str], list2: List[str]) -> float:
    """Calculates the Jaccard similarity between two lists of tags."""
    if not list1 and not list2:
        return 1.0
    if not list1 or not list2:
        return 0.0

    set1 = set(list1)
    set2 = set(list2)
    intersection = len(set1 & set2)  # More efficient than .intersection()
    union = len(set1 | set2)  # More efficient than .union()
    return intersection / union if union > 0 else 0.0

def calculate_match_score(lost_item: Dict[str, Any], found_item: Dict[str, Any]) -> int:
    """
    Calculates a match score (0-100) between a lost and found item.
    The score is based on category, time, keywords, and location similarity.
    """
    
    # --- 1. Category Match (Weight: 40%) ---
    lost_category = lost_item.get('category')
    found_category = found_item.get('category')
    category_score = 1.0 if (lost_category and found_category and 
                             lost_category == found_category) else 0.0
    
    # --- 2. Time Proximity (Weight: 20%) ---
    time_score = 0.1  # Default fallback score
    try:
        # Timestamps from Supabase are in ISO 8601 format with timezone
        lost_date = datetime.datetime.fromisoformat(lost_item['created_at'])
        found_date = datetime.datetime.fromisoformat(found_item['created_at'])
        
        # A found item cannot be reported before a lost item (logical constraint)
        if found_date >= lost_date:
            time_difference_hours = (found_date - lost_date).total_seconds() / 3600
            # Exponential decay: score is high initially and drops off
            # Adjusted for better decay curve
            time_score = 0.95 ** (time_difference_hours / 6.0)
        else:
            # Invalid scenario: found before lost
            time_score = 0.0
    except (ValueError, TypeError, KeyError):
        time_score = 0.1  # Assign a low score if dates are invalid

    # --- 3. Keyword Similarity (Weight: 40%) ---
    lost_tags = lost_item.get('ai_tags') or []
    found_tags = found_item.get('ai_tags') or []
    keyword_score = jaccard_similarity(lost_tags, found_tags)

    # --- 4. Location Bonus (Up to 10 points) ---
    location_bonus = 0.0
    lost_loc = (lost_item.get('location') or "").strip().lower()
    found_loc = (found_item.get('location') or "").strip().lower()
    
    if lost_loc and found_loc:
        if lost_loc == found_loc:
            # Exact match
            location_bonus = 10.0
        elif lost_loc in found_loc or found_loc in lost_loc:
            # Partial match (substring)
            location_bonus = 7.0

    # --- 5. Final Weighted Score ---
    total_score = (
        (category_score * 40) +
        (time_score * 20) +
        (keyword_score * 40)
    )
    
    # Add bonus points and cap the score at 100
    final_score = min(100, round(total_score + location_bonus))
    
    return final_score