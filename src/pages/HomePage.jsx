import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import useAudioRecording from "../hooks/useAudioRecording";
import apiService from "../services/apiService";
import authService from "../services/authService";
import FeedbackCard from "../components/FeedbackCard";
import "../pages/HomePage.css";

// ===== Helper functions for tone + confidence =====
const toneClass = (tone) => {
  const t = (tone || "neutral").toLowerCase();
  if (["confident", "assertive", "excited"].includes(t)) return "tone-confident";
  if (["nervous", "uncertain", "anxious", "hesitant"].includes(t)) return "tone-nervous";
  return "tone-calm";
};

const estimateConfidence = (tone, level = 0) => {
  const t = (tone || "neutral").toLowerCase();
  let base = t === "confident" ? 75 : t === "nervous" ? 45 : 62;
  const lvlBoost = Math.min(10, Math.max(-10, (level - 0.2) * 50));
  return Math.max(5, Math.min(95, Math.round(base + lvlBoost)));
};

export default function HomePage({ onLogout }) {
  const [feedbackSummary, setFeedbackSummary] = useState(null);
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
          const summary = await apiService.generateSummary(conversationToEnd);
          console.log("Summary:", summary);

          if (!summary) {
            console.warn("⚠️ No summary data returned — using fallback");
            setFeedbackSummary({
              confidence: 70,
              tone: "neutral",
              fillerWords: [],
              strengths: ["Good pacing", "Positive tone"],
              improvements: ["Reduce filler words", "Pause naturally"],
            });
            setDebugInfo("No summary returned (fallback used)");
            return;
          }

          const {
            confidenceScore = 70,
            toneProfile = "neutral",
            fillerWords = [],
            strengths = ["Good pacing", "Positive tone"],
            improvements = ["Reduce filler words", "Pause naturally"],
            grade = "B+",
            gradeScore = 85,
          } = summary || {};

          setFeedbackSummary({
            confidence: confidenceScore,
            tone: toneProfile,
            fillerWords,
            strengths,
            improvements,
          });

          setDebugInfo(`Grade: ${grade} (${gradeScore.toFixed(1)}%)`);
        } catch (err) {
          console.error("Summary error:", err);
          setFeedbackSummary({
            confidence: 70,
            tone: "neutral",
            fillerWords: [],
            strengths: ["Good pacing", "Positive tone"],
            improvements: ["Reduce filler words", "Pause naturally"],
          });
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
    if (onLogout) onLogout();
  };

  // ===== Derived data for Live Coach Panel =====
  const latest = segments[segments.length - 1];
  const latestTone =
    latest?.tone ||
    latest?.analysis?.tone?.overall ||
    (latest?.sentiment === "negative" ? "nervous" : "calm");

  const rawConfidence = latest?.analysis?.confidence?.score;
  const confidence = Number.isFinite(rawConfidence)
    ? Math.round(rawConfidence)
    : estimateConfidence(latestTone, audioLevel);

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

      {/* === Live Coach Panel === */}
      <motion.div
        className="coach-panel glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="coach-left">
          <div className="confidence-header">
            <span>Confidence</span>
            <span className="confidence-value">{confidence}%</span>
          </div>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${confidence}%` }} />
          </div>
          <div className="confidence-scale">
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
          </div>
        </div>

        <div className="coach-right">
          <div className={`tone-chip ${toneClass(latestTone)}`}>
            {latestTone?.toString()?.slice(0, 1).toUpperCase() +
              latestTone?.toString()?.slice(1)}
          </div>
          <div className="tone-caption">Current Tone</div>
        </div>
      </motion.div>

      {/* ✅ Feedback summary card only */}
      {feedbackSummary && <FeedbackCard feedback={feedbackSummary} />}
    </div>
  );
}
