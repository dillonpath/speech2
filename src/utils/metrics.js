// Metrics calculation utilities

export const scoreToGrade = (score) => {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
};

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

export const calculatePercentile = (value, allValues) => {
  const sorted = allValues.sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);

  if (index === -1) return 100;

  return Math.round((index / sorted.length) * 100);
};

export const getMetricStatus = (metric, thresholds) => {
  if (metric < thresholds.low) return 'poor';
  if (metric < thresholds.medium) return 'fair';
  if (metric < thresholds.high) return 'good';
  return 'excellent';
};

export const compareToBaseline = (current, baseline) => {
  const diff = current - baseline;
  const percentChange = (diff / baseline) * 100;

  return {
    difference: diff,
    percentChange: Math.round(percentChange),
    improved: diff > 0,
  };
};

export const aggregateSessionMetrics = (sessions) => {
  if (sessions.length === 0) return null;

  const totals = sessions.reduce(
    (acc, session) => ({
      speakingPercent: acc.speakingPercent + session.speakingPercent,
      interruptions: acc.interruptions + session.interruptions,
      wordsPerMinute: acc.wordsPerMinute + session.wordsPerMinute,
      questions: acc.questions + session.questions,
      score: acc.score + session.score,
    }),
    { speakingPercent: 0, interruptions: 0, wordsPerMinute: 0, questions: 0, score: 0 }
  );

  return {
    avgSpeakingPercent: Math.round(totals.speakingPercent / sessions.length),
    avgInterruptions: Math.round(totals.interruptions / sessions.length),
    avgWordsPerMinute: Math.round(totals.wordsPerMinute / sessions.length),
    avgQuestions: Math.round(totals.questions / sessions.length),
    avgScore: Math.round(totals.score / sessions.length),
    totalSessions: sessions.length,
  };
};
