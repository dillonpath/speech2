// src/services/elevenLabsService.js
class ElevenLabsService {
  async playWhisper(text) {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
      if (!apiKey || !voiceId) throw new Error("Missing ElevenLabs env vars");

      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.7, similarity_boost: 0.8 },
          }),
        }
      );

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const arr = await res.arrayBuffer();
      new Audio(URL.createObjectURL(new Blob([arr], { type: "audio/mpeg" }))).play();
    } catch (e) {
      console.error("ElevenLabs playback error:", e);
    }
  }
}
export default new ElevenLabsService();
