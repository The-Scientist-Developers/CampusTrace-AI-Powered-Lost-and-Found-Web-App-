# app/shared.py

model = None  

# Cache for XAI match explanations: {(lost_id, found_id): explanation}
# Clear cache on server restart
match_explanation_cache = {}

def clear_match_cache():
    """Clear the match explanation cache"""
    global match_explanation_cache
    match_explanation_cache = {}
    print("🗑️ Match explanation cache cleared")
