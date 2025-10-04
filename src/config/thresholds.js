// Feedback trigger thresholds

export const SPEAKING_THRESHOLDS = {
  maxSpeakingPercent: 70,
  minSpeakingPercent: 30,
  idealSpeakingPercent: 50,
  tolerance: 10, // ±10% is acceptable
};

export const PACE_THRESHOLDS = {
  fastPaceWPM: 180,
  slowPaceWPM: 120,
  idealPaceWPM: 150,
  veryFastPaceWPM: 200,
  verySlowPaceWPM: 100,
};

export const TIMING_THRESHOLDS = {
  maxMonologueDuration: 120000, // 2 minutes
  questionInterval: 300000, // 5 minutes
  minConversationDuration: 60000, // 1 minute (before feedback starts)
  silenceThreshold: 3000, // 3 seconds of silence
};

export const COUNT_THRESHOLDS = {
  maxInterruptions: 5,
  minQuestions: 2,
  maxFillerWords: 10,
  maxFillerWordsPerMinute: 3,
};

export const FEEDBACK_COOLDOWNS = {
  pace: 30000, // 30 seconds between pace warnings
  interruption: 0, // Immediate
  question: 300000, // 5 minutes
  monologue: 120000, // 2 minutes
  balance: 60000, // 1 minute
};

export const SCORING_WEIGHTS = {
  speakingBalance: 0.25,
  interruptions: 0.20,
  pace: 0.15,
  questions: 0.15,
  fillerWords: 0.10,
  engagement: 0.15,
};
