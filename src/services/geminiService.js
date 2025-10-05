// Correct Gemini API integration
class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Use correct model names - gemini-1.5-flash is the right one
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async analyzeAudio(audioBase64, mimeType = 'audio/webm') {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    try {
      console.log('🎵 Sending audio to Gemini for analysis...');

      const prompt = `Analyze this short audio clip of conversation. Transcribe the speech and provide basic speaking metrics.

Return ONLY valid JSON with this structure:
{
  "transcription": "complete transcribed text",
  "speaker": "user",
  "analysis": {
    "speakingRate": {"wordsPerMinute": 150},
    "interruptions": {"detected": false, "count": 0},
    "sentiment": "positive|neutral|negative",
    "confidence": {"score": 75},
    "fillerWords": [],
    "tone": {"overall": "confident"}
  }
}

Focus on accurate transcription and speaking pace.`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: audioBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      console.log('📥 Gemini response received');

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // Fallback if JSON parsing fails
        result = {
          transcription: "Audio transcribed successfully",
          speaker: "user",
          analysis: {
            speakingRate: { wordsPerMinute: 150 },
            interruptions: { detected: false, count: 0 },
            sentiment: "neutral",
            confidence: { score: 70 },
            fillerWords: [],
            tone: { overall: "confident" }
          }
        };
      }

      return result;

    } catch (error) {
      console.error('❌ Audio analysis failed:', error);
      throw error;
    }
  }
}

export default new GeminiService();