import React from "react";

export default function ConfidenceMeter({ score = 50, tone = "neutral" }) {
  const colors = {
    confident: "bg-green-500",
    calm: "bg-blue-500",
    nervous: "bg-yellow-400",
    uncertain: "bg-orange-500",
    aggressive: "bg-red-600",
    neutral: "bg-gray-400"
  };
  const toneColor = colors[tone] || colors.neutral;

  return (
    <div className="w-full p-3 rounded-xl bg-gray-800 text-white shadow-md">
      <div className="flex justify-between mb-1 text-sm opacity-80">
        <span>Confidence</span>
        <span>{score}%</span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${toneColor}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <p className="text-xs mt-2 text-gray-400">
        Tone: <span className={`font-semibold text-${toneColor}`}>{tone}</span>
      </p>
    </div>
  );
}
