import React, { useState, useRef, useEffect } from 'react';
import useAudioRecording from './src/hooks/useAudioRecording';
import apiService from './src/services/apiService';
import authService from './src/services/authService';
import AuthForm from './src/components/AuthForm';
import './src/App.css';

const App = () => {
  const [segments, setSegments] = useState([]);
  const [debugInfo, setDebugInfo] = useState('Waiting to start...');
  const [conversationId, setConversationId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const conversationRef = useRef(null);

  // Check auth state on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecording(
    async (segment) => {
      console.log('Segment processed:', segment);
      setDebugInfo(`Processed segment at ${new Date().toLocaleTimeString()}`);

      // Add segment to the list
      setSegments(prev => [...prev, {
        ...segment,
        id: Date.now()
      }]);
    },
    () => conversationRef.current
  );

  const handleRecordToggle = async () => {
    if (isRecording) {
      setDebugInfo('Processing final chunk (up to 7s)...');

      // Save the conversation ID before stopping
      const conversationToEnd = conversationRef.current;

      // Stop recording immediately to halt the interval
      await stopRecording();

      // Wait up to 20 seconds for any in-flight Gemini processing to complete
      // (Gemini can take 10-15 seconds for audio analysis)
      setDebugInfo('Waiting for final segment processing...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      setDebugInfo('Generating summary...');

      // End conversation and generate summary
      if (conversationToEnd) {
        try {
          await apiService.endConversation(conversationToEnd);
          const summary = await apiService.generateSummary(conversationToEnd);
          console.log('Conversation summary:', summary);
          setDebugInfo(`Grade: ${summary.grade} (${summary.gradeScore.toFixed(1)}%)`);
        } catch (error) {
          console.error('Failed to end conversation:', error);
          setDebugInfo('Stopped - Error generating summary');
        }
        // Don't clear conversationRef here - let late segments still save
        // It will be cleared when starting a new recording
      }
    } else {
      // Clear previous conversation when starting new recording
      conversationRef.current = null;
      setConversationId(null);
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

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="content">
          <h1 className="title">Social X-Ray</h1>
          <p className="subtitle">Real-time conversation coaching</p>
          <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Social X-Ray</h1>
        <p className="subtitle">Real-time conversation coaching</p>

        <button
          className="logout-button"
          onClick={async () => {
            await authService.logout();
            setIsAuthenticated(false);
          }}
        >
          Logout
        </button>

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
