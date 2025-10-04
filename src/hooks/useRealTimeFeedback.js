import { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';
import hapticService from '../services/hapticService';

const useRealTimeFeedback = (currentMetrics, isActive) => {
  const [activeFeedback, setActiveFeedback] = useState(null);

  useEffect(() => {
    if (!isActive) {
      feedbackService.reset();
      setActiveFeedback(null);
      return;
    }

    feedbackService.startConversation();
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !currentMetrics) return;

    const feedback = feedbackService.evaluateRealTimeFeedback(currentMetrics);

    if (feedback) {
      setActiveFeedback(feedback);

      // Trigger haptic feedback
      switch (feedback.hapticPattern) {
        case 'pace':
          hapticService.triggerPaceAdjustment();
          break;
        case 'interruption':
          hapticService.triggerInterruptionWarning();
          break;
        case 'question':
          hapticService.triggerQuestionPrompt();
          break;
        case 'monologue':
          hapticService.triggerMonologueWarning();
          break;
      }

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setActiveFeedback(null);
      }, 3000);
    }
  }, [currentMetrics, isActive]);

  return {
    activeFeedback,
  };
};

export default useRealTimeFeedback;
