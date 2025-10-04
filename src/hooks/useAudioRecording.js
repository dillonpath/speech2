import { useState, useRef } from "react";
import audioService from "../services/audioService";
import apiService from "../services/apiService";
import feedbackService from "../services/feedbackService";
import elevenLabsService from "../services/elevenLabsService";

const useAudioRecording = (onSegmentProcessed, getConversationId) => {
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

      // --- process every 7 s (faster with Cloudflare edge processing)
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

        // Skip chunks that are too small (less than 5KB)
        if (audioChunk.size < 5000) {
          console.warn("⚠️ Chunk too small, skipping:", audioChunk.size, "bytes");
          isProcessing = false;
          return;
        }

        try {
          console.log('📤 Processing chunk:', audioChunk.size, 'bytes');

          // Convert audio blob to base64
          const reader = new FileReader();
          const audioBase64 = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(audioChunk);
          });

          // Analyze via Cloudflare Worker
          const result = await apiService.analyzeAudio(audioBase64, audioChunk.type);

          // Validate result has transcription
          if (!result || !result.transcription) {
            console.warn("⚠️ No transcription in result, skipping segment");
            isProcessing = false;
            return;
          }

          const duration = 7000;
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
            await elevenLabsService.playWhisper(feedback.message);
          }

          // ---- save to database
          const conversationId = getConversationId ? getConversationId() : null;
          if (conversationId) {
            try {
              const segmentData = {
                conversationId,
                transcription: result.transcription,
                speaker: result.speaker,
                sentiment: result.analysis?.sentiment || "neutral",
                timestamp,
                durationMs: duration,
                analysis: result.analysis
              };
              console.log('Saving segment data:', segmentData);
              const saveResult = await apiService.saveSegment(segmentData);
              console.log('✅ Segment saved to D1:', saveResult);
            } catch (error) {
              console.error('❌ Failed to save segment:', error);
            }
          } else {
            console.warn('⚠️ No conversation ID - segment not saved');
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
      }, 7000);
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
