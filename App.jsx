import React, { useState, useRef } from 'react';
import useAudioRecording from './src/hooks/useAudioRecording';
import apiService from './src/services/apiService';
import './src/App.css';

const App = () => {
  const [segments, setSegments] = useState([]);
  const [debugInfo, setDebugInfo] = useState('Waiting to start...');
  const [conversationId, setConversationId] = useState(null);
  const conversationRef = useRef(null);

  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecording(async (segment) => {
    console.log('Segment processed:', segment);
    setDebugInfo(`Processed segment at ${new Date().toLocaleTimeString()}`);

    // Add segment to the list
    setSegments(prev => [...prev, {
      ...segment,
      id: Date.now()
    }]);

    // Save to Cloudflare D1 (if authenticated)
    if (conversationRef.current) {
      try {
        await apiService.saveSegment({
          conversationId: conversationRef.current,
          transcription: segment.text,
          speaker: segment.speaker,
          sentiment: segment.sentiment,
          timestamp: segment.timestamp,
          durationMs: segment.duration,
          analysis: segment.analysis
        });
        console.log('Segment saved to D1');
      } catch (error) {
        console.error('Failed to save segment:', error);
      }
    }
  });

  const handleRecordToggle = async () => {
    if (isRecording) {
      setDebugInfo('Stopping...');
      await stopRecording();
      setDebugInfo('Stopped');

      // End conversation and generate summary
      if (conversationRef.current) {
        try {
          await apiService.endConversation(conversationRef.current);
          const summary = await apiService.generateSummary(conversationRef.current);
          console.log('Conversation summary:', summary);
          setDebugInfo(`Stopped - Grade: ${summary.grade} (${summary.gradeScore.toFixed(1)}%)`);
        } catch (error) {
          console.error('Failed to end conversation:', error);
        }
        conversationRef.current = null;
        setConversationId(null);
      }
    } else {
      setSegments([]); // Clear previous segments when starting new recording
      setDebugInfo('Starting recording...');

      // Start new conversation
      try {
        const conversation = await apiService.startConversation(`Recording ${new Date().toLocaleString()}`);
        conversationRef.current = conversation.id;
        setConversationId(conversation.id);
        console.log('Started conversation:', conversation.id);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }

      await startRecording();
      setDebugInfo('Recording started - waiting for chunks...');
    }
  };

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Social X-Ray</h1>
        <p className="subtitle">Real-time conversation coaching</p>

        <button
          className={`button ${isRecording ? 'recording-button' : 'record-button'}`}
          onClick={handleRecordToggle}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <div className="debug-container">
          <p className="debug-text">Status: {debugInfo}</p>
        </div>

        {isRecording && (
          <div className="audio-level-container">
            <p className="audio-level-text">
              Audio Level: {Math.round(audioLevel * 100)}% {audioLevel > 0 ? '🎤' : '🔇'}
            </p>
            <div className="audio-level-bar">
              <div className="audio-level-fill" style={{ width: `${Math.max(audioLevel * 100, 2)}%` }} />
            </div>
            <p className="debug-text">Raw level: {audioLevel.toFixed(4)}</p>
          </div>
        )}

        <div className="segments-container">
          {segments.map((segment) => (
            <div key={segment.id} className="segment-card">
              <p className="segment-text">{segment.text || 'Processing...'}</p>
              {segment.sentiment && (
                <div className="segment-meta">
                  <span className="meta-text">Speaker: {segment.speaker}</span>
                  <span className="meta-text">Sentiment: {segment.sentiment}</span>
                  <span className="meta-text">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
