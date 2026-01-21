"""
Document Chunking and Embedding Processor
Converts document chunks into vector embeddings for RAG
Uses cosine similarity for efficient chunk retrieval
"""

from typing import List, Dict
from app import jina_embedding_util
from app.dependencies import supabase

# Constants for token efficiency
MAX_CHUNK_LENGTH = 300  # Limit chunk text to reduce token usage
MAX_CHUNKS_RETURNED = 3  # Return only top 3 most relevant chunks


def truncate_chunk(text: str, max_length: int = MAX_CHUNK_LENGTH) -> str:
    """Truncate chunk text to reduce token usage"""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


async def store_chunks_with_embeddings(item_id: int, chunks: List[str]) -> List[int]:
    """
    Generate embeddings for chunks and store them in database
    
    Args:
        item_id: The item ID these chunks belong to
        chunks: List of text chunks
        
    Returns:
        List of chunk IDs that were created
    """
    chunk_ids = []
    
    for idx, chunk_text in enumerate(chunks):
        try:
            # Generate embedding for this chunk
            print(f"📝 Generating embedding for chunk {idx + 1}/{len(chunks)} (item {item_id})")
            chunk_embedding = await jina_embedding_util.get_multimodal_embedding(
                text=chunk_text, 
                image=None
            )
            
            if not chunk_embedding:
                print(f"⚠️ Failed to generate embedding for chunk {idx}")
                continue
            
            # Store chunk with embedding in database
            result = supabase.table("document_chunks").insert({
                "item_id": item_id,
                "chunk_text": chunk_text,
                "chunk_index": idx,
                "chunk_embedding": chunk_embedding
            }).execute()
            
            if result.data:
                chunk_id = result.data[0]["id"]
                chunk_ids.append(chunk_id)
                print(f"✅ Chunk {idx} stored with ID {chunk_id}")
            
        except Exception as e:
            print(f"❌ Error processing chunk {idx}: {e}")
            continue
    
    print(f"✅ Stored {len(chunk_ids)}/{len(chunks)} chunks for item {item_id}")
    return chunk_ids


async def retrieve_relevant_chunks(
    query: str, 
    university_id: int = None, 
    top_k: int = MAX_CHUNKS_RETURNED,
    similarity_threshold: float = 0.3
) -> List[Dict]:
    """
    Retrieve most relevant chunks using cosine similarity search
    Returns small chunks to minimize token usage and avoid rate limits
    
    Args:
        query: User's search query
        university_id: Filter by university (optional for FAQ)
        top_k: Number of chunks to return (default: 3 for efficiency)
        similarity_threshold: Minimum cosine similarity score (0-1)
        
    Returns:
        List of relevant chunks with truncated text
    """
    try:
        # Generate embedding for the query
        print(f"🔍 Generating query embedding for: {query[:50]}...")
        query_embedding = await jina_embedding_util.get_multimodal_embedding(
            text=query,
            image=None
        )
        
        if not query_embedding:
            print("⚠️ Failed to generate query embedding")
            return []
        
        # Use cosine similarity search via SQL function
        # Try search_chunks_cosine first, then fallback
        try:
            result = supabase.rpc(
                "search_chunks_cosine",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": similarity_threshold,
                    "match_count": top_k
                }
            ).execute()
        except Exception:
            # Fallback to original function
            result = supabase.rpc(
                "search_chunks_by_similarity",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": similarity_threshold,
                    "match_count": top_k,
                    "p_university_id": university_id
                }
            ).execute()
        
        if result.data:
            # Truncate chunk text to reduce tokens
            chunks = []
            for chunk in result.data[:top_k]:
                chunks.append({
                    **chunk,
                    "chunk_text": truncate_chunk(chunk.get("chunk_text", ""))
                })
            print(f"📦 Found {len(chunks)} relevant chunks (truncated)")
            return chunks
        
        return []
        
    except Exception as e:
        print(f"❌ Error retrieving chunks: {e}")
        import traceback
        traceback.print_exc()
        return []


async def delete_chunks_for_item(item_id: int):
    """Delete all chunks for a specific item"""
    try:
        supabase.table("document_chunks").delete().eq("item_id", item_id).execute()
        print(f"🗑️ Deleted chunks for item {item_id}")
    except Exception as e:
        print(f"❌ Error deleting chunks: {e}")
