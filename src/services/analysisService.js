// Conversation analysis and metrics calculation

class AnalysisService {
  calculateSpeakingTime(conversationData) {
    const userTime = conversationData.filter(c => c.speaker === 'user')
      .reduce((sum, c) => sum + c.duration, 0);

    const totalTime = conversationData.reduce((sum, c) => sum + c.duration, 0);

    return {
      userPercent: Math.round((userTime / totalTime) * 100),
      otherPercent: Math.round(((totalTime - userTime) / totalTime) * 100),
      userTime,
      totalTime,
    };
  }

  detectInterruptions(conversationData) {
    const interruptions = [];

    for (let i = 1; i < conversationData.length; i++) {
      const current = conversationData[i];
      const previous = conversationData[i - 1];

      // If speaker changed before previous segment ended
      if (current.speaker !== previous.speaker &&
          current.timestamp < previous.timestamp + previous.duration) {
        interruptions.push({
          timestamp: current.timestamp,
          interrupter: current.speaker,
        });
      }
    }

    return interruptions;
  }

  calculateSpeakingPace(transcription, duration) {
    const wordCount = transcription.split(/\s+/).length;
    const minutes = duration / 60000; // Convert ms to minutes

    return Math.round(wordCount / minutes);
  }

  countFillerWords(transcription) {
    const fillers = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually'];
    let count = 0;

    const lowerText = transcription.toLowerCase();
    fillers.forEach(filler => {
      const matches = lowerText.match(new RegExp(`\\b${filler}\\b`, 'g'));
      count += matches ? matches.length : 0;
    });

    return count;
  }

  countQuestions(transcription) {
    const questionMarks = (transcription.match(/\?/g) || []).length;
    const questionWords = (transcription.toLowerCase().match(/\b(who|what|when|where|why|how)\b/g) || []).length;

    return Math.max(questionMarks, Math.floor(questionWords / 2));
  }

  generateInsights(metrics) {
    const insights = [];

    // Speaking balance
    if (metrics.speakingPercent > 70) {
      insights.push('You dominated the conversation - aim for 50/50 balance');
    } else if (metrics.speakingPercent < 30) {
      insights.push('You were mostly listening - try contributing more');
    } else {
      insights.push('Great speaking balance!');
    }

    // Interruptions
    if (metrics.interruptions > 5) {
      insights.push(`You interrupted ${metrics.interruptions} times - practice active listening`);
    } else if (metrics.interruptions === 0) {
      insights.push('No interruptions - excellent conversation etiquette!');
    }

    // Speaking pace
    if (metrics.wordsPerMinute > 180) {
      insights.push('You spoke very fast - consider slowing down');
    } else if (metrics.wordsPerMinute < 120) {
      insights.push('Your pace was slow - you might seem less confident');
    }

    // Questions
    if (metrics.questions < 3) {
      insights.push('Ask more questions to show engagement');
    } else {
      insights.push('Good job asking questions!');
    }

    // Filler words
    if (metrics.fillerWords > 10) {
      insights.push(`${metrics.fillerWords} filler words detected - practice smoother speech`);
    }

    return insights;
  }

  calculateOverallScore(metrics) {
    let score = 70; // Base score

    // Speaking balance (max +15 points)
    const balanceDiff = Math.abs(50 - metrics.speakingPercent);
    score += Math.max(0, 15 - balanceDiff / 2);

    // Interruptions (max -15 points)
    score -= Math.min(15, metrics.interruptions * 2);

    // Speaking pace (max +10 points)
    if (metrics.wordsPerMinute >= 130 && metrics.wordsPerMinute <= 170) {
      score += 10;
    } else {
      const paceDiff = Math.abs(150 - metrics.wordsPerMinute);
      score += Math.max(0, 10 - paceDiff / 5);
    }

    // Questions (max +10 points)
    score += Math.min(10, metrics.questions * 2);

    // Filler words (max -10 points)
    score -= Math.min(10, metrics.fillerWords);

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

export default new AnalysisService();
