import asyncio
import httpx
from PIL import Image
import io
import base64
import json
from datetime import datetime

# REPLACE WITH YOUR TOKEN
HF_TOKEN = "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"

class ModelTester:
    def __init__(self, token):
        self.token = token
        self.working_models = {
            "text": [],
            "image": []
        }
    
    async def test_text_model(self, model_name: str) -> bool:
        """Test if a text embedding model works"""
        url = f"https://api-inference.huggingface.co/models/{model_name}"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Different payload formats to try
        test_payloads = [
            {"inputs": "test sentence"},  # Most common
            {"inputs": ["test sentence"]},  # Batch format
            {"inputs": {"source_sentence": "test", "sentences": ["test"]}},  # Similarity
        ]
        
        async with httpx.AsyncClient() as client:
            for i, payload in enumerate(test_payloads):
                try:
                    response = await client.post(
                        url, 
                        headers=headers, 
                        json=payload, 
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        # Check if we got valid embeddings
                        if isinstance(result, list) and len(result) > 0:
                            if isinstance(result[0], (float, int)):
                                dims = len(result)
                            elif isinstance(result[0], list):
                                dims = len(result[0])
                            else:
                                continue
                            
                            print(f"✅ {model_name}")
                            print(f"   Format: Payload {i+1}")
                            print(f"   Dimensions: {dims}")
                            self.working_models["text"].append({
                                "model": model_name,
                                "dims": dims,
                                "format": i+1
                            })
                            return True
                    
                    elif response.status_code == 503:
                        print(f"⏳ {model_name} - Model loading (try again in 20s)")
                        return False
                        
                except httpx.TimeoutException:
                    continue
                except Exception:
                    continue
        
        print(f"❌ {model_name} - Not working")
        return False
    
    async def test_image_model(self, model_name: str) -> bool:
        """Test if an image embedding model works"""
        url = f"https://api-inference.huggingface.co/models/{model_name}"
        
        # Create test image
        img = Image.new('RGB', (224, 224), color='red')
        
        # Prepare different formats
        # Format 1: Raw bytes
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format='JPEG')
        img_bytes = img_bytes_io.getvalue()
        
        # Format 2: Base64
        img_b64 = base64.b64encode(img_bytes).decode()
        
        # Format 3: PNG bytes
        png_bytes_io = io.BytesIO()
        img.save(png_bytes_io, format='PNG')
        png_bytes = png_bytes_io.getvalue()
        
        test_configs = [
            # Config 1: Binary with octet-stream
            {
                "headers": {
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/octet-stream"
                },
                "content": img_bytes,
                "name": "Binary JPEG"
            },
            # Config 2: Form data
            {
                "headers": {"Authorization": f"Bearer {self.token}"},
                "files": {"file": ("image.jpg", img_bytes, "image/jpeg")},
                "name": "Form data"
            },
            # Config 3: Base64 JSON
            {
                "headers": {"Authorization": f"Bearer {self.token}"},
                "json": {"inputs": img_b64},
                "name": "Base64 JSON"
            },
            # Config 4: Binary PNG
            {
                "headers": {
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "image/png"
                },
                "content": png_bytes,
                "name": "Binary PNG"
            }
        ]
        
        async with httpx.AsyncClient() as client:
            for config in test_configs:
                try:
                    # Prepare request kwargs
                    kwargs = {"timeout": 10}
                    if "content" in config:
                        kwargs["content"] = config["content"]
                    if "files" in config:
                        kwargs["files"] = config["files"]
                    if "json" in config:
                        kwargs["json"] = config["json"]
                    
                    response = await client.post(
                        url,
                        headers=config["headers"],
                        **kwargs
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        # Determine dimensions
                        dims = 0
                        if isinstance(result, list) and len(result) > 0:
                            if isinstance(result[0], (float, int)):
                                dims = len(result)
                            elif isinstance(result[0], list):
                                dims = len(result[0])
                        
                        if dims > 0:
                            print(f"✅ {model_name}")
                            print(f"   Format: {config['name']}")
                            print(f"   Dimensions: {dims}")
                            self.working_models["image"].append({
                                "model": model_name,
                                "dims": dims,
                                "format": config['name']
                            })
                            return True
                    
                    elif response.status_code == 503:
                        print(f"⏳ {model_name} - Model loading")
                        return False
                        
                except Exception:
                    continue
        
        print(f"❌ {model_name} - Not working")
        return False
    
    async def test_all_models(self):
        """Test comprehensive list of models"""
        
        # Popular text embedding models
        text_models = [
            # Sentence Transformers
            "sentence-transformers/all-MiniLM-L6-v2",
            "sentence-transformers/all-mpnet-base-v2",
            "sentence-transformers/all-MiniLM-L12-v2",
            "sentence-transformers/paraphrase-MiniLM-L6-v2",
            "sentence-transformers/multi-qa-MiniLM-L6-cos-v1",
            
            # BAAI models
            "BAAI/bge-small-en-v1.5",
            "BAAI/bge-base-en-v1.5",
            "BAAI/bge-large-en-v1.5",
            
            # Other popular models
            "thenlper/gte-small",
            "thenlper/gte-base",
            "intfloat/e5-small-v2",
            "intfloat/e5-base-v2",
        ]
        
        # Image embedding models (CLIP variants)
        image_models = [
            # OpenAI CLIP
            "openai/clip-vit-base-patch32",
            "openai/clip-vit-base-patch16",
            "openai/clip-vit-large-patch14",
            
            # Sentence Transformers CLIP
            "sentence-transformers/clip-ViT-B-32",
            "sentence-transformers/clip-ViT-B-16",
            "sentence-transformers/clip-ViT-L-14",
            
            # Other CLIP models
            "patrickjohncyh/fashion-clip",
            "jinaai/jina-clip-v1",
            "laion/CLIP-ViT-B-32-laion2B-s34B-b79K",
            "facebook/metaclip-b32-400m",
        ]
        
        print("=" * 60)
        print("🔍 TESTING TEXT EMBEDDING MODELS")
        print("=" * 60)
        
        for model in text_models:
            await self.test_text_model(model)
            await asyncio.sleep(0.5)  # Be nice to the API
        
        print("\n" + "=" * 60)
        print("🔍 TESTING IMAGE EMBEDDING MODELS")
        print("=" * 60)
        
        for model in image_models:
            await self.test_image_model(model)
            await asyncio.sleep(0.5)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 SUMMARY OF WORKING MODELS")
        print("=" * 60)
        
        print(f"\n✅ Working Text Models ({len(self.working_models['text'])})")
        for model in self.working_models['text']:
            print(f"   - {model['model']} ({model['dims']} dims)")
        
        print(f"\n✅ Working Image Models ({len(self.working_models['image'])})")
        for model in self.working_models['image']:
            print(f"   - {model['model']} ({model['dims']} dims, {model['format']})")
        
        # Save results
        with open('working_models.json', 'w') as f:
            json.dump(self.working_models, f, indent=2)
        print(f"\n💾 Results saved to working_models.json")

async def main():
    tester = ModelTester(HF_TOKEN)
    await tester.test_all_models()

if __name__ == "__main__":
    print(f"🚀 Starting model tests at {datetime.now()}")
    asyncio.run(main())