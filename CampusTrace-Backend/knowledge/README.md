# CampusTrace RAG Knowledge Base

## Overview

This directory contains the knowledge base for the CampusTrace RAG (Retrieval-Augmented Generation) chatbot. The chatbot uses this information to answer user questions accurately about the system, processes, and FAQs.

## Files

- `CampusTrace_System_Knowledge.md` - Comprehensive system documentation including:
  - System overview and features
  - All app screens/pages and their functions
  - Step-by-step user processes
  - FAQs
  - Safety guidelines
  - Tips for success

## How It Works

### 1. Knowledge Base Structure

The knowledge base is organized into sections:

- **System Overview**: What CampusTrace is and does
- **Main Features**: Smart matching, reporting, claiming, handover
- **App Screens/Pages**: Detailed description of each screen
- **User Processes**: Step-by-step guides for common tasks
- **Categories & Locations**: Available options
- **Badges & Gamification**: Reward system
- **FAQs**: Common questions and answers
- **Tips & Safety**: Best practices

### 2. Embedding Process

The knowledge base is split into chunks and embedded using Jina AI embeddings:

```bash
# Run from backend directory
python embed_system_knowledge.py
```

This script:

- Reads the markdown file
- Splits it into semantic chunks (by sections)
- Generates embeddings for each chunk
- Stores them in the database
- Makes them searchable by the chatbot

### 3. RAG Chatbot Flow

When a user asks a question:

1. **Query Embedding**: User's question is embedded
2. **Similarity Search**: Find most relevant knowledge chunks (cosine similarity)
3. **Context Building**: Top chunks are added to AI prompt
4. **Response Generation**: Gemini AI generates answer using retrieved context
5. **Caching**: Response is cached for faster future queries

### 4. Chatbot Features

- **Accurate Answers**: Uses actual system documentation
- **Context-Aware**: Understands conversation history
- **Item Search**: Can also search for lost/found items
- **Caching**: Fast responses for common questions
- **Token Optimization**: Efficient to reduce API costs

## Usage

### Embedding the Knowledge Base

```bash
cd CampusTrace-Backend
python embed_system_knowledge.py
```

### Testing the Chatbot

The chatbot is available at:

- **Mobile App**: Chatbot screen (robot icon)
- **API Endpoint**: `POST /api/chatbot/chat`

Example API request:

```json
{
  "message": "How do I report a lost item?",
  "conversation_history": []
}
```

### Updating the Knowledge Base

1. Edit `CampusTrace_System_Knowledge.md`
2. Run `python embed_system_knowledge.py` to re-embed
3. Old chunks are automatically deleted and replaced

## Best Practices

### Writing Knowledge Base Content

- **Be Clear**: Use simple, direct language
- **Be Specific**: Include exact steps and screen names
- **Be Complete**: Cover all features and processes
- **Use Examples**: Show real scenarios
- **Update Regularly**: Keep in sync with app changes

### Chunk Size

- Aim for 500-1000 characters per chunk
- Each chunk should be self-contained
- Include context (section headers) in chunks

### Testing

After embedding, test with common questions:

- "How do I report a lost item?"
- "What is smart AI matching?"
- "How does handover work?"
- "What screens are in the app?"

## Troubleshooting

### Chatbot gives wrong answers

- Check if knowledge base is up to date
- Re-embed the knowledge base
- Verify chunks are being retrieved (check logs)

### Chatbot says "I don't know"

- Question might be too vague
- Knowledge base might not cover that topic
- Add more information to the knowledge base

### Slow responses

- Check cache stats: `GET /api/chatbot/cache-stats`
- Clear cache if needed: `DELETE /api/chatbot/clear-cache`
- Reduce chunk retrieval limit

## Architecture

```
User Question
     ↓
Query Embedding (Jina AI)
     ↓
Vector Similarity Search
     ↓
Retrieve Top 3 Chunks
     ↓
Build Context (chunks + conversation history)
     ↓
Generate Response (Gemini AI)
     ↓
Cache Response
     ↓
Return to User
```

## Maintenance

### Regular Updates

- Update knowledge base when features change
- Re-embed after major updates
- Test chatbot responses
- Monitor user feedback

### Monitoring

- Check cache hit rate
- Monitor API usage
- Review chatbot logs
- Track user satisfaction

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Image-based queries
- [ ] Personalized responses
- [ ] Analytics dashboard
- [ ] A/B testing for responses

## Support

For issues or questions:

- Check backend logs
- Review chunk retrieval in database
- Test with `embed_system_knowledge.py`
- Contact: support@campustrace.site
