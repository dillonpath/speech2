# Social X-Ray

Real-time conversation coaching through AI-powered social skills analytics.

## Project Structure

```
speechapp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MetricsDisplay.js
│   │   ├── RealTimeFeedback.js
│   │   ├── VoiceWaveform.js
│   │   └── ReportCard.js
│   │
│   ├── screens/            # App screens
│   │   ├── HomeScreen.js
│   │   ├── ConversationScreen.js
│   │   ├── DashboardScreen.js
│   │   └── HistoryScreen.js
│   │
│   ├── services/           # Core services
│   │   ├── audioService.js
│   │   ├── geminiService.js
│   │   ├── elevenLabsService.js
│   │   ├── analysisService.js
│   │   └── feedbackService.js
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useConversation.js
│   │   ├── useRealTimeFeedback.js
│   │   └── useAudioRecording.js
│   │
│   ├── utils/              # Utility functions
│   │   ├── storage.js
│   │   ├── audioProcessing.js
│   │   └── metrics.js
│   │
│   └── config/             # App configuration
│       ├── constants.js
│       ├── elevenLabsConfig.js
│       └── thresholds.js
│
├── backend/
│   ├── workers/            # Cloudflare Workers
│   │   ├── audio-processor.js
│   │   ├── insight-generator.js
│   │   └── wrangler.toml
│   │
│   └── cache/              # Cached audio responses
│       └── pregenerated-whispers.json
│
├── assets/                 # Media files
│   ├── audio/
│   │   └── cached-feedback/
│   ├── images/
│   └── voices/
│
├── docs/                   # Documentation
│   ├── API.md
│   └── DEMO.md
│
├── App.js                  # Main app entry
├── package.json            # Dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Setup Instructions

### Prerequisites
- Node.js 16+
- React Native development environment
- Gemini API key ([Get one here](https://ai.google.dev/))
- ElevenLabs API key ([Get one here](https://elevenlabs.io/))
- Cloudflare account ([Sign up](https://dash.cloudflare.com/sign-up))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dillonpath/speech-app.git
cd speechapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_key_here
# ELEVENLABS_API_KEY=your_key_here
# CLOUDFLARE_WORKER_URL=your_worker_url
```

4. Run the app:

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Cloudflare Worker Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy workers:
```bash
cd backend/workers
wrangler deploy audio-processor.js
wrangler deploy insight-generator.js
```

## Tech Stack

- **Frontend:** React Native
- **Audio Processing:** React Native Audio
- **AI/ML:** Gemini API (speech analysis), ElevenLabs (voice feedback)
- **Real-Time Processing:** Cloudflare Workers
- **Storage:** AsyncStorage (local)

## Features (MVP)

### Phase 1: Real-Time Tracking
- Speaking time distribution (you vs. other speaker)
- Interruption detection and counting
- Speaking pace tracking (words per minute)
- Real-time haptic feedback patterns
- Live metrics display

### Phase 2: Analytics Dashboard
- Conversation report card (A-F grading)
- Speaking time visualization (pie charts)
- Interruption heatmap
- Key insights and behavioral patterns
- Personalized improvement suggestions
- Historical conversation tracking

## Development Workflow

### Branch Structure
- `main` - Production-ready code
- `backend/gemini-integration` - Gemini API work
- `frontend/*` - Frontend feature branches
- `feature/*` - General feature branches

### Making Changes
1. Create a feature branch:
```bash
git checkout -b yourname/feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Description of changes"
```

3. Push and create PR:
```bash
git push -u origin yourname/feature-name
# Then create PR on GitHub
```

## Key Files to Know

### Frontend
- `src/screens/ConversationScreen.js` - Main recording interface
- `src/hooks/useConversation.js` - Conversation state management
- `src/services/feedbackService.js` - Real-time feedback logic

### Backend
- `src/services/geminiService.js` - Gemini API integration
- `backend/workers/audio-processor.js` - Real-time audio processing
- `src/services/analysisService.js` - Metrics calculation

### Configuration
- `src/config/thresholds.js` - Feedback trigger thresholds
- `src/config/elevenLabsConfig.js` - Voice profiles

## Development Timeline

See `social-xray-mvp.md` for detailed hackathon timeline and feature breakdown.

## Documentation

- [API Documentation](docs/API.md) - API endpoints and request/response formats
- [Demo Script](docs/DEMO.md) - Complete demo presentation guide
- [MVP Plan](social-xray-mvp.md) - Full product requirements and timeline

## Team Roles

- **Frontend:** React Native app, UI components, screens
- **Backend:** Gemini API integration, Cloudflare Workers, audio processing
- **Design:** Dashboard visualization, UX flow, presentation materials
- **PM:** Timeline management, demo preparation, pitch

## License

MIT
