# Social X-Ray

Real-time conversation coaching through AI-powered social skills analytics.

## Project Structure

```
speechapp/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── MetricsDisplay.js
│   ├── screens/          # App screens
│   │   ├── ConversationScreen.js
│   │   └── DashboardScreen.js
│   ├── services/         # Core services
│   │   ├── audioService.js
│   │   ├── geminiService.js
│   │   └── hapticService.js
│   ├── utils/            # Utility functions
│   │   └── storage.js
│   └── config/           # App configuration
│       └── constants.js
├── backend/
│   ├── workers/          # Cloudflare Workers
│   │   ├── conversation-processor.js
│   │   └── wrangler.toml
│   └── api/              # Analytics API
│       └── analytics.js
├── assets/               # Media files
│   ├── audio/
│   └── images/
├── App.js               # Main app entry
└── package.json         # Dependencies

```

## Setup Instructions

### Prerequisites
- Node.js 16+
- React Native development environment
- Gemini API key
- Cloudflare account (for Workers)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd speechapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
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

2. Deploy worker:
```bash
cd backend/workers
wrangler deploy
```

## Tech Stack

- **Frontend:** React Native
- **Audio Processing:** React Native Audio
- **AI/ML:** Gemini API
- **Real-Time Processing:** Cloudflare Workers
- **Storage:** AsyncStorage (local)

## Features (MVP)

### Phase 1: Real-Time Tracking
- Speaking time distribution
- Interruption detection
- Speaking pace (WPM)
- Haptic feedback patterns

### Phase 2: Analytics Dashboard
- Conversation report card
- Speaking time visualization
- Key insights and patterns
- Improvement suggestions

## Development Timeline

See `social-xray-mvp.md` for detailed hackathon timeline and feature breakdown.

## Team Roles

- **Frontend:** React Native app and UI
- **Backend:** Gemini API and Cloudflare Workers
- **Design:** Dashboard and UX
- **PM:** Timeline and demo prep

## License

MIT
