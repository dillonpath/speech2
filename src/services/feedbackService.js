// Real-time feedback logic and trigger management
import { THRESHOLDS, FEEDBACK_DELAYS } from '../config/constants';

class FeedbackService {
  constructor() {
    this.lastFeedback = {};
    this.conversationStartTime = null;
    this.currentSpeakingStartTime = null;
  }

  startConversation() {
    this.conversationStartTime = Date.now();
    this.lastFeedback = {};
  }

  shouldTriggerPaceFeedback(wordsPerMinute) {
    const now = Date.now();
    const lastPaceFeedback = this.lastFeedback.pace || 0;

    if (now - lastPaceFeedback < FEEDBACK_DELAYS.pace) {
      return null;
    }

    if (wordsPerMinute > THRESHOLDS.fastPaceWPM) {
      this.lastFeedback.pace = now;
      return {
        type: 'pace',
        message: 'You\'re speaking too fast',
        hapticPattern: 'pace',
      };
    }

    if (wordsPerMinute < THRESHOLDS.slowPaceWPM) {
      this.lastFeedback.pace = now;
      return {
        type: 'pace',
        message: 'Try speaking a bit faster',
        hapticPattern: 'pace',
      };
    }

    return null;
  }

  shouldTriggerInterruptionFeedback(interrupted) {
    if (interrupted) {
      return {
        type: 'interruption',
        message: 'Let them finish speaking',
        hapticPattern: 'interruption',
      };
    }
    return null;
  }

  shouldTriggerQuestionFeedback(questionCount, conversationDuration) {
    const now = Date.now();
    const lastQuestionFeedback = this.lastFeedback.question || 0;

    if (now - lastQuestionFeedback < FEEDBACK_DELAYS.question) {
      return null;
    }

    if (conversationDuration > THRESHOLDS.questionInterval && questionCount < 2) {
      this.lastFeedback.question = now;
      return {
        type: 'question',
        message: 'Try asking them a question',
        hapticPattern: 'question',
      };
    }

    return null;
  }

  shouldTriggerMonologueFeedback(currentSpeakingDuration) {
    if (currentSpeakingDuration > THRESHOLDS.maxMonologueDuration) {
      return {
        type: 'monologue',
        message: 'You\'ve been talking for a while - pause',
        hapticPattern: 'monologue',
      };
    }
    return null;
  }

  shouldTriggerSpeakingBalanceFeedback(speakingPercent, conversationDuration) {
    // Only check balance after 2 minutes
    if (conversationDuration < 120000) {
      return null;
    }

    const now = Date.now();
    const lastBalanceFeedback = this.lastFeedback.balance || 0;

    if (now - lastBalanceFeedback < 60000) { // 1 minute delay
      return null;
    }

    if (speakingPercent > THRESHOLDS.maxSpeakingPercent) {
      this.lastFeedback.balance = now;
      return {
        type: 'balance',
        message: 'Try listening more',
        hapticPattern: 'pace',
      };
    }

    if (speakingPercent < THRESHOLDS.minSpeakingPercent) {
      this.lastFeedback.balance = now;
      return {
        type: 'balance',
        message: 'Contribute more to the conversation',
        hapticPattern: 'pace',
      };
    }

    return null;
  }

  evaluateRealTimeFeedback(currentMetrics) {
    const feedback = [];

    // Check all feedback conditions
    const paceFeedback = this.shouldTriggerPaceFeedback(currentMetrics.wordsPerMinute);
    if (paceFeedback) feedback.push(paceFeedback);

    const interruptionFeedback = this.shouldTriggerInterruptionFeedback(currentMetrics.interrupted);
    if (interruptionFeedback) feedback.push(interruptionFeedback);

    const questionFeedback = this.shouldTriggerQuestionFeedback(
      currentMetrics.questionCount,
      currentMetrics.conversationDuration
    );
    if (questionFeedback) feedback.push(questionFeedback);

    const monologueFeedback = this.shouldTriggerMonologueFeedback(
      currentMetrics.currentSpeakingDuration
    );
    if (monologueFeedback) feedback.push(monologueFeedback);

    const balanceFeedback = this.shouldTriggerSpeakingBalanceFeedback(
      currentMetrics.speakingPercent,
      currentMetrics.conversationDuration
    );
    if (balanceFeedback) feedback.push(balanceFeedback);

    // Return highest priority feedback
    return feedback[0] || null;
  }

  reset() {
    this.lastFeedback = {};
    this.conversationStartTime = null;
    this.currentSpeakingStartTime = null;
  }
}

export default new FeedbackService();
