import json
import asyncio
import sys
import os
from typing import List, Dict, Set
from PIL import Image

# Fix: Add the CampusTrace-Backend directory to Python path so 'app' module is found
# This works no matter where you run the script from

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from app.jina_embedding_util import get_multimodal_embedding
from app.dependencies import supabase

# =====================================================================
# METRIC 1: Top-1 Accuracy
# Explains if the TRUE match was the absolute #1 ranked result
# =====================================================================
def calculate_top_1_accuracy(retrieved_item_ids: List[int], ground_truth_id: int) -> int:
    """
    Returns 1 if the very first result matches the ground truth, else 0.
    """
    if len(retrieved_item_ids) > 0 and retrieved_item_ids[0] == ground_truth_id:
        return 1
    return 0

# =====================================================================
# METRIC 2: Top-5 Accuracy
# Explains if the TRUE match appeared anywhere in the Top 5 results
# =====================================================================
def calculate_top_k_accuracy(retrieved_item_ids: List[int], ground_truth_id: int, k: int = 5) -> int:
    """
    Returns 1 if the ground truth ID is anywhere in the top K results, else 0.
    """
    if ground_truth_id in retrieved_item_ids[:k]:
        return 1
    return 0

# =====================================================================
# METRIC 3: Precision@K
# Explains out of K returned items, how many were actually relevant
# (For a single 1:1 match, this is 1/K if found, or 0 if not found)
# =====================================================================
def calculate_precision_at_k(retrieved_item_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
    """
    Precision = (Number of relevant items retrieved in Top K) / K
    """
    top_k_retrieved = retrieved_item_ids[:k]
    
    if len(top_k_retrieved) == 0:
         return 0.0
         
    # Count how many of the top K are in our ground truth set
    relevant_retrieved_count = sum(1 for item_id in top_k_retrieved if item_id in ground_truth_ids)
    
    # Precision is the fraction of retrieved items that are relevant
    return relevant_retrieved_count / len(top_k_retrieved)

# =====================================================================
# METRIC 4: Recall@K
# Explains if we successfully "captured" the true items within our allowed limit K
# =====================================================================
def calculate_recall_at_k(retrieved_item_ids: List[int], ground_truth_ids: Set[int], k: int) -> float:
    """
    Recall = (Number of relevant items retrieved in Top K) / (Total relevant items that exist)
    """
    top_k_retrieved = retrieved_item_ids[:k]
    
    if len(ground_truth_ids) == 0:
        return 0.0
        
    # Count how many of the top K are in our ground truth set
    relevant_retrieved_count = sum(1 for item_id in top_k_retrieved if item_id in ground_truth_ids)
    
    # Recall is the fraction of total relevant items we managed to find
    return relevant_retrieved_count / len(ground_truth_ids)


# =====================================================================
# MAIN RUNNER: Putting it all together
# =====================================================================
async def run_evaluation(dataset_filepath: str, k_value: int = 5):
    """
    Reads the test dataset and runs your pipeline to calculate metrics.
    """
    print(f"Loading dataset from {dataset_filepath}...")
    
    try:
        with open(dataset_filepath, 'r') as f:
            eval_dataset = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find '{dataset_filepath}'. Make sure you create this JSON file first!")
        return

    total_queries = len(eval_dataset)
    if total_queries == 0:
        print("Dataset is empty.")
        return

    print(f"Evaluating {total_queries} items...\n")

    top_1_hits = 0
    top_k_hits = 0
    precision_k_sum = 0.0
    recall_k_sum = 0.0

    for idx, item in enumerate(eval_dataset):
        print(f"Processing Query {idx + 1}/{total_queries}: {item.get('scenario', 'Unknown')}")
        
        text = item["lost_item_query"]["text"]
        img_path = item["lost_item_query"]["image_path"]
        ground_truth_id = item["ground_truth_found_item_id"]
        
        # In a generic retrieval task, there might be MULTIPLE relevant matches.
        # But for your specific Lost-and-Found app, there is usually exactly ONE true match.
        ground_truth_set = {ground_truth_id}
        
        try:
            # 1. Open the image
            image = Image.open(img_path)
            
            # 2. Get the embedding using your exact pipeline function
            # Ensure get_multimodal_embedding handles text+image according to jina_embedding_util.py definition
            query_embedding = await get_multimodal_embedding(text=text, image=image)
            image.close() # Always close the file
            
            if not query_embedding:
               print(f"  -> Skipping. Failed to generate embedding.")
               continue
               
            # 3. Search Supabase database
            # Updated to use the correct RPC function name as per Supabase schema
            response = supabase.rpc(
                "match_items_by_embedding",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.3, # Your similarity threshold
                    "match_count": k_value  # Maximum items to fetch
                }
            ).execute()
            
            retrieved_items = response.data if response.data else []
            
            # Replace 'item_id' with whatever column name your DB returns as the ID!
            retrieved_ids = [row["id"] for row in retrieved_items] 
            print(f"  -> Retrieved IDs: {retrieved_ids} | True Match: {ground_truth_id}")
            
            # 4. Use the isolated metric functions!
            top_1_hits += calculate_top_1_accuracy(retrieved_ids, ground_truth_id)
            top_k_hits += calculate_top_k_accuracy(retrieved_ids, ground_truth_id, k=k_value)
            precision_k_sum += calculate_precision_at_k(retrieved_ids, ground_truth_set, k=k_value)
            recall_k_sum += calculate_recall_at_k(retrieved_ids, ground_truth_set, k=k_value)

        except Exception as e:
            print(f"  -> Error processing item: {e}")
            continue

    # Final Math across the whole dataset
    final_top_1 = (top_1_hits / total_queries) * 100
    final_top_k = (top_k_hits / total_queries) * 100
    final_precision = (precision_k_sum / total_queries) * 100
    final_recall = (recall_k_sum / total_queries) * 100

    print("\n=============================================")
    print("🎓 FINAL EVALUATION METRICS 🎓")
    print("=============================================")
    print(f"Top-1 Accuracy:  {final_top_1:.2f}%  (Found exactly at #1)")
    print(f"Top-{k_value} Accuracy:  {final_top_k:.2f}%  (Found somewhere in Top {k_value})")
    print(f"Precision@{k_value}:     {final_precision:.2f}%  (Relevance density of returned items)")
    print(f"Recall@{k_value}:        {final_recall:.2f}%  (Did we successfully catch the true item?)")
    print("=============================================")

if __name__ == "__main__":
    # Always use the absolute path to the dataset file in the same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "my_test_dataset.json")
    asyncio.run(run_evaluation(dataset_path, k_value=5))
