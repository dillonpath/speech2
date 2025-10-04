// App configuration and constants

export const AUDIO_CONFIG = {
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  chunkDuration: 5000, // 5 seconds
};

export const THRESHOLDS = {
  fastPaceWPM: 200,
  slowPaceWPM: 100,
  maxMonologueDuration: 30000, // 30 s
  questionInterval: 60000,     // 1 min
  maxSpeakingPercent: 70,
  minSpeakingPercent: 30,
};

export const FEEDBACK_DELAYS = {
  pace: 20000,      // 20 s cooldown
  question: 60000,  // 1 min
};

export const API_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  cloudflareWorker: 'https://your-worker.workers.dev',
};
