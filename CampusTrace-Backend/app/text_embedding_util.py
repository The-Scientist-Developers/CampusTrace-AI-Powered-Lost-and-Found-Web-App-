from sentence_transformers import SentenceTransformer

MODEL_NAME = 'all-MiniLM-L6-v2'
model = None

def load_model():
    """Loads the Sentence Transformer model into memory."""
    global model
    if model is None:
        print("Loading Sentence Transformer model... (This might take a moment on first run)")
        model = SentenceTransformer(MODEL_NAME)
        print("Sentence Transformer model loaded successfully.")

def get_text_embedding(text: str) -> list[float]:
    """Generates a vector (embedding) for a given text string."""
    if not model:
        load_model()
    
    embedding = model.encode(text)
    return embedding.tolist()

load_model()