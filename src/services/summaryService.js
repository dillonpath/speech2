// Post-conversation summary generation with ElevenLabs
import apiService from './apiService';
import feedbackService from './feedbackService';

class SummaryService {
  async generateConversationSummary(conversationId) {
    try {
      // Get conversation data
      const conversationData = await apiService.getConversationData(conversationId);
      const metrics = feedbackService.getConversationMetrics();

      // Generate summary text
      const summaryText = this.createSummaryText(metrics, conversationData);
      
      // Generate audio summary
      const elevenLabsService = await import('./elevenLabsService.js');
      await elevenLabsService.default.playSummary(summaryText);
      
      return summaryText;
    } catch (error) {
      console.error('❌ Summary generation failed:', error);
      throw error;
    }
  }

  createSummaryText(metrics, conversationData) {
    const speakingTimeMsg = this.getSpeakingTimeMessage(metrics.speakingPercent);
    const interruptionMsg = this.getInterruptionMessage(metrics.interruptionCount);
    const questionMsg = this.getQuestionMessage(metrics.questionCount);
    const adviceMsg = this.getAdviceMessage(metrics);

    return `
Hey, let's review your conversation.

${speakingTimeMsg}

${interruptionMsg}

${questionMsg}

${adviceMsg}

Keep practicing - you're doing great!
    `.trim();
  }

  getSpeakingTimeMessage(speakingPercent) {
    if (speakingPercent > 70) {
      return `You spoke ${speakingPercent}% of the time. That's quite dominant - try aiming for a more balanced 50-50 split so the other person feels heard.`;
    } else if (speakingPercent < 30) {
      return `You spoke ${speakingPercent}% of the time. You were quite reserved - don't be afraid to share more of your thoughts.`;
    } else {
      return `You spoke ${speakingPercent}% of the time. Excellent balance - you found the right mix of speaking and listening.`;
    }
  }

  getInterruptionMessage(interruptionCount) {
    if (interruptionCount === 0) {
      return "You didn't interrupt at all - fantastic conversational etiquette!";
    } else if (interruptionCount <= 2) {
      return `You interrupted ${interruptionCount} time${interruptionCount > 1 ? 's' : ''}. Be mindful of letting people finish their thoughts.`;
    } else {
      return `You interrupted ${interruptionCount} times. Try being more patient and practice active listening.`;
    }
  }

  getQuestionMessage(questionCount) {
    if (questionCount === 0) {
      return "You didn't ask any questions. Try asking more open-ended questions to show engagement.";
    } else if (questionCount <= 3) {
      return `You asked ${questionCount} question${questionCount > 1 ? 's' : ''}. Good job showing curiosity!`;
    } else {
      return `You asked ${questionCount} questions! Excellent - you really engaged with the other person.`;
    }
  }

  getAdviceMessage(metrics) {
    const advice = [];
    
    if (metrics.speakingPercent > 70) {
      advice.push("Next time, try counting to 3 after the other person finishes speaking before you respond.");
    }
    
    if (metrics.interruptionCount > 2) {
      advice.push("When you feel the urge to interrupt, make a mental note and wait for your turn.");
    }
    
    if (metrics.questionCount < 2) {
      advice.push("Prepare 2-3 open-ended questions before your next conversation.");
    }
    
    if (advice.length === 0) {
      return "Your conversation skills are strong! Keep up the good work.";
    }
    
    return `Here's one thing to try next time: ${advice[0]}`;
  }
}

export default new SummaryService();