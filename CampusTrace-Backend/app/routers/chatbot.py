"""
RAG Chatbot for CampusTrace
Retrieval-Augmented Generation chatbot that helps users find lost items
Uses cosine similarity for efficient chunk retrieval with small token output
Includes caching for embeddings and responses to reduce API calls
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import traceback
import hashlib
from functools import lru_cache
from collections import OrderedDict
import time

from app.dependencies import supabase, get_current_user_id
from app.config import get_settings
from app import jina_embedding_util
from app import shared
from app import chunk_processor
import google.generativeai as genai

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])
settings = get_settings()

# Token efficiency constants
MAX_RESPONSE_WORDS = 100  # Limit AI response to reduce tokens
MAX_ITEMS_IN_CONTEXT = 3  # Only use top 3 items for context
MAX_DESCRIPTION_LENGTH = 80  # Truncate descriptions

# Caching configuration
CACHE_MAX_SIZE = 100  # Maximum cached items
CACHE_TTL_SECONDS = 3600  # 1 hour TTL

# Cache stores
response_cache: OrderedDict = OrderedDict()  # {query_hash: (response, timestamp)}
embedding_cache: OrderedDict = OrderedDict()  # {query_hash: (embedding, timestamp)}


def get_cache_key(text: str, university_id: str = "") -> str:
    """Generate a cache key from query text"""
    normalized = text.lower().strip()
    return hashlib.md5(f"{normalized}:{university_id}".encode()).hexdigest()


def get_cached_response(cache_key: str) -> Optional[Dict]:
    """Get cached response if valid"""
    if cache_key in response_cache:
        response, timestamp = response_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL_SECONDS:
            # Move to end (LRU)
            response_cache.move_to_end(cache_key)
            print(f"✅ Cache hit for response: {cache_key[:8]}...")
            return response
        else:
            # Expired, remove
            del response_cache[cache_key]
    return None


def cache_response(cache_key: str, response: Dict):
    """Cache a response with timestamp"""
    # Evict oldest if full
    while len(response_cache) >= CACHE_MAX_SIZE:
        response_cache.popitem(last=False)
    response_cache[cache_key] = (response, time.time())
    print(f"💾 Cached response: {cache_key[:8]}...")


def get_cached_embedding(cache_key: str) -> Optional[List[float]]:
    """Get cached embedding if valid"""
    if cache_key in embedding_cache:
        embedding, timestamp = embedding_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL_SECONDS:
            embedding_cache.move_to_end(cache_key)
            print(f"✅ Cache hit for embedding: {cache_key[:8]}...")
            return embedding
        else:
            del embedding_cache[cache_key]
    return None


def cache_embedding(cache_key: str, embedding: List[float]):
    """Cache an embedding with timestamp"""
    while len(embedding_cache) >= CACHE_MAX_SIZE:
        embedding_cache.popitem(last=False)
    embedding_cache[cache_key] = (embedding, time.time())
    print(f"💾 Cached embedding: {cache_key[:8]}...")


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    response: str
    relevant_items: List[Dict]
    chunks_used: Optional[int] = 0  # Track chunks used for debugging
    

def ensure_ai_model():
    """Ensure Gemini AI model is loaded"""
    if shared.model is None and settings.GEMINI_API_KEY:
        try:
            print("🔄 Loading Gemini AI model for chatbot...")
            genai.configure(api_key=settings.GEMINI_API_KEY)
            shared.model = genai.GenerativeModel("gemini-2.5-flash")
            print("✅ Gemini AI model loaded for chatbot")
        except Exception as e:
            print(f"❌ Failed to load AI model: {e}")


async def retrieve_faq_chunks(query: str, limit: int = 3) -> List[Dict]:
    """
    Retrieve relevant FAQ chunks using cosine similarity
    Returns minimal data to save tokens
    """
    try:
        chunks = await chunk_processor.retrieve_relevant_chunks(
            query=query,
            university_id=None,  # FAQ is universal
            top_k=limit,
            similarity_threshold=0.3
        )
        return chunks
    except Exception as e:
        print(f"⚠️ FAQ chunk retrieval failed: {e}")
        return []


async def retrieve_relevant_items(query: str, university_id: str, limit: int = 3) -> List[Dict]:
    """
    Retrieve relevant items using chunk-based vector similarity search
    Returns minimal data to save tokens
    """
    try:
        # First, try to retrieve relevant chunks
        print(f"🔍 Searching chunks for query: {query[:50]}...")
        relevant_chunks = await chunk_processor.retrieve_relevant_chunks(
            query=query,
            university_id=university_id,
            top_k=limit,
            similarity_threshold=0.3
        )
        
        if relevant_chunks:
            # Extract unique items from chunks
            seen_items = set()
            items = []
            
            for chunk in relevant_chunks:
                item_id = chunk.get("item_id")
                if item_id and item_id not in seen_items:
                    seen_items.add(item_id)
                    items.append({
                        "id": item_id,
                        "title": chunk.get("item_title", "")[:50],  # Truncate
                        "category": chunk.get("item_category"),
                        "status": chunk.get("item_status"),
                        "matched_text": chunk.get("chunk_text", "")[:150],  # Small chunk
                        "similarity": round(chunk.get("similarity", 0), 2)
                    })
                    
                    if len(items) >= limit:
                        break
            
            if items:
                print(f"✅ Found {len(items)} items from chunks")
                # Fetch minimal item details
                item_ids = [item["id"] for item in items]
                full_items = supabase.table("items").select(
                    "id, title, category, location, status, thumbnail_url"
                ).in_("id", item_ids).execute()
                
                return full_items.data[:limit] if full_items.data else items[:limit]
        
        # Fallback to simple text search (no embedding to save API calls)
        print("⚠️ No chunks found, using text search fallback")
    except Exception as e:
        print(f"⚠️ Chunk search failed: {e}")
    
    # Simple text search fallback
    try:
        result = supabase.table("items").select(
            "id, title, category, location, status, thumbnail_url"
        ).eq("university_id", university_id).eq("moderation_status", "approved").or_(
            f"title.ilike.%{query}%,description.ilike.%{query}%"
        ).limit(limit).execute()
        return result.data or []
        
    except Exception as e:
        print(f"⚠️ Text search fallback failed: {e}")
        return []


async def generate_response(
    query: str, 
    relevant_items: List[Dict], 
    faq_chunks: List[Dict],
    conversation_history: List[Dict]
) -> str:
    """
    Generate chatbot response using retrieved items and FAQ chunks
    Optimized for minimal token usage
    """
    ensure_ai_model()
    
    if not shared.model:
        return "I'm sorry, I'm currently unavailable. Please try again later."
    
    # Format FAQ chunks (small context)
    faq_context = ""
    if faq_chunks:
        faq_context = "\nFAQ Knowledge:\n"
        for chunk in faq_chunks[:2]:  # Max 2 chunks
            text = chunk.get("chunk_text", "")[:200]  # Truncate
            faq_context += f"- {text}\n"
    
    # Format items context (minimal)
    items_context = ""
    if relevant_items:
        items_context = "\nFound Items:\n"
        for item in relevant_items[:MAX_ITEMS_IN_CONTEXT]:
            items_context += f"- {item.get('title', 'N/A')} ({item.get('status')}) at {item.get('location', 'N/A')}\n"
    
    # Minimal history (last 2 only)
    history_context = ""
    if conversation_history:
        history_context = "\nRecent:\n"
        for msg in conversation_history[-2:]:
            role = "U" if msg.get("role") == "user" else "A"
            content = msg.get("content", "")[:50]
            history_context += f"{role}: {content}\n"
    
    # Concise prompt
    prompt = f"""You are CampusTrace assistant. Be helpful and concise.
{faq_context}{items_context}{history_context}
User: {query}

Reply in under {MAX_RESPONSE_WORDS} words. If items found, mention them. Be friendly."""

    try:
        print(f"🤖 Generating response for: {query[:30]}...")
        response = await shared.model.generate_content_async(prompt)
        answer = response.text.strip()
        # Truncate if too long
        words = answer.split()
        if len(words) > MAX_RESPONSE_WORDS + 20:
            answer = " ".join(words[:MAX_RESPONSE_WORDS]) + "..."
        print(f"✅ Response: {answer[:60]}...")
        return answer
    except Exception as e:
        print(f"❌ Generation error: {e}")
        if "429" in str(e) or "quota" in str(e).lower():
            return "I'm a bit busy right now. Please try again in a moment."
        return "Sorry, I couldn't process that. Please try again."


@router.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    RAG-powered chatbot endpoint
    Uses cosine similarity for chunk retrieval, optimized for low token usage
    Caches responses to avoid rate limits on repeated questions
    """
    try:
        # Get user's university
        profile_res = supabase.table("profiles").select("university_id").eq("id", user_id).single().execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        university_id = profile_res.data["university_id"]
        
        # Check cache first - use normalized query as key
        cache_key = get_cache_key(message.message, str(university_id))
        cached = get_cached_response(cache_key)
        if cached:
            print(f"🚀 Returning cached response for: {message.message[:30]}...")
            return ChatResponse(
                response=cached["response"],
                relevant_items=cached["items"],
                chunks_used=cached.get("chunks", 0)
            )
        
        # Retrieve FAQ chunks first (for general questions)
        print(f"🔍 Searching FAQ for: {message.message[:30]}")
        faq_chunks = await retrieve_faq_chunks(message.message, limit=2)
        chunks_used = len(faq_chunks)
        
        # Retrieve relevant items
        print(f"🔍 Searching items for: {message.message[:30]}")
        relevant_items = await retrieve_relevant_items(message.message, university_id, limit=3)
        print(f"📦 Found {len(relevant_items)} items, {chunks_used} FAQ chunks")
        
        # Generate response with both contexts
        response = await generate_response(
            message.message,
            relevant_items,
            faq_chunks,
            message.conversation_history or []
        )
        
        # Cache the response for future use
        cache_response(cache_key, {
            "response": response,
            "items": relevant_items[:3],
            "chunks": chunks_used
        })
        
        return ChatResponse(
            response=response,
            relevant_items=relevant_items[:3],
            chunks_used=chunks_used
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Chatbot error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Chatbot error occurred")


@router.get("/suggested-questions")
async def get_suggested_questions(user_id: str = Depends(get_current_user_id)):
    """
    Get suggested questions for the chatbot
    """
    return {
        "questions": [
            "I lost my blue backpack yesterday, can you help me find it?",
            "Are there any found phones?",
            "I'm looking for a black wallet",
            "Show me recently found items",
            "Has anyone found a laptop in the library?",
            "I lost my keys near the cafeteria"
        ]
    }


@router.get("/cache-stats")
async def get_cache_stats(user_id: str = Depends(get_current_user_id)):
    """
    Get cache statistics
    """
    return {
        "response_cache_size": len(response_cache),
        "embedding_cache_size": len(embedding_cache),
        "max_size": CACHE_MAX_SIZE,
        "ttl_seconds": CACHE_TTL_SECONDS
    }


@router.delete("/clear-cache")
async def clear_cache(user_id: str = Depends(get_current_user_id)):
    """
    Clear all cached responses (admin use)
    """
    global response_cache, embedding_cache
    cleared_responses = len(response_cache)
    cleared_embeddings = len(embedding_cache)
    response_cache.clear()
    embedding_cache.clear()
    print(f"🗑️ Cache cleared: {cleared_responses} responses, {cleared_embeddings} embeddings")
    return {
        "message": "Cache cleared",
        "cleared_responses": cleared_responses,
        "cleared_embeddings": cleared_embeddings
    }


@router.post("/embed-chunks/{item_id}")
async def embed_item_chunks(
    item_id: int,
    chunks: List[str],
    user_id: str = Depends(get_current_user_id)
):
    """
    Embed and store chunks for an item
    
    Body: ["chunk 1", "chunk 2", "chunk 3"]
    """
    try:
        # Verify item belongs to user
        item = supabase.table("items").select("id, user_id").eq("id", item_id).single().execute()
        if not item.data or item.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Embed and store chunks
        chunk_ids = await chunk_processor.store_chunks_with_embeddings(item_id, chunks)
        
        return {
            "message": "Chunks embedded successfully",
            "item_id": item_id,
            "chunks_processed": len(chunks),
            "chunks_stored": len(chunk_ids),
            "chunk_ids": chunk_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error embedding chunks: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to embed chunks")
