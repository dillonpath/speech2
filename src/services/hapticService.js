// Haptic feedback service for real-time notifications
import { Vibration } from 'react-native';

class HapticService {
  // Vibration patterns
  patterns = {
    pace: [0, 100], // Short vibration for pace adjustment
    interruption: [0, 500], // Long vibration for interruption
    question: [0, 100, 100, 100], // Double vibration for asking question
    monologue: [0, 100, 100, 100, 100, 100], // Triple vibration for long speaking
  };

  triggerPaceAdjustment() {
    Vibration.vibrate(this.patterns.pace);
  }

  triggerInterruptionWarning() {
    Vibration.vibrate(this.patterns.interruption);
  }

  triggerQuestionPrompt() {
    Vibration.vibrate(this.patterns.question);
  }

  triggerMonologueWarning() {
    Vibration.vibrate(this.patterns.monologue);
  }
}

export default new HapticService();
