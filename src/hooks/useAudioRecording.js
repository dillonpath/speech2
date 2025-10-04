import { useState, useRef, useEffect } from 'react';
import audioService from '../services/audioService';
import geminiService from '../services/geminiService';

const useAudioRecording = (onSegmentProcessed) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const processingInterval = useRef(null);
  const audioLevelInterval = useRef(null);

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);

      // Update audio level every 100ms
      audioLevelInterval.current = setInterval(() => {
        const level = audioService.getAudioLevel();
        setAudioLevel(level);
      }, 100);

      // Start processing audio chunks every 12 seconds
      let isProcessing = false;
      processingInterval.current = setInterval(async () => {
        if (isProcessing) {
          console.log('⏭️ Skipping - previous Gemini call still processing');
          return;
        }

        console.log('🔄 Processing audio chunk...');
        const audioChunk = await audioService.getCurrentChunk();

        if (audioChunk) {
          console.log('📦 Got audio chunk, sending to Gemini...', audioChunk.size, 'bytes');

          try {
            isProcessing = true;

            // Process with Gemini API
            const result = await geminiService.analyzeSpeech(audioChunk);

            console.log('=== GEMINI RESPONSE ===');
            console.log('Transcription:', result.transcription);
            console.log('Analysis:', result.analysis);
            console.log('=====================');

            if (result && result.transcription) {
              // Call callback with processed segment
              onSegmentProcessed({
                speaker: result.speaker,
                text: result.transcription,
                duration: 12000,
                timestamp: Date.now(),
                sentiment: result.analysis?.sentiment || 'neutral',
                analysis: result.analysis,
              });
            }
          } catch (error) {
            console.error('❌ Error processing with Gemini:', error);
          } finally {
            isProcessing = false;
          }
        } else {
          console.log('⚠️ No audio chunk available');
        }
      }, 12000);

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

      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
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
