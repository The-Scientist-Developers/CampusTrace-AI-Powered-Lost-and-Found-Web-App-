# CampusTrace Infomercial - Quick Production Reference

**Quick links to detailed files:**

- 📝 Full script: `HEYGEN_INFOMERCIAL_SCRIPT.md`
- 🎬 Recording guide: `SCREEN_RECORDING_PROCESS_GUIDE.md`

---

## ⏱️ QUICK TIMING GUIDE (180 seconds total)

```
0:00-0:10  (10s)  ▓░░░░░░░░░░ HOOK - Problem statement
0:10-0:30  (20s)  ▓▓░░░░░░░░░ Multi-tenant architecture
0:30-0:50  (20s)  ▓▓▓░░░░░░░░ AI Automatic Matching
0:50-1:10  (20s)  ▓▓▓▓░░░░░░░ RAG Chatbot
1:10-1:30  (20s)  ▓▓▓▓▓░░░░░░ Description Enhancer
1:30-1:50  (20s)  ▓▓▓▓▓▓░░░░░ Auto Photo Detection
1:50-2:10  (20s)  ▓▓▓▓▓▓▓░░░░ XAI Explainability
2:10-2:30  (20s)  ▓▓▓▓▓▓▓▓░░░ Tech Stack
2:30-3:00  (30s)  ▓▓▓▓▓▓▓▓▓░░ Call to Action
```

---

## 🎯 FEATURE DEMO CHECKLIST

### ✅ BEFORE RECORDING STARTS

- [ ] All apps closed except what you're demoing
- [ ] Internet connection stable
- [ ] Screen resolution set to 1920x1080
- [ ] Test data ready in database
- [ ] Backend server running
- [ ] Chat API keys working
- [ ] Video recording software ready
- [ ] Microphone/audio levels checked
- [ ] No notifications or popups will appear

---

### SECTION 1: Hook (0:00-0:10)

**What Avatar Says:**

> "Every year, thousands of valuable items go missing on university campuses..."

**You Record:**

- [ ] Sad montage of lost items (5s) - Phone, wallet, backpack, laptop
- [ ] Transition to CampusTrace logo (5s) - Tech elements, glow effect

---

### SECTION 2: Multi-Tenant (0:10-0:30)

**What Avatar Says:**

> "Meet CampusTrace. An AI-powered, multi-tenant lost and found platform..."

**You Record:**

- [ ] Architecture diagram with 3-4 university containers (5s)
- [ ] Dashboard login and university switch (5s)
- [ ] Database schema showing university_id isolation (10s)

**Items Needed:**

- Architecture diagram file
- Access to CampusTrace admin dashboard
- University selector functional

---

### SECTION 3: AI Matching (0:30-0:50)

**What Avatar Says:**

> "Users report a lost laptop. They upload a photo. Our Gemini AI..."

**You Record:**

- [ ] "Post Item" screen with lost laptop details (5s)
- [ ] AI processing animation (5s)
- [ ] 87% match results displayed (5s)
- [ ] Push notification arriving (5s)

**Items Needed:**

- Approved "Lost" item ready
- Matching "Found" item in database
- Real laptop photo for upload
- Actual match percentage ready (87% or similar)

**API Calls Needed:**

- POST /api/items (create item)
- GET /api/chatbot/match (trigger matching)
- Show match results response

---

### SECTION 4: RAG Chatbot (0:50-1:10)

**What Avatar Says:**

> "Feature Two: The RAG Chatbot. Retrieval-Augmented Generation..."

**You Record:**

- [ ] Chat interface opening (3s)
- [ ] User types "How do I claim an item?" (2s)
- [ ] Chatbot "thinking" animation (2s)
- [ ] Knowledge chunks being retrieved visualization (3s)
- [ ] Chatbot response appears with typing effect (5s)
- [ ] Follow-up question demo (2s)

**Items Needed:**

- Chatbot UI accessible
- Knowledge base embedded (CampusTrace_System_Knowledge.md)
- Real chatbot responses available
- Backend logs showing retrieval

**API Calls Needed:**

- POST /api/chatbot/chat
- GET /api/chatbot/cache-stats (show knowledge chunks)

---

### SECTION 5: Description Enhancer (1:10-1:30)

**What Avatar Says:**

> "Feature Three: AI Description Enhancer. A student types 'Red backpack, lost it.'"

**You Record:**

- [ ] Show vague description input (3s)
- [ ] AI processing animation (2s)
- [ ] Enhanced description comparison (8s)
- [ ] Improved match results showing impact (7s)

**Items Needed:**

- Before text: "Red backpack, lost it"
- After text: Enhanced version from Gemini
- Real Gemini API response (test locally if needed)
- Matching results showing improvement

**If Not Built:**

- Screenshot before/after descriptions
- Gemini API output from test run
- Manually show matching improvement

---

### SECTION 6: Auto Photo Detection (1:30-1:50)

**What Avatar Says:**

> "Upload a photo of your lost iPhone. Our vision AI identifies..."

**You Record:**

- [ ] Photo upload interface (3s)
- [ ] AI vision detection processing (5s)
  - Bounding boxes
  - "Analyzing image..." progress
  - Detected attributes (model, color, condition)
- [ ] Auto-filled form fields appearing (8s)
- [ ] Form ready to submit (4s)

**Items Needed:**

- Photo of iPhone or similar device
- Real Gemini vision output (test with actual image)
- Form screenshot showing all fields filled
- Confidence score visible (95%)

**API Calls Needed:**

- POST /api/items/auto-detect (with photo)
- Show vision analysis response

---

### SECTION 7: XAI Explainability (1:50-2:10)

**What Avatar Says:**

> "Feature Five: XAI—Explainable Artificial Intelligence. We don't just say..."

**You Record:**

- [ ] Match result showing 87% (2s)
- [ ] "Why?" section expanding (1s)
- [ ] Animated breakdown of factors:
  - [ ] Brand match: 100% (2s)
  - [ ] Color match: 92% (2s)
  - [ ] Screen size: 100% (2s)
  - [ ] Damage pattern: 87% (2s)
  - [ ] Description: 82% (2s)
  - [ ] Location: 100% (2s)
  - [ ] Time: 95% (2s)
  - [ ] Final score: 87% (2s)
- [ ] Trust badge and confidence controls (2s)

**Items Needed:**

- Real match with explainability breakdown
- All confidence percentages calculated
- Trust threshold slider visible
- XAI interface in app

---

### SECTION 8: Tech Stack (2:10-2:30)

**What Avatar Says:**

> "Under the hood, CampusTrace is built on cutting-edge computer science..."

**You Record:**

- [ ] Full architecture diagram with layers (8s)
  - Frontend tier
  - API gateway
  - Backend services
  - Database
  - AI services
- [ ] Tech stack badges appearing (5s)
  - Frontend: React, React Native, Vite
  - Backend: Python, FastAPI
  - DB: PostgreSQL, Supabase, Redis
  - AI: Gemini, Jina
- [ ] Performance metrics (4s)
  - Match time: 0.8s
  - Top-1 accuracy: 94.3%
  - Response time: 245ms
  - Uptime: 99.9%
- [ ] Deployment infrastructure (3s)

**Items Needed:**

- Architecture diagram (create or screenshot)
- Tech stack logos/icons
- Real performance metrics from your monitoring
- Deployment diagram or screenshot

---

### SECTION 9: Call to Action (2:30-3:00)

**What Avatar Says:**

> "Imagine your campus without lost items. CampusTrace makes that real..."

**You Record:**

- [ ] Success testimonials/quotes (10s)
  - Sarah Chen, MIT: "Found laptop in 12 minutes"
  - James Rodriguez, Harvard: "Best campus app"
  - Admin testimonial: "340% recovery increase"
- [ ] App store screenshots (10s)
  - iOS App Store card
  - Google Play card
  - Download buttons prominent
- [ ] QR code for downloads (3s)
- [ ] Brand animation with logo (3s)
- [ ] Website URL and contact info (3s)
- [ ] Final fade out (1s)

**Items Needed:**

- Testimonial videos or quotes with photos
- iOS App Store screenshots
- Google Play screenshots
- QR code linking to download page
- Website URL: campustrace.site
- Logo animation file (MP4)
- Contact email visible

---

## 🎬 RECORDING COMMAND EXAMPLES

### **Using OBS Studio (Free)**

```bash
# Record screen at 1920x1080, 60fps
# Settings:
# - Output: 1920x1080
# - FPS: 60
# - Bitrate: 8000-15000 kbps
# - Codec: H.264
# - Format: MP4
```

### **Using FFmpeg (CLI)**

```bash
# Record screen (Windows)
ffmpeg -f gdigrab -framerate 60 -i desktop -c:v libx264 -preset fast \
  -crf 18 -s 1920x1080 output.mp4

# Record with audio
ffmpeg -f gdigrab -framerate 60 -i desktop \
  -f dshow -i audio="Microphone" \
  -c:v libx264 -preset fast -c:a aac output.mp4
```

### **Using Camtasia (Paid)**

```
1. Open Camtasia
2. Click "Record"
3. Select screen region
4. Set quality: Custom > 1920x1080, 60fps
5. Enable audio capture
6. Click "Record"
```

---

## 📊 REQUIRED TEST DATA

### Items to have ready before recording:

**For Matching Demo:**

```json
{
  "lost_item": {
    "title": "Dell Laptop 15-inch, Gray",
    "description": "4GB RAM, charger in bag, dent on corner",
    "category": "Electronics",
    "location": "Library - Building A",
    "photo": "laptop_lost.jpg",
    "status": "Lost"
  },
  "found_item": {
    "title": "Gray Laptop, 15.6-inch - FOUND",
    "description": "Found near library, has charger",
    "category": "Electronics",
    "location": "Library - Building A",
    "photo": "laptop_found.jpg",
    "status": "Found",
    "expected_match": "87%"
  }
}
```

**For Photo Detection Demo:**

```json
{
  "photo": "iphone_photo.jpg",
  "expected_detection": {
    "type": "iPhone",
    "model": "iPhone 14 Pro",
    "color": "Space Black",
    "condition": "Good",
    "confidence": 0.98
  }
}
```

---

## 🔧 SYSTEM REQUIREMENTS FOR RECORDING

**Minimum:**

- 8GB RAM
- Quad-core processor
- 10 Mbps internet (for API calls)
- SSD with 20GB free space
- 1920x1080 display (or larger)

**Recommended:**

- 16GB RAM
- 8-core processor
- 50 Mbps internet
- NVMe SSD
- 4K display
- Dedicated GPU (for H.264 encoding)

---

## 📹 EDITING CHECKLIST

After recording all sections:

- [ ] Trim excess footage (start/end)
- [ ] Align with script timing (±0.5 seconds)
- [ ] Add transitions between sections (0.5s crossfade)
- [ ] Color grade for consistency
- [ ] Normalize audio levels
- [ ] Add captions/subtitles
- [ ] Embed logo watermarks if needed
- [ ] Export final MP4 (H.264, 1920x1080, 60fps)
- [ ] Verify file size < 500MB
- [ ] Test playback on target display
- [ ] Create backup copies

---

## 🎙️ HEYGAN SETUP QUICK STEPS

1. **Create HeyGen Account**
   - Go to heyagen.com
   - Sign up / Login
   - Create new project

2. **Select Avatar**
   - Choose professional presenter avatar
   - Test voice (English, professional tone)
   - Adjust speed (85-95% normal)

3. **Upload Script**
   - Copy full script from `HEYGEN_INFOMERCIAL_SCRIPT.md`
   - Paste into HeyGen editor
   - Enable emotion markers in speech

4. **Configure Settings**
   - Language: English (US)
   - Voice: Professional/Authoritative
   - Speed: 85-90%
   - Tone: Enthusiastic but professional
   - Pause timing: Auto

5. **Add Screen Recordings**
   - Import MP4 screen recordings
   - Sync with avatar speaking
   - Adjust timing in timeline editor
   - Preview and iterate

6. **Generate Video**
   - Click "Generate"
   - Wait for processing (15-30 min)
   - Download final MP4
   - Test on all devices

---

## 📱 PLAYBACK TESTING

Before final deployment, test on:

- [ ] Laptop/Desktop (Chrome, Firefox, Safari)
- [ ] Tablet (iPad, Android)
- [ ] Mobile phone (iPhone, Android)
- [ ] Exhibit display system
- [ ] Projector (if used)
- [ ] Different audio systems

**Check for:**

- ✅ Smooth playback (no stuttering)
- ✅ Audio sync is perfect
- ✅ All text readable
- ✅ Colors look correct
- ✅ No artifacts or glitches

---

## 🎯 FINAL DELIVERABLES

```
CampusTrace_Infomercial_FINAL/
├── CampusTrace_Infomercial_3min.mp4 (Main video)
├── CampusTrace_Infomercial_3min.srt (Subtitles)
├── CampusTrace_Infomercial_3min_4K.mp4 (4K version, optional)
├── thumbnail.png (1280x720)
├── description.txt (YouTube/social media)
└── README.txt (Deployment instructions)
```

---

## 📞 QUICK TROUBLESHOOTING

| Problem                | Solution                                           |
| ---------------------- | -------------------------------------------------- |
| Audio out of sync      | Re-export from HeyGen with offset adjustment       |
| Video stuttering       | Reduce bitrate or frame rate in source             |
| Text unreadable        | Increase font size to 24pt minimum                 |
| API calls show errors  | Check backend is running, API keys valid           |
| Long processing time   | Close background apps, increase RAM allocation     |
| Color looks washed out | Apply color grading adjustment in editing software |
| Video too large        | Re-export with CRF 23 instead of 18                |

---

## ✅ GO-LIVE CHECKLIST

- [ ] All sections recorded (9 total)
- [ ] HeyGen avatar video generated
- [ ] Final video rendered and tested
- [ ] Subtitles created and synced
- [ ] Video plays without errors
- [ ] All stakeholders approved
- [ ] Backup copy created
- [ ] Deployment system tested
- [ ] Loop settings configured (continuous play)
- [ ] Audio levels set for exhibit space
- [ ] Display resolution optimized
- [ ] Emergency stop button configured

---

**Ready to produce? Start with:**

1. Prepare test data (Section 3 checklist above)
2. Record Section 1 (Hook) - easiest, gets you rolling
3. Work through Sections 2-9 in order
4. Edit and sync in HeyGen
5. Test on target display
6. Deploy!

**Estimated Time: 8-10 hours for professional quality**

Good luck! 🚀
