// Enhanced feedback service with FASTER detection
import { THRESHOLDS, FEEDBACK_CONFIG } from '../config/constants';

class FeedbackService {
  constructor() {
    this.lastFeedbackTime = 0;
    this.feedbackCooldown = 5000; // 5 seconds between feedback
    this.conversationStartTime = null;
    
    // Track conversation state
    this.metrics = {
      totalWords: 0,
      totalDuration: 0,
      interruptionCount: 0,
      questionCount: 0,
      userSpeakingTime: 0,
      lastSpeaker: null,
      consecutiveUserSegments: 0,
      segmentHistory: [],
      lastQuestionTime: null
    };
    
    this.feedbackGiven = new Set();
  }

  startConversation() {
    this.conversationStartTime = Date.now();
    this.lastFeedbackTime = 0;
    this.metrics = {
      totalWords: 0,
      totalDuration: 0,
      interruptionCount: 0,
      questionCount: 0,
      userSpeakingTime: 0,
      lastSpeaker: null,
      consecutiveUserSegments: 0,
      segmentHistory: [],
      lastQuestionTime: null
    };
    this.feedbackGiven.clear();
    console.log("🎯 Conversation tracking started");
  }

  evaluateRealTimeFeedback(segment) {
    const now = Date.now();
    const conversationDuration = now - this.conversationStartTime;
    
    // Update metrics with current segment
    this.updateMetrics(segment);
    
    // Enforce 5-second cooldown
    if (now - this.lastFeedbackTime < this.feedbackCooldown) {
      return null;
    }

    // 🚀 REDUCED: Only 5 seconds grace period instead of 10
    if (conversationDuration < 5000) {
      return null;
    }

    console.log('📊 Current metrics:', {
      wpm: this.getCurrentWPM(),
      interruptions: this.metrics.interruptionCount,
      questions: this.metrics.questionCount,
      consecutiveSegments: this.metrics.consecutiveUserSegments,
      userSpeakingTime: this.metrics.userSpeakingTime
    });

    // Check all feedback conditions
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

    // Update word count
    if (segment.transcription) {
      const words = segment.transcription.split(/\s+/).filter(w => w.length > 0).length;
      this.metrics.totalWords += words;
    }

    // Update duration
    this.metrics.totalDuration += segment.durationMs || 7000;

    // Track speaker patterns
    const currentSpeaker = segment.speaker || 'user';
    if (currentSpeaker === 'user') {
      this.metrics.userSpeakingTime += segment.durationMs || 7000;
      if (this.metrics.lastSpeaker === 'user') {
        this.metrics.consecutiveUserSegments++;
      } else {
        this.metrics.consecutiveUserSegments = 1;
      }
    } else {
      this.metrics.consecutiveUserSegments = 0;
    }
    this.metrics.lastSpeaker = currentSpeaker;

    // Update interruptions
    if (segment.analysis?.interruptions?.detected) {
      this.metrics.interruptionCount += segment.analysis.interruptions.count || 1;
    }

    // Update questions and track last question time
    const questionsInSegment = (segment.transcription?.match(/\?/g) || []).length;
    if (questionsInSegment > 0) {
      this.metrics.questionCount += questionsInSegment;
      this.metrics.lastQuestionTime = segment.timestamp || Date.now();
    }

    // Keep recent history (last 3 segments for faster response)
    this.metrics.segmentHistory.push({
      timestamp: segment.timestamp || Date.now(),
      speaker: currentSpeaker,
      duration: segment.durationMs || 7000,
      hasQuestion: questionsInSegment > 0,
      wordCount: segment.transcription ? segment.transcription.split(/\s+/).filter(w => w.length > 0).length : 0
    });
    
    if (this.metrics.segmentHistory.length > 3) { // Reduced from 5 to 3 for faster response
      this.metrics.segmentHistory.shift();
    }
  }

  checkAllConditions(segment, conversationDuration) {
    const conditions = [];

    // 1. 🚀 INSTANT PACE DETECTION - Most immediate feedback
    const currentWPM = this.getCurrentWPM();
    if (currentWPM > THRESHOLDS.fastPaceWPM) {
      conditions.push({
        type: 'pace_fast',
        message: `You're speaking at ${currentWPM} words per minute - that's quite fast. Try slowing down for better clarity.`,
        priority: 1, // Highest priority
        wpm: currentWPM
      });
    } else if (currentWPM < THRESHOLDS.slowPaceWPM && currentWPM > 20) {
      conditions.push({
        type: 'pace_slow', 
        message: `You're speaking at ${currentWPM} words per minute - try picking up the pace a bit to maintain engagement.`,
        priority: 1, // Highest priority
        wpm: currentWPM
      });
    }

    // 2. 🚀 QUICK MONOLOGUE DETECTION - After just 2 segments (~14 seconds)
    if (this.metrics.consecutiveUserSegments >= 2) { // Reduced from 3 to 2
      const totalMonologueTime = this.metrics.consecutiveUserSegments * 7000;
      conditions.push({
        type: 'monologue',
        message: `You've been speaking for ${Math.round(totalMonologueTime/1000)} seconds. Pause and let the other person respond.`,
        priority: 2,
        duration: totalMonologueTime
      });
    }

    // 3. 🚀 IMMEDIATE INTERRUPTION DETECTION - After 1 interruption
    if (this.metrics.interruptionCount >= 1) { // Reduced from 2 to 1
      conditions.push({
        type: 'interruption',
        message: `You've interrupted ${this.metrics.interruptionCount} time${this.metrics.interruptionCount > 1 ? 's' : ''}. Practice active listening.`,
        priority: 2,
        count: this.metrics.interruptionCount
      });
    }

    // 4. 🚀 FASTER QUESTION ENCOURAGEMENT - After 15 seconds without questions
    const timeSinceLastQuestion = this.getTimeSinceLastQuestion();
    if (timeSinceLastQuestion > 15000 && this.metrics.questionCount === 0) { // Reduced from 30 to 15 seconds
      conditions.push({
        type: 'question_prompt',
        message: "Try asking an open-ended question to engage the other person.",
        priority: 1,
        timeSinceQuestion: timeSinceLastQuestion
      });
    }

    // 5. 🚀 QUICK SPEAKING BALANCE - After 30 seconds instead of 60
    if (conversationDuration > 30000) { // Reduced from 60000 to 30000
      const speakingPercentage = this.getSpeakingPercentage();
      if (speakingPercentage > THRESHOLDS.maxSpeakingPercent) {
        conditions.push({
          type: 'balance_talkative',
          message: `You're doing ${Math.round(speakingPercentage)}% of the talking. Try listening more.`,
          priority: 2,
          percentage: speakingPercentage
        });
      } else if (speakingPercentage < THRESHOLDS.minSpeakingPercent) {
        conditions.push({
          type: 'balance_quiet',
          message: `You're only doing ${Math.round(speakingPercentage)}% of the talking. Share more of your thoughts.`,
          priority: 2,
          percentage: speakingPercentage
        });
      }
    }

    // 6. 🚀 INSTANT FILLER WORD DETECTION
    if (segment.analysis?.fillerWords && segment.analysis.fillerWords.length > 0) {
      const totalFillers = segment.analysis.fillerWords.reduce((sum, f) => sum + f.count, 0);
      if (totalFillers >= 2) { // Reduced threshold from 3 to 2
        conditions.push({
          type: 'filler_words',
          message: `You used ${totalFillers} filler words. Try pausing instead.`,
          priority: 1,
          count: totalFillers
        });
      }
    }

    // Return highest priority feedback
    if (conditions.length > 0) {
      conditions.sort((a, b) => b.priority - a.priority);
      return conditions[0];
    }

    return null;
  }

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
    if (this.metrics.lastQuestionTime) {
      return now - this.metrics.lastQuestionTime;
    }
    return now - this.conversationStartTime; // No questions yet
  }

  reset() {
    this.lastFeedbackTime = 0;
    this.conversationStartTime = null;
    this.metrics = {
      totalWords: 0,
      totalDuration: 0,
      interruptionCount: 0,
      questionCount: 0,
      userSpeakingTime: 0,
      lastSpeaker: null,
      consecutiveUserSegments: 0,
      segmentHistory: [],
      lastQuestionTime: null
    };
    this.feedbackGiven.clear();
  }
}

export default new FeedbackService();