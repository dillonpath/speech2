import { useState, useRef } from "react";
import audioService from "../services/audioService";
import apiService from "../services/apiService";
import feedbackService from "../services/feedbackService";
import realTimeFeedbackService from "../services/realTimeFeedbackService";

const useAudioRecording = (onSegmentProcessed, getConversationId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const processingInterval = useRef(null);
  const audioLevelInterval = useRef(null);
  const conversationStart = useRef(null);

  const startRecording = async () => {
    try {
      console.log("🎙️ Starting recording...");
      await audioService.startRecording();
      setIsRecording(true);
      conversationStart.current = Date.now();
      feedbackService.startConversation();
      realTimeFeedbackService.clearQueue();

      // Monitor audio level
      audioLevelInterval.current = setInterval(() => {
        setAudioLevel(audioService.getAudioLevel());
      }, 100);

      // Process audio every 7 seconds
      let isProcessing = false;
      processingInterval.current = setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
          const audioChunk = await audioService.getCurrentChunk();
          if (!audioChunk) {
            console.warn("⚠️ No audio chunk this cycle");
            isProcessing = false;
            return;
          }

          // Skip chunks that are too small
          if (audioChunk.size < 5000) {
            console.warn("⚠️ Chunk too small, skipping:", audioChunk.size, "bytes");
            isProcessing = false;
            return;
          }

          console.log('📤 Processing audio chunk:', audioChunk.size, 'bytes');
          await processAudioChunk(audioChunk);

        } catch (error) {
          console.error("❌ Processing error:", error);
        } finally {
          isProcessing = false;
        }
      }, 7000);

    } catch (err) {
      console.error("❌ Start recording failed:", err);
      setIsRecording(false);
    }
  };

  const processAudioChunk = async (audioChunk) => {
    try {
      // Convert to base64 for Cloudflare Worker
      const audioBase64 = await blobToBase64(audioChunk);
      
      if (!audioBase64 || audioBase64.length < 100) {
        console.error('❌ Invalid audio data');
        return;
      }

      // Send to Cloudflare Worker for analysis
      const result = await apiService.analyzeAudio(audioBase64, audioChunk.type);

      // Validate response has transcription
      if (!result || !result.transcription) {
        console.error('❌ No transcription in result');
        return;
      }

      const duration = 7000;
      const timestamp = Date.now();

      // Create segment data
      const segmentData = {
        transcription: result.transcription,
        speaker: result.speaker || 'user',
        sentiment: result.analysis?.sentiment || "neutral",
        timestamp,
        durationMs: duration,
        analysis: result.analysis
      };

      console.log('✅ Transcription received:', result.transcription.substring(0, 50) + '...');

      // 🎯 GET FEEDBACK (with built-in 5-second cooldown)
      const feedback = feedbackService.evaluateRealTimeFeedback(segmentData);
      if (feedback) {
        console.log(`💬 Feedback triggered: ${feedback.message}`);
        await realTimeFeedbackService.queueFeedback(feedback);
      }

      // Save to database
      await saveSegmentToDB(segmentData);

      // Update UI
      onSegmentProcessed({
        ...result,
        duration,
        timestamp,
        sentiment: result.analysis?.sentiment || "neutral",
      });

    } catch (error) {
      console.error("❌ Error processing audio chunk:", error);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => {
        console.error('❌ Failed to convert blob to base64');
        reject(new Error('Blob to base64 conversion failed'));
      };
      reader.readAsDataURL(blob);
    });
  };

  const saveSegmentToDB = async (segmentData) => {
    try {
      const conversationId = getConversationId ? getConversationId() : null;
      if (conversationId) {
        const segmentWithId = {
          ...segmentData,
          conversationId
        };
        console.log('💾 Saving segment to DB...');
        const saveResult = await apiService.saveSegment(segmentWithId);
        console.log('✅ Segment saved:', saveResult);
      } else {
        console.warn('⚠️ No conversation ID - segment not saved');
      }
    } catch (error) {
      console.error('❌ Failed to save segment:', error);
    }
  };

  const stopRecording = async () => {
    console.log("🛑 Stopping recording...");
    
    if (processingInterval.current) {
      clearInterval(processingInterval.current);
    }
    if (audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current);
    }
    
    await audioService.stopRecording();
    setIsRecording(false);
    setAudioLevel(0);
    feedbackService.reset();
    realTimeFeedbackService.clearQueue();
    
    console.log("✅ Recording stopped successfully");
  };

  return { isRecording, audioLevel, startRecording, stopRecording };
};

export default useAudioRecording;