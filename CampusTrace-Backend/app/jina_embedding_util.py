import io
import base64
import requests
from PIL import Image
from app.config import get_settings

settings = get_settings()

JINA_API_URL = getattr(settings, "JINA_EMBEDDING_URL", "https://api.jina.ai/v1/embeddings")
JINA_API_TOKEN = getattr(settings, "JINA_API_KEY", None)
HEADERS = {"Authorization": f"Bearer {JINA_API_TOKEN}"} if JINA_API_TOKEN else {}


async def get_jina_embedding_async(input_data):
    """Generate a Jina embedding from text or image (auto-detect type)."""
    try:
        print(f"🧩 Input type at runtime: {type(input_data)}")

        # --- Image input ---
        if isinstance(input_data, Image.Image):
            buffered = io.BytesIO()
            input_data.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            payload = {
                "model": "jina-embeddings-v4",
                "input": [{"image": f"data:image/png;base64,{img_base64}"}],
            }

        # --- Text input ---
        elif isinstance(input_data, str):
            payload = {
                "model": "jina-embeddings-v4",
                "input": [input_data],
            }

        else:
            raise TypeError(f"Unsupported input type for Jina embedding: {type(input_data)}")

        response = requests.post(JINA_API_URL, headers=HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        embedding = result.get("data", [{}])[0].get("embedding", [])
        return embedding

    except requests.exceptions.Timeout:
        print(f"⏱️ Timeout calling Jina API (30s)")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP error calling Jina API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"🧾 Response body: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ General error generating Jina embedding: {e}")
        return None


async def get_multimodal_embedding(text: str = None, image: Image.Image = None):
    """Generate a multimodal (text + image) embedding."""
    try:
        # Handle text-only case
        if text and not image:
            print(f"🧩 Generating text-only embedding. text type={type(text)}")
            payload = {
                "model": "jina-embeddings-v4",
                "input": [text],
            }
        
        # Handle image-only case
        elif image and not text:
            print(f"🧩 Generating image-only embedding. image type={type(image)}")
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            payload = {
                "model": "jina-embeddings-v4",
                "input": [{"image": f"data:image/png;base64,{img_base64}"}],
            }
        
        # Handle multimodal case (both text and image)
        elif text and image:
            print(f"🧩 Generating multimodal embedding. text type={type(text)}, image type={type(image)}")
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            payload = {
                "model": "jina-embeddings-v4",
                "input": [{
                    "text": text,
                    "image": f"data:image/png;base64,{img_base64}"
                }],
            }
        
        else:
            raise ValueError("Either text or image (or both) must be provided")

        response = requests.post(JINA_API_URL, headers=HEADERS, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        embedding = result.get("data", [{}])[0].get("embedding", [])
        return embedding

    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP error (multimodal) calling Jina API: {e}")
        if e.response is not None:
            print(f"🧾 Response body: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ General error generating multimodal embedding: {e}")
        return None


async def test_jina_embedding():
    """Test Jina embedding on both text and image to confirm multimodal support."""
    try:
        print(f"🧩 Testing Jina embeddings with jina-embeddings-v4")

        # 🧠 Test text embedding only (simplest test)
        sample_text = "Lost black wallet near campus gate"
        print(f"🔹 Testing text-only embedding...")
        text_emb = await get_multimodal_embedding(text=sample_text)

        if text_emb and len(text_emb) > 0:
            print(f"✅ Text embedding OK (dim={len(text_emb)})")
            print(f"✅ Jina embedding model (jina-embeddings-v4) is working!")
        else:
            print("⚠️ Text embedding failed!")
            print("⚠️ WARNING: Jina embedding model not responding properly.")
            return

        # Optional: Test with a simple generated image (skip external URLs)
        try:
            # Create a simple test image (100x100 red square)
            test_img = Image.new('RGB', (100, 100), color='red')
            
            print(f"🔹 Testing image-only embedding...")
            image_emb = await get_multimodal_embedding(image=test_img)

            if image_emb and len(image_emb) > 0:
                print(f"✅ Image embedding OK (dim={len(image_emb)})")
            else:
                print("⚠️ Image embedding test skipped or failed")

            # Test multimodal
            print(f"🔹 Testing multimodal (text + image) embedding...")
            multimodal_emb = await get_multimodal_embedding(text=sample_text, image=test_img)

            if multimodal_emb and len(multimodal_emb) > 0:
                print(f"✅ Multimodal embedding OK (dim={len(multimodal_emb)})")
            else:
                print("⚠️ Multimodal embedding test skipped or failed")
            
            test_img.close()
        except Exception as img_test_error:
            print(f"⚠️ Image/multimodal test skipped: {img_test_error}")

    except Exception as e:
        print(f"❌ Error testing Jina embedding: {e}")
        print("⚠️ WARNING: Jina embedding model not responding properly.")