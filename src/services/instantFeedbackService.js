// Instant feedback for immediate speaking pace detection
class InstantFeedbackService {
    constructor() {
      this.lastFeedbackTime = 0;
      this.feedbackCooldown = 5000; // 5 seconds between same type feedback
      this.activeFeedbacks = new Set();
    }
  
    analyzeInstantMetrics(transcription, audioLevel, durationMs = 7000) {
      const metrics = {
        wordsPerMinute: this.calculateWordsPerMinute(transcription, durationMs),
        audioLevel: audioLevel,
        transcriptionLength: transcription.length,
        hasQuestion: transcription.includes('?'),
        isSpeakingFast: false,
        isSpeakingSlow: false,
        isTooQuiet: false
      };
  
      // Instant pace detection
      metrics.isSpeakingFast = metrics.wordsPerMinute > 190;
      metrics.isSpeakingSlow = metrics.wordsPerMinute < 100 && metrics.wordsPerMinute > 10;
      metrics.isTooQuiet = audioLevel < 0.1 && transcription.length > 10;
  
      return metrics;
    }
  
    calculateWordsPerMinute(transcription, durationMs) {
      if (!transcription || transcription.length < 5) return 0;
      
      const words = transcription.split(/\s+/).filter(word => word.length > 0);
      const minutes = durationMs / 60000;
      return Math.round(words.length / minutes);
    }
  
    getInstantFeedback(metrics, transcription) {
      const now = Date.now();
      const feedbacks = [];
  
      // 🚀 INSTANT PACE FEEDBACK (no delay)
      if (metrics.isSpeakingFast && now - this.lastFeedbackTime > 3000) {
        feedbacks.push({
          type: 'pace_fast',
          priority: 1,
          message: "You're speaking fast - slow down a bit",
          instant: true
        });
      }
  
      if (metrics.isSpeakingSlow && transcription.length > 20 && now - this.lastFeedbackTime > 4000) {
        feedbacks.push({
          type: 'pace_slow', 
          priority: 1,
          message: "Try speaking a bit faster",
          instant: true
        });
      }
  
      // Volume feedback
      if (metrics.isTooQuiet && now - this.lastFeedbackTime > 6000) {
        feedbacks.push({
          type: 'volume',
          priority: 2,
          message: "Speak up a little - I can barely hear you",
          instant: true
        });
      }
  
      // Return highest priority instant feedback
      if (feedbacks.length > 0) {
        feedbacks.sort((a, b) => b.priority - a.priority);
        const feedback = feedbacks[0];
        this.lastFeedbackTime = now;
        return feedback;
      }
  
      return null;
    }
  
    reset() {
      this.lastFeedbackTime = 0;
      this.activeFeedbacks.clear();
    }
  }
  
  export default new InstantFeedbackService();