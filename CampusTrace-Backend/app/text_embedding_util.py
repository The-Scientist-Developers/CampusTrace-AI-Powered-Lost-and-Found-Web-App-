# app/text_embedding_util.py
from sentence_transformers import SentenceTransformer
import time
import numpy as np

MODEL_NAME = 'all-MiniLM-L6-v2'
model = None
is_loading = False

def load_model():
    """Loads the Sentence Transformer model into memory."""
    global model, is_loading
    
    # Prevent multiple simultaneous loading attempts
    if is_loading:
        print("⏳ Sentence Transformer is already being loaded, waiting...")
        while is_loading:
            time.sleep(0.1)
        return
    
    if model is None:
        is_loading = True
        try:
            print("🚀 Starting to load Sentence Transformer model...")
            start_time = time.time()
            
            model = SentenceTransformer(MODEL_NAME)
            
            load_time = time.time() - start_time
            print(f"✅ Sentence Transformer loaded successfully in {load_time:.2f} seconds")
        except Exception as e:
            print(f"❌ Failed to load Sentence Transformer: {e}")
            raise
        finally:
            is_loading = False

def get_text_embedding(text: str) -> list[float]:
    """
    Generates a vector (embedding) for a given text string.
    Loads model on first use (lazy loading).
    """
    # Lazy load - only load when actually needed
    if not model:
        load_model()
    
    try:
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"❌ Error generating text embedding: {e}")
        # Return empty embedding as fallback
        return [0.0] * 384  # all-MiniLM-L6-v2 embeddings are 384-dimensional

# DO NOT CALL load_model() HERE - This is the key fix!
# Models will load on first use instead