"""
Embed CampusTrace System Knowledge Base
Reads the system knowledge markdown file and stores embeddings for RAG chatbot
"""

import asyncio
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.dependencies import supabase
from app.chunk_processor import store_chunks_with_embeddings, delete_chunks_for_item


async def parse_and_embed_knowledge():
    """
    Parse the system knowledge markdown file and embed each chunk
    """
    # Path to knowledge base
    knowledge_path = Path(__file__).parent / "knowledge" / "CampusTrace_System_Knowledge.md"
    
    if not knowledge_path.exists():
        print(f"❌ File not found: {knowledge_path}")
        return
    
    print(f"📖 Reading knowledge base from: {knowledge_path}")
    
    # Read the file
    with open(knowledge_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into chunks by sections (## headers)
    chunks = []
    current_chunk = ""
    
    for line in content.split('\n'):
        if line.startswith('## '):
            # New section - save previous chunk
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = line + '\n'
        elif line.startswith('### '):
            # Subsection - save previous if too long
            if len(current_chunk) > 800:
                chunks.append(current_chunk.strip())
                current_chunk = line + '\n'
            else:
                current_chunk += line + '\n'
        elif line.startswith('---'):
            # Separator - save chunk
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
                current_chunk = ""
        else:
            current_chunk += line + '\n'
            
            # Split if chunk gets too large (>1000 chars)
            if len(current_chunk) > 1000 and line.strip() == '':
                chunks.append(current_chunk.strip())
                current_chunk = ""
    
    # Add final chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    print(f"📄 Parsed {len(chunks)} chunks from knowledge base")
    
    # Create or get a special Knowledge Base "item" in database
    kb_item_result = supabase.table("items").select("id").eq(
        "title", "CampusTrace System Knowledge"
    ).eq("status", "Found").execute()
    
    if kb_item_result.data:
        kb_item_id = kb_item_result.data[0]["id"]
        print(f"📌 Using existing Knowledge Base item ID: {kb_item_id}")
        
        # Delete old chunks first
        await delete_chunks_for_item(kb_item_id)
        print("🗑️ Deleted old knowledge base chunks")
    else:
        # Create a new Knowledge Base item using first admin user
        print("📝 Creating new Knowledge Base item...")
        
        # Get first admin user
        admin_result = supabase.table("profiles").select("id").eq(
            "role", "admin"
        ).limit(1).execute()
        
        if not admin_result.data:
            print("❌ No admin user found. Please create an admin user first.")
            return
        
        admin_id = admin_result.data[0]["id"]
        
        # Get admin's university
        admin_profile = supabase.table("profiles").select("university_id").eq(
            "id", admin_id
        ).single().execute()
        
        university_id = admin_profile.data["university_id"]
        
        new_item = supabase.table("items").insert({
            "title": "CampusTrace System Knowledge",
            "description": "System documentation, processes, and FAQs for CampusTrace",
            "status": "Found",
            "category": "Other",
            "location": "System",
            "user_id": admin_id,
            "university_id": university_id,
            "moderation_status": "approved"
        }).execute()
        
        kb_item_id = new_item.data[0]["id"]
        print(f"✅ Created Knowledge Base item with ID: {kb_item_id}")
    
    # Preview first few chunks
    print(f"\n{'='*60}")
    print("📋 Preview of chunks to be embedded:")
    print(f"{'='*60}\n")
    
    for i, chunk in enumerate(chunks[:3], 1):
        preview = chunk[:150].replace('\n', ' ')
        print(f"{i}. {preview}...")
        print()
    
    if len(chunks) > 3:
        print(f"... and {len(chunks) - 3} more chunks\n")
    
    print(f"{'='*60}")
    print(f"🚀 Embedding {len(chunks)} chunks...")
    print(f"{'='*60}\n")
    
    chunk_ids = await store_chunks_with_embeddings(kb_item_id, chunks)
    
    print(f"\n{'='*60}")
    print(f"✅ Successfully embedded {len(chunk_ids)}/{len(chunks)} knowledge base chunks!")
    print(f"Knowledge Base Item ID: {kb_item_id}")
    print(f"Chunk IDs: {chunk_ids[:5]}..." if len(chunk_ids) > 5 else f"Chunk IDs: {chunk_ids}")
    print(f"{'='*60}\n")
    
    print("🎉 System knowledge is now searchable via the RAG chatbot!")
    
    return {
        "kb_item_id": kb_item_id,
        "chunks_embedded": len(chunk_ids),
        "total_chunks": len(chunks)
    }


async def test_knowledge_search():
    """
    Test searching the embedded knowledge base
    """
    from app.chunk_processor import retrieve_relevant_chunks
    
    test_queries = [
        "How do I report a lost item?",
        "What is smart AI matching?",
        "How does the handover process work?",
        "What screens are available in the app?",
        "How do I claim an item?",
    ]
    
    print("\n🧪 Testing Knowledge Base Search\n")
    
    for query in test_queries:
        print(f"Query: {query}")
        chunks = await retrieve_relevant_chunks(
            query=query,
            university_id=None,  # Knowledge base is universal
            top_k=2,
            similarity_threshold=0.3
        )
        
        if chunks:
            print(f"✅ Found {len(chunks)} relevant chunks")
            for i, chunk in enumerate(chunks, 1):
                preview = chunk.get("chunk_text", "")[:100].replace('\n', ' ')
                similarity = chunk.get("similarity", 0)
                print(f"   {i}. [{similarity:.2f}] {preview}...")
        else:
            print("❌ No relevant chunks found")
        print()


if __name__ == "__main__":
    print("="*60)
    print("CampusTrace System Knowledge Embedder")
    print("="*60)
    print()
    
    # Embed the knowledge base
    result = asyncio.run(parse_and_embed_knowledge())
    
    # Test search
    if result:
        print("\n" + "="*60)
        asyncio.run(test_knowledge_search())
