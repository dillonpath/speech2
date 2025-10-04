import React, { useState, useRef } from "react";
import useAudioRecording from "../hooks/useAudioRecording";
import apiService from "../services/apiService";
import authService from "../services/authService";
import "../pages/HomePage.css";

export default function HomePage({ onLogout }) {
  const [segments, setSegments] = useState([]);
  const [debugInfo, setDebugInfo] = useState("Waiting to start...");
  const [conversationId, setConversationId] = useState(null);
  const conversationRef = useRef(null);

  const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecording(
    async (segment) => {
      console.log("Segment processed:", segment);
      setDebugInfo(`Processed at ${new Date().toLocaleTimeString()}`);
      setSegments((prev) => [...prev, { ...segment, id: Date.now() }]);
    },
    () => conversationRef.current
  );

  const handleRecordToggle = async () => {
    if (isRecording) {
      setDebugInfo("Processing final chunk...");
      const conversationToEnd = conversationRef.current;

      await stopRecording();

      setDebugInfo("Waiting for final segment...");
      await new Promise((r) => setTimeout(r, 20000));
      setDebugInfo("Generating summary...");

      if (conversationToEnd) {
        try {
          await apiService.endConversation(conversationToEnd);
          const summary = await apiService.generateSummary(conversationToEnd);
          console.log("Summary:", summary);
          setDebugInfo(`Grade: ${summary.grade} (${summary.gradeScore.toFixed(1)}%)`);
        } catch (err) {
          console.error("Summary error:", err);
          setDebugInfo("Error generating summary");
        }
      }
    } else {
      conversationRef.current = null;
      setConversationId(null);
      setSegments([]);
      setDebugInfo("Starting new recording...");

      try {
        const conversation = await apiService.startConversation(
          `Recording ${new Date().toLocaleString()}`
        );
        conversationRef.current = conversation.id;
        setConversationId(conversation.id);
      } catch (err) {
        console.error("Failed to start conversation:", err);
      }

      await startRecording();
      setDebugInfo("Recording started...");
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onLogout();
  };

  return (
    <div className="home-container">
      {/* Top Nav */}
      <nav className="navbar glass-nav">
        <h2 className="logo">Social X-Ray</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <h1>🎧 Real-Time Speech Coach</h1>
        <p>Analyze your tone, sentiment, and clarity — instantly.</p>
      </section>

      {/* Record Button */}
      <div className="record-wrapper">
        <button
          className={`record-btn ${isRecording ? "stop" : "start"}`}
          onClick={handleRecordToggle}
        >
          {isRecording ? "⏹ Stop" : "🎙 Start"}
        </button>
        <div className={`mic-glow ${isRecording ? "active" : ""}`}></div>
      </div>

      {/* Status & Audio Level */}
      <div className="status-section glass-card">
        <p className="status-title">Status</p>
        <p className="status-text">{debugInfo}</p>

        {isRecording && (
          <div className="audio-visualizer">
            <div
              className="audio-bar"
              style={{ width: `${Math.max(audioLevel * 100, 3)}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Segments Section */}
      <div className="segments-section">
        <h2>🗒 Conversation Segments</h2>
        <div className="segments-grid">
          {segments.map((segment) => (
            <div key={segment.id} className="segment-card glass-card">
              <p>{segment.text || "Processing..."}</p>
              {segment.sentiment && (
                <small>
                  Speaker: {segment.speaker} • Sentiment: {segment.sentiment} •{" "}
                  {new Date(segment.timestamp).toLocaleTimeString()}
                </small>
              )}
            </div>
          ))}
          {segments.length === 0 && (
            <p className="placeholder">No segments yet. Start recording to see results!</p>
          )}
        </div>
      </div>
    </div>
  );
}
