import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./FeedbackCard.css";

export default function FeedbackCard({ feedback }) {
  const [tipIndex, setTipIndex] = useState(0);

  // === Confidence Ring Animation ===
  const targetConfidence = feedback?.confidence || 0;
  const progress = useSpring(0, { stiffness: 80, damping: 15 });
  useEffect(() => {
    progress.set(targetConfidence);
  }, [targetConfidence]);

  const circumference = 2 * Math.PI * 45;
  const dashOffset = useTransform(progress, (v) => circumference * (1 - v / 100));

  // === Dynamic Tips from feedback ===
  const dynamicTips = [
    ...(feedback.strengths?.map((s) => `💪 ${s}`) || []),
    ...(feedback.improvements?.map((s) => `⚙️ ${s}`) || []),
  ];

  const tips =
    dynamicTips.length > 0
      ? dynamicTips
      : [
          "Pause before key points — it projects confidence.",
          "Reduce filler words like 'um' or 'like' — silence is strength.",
          "Speak slightly slower for more clarity.",
          "Smile while speaking — it brightens your tone.",
        ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // === PDF Export ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Social X-Ray – AI Speech Report", 14, 20);

    const rows = [
      ["Overall Confidence", `${feedback.confidence}%`],
      ["Tone", feedback.tone || "neutral"],
      ["Filler Words", feedback.fillerWords?.join(", ") || "None detected"],
      ["Strengths", feedback.strengths?.join(", ") || "—"],
      ["Areas for Improvement", feedback.improvements?.join(", ") || "—"],
    ];

    doc.autoTable({
      startY: 30,
      head: [["Metric", "Details"]],
      body: rows,
    });

    doc.save("speech-report.pdf");
  };

  if (!feedback) return null;

  return (
    <motion.div
      className="feedback-card compact"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h3>AI Feedback Summary</h3>

      {/* === Confidence + Tone Section === */}
      <div className="feedback-top">
        <motion.div
          className="confidence-ring pulse"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <div className="ring-glow-wrapper">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              className="ring-svg"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="#4cd1ff"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <motion.text
                x="50"
                y="57"
                textAnchor="middle"
                fontSize="18"
                fontWeight="700"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="0.5"
                paintOrder="stroke"
              >
                {feedback.confidence}%
              </motion.text>
            </svg>
            <div className="ring-glow"></div>
          </div>
          <div className="ring-label">Confidence</div>
        </motion.div>

        <div className="tone-section">
          <div
            className={`tone-chip tone-${feedback.tone?.toLowerCase() || "neutral"}`}
          >
            {feedback.tone}
          </div>
          <small>Detected Tone</small>
        </div>
      </div>

      {/* === Dynamic Tip with Glow === */}
      <motion.div
        className="ai-tip pulse-tip"
        key={tipIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
      >
        {tips[tipIndex]}
      </motion.div>

      {/* === PDF Button === */}
      <button className="export-btn" onClick={handleExportPDF}>
        Export Report
      </button>
    </motion.div>
  );
}
