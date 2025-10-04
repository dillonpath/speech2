import { useState, useRef } from "react";
import audioService from "../services/audioService";
import geminiService from "../services/geminiService";
import feedbackService from "../services/feedbackService";
// optionally later: import elevenLabsService from "../services/elevenLabsService";

const useAudioRecording = (onSegmentProcessed) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const processingInterval = useRef(null);
  const audioLevelInterval = useRef(null);
  const conversationStart = useRef(null);

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      conversationStart.current = Date.now();
      feedbackService.startConversation();

      // --- monitor volume
      audioLevelInterval.current = setInterval(() => {
        setAudioLevel(audioService.getAudioLevel());
      }, 100);

      // --- process every 10 s
      let isProcessing = false;
      processingInterval.current = setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        const audioChunk = await audioService.getCurrentChunk();
        if (!audioChunk) {
          console.warn("⚠️ No chunk this cycle");
          isProcessing = false;
          return;
        }

        try {
          const result = await geminiService.analyzeSpeech(audioChunk);
          const duration = 10000;
          const timestamp = Date.now();
          const conversationDuration = timestamp - conversationStart.current;

          // ---- feedback logic
          const metrics = {
            wordsPerMinute:
              result.analysis.speakingRate?.wordsPerMinute || 0,
            interrupted:
              result.analysis.interruptions?.detected || false,
            questionCount:
              result.transcription?.match(/\?/g)?.length || 0,
            conversationDuration,
            currentSpeakingDuration: duration,
            speakingPercent: 50, // placeholder until full dual-speaker tracking
          };

          const feedback = feedbackService.evaluateRealTimeFeedback(metrics);
          if (feedback) {
            console.log("💬 FEEDBACK:", feedback.message);
            // await elevenLabsService.playWhisper(feedback.message);
          }

          // ---- update UI
          onSegmentProcessed({
            ...result,
            duration,
            timestamp,
            sentiment: result.analysis?.sentiment || "neutral",
          });
        } catch (e) {
          console.error("❌ Gemini error:", e);
        } finally {
          isProcessing = false;
        }
      }, 10000);
    } catch (err) {
      console.error("Start recording failed:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    clearInterval(processingInterval.current);
    clearInterval(audioLevelInterval.current);
    await audioService.stopRecording();
    setIsRecording(false);
    setAudioLevel(0);
    feedbackService.reset();
  };

  return { isRecording, audioLevel, startRecording, stopRecording };
};

export default useAudioRecording;
