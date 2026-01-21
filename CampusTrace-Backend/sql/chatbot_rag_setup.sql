-- SQL for Chatbot RAG System
-- Run this in Supabase SQL Editor

-- 1. Create document_chunks table (if not exists)
-- Note: No vector index due to 2000-dimension limit, but works fine for small datasets
CREATE TABLE IF NOT EXISTS document_chunks (
    id bigserial PRIMARY KEY,
    item_id bigint REFERENCES items(id) ON DELETE CASCADE,
    chunk_text text NOT NULL,
    chunk_index integer NOT NULL,
    chunk_embedding vector(2048),
    created_at timestamp with time zone DEFAULT now()
);

-- Index for item lookup
CREATE INDEX IF NOT EXISTS idx_chunks_item_id ON document_chunks(item_id);

-- 2. Cosine similarity search function (optimized for small token output)
CREATE OR REPLACE FUNCTION search_chunks_cosine(
    query_embedding vector(2048),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 3
)
RETURNS TABLE (
    id bigint,
    item_id bigint,
    chunk_text text,
    chunk_index int,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.item_id,
        -- Truncate chunk text to 300 chars to save tokens
        LEFT(dc.chunk_text, 300) as chunk_text,
        dc.chunk_index,
        -- Cosine similarity: 1 - cosine_distance
        (1 - (dc.chunk_embedding <=> query_embedding))::float as similarity
    FROM document_chunks dc
    WHERE dc.chunk_embedding IS NOT NULL
        AND (1 - (dc.chunk_embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.chunk_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 3. Search with item details (for FAQ and item chunks)
CREATE OR REPLACE FUNCTION search_chunks_with_items(
    query_embedding vector(2048),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 3
)
RETURNS TABLE (
    chunk_id bigint,
    item_id bigint,
    chunk_text text,
    chunk_index int,
    similarity float,
    item_title text,
    item_category text,
    item_status text,
    item_location text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id as chunk_id,
        dc.item_id,
        LEFT(dc.chunk_text, 300) as chunk_text,
        dc.chunk_index,
        (1 - (dc.chunk_embedding <=> query_embedding))::float as similarity,
        i.title as item_title,
        i.category as item_category,
        i.status as item_status,
        i.location as item_location
    FROM document_chunks dc
    LEFT JOIN items i ON dc.item_id = i.id
    WHERE dc.chunk_embedding IS NOT NULL
        AND (1 - (dc.chunk_embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.chunk_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 4. Simple text search fallback (no embeddings needed)
CREATE OR REPLACE FUNCTION search_chunks_text(
    search_query text,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    item_id bigint,
    chunk_text text,
    chunk_index int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.item_id,
        LEFT(dc.chunk_text, 300) as chunk_text,
        dc.chunk_index
    FROM document_chunks dc
    WHERE dc.chunk_text ILIKE '%' || search_query || '%'
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_chunks_cosine TO authenticated;
GRANT EXECUTE ON FUNCTION search_chunks_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION search_chunks_text TO authenticated;
GRANT ALL ON document_chunks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE document_chunks_id_seq TO authenticated;
