import { useState, useRef } from 'react';
import audioService from '../services/audioService';
import geminiService from '../services/geminiService';

const useAudioRecording = (onSegmentProcessed) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const processingInterval = useRef(null);

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);

      // Start processing audio chunks every 5 seconds
      processingInterval.current = setInterval(async () => {
        const audioChunk = await audioService.getCurrentChunk();

        if (audioChunk) {
          // Process with Gemini API
          const result = await geminiService.analyzeSpeech(audioChunk);

          if (result && result.transcription) {
            // Call callback with processed segment
            onSegmentProcessed({
              speaker: result.speaker,
              text: result.transcription,
              duration: 5000, // 5 seconds
              timestamp: Date.now(),
              sentiment: result.sentiment,
            });
          }

          // Update audio level for visualization
          setAudioLevel(audioChunk.amplitude || 0.5);
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
        processingInterval.current = null;
      }

      await audioService.stopRecording();
      setIsRecording(false);
      setAudioLevel(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return {
    isRecording,
    audioLevel,
    startRecording,
    stopRecording,
  };
};

export default useAudioRecording;
