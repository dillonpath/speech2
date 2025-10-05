// Enhanced real-time feedback with ElevenLabs integration
import { FEEDBACK_CONFIG } from '../config/constants';

class RealTimeFeedbackService {
  constructor() {
    this.feedbackQueue = [];
    this.isPlaying = false;
    this.lastFeedbackTime = 0;
    this.feedbackCooldown = 8000; // 8 seconds between feedback
    this.activeFeedbacks = new Set();
  }

  async queueFeedback(feedback) {
    if (!feedback || !feedback.message) return;

    // Check if similar feedback was recently given
    if (this.activeFeedbacks.has(feedback.type)) {
      console.log(`⚠️ Feedback ${feedback.type} already active, skipping`);
      return;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.feedbackCooldown) {
      console.log('⏳ Feedback cooldown active, queuing');
      this.feedbackQueue.push(feedback);
      return;
    }

    await this.playFeedback(feedback);
  }

  async playFeedback(feedback) {
    if (this.isPlaying) {
      this.feedbackQueue.unshift(feedback); // Add to front of queue
      return;
    }

    this.isPlaying = true;
    this.activeFeedbacks.add(feedback.type);
    this.lastFeedbackTime = Date.now();

    try {
      console.log(`🎧 Playing feedback: ${feedback.message}`);
      
      // Import dynamically to avoid circular dependencies
      const elevenLabsService = await import('./elevenLabsService.js');
      await elevenLabsService.default.playWhisper(feedback.message);
      
    } catch (error) {
      console.error('❌ Feedback playback failed:', error);
    } finally {
      this.isPlaying = false;
      this.activeFeedbacks.delete(feedback.type);
      
      // Play next in queue after short delay
      setTimeout(() => {
        if (this.feedbackQueue.length > 0) {
          const nextFeedback = this.feedbackQueue.shift();
          this.playFeedback(nextFeedback);
        }
      }, 2000);
    }
  }

  clearQueue() {
    this.feedbackQueue = [];
    this.activeFeedbacks.clear();
    this.isPlaying = false;
  }
}

export default new RealTimeFeedbackService();