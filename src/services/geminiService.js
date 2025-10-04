// Gemini API integration for speech processing
import fs from 'fs';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async analyzeSpeech(audioData, transcription = null) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    try {
      let parts = [];
      let audioBase64 = null;
      let mimeType = null;

      // Handle audio data input (can be file path, base64, or Buffer)
      if (audioData) {
        if (typeof audioData === 'string' && audioData.startsWith('/')) {
          // File path - read and encode
          const buffer = fs.readFileSync(audioData);
          audioBase64 = buffer.toString('base64');

          // Detect mime type from file extension
          const ext = audioData.split('.').pop().toLowerCase();
          const mimeTypes = {
            'mp3': 'audio/mp3',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'webm': 'audio/webm',
            'flac': 'audio/flac'
          };
          mimeType = mimeTypes[ext] || 'audio/mp3';
        } else if (typeof audioData === 'string') {
          // Assume base64 string
          audioBase64 = audioData;
          mimeType = 'audio/mp3'; // Default
        } else if (Buffer.isBuffer(audioData)) {
          // Buffer
          audioBase64 = audioData.toString('base64');
          mimeType = 'audio/mp3'; // Default
        }
      }

      const prompt = `Analyze this speech audio for communication patterns. Provide a detailed analysis in JSON format.

${transcription ? `Transcription reference: "${transcription}"` : 'Listen to the audio and transcribe it first.'}

Analyze and return JSON with these fields:
{
  "transcription": "full text transcription of the audio",
  "stutters": [{"word": "example", "timestamp": 0, "type": "repetition|prolongation|block"}],
  "pauses": [{"duration": 2.5, "timestamp": 10, "type": "filler|silence"}],
  "tone": {"overall": "confident|nervous|uncertain|aggressive|calm", "score": 0-100},
  "fillerWords": [{"word": "um", "count": 3, "timestamps": [1, 5, 12]}],
  "speakingRate": {"wordsPerMinute": 150, "variance": "consistent|varied"},
  "confidence": {"score": 0-100, "indicators": ["direct language", "minimal hesitation"]},
  "interruptions": {"detected": true/false, "count": 0, "timestamps": []},
  "sentiment": "positive|neutral|negative",
  "keyInsights": ["Frequent pauses before answering", "High use of filler words"]
}`;

      // Build request parts
      parts.push({ text: prompt });

      if (audioBase64) {
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: audioBase64
          }
        });
      }

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseModalities: ["TEXT"]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Debug: log the response
      console.log('API Response:', JSON.stringify(data, null, 2));

      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                       analysisText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, analysisText];

      const analysis = JSON.parse(jsonMatch[1] || analysisText);

      return {
        transcription: analysis.transcription || transcription || '',
        speaker: 'user',
        analysis: {
          stutters: analysis.stutters || [],
          pauses: analysis.pauses || [],
          tone: analysis.tone || { overall: 'neutral', score: 50 },
          fillerWords: analysis.fillerWords || [],
          speakingRate: analysis.speakingRate || { wordsPerMinute: 0, variance: 'unknown' },
          confidence: analysis.confidence || { score: 50, indicators: [] },
          interruptions: analysis.interruptions || { detected: false, count: 0, timestamps: [] },
          sentiment: analysis.sentiment || 'neutral',
          keyInsights: analysis.keyInsights || []
        }
      };
    } catch (error) {
      console.error('Speech analysis error:', error);
      throw error;
    }
  }

  async detectInterruption(audioData, context) {
    // Analyze if current speaker interrupted the other speaker
    // Context should include: previous speaker, timing, conversation flow
    if (!context || !context.previousSpeaker) {
      return false;
    }

    try {
      const prompt = `Based on the conversation context, determine if an interruption occurred.

Previous speaker: ${context.previousSpeaker}
Current speaker: ${context.currentSpeaker}
Time since last speech ended: ${context.timeSinceLastSpeech}ms
Previous sentence complete: ${context.previousSentenceComplete}

Return JSON: {"interrupted": true/false, "confidence": 0-100, "reason": "explanation"}`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      const resultText = data.candidates[0]?.content?.parts[0]?.text || '{}';
      const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/) ||
                       resultText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, resultText];

      const result = JSON.parse(jsonMatch[1]);
      return result.interrupted || false;
    } catch (error) {
      console.error('Interruption detection error:', error);
      return false;
    }
  }

  async calculateMetrics(conversationData) {
    // Process full conversation for comprehensive analytics
    const { segments, duration } = conversationData;

    if (!segments || segments.length === 0) {
      return {
        speakingTimePercent: 0,
        interruptions: 0,
        wordsPerMinute: 0,
        fillerWords: 0,
        stutters: 0,
        pauses: { total: 0, averageDuration: 0 },
        confidenceScore: 50,
        toneProfile: 'neutral',
        questions: 0,
      };
    }

    try {
      const allAnalyses = segments.filter(s => s.analysis);

      // Aggregate metrics
      const totalWords = segments.reduce((sum, s) =>
        sum + (s.transcription?.split(' ').length || 0), 0);
      const speakingTime = segments.reduce((sum, s) => sum + (s.duration || 0), 0);

      const interruptions = allAnalyses.reduce((sum, s) =>
        sum + (s.analysis.interruptions?.count || 0), 0);

      const fillerWords = allAnalyses.reduce((sum, s) =>
        sum + s.analysis.fillerWords.reduce((count, f) => count + f.count, 0), 0);

      const stutters = allAnalyses.reduce((sum, s) =>
        sum + (s.analysis.stutters?.length || 0), 0);

      const allPauses = allAnalyses.flatMap(s => s.analysis.pauses || []);
      const avgPauseDuration = allPauses.length > 0
        ? allPauses.reduce((sum, p) => sum + p.duration, 0) / allPauses.length
        : 0;

      const avgConfidence = allAnalyses.length > 0
        ? allAnalyses.reduce((sum, s) => sum + (s.analysis.confidence?.score || 50), 0) / allAnalyses.length
        : 50;

      return {
        speakingTimePercent: duration > 0 ? (speakingTime / duration) * 100 : 0,
        interruptions,
        wordsPerMinute: speakingTime > 0 ? (totalWords / speakingTime) * 60 : 0,
        fillerWords,
        stutters,
        pauses: {
          total: allPauses.length,
          averageDuration: avgPauseDuration
        },
        confidenceScore: avgConfidence,
        toneProfile: this._aggregateTone(allAnalyses),
        questions: this._countQuestions(segments),
      };
    } catch (error) {
      console.error('Metrics calculation error:', error);
      throw error;
    }
  }

  _aggregateTone(analyses) {
    if (analyses.length === 0) return 'neutral';

    const tones = analyses.map(a => a.analysis.tone?.overall || 'neutral');
    const toneCount = {};
    tones.forEach(t => toneCount[t] = (toneCount[t] || 0) + 1);

    return Object.keys(toneCount).reduce((a, b) =>
      toneCount[a] > toneCount[b] ? a : b
    );
  }

  _countQuestions(segments) {
    return segments.reduce((count, s) => {
      const text = s.transcription || '';
      return count + (text.match(/\?/g) || []).length;
    }, 0);
  }
}

export default new GeminiService();
