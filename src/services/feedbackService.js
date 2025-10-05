// Enhanced feedback service with real-time stutter detection + smarter variety
import { THRESHOLDS } from '../config/constants';

class FeedbackService {
  constructor() {
    this.lastFeedbackTime = 0;
    this.feedbackCooldown = 4000; // faster feedback window (4s)
    this.conversationStartTime = null;
    this.metrics = this._resetMetrics();
    this.feedbackGiven = new Set();
  }

  _resetMetrics() {
    return {
      totalWords: 0,
      totalDuration: 0,
      interruptionCount: 0,
      questionCount: 0,
      userSpeakingTime: 0,
      lastSpeaker: null,
      consecutiveUserSegments: 0,
      segmentHistory: [],
      lastQuestionTime: null,
      stutterEvents: 0
    };
  }

  startConversation() {
    this.conversationStartTime = Date.now();
    this.lastFeedbackTime = 0;
    this.metrics = this._resetMetrics();
    this.feedbackGiven.clear();
    console.log('🎯 Conversation tracking started');
  }

  evaluateRealTimeFeedback(segment) {
    const now = Date.now();
    const conversationDuration = now - this.conversationStartTime;

    this.updateMetrics(segment);

    if (now - this.lastFeedbackTime < this.feedbackCooldown) return null;
    if (conversationDuration < 4000) return null;

    const feedback = this.checkAllConditions(segment, conversationDuration);
    if (feedback && !this.feedbackGiven.has(feedback.type)) {
      this.lastFeedbackTime = now;
      this.feedbackGiven.add(feedback.type);
      console.log(`🎯 FEEDBACK TRIGGERED: ${feedback.message}`);
      return feedback;
    }

    return null;
  }

  updateMetrics(segment) {
    if (!segment) return;
    const words = segment.transcription?.split(/\s+/).filter(Boolean).length || 0;
    this.metrics.totalWords += words;
    this.metrics.totalDuration += segment.durationMs || 7000;

    const currentSpeaker = segment.speaker || 'user';
    if (currentSpeaker === 'user') {
      this.metrics.userSpeakingTime += segment.durationMs || 7000;
      this.metrics.consecutiveUserSegments =
        this.metrics.lastSpeaker === 'user'
          ? this.metrics.consecutiveUserSegments + 1
          : 1;
    } else {
      this.metrics.consecutiveUserSegments = 0;
    }
    this.metrics.lastSpeaker = currentSpeaker;

    if (segment.analysis?.interruptions?.detected)
      this.metrics.interruptionCount += segment.analysis.interruptions.count || 1;

    const questionsInSegment = (segment.transcription?.match(/\?/g) || []).length;
    if (questionsInSegment > 0) {
      this.metrics.questionCount += questionsInSegment;
      this.metrics.lastQuestionTime = segment.timestamp || Date.now();
    }

    // 🎯 Track stuttering events (repetition/prolongation/block)
    if (segment.analysis?.stutters?.length) {
      this.metrics.stutterEvents += segment.analysis.stutters.length;
    }

    this.metrics.segmentHistory.push({
      timestamp: segment.timestamp || Date.now(),
      speaker: currentSpeaker,
      duration: segment.durationMs || 7000,
      wordCount: words
    });
    if (this.metrics.segmentHistory.length > 3) this.metrics.segmentHistory.shift();
  }

  // === Main detection logic ===
  checkAllConditions(segment, conversationDuration) {
    const conditions = [];

    const currentWPM = this.getCurrentWPM();
    const totalFillers =
      segment.analysis?.fillerWords?.reduce((s, f) => s + f.count, 0) || 0;
    const tone = segment.analysis?.tone?.overall || 'neutral';
    const confidence = segment.analysis?.confidence?.score || 60;
    const sentiment = segment.analysis?.sentiment || 'neutral';
    const stutters = segment.analysis?.stutters || [];

    // 🧩 NEW: Real-time stutter feedback
    if (stutters.length > 0) {
      const typeCounts = { repetition: 0, prolongation: 0, block: 0 };
      stutters.forEach((s) => (typeCounts[s.type] = (typeCounts[s.type] || 0) + 1));
      const total = stutters.length;

      let msg = '';
      if (typeCounts.repetition > 0)
        msg = `I heard some repetition in your words. Try pausing slightly before restarting — it helps reset your rhythm.`;
      else if (typeCounts.prolongation > 0)
        msg = `You're stretching some sounds. Take a short breath and speak the next word smoothly.`;
      else if (typeCounts.block > 0)
        msg = `You had a brief block — relax your jaw and start gently on the next word.`;
      else
        msg = `A few stutters detected. Focus on slow breathing and shorter phrases.`;

      conditions.push({
        type: 'stuttering',
        message: msg,
        priority: 3,
        count: total
      });
    }

    // 🗣 Pace
    if (currentWPM > THRESHOLDS.fastPaceWPM)
      conditions.push({
        type: 'pace_fast',
        message: `You're speaking at ${currentWPM} words per minute — that's quite fast. Try short pauses for clarity.`,
        priority: 2
      });
    else if (currentWPM < THRESHOLDS.slowPaceWPM && currentWPM > 20)
      conditions.push({
        type: 'pace_slow',
        message: `You're speaking at ${currentWPM} words per minute — try picking up the pace a bit.`,
        priority: 2
      });

    // 🧏 Monologue
    if (this.metrics.consecutiveUserSegments >= 2)
      conditions.push({
        type: 'monologue',
        message: `You've been speaking for ${Math.round(
          (this.metrics.consecutiveUserSegments * 7000) / 1000
        )} seconds. Pause and let the other person respond.`,
        priority: 1
      });

    // 🔊 Filler words
    if (totalFillers >= 2)
      conditions.push({
        type: 'filler_words',
        message: `You used ${totalFillers} filler words — try pausing instead of saying "um" or "uh".`,
        priority: 1
      });

    // 💬 Confidence and tone
    if (confidence < 50)
      conditions.push({
        type: 'low_confidence',
        message: `You sound a bit hesitant — take a deep breath and project your voice.`,
        priority: 1
      });
    else if (confidence > 85)
      conditions.push({
        type: 'high_confidence',
        message: `You sound confident and clear — great delivery!`,
        priority: 1
      });

    if (tone === 'nervous')
      conditions.push({
        type: 'tone_nervous',
        message: `Your tone sounds tense — slow down and breathe.`,
        priority: 1
      });
    if (sentiment === 'positive')
      conditions.push({
        type: 'sentiment_positive',
        message: `Positive tone detected — good energy!`,
        priority: 1
      });

    // ✅ Return highest priority condition
    if (conditions.length > 0) {
      conditions.sort((a, b) => b.priority - a.priority);
      return conditions[0];
    }

    return null;
  }

  // === Utility helpers ===
  getCurrentWPM() {
    if (this.metrics.totalDuration === 0) return 0;
    const minutes = this.metrics.totalDuration / 60000;
    return Math.round(this.metrics.totalWords / minutes);
  }

  getSpeakingPercentage() {
    if (this.metrics.totalDuration === 0) return 50;
    return (this.metrics.userSpeakingTime / this.metrics.totalDuration) * 100;
  }

  getTimeSinceLastQuestion() {
    const now = Date.now();
    return this.metrics.lastQuestionTime
      ? now - this.metrics.lastQuestionTime
      : now - this.conversationStartTime;
  }

  reset() {
    this.lastFeedbackTime = 0;
    this.conversationStartTime = null;
    this.metrics = this._resetMetrics();
    this.feedbackGiven.clear();
  }
}

export default new FeedbackService();
