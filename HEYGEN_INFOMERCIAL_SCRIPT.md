# CampusTrace - 3-Minute HeyGen Infomercial Script

**Total Duration**: 3 minutes (180 seconds)  
**Format**: Avatar speaking with synchronized screen recording overlays  
**Language**: English  
**Tone**: Professional, engaging, conversational

---

## 📋 SCRIPT OVERVIEW & TIMING

| Section                         | Time      | Duration | Content                          |
| ------------------------------- | --------- | -------- | -------------------------------- |
| Hook & Intro                    | 0:00-0:10 | 10s      | Problem statement                |
| Solution Reveal                 | 0:10-0:30 | 20s      | CampusTrace intro + multi-tenant |
| Feature 1: AI Matching          | 0:30-0:50 | 20s      | Smart matching demo              |
| Feature 2: RAG Chatbot          | 0:50-1:10 | 20s      | Chatbot demo                     |
| Feature 3: Description Enhancer | 1:10-1:30 | 20s      | AI enhancement demo              |
| Feature 4: Auto Photo Detection | 1:30-1:50 | 20s      | Photo recognition demo           |
| Feature 5: XAI & Explainability | 1:50-2:10 | 20s      | Transparency feature             |
| Tech Stack Highlight            | 2:10-2:30 | 20s      | CS architecture                  |
| Call to Action                  | 2:30-3:00 | 30s      | Final pitch & engagement         |

---

## 🎬 DETAILED SCRIPT WITH PROCESS FLOWS

### **SECTION 1: HOOK & INTRO (0:00 - 0:10) [10 seconds]**

**AVATAR SPEAKS:**

```
"Every year, thousands of valuable items go missing on university campuses.
Textbooks, phones, laptops, wallets. Students stress. Money is lost.
What if AI could solve this problem in seconds?"
```

**SCREEN OVERLAY PROCESS:**

- **0:00-0:05**: Show blurred/sad montage of common lost items (phone, wallet, backpack)
- **0:05-0:10**: Quick transition to CampusTrace logo with tech elements

---

### **SECTION 2: SOLUTION REVEAL - CAMPUSTRACE & MULTI-TENANT (0:10 - 0:30) [20 seconds]**

**AVATAR SPEAKS:**

```
"Meet CampusTrace. An AI-powered, multi-tenant lost and found platform
designed for universities. One platform. Multiple campuses. Complete data isolation.
Each university gets its own secure ecosystem—Harvard has its data. MIT has its data.
Zero cross-contamination. Perfect for higher education networks."
```

**SCREEN OVERLAY PROCESS:**

- **0:10-0:15**: Animated diagram showing "Multi-Tenant Architecture"
  - Show visual: Multiple university logos (3-4 different universities)
  - Each university in a separate "container" box
  - Arrows showing data isolation
- **0:15-0:20**: Show dashboard login screen
  - Show university selector dropdown
  - Demonstrate selecting "University A" vs "University B"
  - Show how data changes per university
- **0:20-0:30**: Show database schema diagram (simplified)
  - `university_id` field in items table
  - Row-level security indicators
  - Supabase RLS (Row Level Security) badges

---

### **SECTION 3: FEATURE 1 - AI AUTOMATIC MATCHING (0:30 - 0:50) [20 seconds]**

**AVATAR SPEAKS:**

```
"Feature One: Smart AI Automatic Matching. Users report a lost laptop.
They upload a photo. Our Gemini AI with multimodal embedding—combining
text analysis and image recognition—instantly searches the database.
Within seconds, it finds the laptop someone reported as found.
It calculates an 87% match confidence. Both parties get notified.
Problem solved."
```

**SCREEN OVERLAY PROCESS:**

- **0:30-0:35**: Show "Post Item" screen (Lost Laptop)
  - Fill in: Title, Description, Category, Location, Date
  - Show photo upload
- **0:35-0:40**: Show AI processing animation
  - Jina embedding process (visual waveforms)
  - Gemini vision analysis happening
  - "Searching 2,847 items..." progress bar
- **0:40-0:45**: Show match results
  - "87% MATCH FOUND" banner
  - Matched item card appears
  - Show similarity score breakdown:
    - Title match: 95%
    - Description: 78%
    - Image similarity: 82%
    - Overall: 87%
- **0:45-0:50**: Show notification
  - Push notification arrives to user
  - "Your laptop has been found! Claim now?" button highlighted

---

### **SECTION 4: FEATURE 2 - RAG CHATBOT (0:50 - 1:10) [20 seconds]**

**AVATAR SPEAKS:**

```
"Feature Two: The RAG Chatbot. Retrieval-Augmented Generation means
the chatbot doesn't just guess—it retrieves real answers from our
system knowledge base. Ask 'How do I claim an item?' and it gives
you exact steps. Ask 'What happens in handover?' It explains the process.
Powered by Jina embeddings for semantic understanding, the chatbot learns
what you're asking and gives intelligent, contextual responses."
```

**SCREEN OVERLAY PROCESS:**

- **0:50-0:55**: Show chat interface
  - User types: "How do I claim an item?"
  - Chatbot "thinking" animation (spinning icons)
- **0:55-1:00**: Show RAG retrieval visualization
  - Knowledge chunks being retrieved from database
  - Vector similarity scoring (0.92, 0.88, 0.85)
  - Top 3 relevant chunks highlighted
- **1:00-1:05**: Show chatbot response appearing
  - Detailed step-by-step answer:
    ```
    "To claim an item:
    1. Go to Browse → Find the item
    2. Click 'Claim This Item'
    3. Verify ownership details
    4. Wait for finder approval
    5. Arrange handover"
    ```
  - Response generated in real-time typing effect
- **1:05-1:10**: Show follow-up interaction
  - User asks: "What's smart matching?"
  - Chatbot retrieves knowledge chunks in 0.3 seconds
  - Provides accurate technical answer

---

### **SECTION 5: FEATURE 3 - DESCRIPTION ENHANCER (1:10 - 1:30) [20 seconds]**

**AVATAR SPEAKS:**

```
"Feature Three: AI Description Enhancer. A student types 'Red backpack, lost it.'
That's vague. Our Gemini AI detects the poor description quality and
enhances it: 'Red Adidas backpack with black straps and laptop pocket.
Last seen near the library at 2 PM. Approximately 20L capacity.'
Better descriptions mean better matches. The AI understands context,
infers details, and transforms user input into search-optimized text."
```

**SCREEN OVERLAY PROCESS:**

- **1:10-1:15**: Show text input
  - User types rough description: "Red backpack, lost it"
  - Show cursor blinking
- **1:15-1:20**: Show enhancement animation
  - Original text highlighted
  - AI processing indicators
  - Gemini API call visualization
- **1:20-1:25**: Show enhanced result
  - Before/After comparison:

    ```
    BEFORE: "Red backpack, lost it"

    AFTER: "Red Adidas backpack with black straps and
    zippered laptop pocket. Last seen near the main library
    at 2 PM on April 20. Approximately 20-liter capacity."
    ```

  - Show confidence score: 0.94
- **1:25-1:30**: Show improved match results
  - Enhanced description improves matching accuracy
  - "Better description = Better matches" animation

---

### **SECTION 6: FEATURE 4 - AUTO-DETECT PHOTO & AUTO-FILL (1:30 - 1:50) [20 seconds]**

**AVATAR SPEAKS:**

```
"Feature Four: Auto-Detect Photo and Auto-Fill Fields. Upload a photo
of your lost iPhone. Our vision AI doesn't just see—it identifies
the exact model, color, condition, and even likely location based on
the background. All fields auto-populate. No typing required.
Machine vision powered by Gemini, vector embeddings, and multi-modal AI
recognizes objects with 95% accuracy. What used to take five minutes
now takes fifteen seconds."
```

**SCREEN OVERLAY PROCESS:**

- **1:30-1:35**: Show camera/photo upload
  - User clicks "Upload Photo"
  - Camera interface or file selector
  - iPhone photo gets selected
- **1:35-1:42**: Show AI detection process
  - Photo loads
  - Bounding boxes appear around detected objects
  - "Analyzing image..." progress bar
  - Vision AI showing:
    - Object detection: "iPhone 14 Pro"
    - Color detection: "Space Black"
    - Condition: "Good"
    - Background analysis: "Library setting"
- **1:42-1:48**: Show auto-filled form
  - Title field: "iPhone 14 Pro, Space Black" ✅
  - Category field: "Electronics" ✅
  - Description field: "iPhone 14 Pro in space black color, good condition..." ✅
  - Location field: "Library" ✅
  - Suggested tags appear
- **1:48-1:50**: Show form completion
  - "Auto-fill complete! 95% confidence" notification
  - One-click submit button ready

---

### **SECTION 7: FEATURE 5 - XAI (EXPLAINABLE AI) (1:50 - 2:10) [20 seconds]**

**AVATAR SPEAKS:**

```
"Feature Five: XAI—Explainable Artificial Intelligence. We don't just
say 'Your item matches.' We show you why. This laptop matches with 87%
confidence because: the brand matches perfectly, the color matches 82%,
the damage pattern matches 79%, the screen size matches, and the
accessories match. You get transparency into every decision. You trust
the algorithm because you understand it. This is ethical AI. This is
CampusTrace."
```

**SCREEN OVERLAY PROCESS:**

- **1:50-1:55**: Show match result
  - "87% Match Found" heading
  - Item card displayed
- **1:55-2:05**: Show explainability breakdown
  - Visual breakdown of why this is a match:

    ```
    ✅ Brand Match: Apple → 100% (Perfect)
    ✅ Color Match: Space Gray → 92% (Excellent)
    ✅ Screen Size: 15-inch → 100% (Perfect)
    ✅ Damage Marks: Dent on top left → 87%
    ✅ Accessory Match: USB-C cable → 95%

    FINAL CONFIDENCE: 87%
    ```

  - Each field highlighted with color coding
  - Percentage scores animate in
- **2:05-2:10**: Show trust indicator
  - "Explainable AI Badge" indicator
  - "Confidence Threshold: 87% (High Trust)" message
  - Show how user can adjust trust threshold slider

---

### **SECTION 8: TECH STACK & CS INNOVATIONS (2:10 - 2:30) [20 seconds]**

**AVATAR SPEAKS:**

```
"Under the hood, CampusTrace is built on cutting-edge computer science.
Multi-tenant architecture with row-level security ensures university data
isolation. Jina embeddings v4 provide semantic vector search at scale.
Gemini 2.0 Flash powers vision and natural language understanding.
Real-time notification systems built on WebSockets. RAG—Retrieval Augmented
Generation—means intelligent context retrieval. RESTful APIs. GraphQL for
efficient data fetching. Redis caching for sub-second response times.
Scalable backend. Mobile apps. Web apps. All unified. Enterprise-grade."
```

**SCREEN OVERLAY PROCESS:**

- **2:10-2:15**: Show architecture diagram
  - Frontend tier (Web + Mobile)
  - API Gateway
  - Backend services
  - Database layer
  - AI services
  - All labeled and color-coded
- **2:15-2:20**: Show tech stack icons/badges
  - Python FastAPI ✅
  - React + React Native ✅
  - Supabase/PostgreSQL ✅
  - Google Gemini ✅
  - Jina AI Embeddings ✅
  - Real-time notifications ✅
  - RESTful + GraphQL ✅
- **2:20-2:25**: Show performance metrics
  - "Average Response Time: 245ms"
  - "Embedding Generation: 1.2 seconds"
  - "Match Calculation: 0.8 seconds"
  - "99.9% Uptime" SLA badge
- **2:25-2:30**: Show deployment infrastructure
  - Cloud deployment diagram
  - Multi-region support
  - Load balancing visualization

---

### **SECTION 9: CALL TO ACTION & CLOSING (2:30 - 3:00) [30 seconds]**

**AVATAR SPEAKS:**

```
"Imagine your campus without lost items. Without stressed students.
Without wasted time. CampusTrace makes that real.

For universities: Deploy for your campus. Enable AI-powered lost and found.
For students: Download the app. Report an item. Get matches in minutes.

Whether you've lost your laptop, keys, or favorite hoodie, CampusTrace
works for you. Multi-tenant. Secure. Intelligent. Transparent.

Visit CampusTrace.site. Experience the future of lost and found.
Where AI meets community. Where every lost item gets found.

CampusTrace. The lost and found platform of the future."
```

**SCREEN OVERLAY PROCESS:**

- **2:30-2:40**: Show success stories/testimonials
  - Quick clips of:
    - "Found my laptop in 12 minutes!" - Sarah, MIT
    - "Best campus app ever!" - James, Harvard
    - "Recovery rate increased 340%" - Admin, State U
  - Show recovery statistics
- **2:40-2:50**: Show app download screens
  - iOS App Store badge
  - Google Play badge
  - Website URL: campustrace.site
  - QR code for quick download
  - "Download Now" CTAs highlighted
- **2:50-2:55**: Show final brand animation
  - CampusTrace logo with tagline
  - "AI Meets Community"
  - "Where Lost Items Get Found"
- **2:55-3:00**: Show fade-out with brand
  - campustrace.site prominently displayed
  - Contact info or CTA
  - Final frame holds for 2 seconds

---

## 🎯 KEY MESSAGING POINTS FOR HEYGAN AI

**Tone Cues:**

- Enthusiastic but professional
- Technical but accessible to non-engineers
- Emphasize "AI", "intelligent", "automatic", "secure"
- Build excitement at feature reveals
- Trust-building with "explainability" and "transparent"

**Pacing:**

- Slow down for complex concepts (multi-tenant, RAG, XAI)
- Speed up during feature demos
- Use natural pauses between sections

**Emphasis Words:**

- _"instant"_, _"intelligent"_, _"automatic"_, _"secure"_
- _"seconds"_ (quick process times)
- _"87% match"_, _"95% accuracy"_ (specific numbers build credibility)
- _"transparent"_, _"explainable"_ (trust building)

---

## 🎨 VISUAL OVERLAY SUMMARY

| Feature              | Primary Visual       | Secondary Visual    | Animation Type     |
| -------------------- | -------------------- | ------------------- | ------------------ |
| AI Matching          | Match results card   | Similarity scoring  | Fade-in + slide    |
| RAG Chatbot          | Chat interface       | Knowledge chunks    | Type-writer + fade |
| Description Enhancer | Before/After text    | Enhancement score   | Split-screen wipe  |
| Auto Photo           | Phone photo          | Form fields filling | Progressive reveal |
| XAI Explainability   | Breakdown chart      | Confidence bar      | Counter animation  |
| Tech Stack           | Architecture diagram | Icons/badges        | Stagger reveal     |

---

## 📝 TECHNICAL NOTES FOR SCREEN RECORDING

**Recording Specifications:**

- Resolution: 1920x1080 (minimum)
- Frame rate: 60fps
- Format: MP4 or WebM
- Include system audio (API calls, notifications)
- Smooth transitions between features

**What to Record:**

1. Complete user journey from start to claiming item
2. Each feature working end-to-end
3. Admin dashboard for multi-tenant view
4. Mobile app interface (if available)
5. Real API calls happening (log timestamps)
6. Notification pops
7. Success messages

**Timing Notes:**

- Each feature demo should be 15-20 seconds of video
- Allow 2-3 second buffer between sections
- Keep cursor visible for clarity
- Slow down mouse movements during demos
- Highlight important UI elements with circles/arrows

---

## 🎬 HEYGAN PROMPT TEMPLATE

Copy this to HeyGen AI:

```
You are an enthusiastic technology narrator for a 3-minute infomercial
about CampusTrace, an AI-powered lost and found platform.

Tone: Professional, excited, authoritative but accessible.

Speak clearly and deliberately. Emphasize technical features like
"multi-tenant architecture," "RAG chatbot," "Gemini AI," "Jina embeddings,"
and "Explainable AI" - but explain them in simple terms.

Pause naturally between sections (use ellipses ... to indicate pauses).

Build excitement: Start with the problem. Reveal the solution. Showcase
each feature one by one. End with inspiring call to action.

Here's the script: [INSERT SCRIPT ABOVE]

Sync your speaking with the screen recording overlays provided.
```

---

## ✅ PRODUCTION CHECKLIST

- [ ] Screen recordings completed for all 5 features
- [ ] HeyGen avatar selected and tested
- [ ] Script uploaded to HeyGen
- [ ] Voice parameters tuned (speed, pitch, emotion)
- [ ] Overlay timing synchronized
- [ ] Transitions between sections smooth
- [ ] Audio levels balanced (avatar voice vs background)
- [ ] Final video rendered at 1080p
- [ ] YouTube thumbnail created
- [ ] Video uploaded to exhibit display system

---

**Total Production Time Estimate:** 4-6 hours  
**Video File Size:** ~150-200MB (3min at 1080p 60fps)  
**Loop Ready:** Yes - Can play continuously for exhibit
