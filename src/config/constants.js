// App configuration and constants

export const AUDIO_CONFIG = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  chunkDuration: 5000, // 5 seconds
};

export const THRESHOLDS = {
  maxSpeakingPercent: 70,
  minSpeakingPercent: 30,
  fastPaceWPM: 180,
  slowPaceWPM: 120,
  maxMonologueDuration: 120000, // 2 minutes
  questionInterval: 300000, // 5 minutes
};

export const FEEDBACK_DELAYS = {
  pace: 30000, // 30 seconds between pace warnings
  interruption: 0, // Immediate
  question: 300000, // 5 minutes
  monologue: 120000, // 2 minutes
};

export const API_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  cloudflareWorker: 'https://your-worker.workers.dev',
};
