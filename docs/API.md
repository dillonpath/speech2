# API Documentation

## Gemini API

### Speech Analysis Endpoint

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

**Authentication:** API Key in header: `x-goog-api-key`

**Request:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Analyze this audio and provide speaker diarization",
      "inline_data": {
        "mime_type": "audio/wav",
        "data": "base64_encoded_audio"
      }
    }]
  }]
}
```

**Response:**
```json
{
  "transcription": "string",
  "speaker": "user|other",
  "confidence": 0.95,
  "sentiment": "neutral|positive|negative"
}
```

## ElevenLabs API

### Text-to-Speech Endpoint

**Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Authentication:** API Key in header: `xi-api-key`

**Request:**
```json
{
  "text": "Feedback message",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

**Response:** Audio file (MP3)

## Cloudflare Workers

### Audio Processor

**Endpoint:** `POST /process`

**Request:**
```json
{
  "audioData": "base64_string",
  "timestamp": 1234567890,
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transcription": "string",
  "speaker": "user|other",
  "metrics": {
    "wordCount": 10,
    "speakingRate": 150,
    "fillerWords": 2
  },
  "feedback": {
    "type": "pace|interruption|question|monologue",
    "message": "string"
  }
}
```

### Insight Generator

**Endpoint:** `POST /generate`

**Request:**
```json
{
  "conversationData": [],
  "metrics": {
    "speakingPercent": 50,
    "interruptions": 2,
    "wordsPerMinute": 150,
    "questions": 5,
    "fillerWords": 3,
    "duration": 300000
  }
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "summary": "string",
    "strengths": ["string"],
    "improvements": ["string"],
    "tips": ["string"],
    "score": 85,
    "grade": "A-"
  }
}
```
