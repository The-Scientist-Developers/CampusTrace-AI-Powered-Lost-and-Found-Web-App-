"""
Embed CampusTrace User FAQ Document
Reads the chunked FAQ markdown file and stores embeddings
"""

import asyncio
import re
import sys
import os
from pathlib import Path

# Add the backend directory to Python path and load environment
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = backend_dir / '.env'
load_dotenv(env_path)

from app.chunk_processor import store_chunks_with_embeddings
from app.dependencies import supabase


async def parse_and_embed_faq():
    """
    Parse the FAQ markdown file and embed each chunk
    """
    # Path to your chunked document
    faq_path = Path(r"C:\Documents\Knowledge\CampusTrace_User_FAQ.md")
    
    if not faq_path.exists():
        print(f"❌ File not found: {faq_path}")
        return
    
    print(f"📖 Reading FAQ from: {faq_path}")
    
    # Read the file
    with open(faq_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"✅ File loaded ({len(content)} characters)")
    
    # Parse chunks based on markdown structure
    # Strategy 1: Split by ## headers (sections)
    chunks = []
    
    # Split by level 2 headers (##)
    sections = re.split(r'\n## ', content)
    
    for section in sections:
        if section.strip():
            # Clean up and add header back
            if not section.startswith('##'):
                section = '## ' + section
            
            # Further split large sections by ### headers if needed
            if len(section) > 500:  # If section is too large
                subsections = re.split(r'\n### ', section)
                for subsection in subsections:
                    if subsection.strip():
                        if not subsection.startswith('###') and not subsection.startswith('##'):
                            subsection = '### ' + subsection
                        chunks.append(subsection.strip())
            else:
                chunks.append(section.strip())
    
    print(f"📄 Parsed {len(chunks)} chunks from FAQ")
    
    # Create or get a special FAQ "item" in database
    # First, check if FAQ item exists
    faq_item_result = supabase.table("items").select("id").eq(
        "title", "CampusTrace FAQ"
    ).eq("status", "Found").execute()
    
    if faq_item_result.data:
        faq_item_id = faq_item_result.data[0]["id"]
        print(f"📌 Using existing FAQ item ID: {faq_item_id}")
        
        # Delete old chunks first
        from app.chunk_processor import delete_chunks_for_item
        await delete_chunks_for_item(faq_item_id)
        print("🗑️ Deleted old FAQ chunks")
    else:
        # Create a new FAQ item using first admin user
        print("📝 Creating new FAQ item...")
        
        # Get first admin user
        admin_result = supabase.table("profiles").select("id, university_id").eq(
            "role", "admin"
        ).limit(1).execute()
        
        if not admin_result.data:
            print("❌ No admin user found. Creating with first user...")
            # Get any user
            user_result = supabase.table("profiles").select("id, university_id").limit(1).execute()
            if not user_result.data:
                print("❌ No users found in database!")
                return
            admin_user = user_result.data[0]
        else:
            admin_user = admin_result.data[0]
        
        print(f"   Using user ID: {admin_user['id']}")
        
        new_item = supabase.table("items").insert({
            "title": "CampusTrace FAQ",
            "description": "Frequently Asked Questions about CampusTrace",
            "status": "Found",
            "category": "Others",
            "location": "System Documentation",
            "user_id": admin_user["id"],
            "university_id": admin_user["university_id"],
            "moderation_status": "approved"
        }).execute()
        
        faq_item_id = new_item.data[0]["id"]
        print(f"✅ Created FAQ item with ID: {faq_item_id}")
    
    # Preview first few chunks
    print("\n📋 Preview of chunks:")
    for i, chunk in enumerate(chunks[:3], 1):
        preview = chunk[:100].replace('\n', ' ')
        print(f"  {i}. {preview}...")
    if len(chunks) > 3:
        print(f"  ... and {len(chunks) - 3} more chunks")
    
    # Confirm before proceeding
    print(f"\n⚠️  About to embed {len(chunks)} chunks")
    print("This will make API calls to Jina AI")
    response = input("Continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Cancelled")
        return
    
    # Embed and store
    print(f"\n{'='*60}")
    print(f"🚀 Starting embedding process")
    print(f"{'='*60}\n")
    
    chunk_ids = await store_chunks_with_embeddings(faq_item_id, chunks)
    
    print(f"\n{'='*60}")
    print(f"✅ Successfully embedded {len(chunk_ids)}/{len(chunks)} FAQ chunks!")
    print(f"FAQ Item ID: {faq_item_id}")
    print(f"Chunk IDs: {chunk_ids[:5]}..." if len(chunk_ids) > 5 else f"Chunk IDs: {chunk_ids}")
    print(f"{'='*60}\n")
    
    print("🎉 FAQ is now searchable via the RAG chatbot!")
    
    return {
        "faq_item_id": faq_item_id,
        "chunks_embedded": len(chunk_ids),
        "total_chunks": len(chunks)
    }


async def test_faq_search():
    """
    Test searching the embedded FAQ
    """
    from app.chunk_processor import retrieve_relevant_chunks
    
    test_queries = [
        "How do I report a lost item?",
        "What is the claim process?",
        "How do I contact someone about a found item?"
    ]
    
    print("\n🧪 Testing FAQ Search\n")
    
    for query in test_queries:
        print(f"Query: '{query}'")
        chunks = await retrieve_relevant_chunks(
            query=query,
            university_id=1,
            top_k=3,
            similarity_threshold=0.3
        )
        
        if chunks:
            print(f"  ✅ Found {len(chunks)} relevant chunks:")
            for i, chunk in enumerate(chunks, 1):
                preview = chunk.get('chunk_text', '')[:80].replace('\n', ' ')
                similarity = chunk.get('similarity', 0)
                print(f"    {i}. [{similarity:.2%}] {preview}...")
        else:
            print("  ❌ No relevant chunks found")
        print()


if __name__ == "__main__":
    print("="*60)
    print("CampusTrace FAQ Embedder")
    print("="*60)
    print()
    
    # Embed the FAQ
    result = asyncio.run(parse_and_embed_faq())
    
    # Test search
    if result:
        print("\n" + "="*60)
        asyncio.run(test_faq_search())
