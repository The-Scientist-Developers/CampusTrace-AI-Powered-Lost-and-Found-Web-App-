from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

MODEL_NAME = "openai/clip-vit-base-patch32"
model = None
processor = None

def load_model():
    """Loads the CLIP model and processor into memory."""
    global model, processor
    if model is None:
        print("Loading CLIP model... (This might take a moment on first run)")
        model = CLIPModel.from_pretrained(MODEL_NAME)
        processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        print("CLIP model loaded successfully.")

def get_image_embedding(image: Image.Image) -> list[float]:
    """
    Generates a vector (embedding) for a given image.
    This vector is the numerical "fingerprint" of the image.
    """
    if not model or not processor:
        load_model()
    
    # Process the image and get the embedding
    with torch.no_grad():
        inputs = processor(images=image, return_tensors="pt")
        image_features = model.get_image_features(**inputs)

    # Convert to a standard Python list and return
    return image_features[0].cpu().numpy().tolist()

# Load the model when the application starts
load_model()