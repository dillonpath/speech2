// Faster feedback thresholds
export const THRESHOLDS = {
  // Speaking pace (words per minute)
  fastPaceWPM: 160,    // Lowered to catch more cases
  slowPaceWPM: 100,    // Raised to catch slow speakers earlier
  
  // Monologue detection (in segments of 7 seconds each)
  maxConsecutiveSegments: 2, // Reduced from 3 to 2 (~14 seconds)
  
  // Speaking balance (%)
  maxSpeakingPercent: 65,    // Lowered to catch dominance earlier
  minSpeakingPercent: 35,    // Raised to catch quietness earlier
  
  // Interruption thresholds
  minInterruptionsForFeedback: 1, // Reduced from 2 to 1
  
  // Question timing (milliseconds)
  questionPromptTime: 15000, // Reduced from 30000 to 15000
  
  // Filler word thresholds
  minFillersForFeedback: 2, // Reduced from 3 to 2
};

export const FEEDBACK_CONFIG = {
  cooldown: 5000, // 5 seconds between feedback
  initialGracePeriod: 5000, // Reduced from 10000 to 5000
  maxFeedbacksPerConversation: 8,
};