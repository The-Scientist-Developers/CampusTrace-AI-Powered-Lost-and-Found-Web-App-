import requests
import os
from dotenv import load_dotenv

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY")

if not JINA_API_KEY:
    print("❌ JINA_API_KEY not found in environment!")
    exit(1)

print(f"🔑 Using Jina API Key: {JINA_API_KEY[:20]}...")

# Test 1: Simple text embedding
print("\n🧪 Test 1: Simple text embedding")
try:
    response = requests.post(
        "https://api.jina.ai/v1/embeddings",
        headers={
            "Authorization": f"Bearer {JINA_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "jina-embeddings-v4",
            "input": ["test"]
        },
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        embedding = result.get("data", [{}])[0].get("embedding", [])
        print(f"✅ Success! Embedding dimension: {len(embedding)}")
    else:
        print(f"❌ Failed!")
        print(f"Response: {response.text}")
        
except requests.exceptions.Timeout:
    print("❌ Request timed out after 10 seconds")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Check API endpoint directly
print("\n🧪 Test 2: Check if Jina API is reachable")
try:
    response = requests.get("https://api.jina.ai", timeout=5)
    print(f"✅ Jina API is reachable (status: {response.status_code})")
except Exception as e:
    print(f"❌ Cannot reach Jina API: {e}")