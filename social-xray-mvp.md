# Social X-Ray: MVP Product Plan

**Tagline:** Real-time conversation coaching through AI-powered social skills analytics

**Hackathon Duration:** 36 hours  
**Category:** Human Augmentation

---

## Executive Summary

Social X-Ray is an AI-powered "social coach" that provides real-time feedback during conversations and detailed post-conversation analytics. Like a fitness tracker for social skills, it helps users improve their communication by making soft skills measurable and actionable.

**Core Value Proposition:** Turn social anxiety into data, and data into improvement.

---

## Tech Stack

- **Frontend:** React Native (iOS/Android compatibility)
- **Audio Processing:** Web Audio API / React Native Audio
- **AI/ML:** Gemini API (multimodal audio processing)
- **Real-Time Processing:** Cloudflare Workers
- **Database:** Local storage (primary), optional cloud sync
- **UI Components:** React with shadcn/ui for dashboard
- **Feedback System:** Haptic patterns (device vibration)

---

## MVP Feature Set

### Phase 1: Real-Time Conversation Tracking

**Core Metrics**
- Speaking time distribution (you vs. other speaker)
- Interruption detection and counting
- Speaking pace (words per minute)
- Turn-taking analysis
- Silence length tracking
- Filler word counting ("um," "like," "you know")

**Real-Time Feedback (Haptic Patterns)**
- Short vibration: Speaking too fast/slow
- Long vibration: You interrupted someone
- Double vibration: Ask a question (been monologuing)
- Triple vibration: Speaking for 2+ minutes straight

### Phase 2: Post-Conversation Analytics

**Dashboard Components**
1. **Report Card:** Overall conversation score (A-F)
2. **Time Distribution:** Pie chart showing speaking balance
3. **Interruption Heatmap:** Timeline of when interruptions occurred
4. **Engagement Graph:** Speaking energy/pace over time
5. **Key Insights:** Specific behavioral patterns identified
6. **Improvement Tips:** Personalized actionable suggestions

**Sample Insights**
- "You interrupted 7 times, mostly in the first 10 minutes"
- "You asked only 2 questions in a 30-minute conversation"
- "Your speaking pace increased 40% when discussing [topic] - nervous?"
- "They spoke 70% of the time - you were a good listener"

---

## Technical Architecture

### System Flow

```
Audio Capture → Speaker Separation → Real-Time Analysis → Feedback Loop
                                            ↓
                                    Local Storage
                                            ↓
                                Post-Processing Analytics
```

### Detailed Process

**1. Audio Capture & Processing**
- Phone records conversation continuously
- Audio sent to Gemini API in 5-second chunks
- Speaker diarization separates "you" vs "other"
- Local processing prioritized for privacy

**2. Real-Time Analysis (Cloudflare Workers)**
- Extract: words spoken, speaker ID, emotional tone, interruptions
- Calculate: speaking %, pace, pauses, turn-taking
- Trigger haptic feedback when thresholds crossed
- Update live metrics display

**3. Post-Conversation Processing**
- Store full conversation data locally
- Generate comprehensive analytics report
- Compare to user's historical baseline
- Provide personalized coaching insights

---

## Development Timeline (36 Hours)

### Hour 0-8: Foundation (Team Setup & Core Infrastructure)
**Goal:** Get audio recording and basic processing working

- [ ] Set up React Native project structure
- [ ] Implement audio recording functionality
- [ ] Integrate Gemini API for speech recognition
- [ ] Create basic speaker separation (simplified: assume other audio is "them")
- [ ] Set up local storage structure
- [ ] Configure Cloudflare Workers endpoint

**Deliverable:** App can record and separate basic audio

---

### Hour 8-16: Real-Time Features (Core Functionality)
**Goal:** Implement live tracking and feedback

- [ ] Build speaking time % calculator
- [ ] Implement interruption detection logic
- [ ] Create speaking pace tracker (WPM)
- [ ] Develop haptic feedback system (3 vibration patterns)
- [ ] Build simple real-time metrics overlay
- [ ] Test feedback triggers and thresholds

**Deliverable:** App provides real-time haptic feedback during conversations

---

### Hour 16-24: Analytics Dashboard (Value Demonstration)
**Goal:** Create compelling post-conversation insights

- [ ] Design dashboard layout (shadcn/ui components)
- [ ] Build report card scoring system
- [ ] Create time distribution pie chart
- [ ] Implement interruption heatmap visualization
- [ ] Develop engagement/pace graph over time
- [ ] Generate automated insight text
- [ ] Create improvement suggestion algorithm

**Deliverable:** Beautiful, insightful analytics dashboard

---

### Hour 24-30: Polish & Advanced Features (If Time Permits)
**Goal:** Add wow-factor features

**Priority Order:**
1. [ ] Filler word detection and counting
2. [ ] Question frequency tracking
3. [ ] Emotional tone analysis via Gemini
4. [ ] Historical comparison ("You're improving!")
5. [ ] Conversation topic tracking
6. [ ] Export/share functionality

**Deliverable:** Enhanced feature set for competitive edge

---

### Hour 30-36: Demo Preparation & Bug Fixes
**Goal:** Perfect the pitch and demo

- [ ] Create demo conversation script
- [ ] Set up demo environment (2 phones/devices)
- [ ] Prepare presentation slides
- [ ] Practice demo flow with team
- [ ] Test edge cases and fix critical bugs
- [ ] Prepare backup demo (recorded video if live fails)
- [ ] Create judge handout materials

**Deliverable:** Flawless demo ready to win

---

## Key Technical Challenges & Solutions

### Challenge 1: Speaker Separation
**Problem:** Distinguishing between multiple speakers in real-time  
**MVP Solution:** Use single-phone approach - track only user's metrics, assume all other audio is "other speaker"  
**Future Solution:** Two-phone setup or Gemini's speaker diarization

### Challenge 2: Non-Disruptive Feedback
**Problem:** Audio cues would interrupt the conversation  
**MVP Solution:** Use haptic vibration patterns (subtle, personal)  
- Short buzz = pace adjustment
- Long buzz = interruption warning
- Double buzz = ask a question

### Challenge 3: Privacy Concerns
**Problem:** Users won't want conversations recorded permanently  
**MVP Solution:** 
- All processing happens locally
- Audio deleted after analysis
- Clear consent screen on first launch
- "Your data never leaves your phone" messaging

### Challenge 4: Battery & Performance
**Problem:** Continuous audio processing drains battery  
**MVP Solution:**
- Process in 10-second chunks (not continuous)
- Low-power mode option: track only speaking %, skip advanced analysis
- Option to process post-conversation instead of real-time

---

## Demo Strategy

### The Perfect 5-Minute Demo Flow

**1. Hook (30 seconds)**
- "Raise your hand if you've ever left a conversation wondering 'Did I talk too much?'"
- "We've all bombed interviews, tanked dates, or killed conversations without knowing why"
- "Social X-Ray turns that anxiety into actionable data"

**2. Live Demo Part 1 (2 minutes)**
- Two team members on stage
- One wears the app, one doesn't
- Have a mock interview conversation
- Project real-time metrics on screen
- Show interruption counter, speaking % bar, pace graph

**3. The "Aha" Moment (30 seconds)**
- Pause when metrics show something interesting
- "Look - John just interrupted Sarah for the 4th time in 90 seconds"
- "His speaking pace jumped from 140 to 200 wpm when he got nervous"
- Show how the app buzzed him to course-correct

**4. Live Demo Part 2 (1 minute)**
- Restart conversation with John using feedback
- Show visible improvement in metrics
- "Watch - he's now at 50/50 split, interruptions dropped to zero"

**5. Dashboard Reveal (1 minute)**
- Pull up post-conversation analytics
- Show report card with beautiful insights
- "Sarah, you asked 8 questions. John, you asked 2 - next time, be more curious"
- Compare to benchmark "good conversation"

**6. Use Cases (30 seconds)**
- Job interviews, first dates, sales calls, therapy sessions, social anxiety tracking

**7. The Closer (30 seconds)**
- "Social X-Ray makes social skills measurable, trackable, improvable"
- Mention tech: "Built with Gemini API, powered by Cloudflare Workers"

---

## Competitive Differentiators

### Why This Wins

1. **Immediately Relatable** - Everyone has experienced social anxiety or awkward conversations
2. **Quantifies the Unquantifiable** - Makes soft skills measurable for the first time
3. **Non-Invasive** - Just your phone, no special hardware required
4. **Privacy-First** - All local processing, transparent data handling
5. **Actionable Insights** - Not just data, but specific improvement tips
6. **Broad Use Cases** - Dating, interviews, sales, therapy, everyday life
7. **Genuinely Augments Humans** - Makes you better at being human, doesn't replace humanity

### Emotional Hook for Judges

"We built Social X-Ray because social skills are the most important skills in life, yet the hardest to improve. You can't manage what you can't measure. Now you can."

---

## Success Metrics

### MVP Success Criteria
- [ ] Successfully records and processes 5-minute conversation
- [ ] Provides at least 3 types of real-time haptic feedback
- [ ] Generates complete analytics dashboard with 5+ insights
- [ ] Demo runs smoothly without crashes
- [ ] Judges understand the value proposition immediately

### Stretch Goals
- Win "Best Use of Gemini API" prize
- Win "Best Use of Cloudflare" prize
- Win overall Human Augmentation category
- Generate social media buzz (#SocialXRay)

---

## Team Roles & Responsibilities

**Frontend Developer(s)**
- React Native app structure
- Dashboard UI with shadcn/ui
- Real-time metrics display
- Haptic feedback implementation

**Backend/API Developer(s)**
- Gemini API integration
- Cloudflare Workers setup
- Audio processing pipeline
- Analytics algorithm development

**Designer/UX**
- Dashboard design and data visualization
- User flow optimization
- Presentation materials
- Demo script and staging

**PM/Demo Lead**
- Timeline management
- Demo preparation and practice
- Judge Q&A preparation
- Pitch deck creation

---

## Risk Mitigation

### High-Risk Items
1. **Gemini API integration complexity** → Start testing API immediately, have backup audio processing
2. **Speaker separation accuracy** → Use simplified single-speaker tracking for MVP
3. **Real-time processing lag** → Process in chunks, have post-conversation fallback mode
4. **Demo technical failure** → Prepare recorded demo video as backup

### Backup Plan
If real-time features don't work: pivot to post-conversation analysis only (still valuable, easier to build)

---

## Post-Hackathon Vision

### Future Features
- AI coaching assistant with voice guidance
- Conversation style matching (adapt to your conversation partner)
- Team conversation analytics (meeting effectiveness)
- Integration with calendar for automated session tracking
- ML model trained on user's successful conversations
- Conversation transcript export
- Social skills progress tracking over weeks/months

### Monetization Strategy
- Freemium model: 3 free conversations/month
- Pro tier: Unlimited conversations + advanced analytics ($9.99/month)
- Enterprise: Team analytics for sales/support teams ($49/user/month)

---

## Getting Started Checklist

### Pre-Hackathon Setup
- [ ] All team members have dev environment ready
- [ ] Gemini API keys obtained and tested
- [ ] Cloudflare Workers account created
- [ ] React Native boilerplate tested on devices
- [ ] shadcn/ui components reviewed
- [ ] Demo devices charged and ready

### First Hour Actions
1. Clone starter repo and verify all dependencies install
2. Test basic audio recording on target devices
3. Verify Gemini API connectivity
4. Assign roles and create Slack/Discord channel
5. Set up shared Figma/design document
6. Create GitHub repo with branch protection

---

## Resources

### Key Documentation
- [Gemini API - Audio Processing](https://ai.google.dev/gemini-api/docs)
- [React Native Audio](https://github.com/react-native-audio/react-native-audio)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Inspiration
- Conversation analytics tools: Gong, Chorus
- Social skills apps: Crystal, Hume
- Fitness trackers: Strava, Whoop (for UX patterns)

---

**Last Updated:** Hackathon Kickoff  
**Next Review:** Hour 12 checkpoint

**Remember:** Done is better than perfect. Ship the MVP, wow the judges, win the prizes. 🚀