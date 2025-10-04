// Gemini API integration for Cloudflare Worker

export async function analyzeSpeechAudio(audioBase64, mimeType, apiKey) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const prompt = `Transcribe and analyze this audio. Return valid JSON:
{
  "transcription": "word-for-word transcription",
  "stutters": [{"word": "repeated word", "timestamp": 0, "type": "repetition"}],
  "pauses": [{"duration": 1.0, "timestamp": 5, "type": "silence"}],
  "tone": {"overall": "confident", "score": 75},
  "fillerWords": [{"word": "um", "count": 2}],
  "speakingRate": {"wordsPerMinute": 150, "variance": "consistent"},
  "confidence": {"score": 80, "indicators": ["clear speech"]},
  "interruptions": {"detected": false, "count": 0, "timestamps": []},
  "sentiment": "neutral",
  "keyInsights": ["speaks clearly"]
}`;

  const parts = [
    { text: prompt },
    {
      inline_data: {
        mime_type: mimeType,
        data: audioBase64
      }
    }
  ];

  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
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
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 4192,  // Balanced for quality and speed
        responseModalities: ["TEXT"],
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Extract JSON from markdown code blocks if present
  let jsonText = analysisText;
  const jsonMatch = analysisText.match(/```json\s*\n([\s\S]*?)\n```/) ||
                   analysisText.match(/```\s*\n([\s\S]*?)\n```/) ||
                   analysisText.match(/`([\s\S]*?)`/);

  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1].trim();
  }

  let analysis;
  try {
    analysis = JSON.parse(jsonText);
  } catch (parseError) {
    // Return a default structure if parsing fails
    analysis = {
      transcription: '',
      stutters: [],
      pauses: [],
      tone: { overall: 'neutral', score: 50 },
      fillerWords: [],
      speakingRate: { wordsPerMinute: 0, variance: 'unknown' },
      confidence: { score: 50, indicators: [] },
      interruptions: { detected: false, count: 0, timestamps: [] },
      sentiment: 'neutral',
      keyInsights: ['Could not parse Gemini response']
    };
  }

  return {
    transcription: analysis.transcription || '',
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
}
