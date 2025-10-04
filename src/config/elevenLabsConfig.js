// ElevenLabs voice profiles and configuration

export const VOICE_PROFILES = {
  default: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    name: 'Rachel',
    description: 'Calm, professional female voice',
    settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  },
  encouraging: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    name: 'Bella',
    description: 'Warm, encouraging female voice',
    settings: {
      stability: 0.6,
      similarity_boost: 0.7,
    },
  },
  direct: {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold
    name: 'Arnold',
    description: 'Direct, authoritative male voice',
    settings: {
      stability: 0.7,
      similarity_boost: 0.6,
    },
  },
};

export const FEEDBACK_TEMPLATES = {
  pace_fast: 'Try slowing down your pace. Take a breath.',
  pace_slow: 'You can speak a bit faster to sound more confident.',
  interruption: 'Let them finish their thought.',
  question: 'Ask them a question to show you\'re engaged.',
  monologue: 'You\'ve been talking for a while. Give them space to respond.',
  balance_dominating: 'Try to listen more and give them room to speak.',
  balance_quiet: 'Don\'t be afraid to contribute more to the conversation.',
};

export const MODEL_CONFIG = {
  modelId: 'eleven_monolingual_v1',
  optimize_streaming_latency: 0,
  output_format: 'mp3_44100_128',
};
