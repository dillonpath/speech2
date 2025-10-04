# Social X-Ray Cloudflare Worker

API backend for Social X-Ray speech analysis app with D1 database integration.

## Setup Instructions

### 1. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

### 2. Create D1 Database

```bash
# Create the database
npm run db:create

# This will output a database ID. Copy it and update wrangler.toml
```

Update `wrangler.toml` with your database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "social-xray-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace this
```

### 3. Initialize Database Schema

```bash
# Run the schema migration
npm run db:init
```

### 4. Set Environment Variables

Add your Gemini API key to `wrangler.toml`:
```toml
[vars]
GEMINI_API_KEY = "your_gemini_api_key_here"
```

### 5. Run Development Server

```bash
npm run dev
```

The worker will run at `http://localhost:8787`

### 6. Deploy to Production

```bash
npm run deploy
```

## API Endpoints

All endpoints require Firebase Auth token in header:
```
Authorization: Bearer <firebase-id-token>
```

### Conversations

- `POST /api/conversations/start` - Start a new recording session
  ```json
  { "title": "Optional conversation title" }
  ```

- `POST /api/conversations/:id/end` - End a conversation

### Speech Segments

- `POST /api/segments` - Save a speech segment with analysis
  ```json
  {
    "conversationId": "conv-123",
    "transcription": "Hello world",
    "speaker": "user",
    "sentiment": "neutral",
    "timestamp": 1234567890,
    "durationMs": 10000,
    "analysis": {
      "stutters": [],
      "pauses": [],
      "tone": {},
      "fillerWords": [],
      "speakingRate": {},
      "confidence": {},
      "interruptions": {},
      "keyInsights": []
    }
  }
  ```

### Summaries

- `POST /api/conversations/:id/summary` - Generate summary and grade
- `GET /api/conversations/:id/summary` - Get conversation summary
- `GET /api/summaries` - Get all user summaries

## Database Schema

### Tables
- `conversations` - Recording sessions
- `speech_segments` - 10-second audio chunks with Gemini analysis
- `conversation_summaries` - Aggregated analysis and grades (A-F)
- `user_stats` - User progress tracking

### Grading System

Score is calculated from:
- Filler word rate (max -20 points)
- Stutter rate (max -15 points)
- Speaking rate (max -15 points)
- Confidence score (max -20 points)
- Pause duration (max -15 points)

Grades:
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: <60

## Frontend Integration

Update your frontend `.env`:
```env
CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev
```

The frontend will automatically save segments to D1 during recording and generate a summary when stopped.
