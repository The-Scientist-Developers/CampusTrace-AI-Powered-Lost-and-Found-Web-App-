# app/clip_util.py
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import time

MODEL_NAME = "openai/clip-vit-base-patch32"
model = None
processor = None
is_loading = False

def load_model():
    """Loads the CLIP model and processor into memory."""
    global model, processor, is_loading
    
    # Prevent multiple simultaneous loading attempts
    if is_loading:
        print("⏳ CLIP model is already being loaded, waiting...")
        while is_loading:
            time.sleep(0.1)
        return
    
    if model is None:
        is_loading = True
        try:
            print("🚀 Starting to load CLIP model...")
            start_time = time.time()
            
            # Load with reduced memory if possible
            model = CLIPModel.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True
            )
            processor = CLIPProcessor.from_pretrained(MODEL_NAME)
            
            load_time = time.time() - start_time
            print(f"✅ CLIP model loaded successfully in {load_time:.2f} seconds")
        except Exception as e:
            print(f"❌ Failed to load CLIP model: {e}")
            raise
        finally:
            is_loading = False

def get_image_embedding(image: Image.Image) -> list[float]:
    """
    Generates a vector (embedding) for a given image.
    Loads model on first use (lazy loading).
    """
    # Lazy load - only load when actually needed
    if not model or not processor:
        load_model()
    
    try:
        with torch.no_grad():
            inputs = processor(images=image, return_tensors="pt")
            image_features = model.get_image_features(**inputs)
        
        return image_features[0].cpu().numpy().tolist()
    except Exception as e:
        print(f"❌ Error generating image embedding: {e}")
        # Return empty embedding as fallback
        return [0.0] * 512  # CLIP embeddings are 512-dimensional

# DO NOT CALL load_model() HERE - This is the key fix!
# Models will load on first use instead