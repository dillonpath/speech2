// Simple ID generator for Cloudflare Workers
function generateId() {
  return crypto.randomUUID();
}

// Generate summary and grade for a conversation
export async function generateSummary(db, conversationId, userId) {
  // Get all segments for this conversation
  const segments = await db.prepare(`
    SELECT * FROM speech_segments
    WHERE conversation_id = ? AND user_id = ?
    ORDER BY timestamp ASC
  `).bind(conversationId, userId).all();

  if (!segments.results || segments.results.length === 0) {
    throw new Error('No segments found for this conversation');
  }

  // Calculate aggregated metrics
  const metrics = calculateMetrics(segments.results);

  // Calculate grade
  const { grade, gradeScore } = calculateGrade(metrics);

  // Generate insights
  const { strengths, areasForImprovement, keyPatterns } = generateInsights(metrics, segments.results);

  const id = generateId();
  const now = Date.now();

  // Insert or update summary
  await db.prepare(`
    INSERT OR REPLACE INTO conversation_summaries (
      id, conversation_id, user_id, total_segments, total_words,
      avg_words_per_minute, total_filler_words, filler_word_rate,
      total_stutters, stutter_rate, total_pauses, avg_pause_duration,
      confidence_score, overall_tone, overall_sentiment, grade, grade_score,
      strengths, areas_for_improvement, key_patterns, filler_word_breakdown,
      tone_breakdown, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    conversationId,
    userId,
    metrics.totalSegments,
    metrics.totalWords,
    metrics.avgWordsPerMinute,
    metrics.totalFillerWords,
    metrics.fillerWordRate,
    metrics.totalStutters,
    metrics.stutterRate,
    metrics.totalPauses,
    metrics.avgPauseDuration,
    metrics.confidenceScore,
    metrics.overallTone,
    metrics.overallSentiment,
    grade,
    gradeScore,
    JSON.stringify(strengths),
    JSON.stringify(areasForImprovement),
    JSON.stringify(keyPatterns),
    JSON.stringify(metrics.fillerWordBreakdown),
    JSON.stringify(metrics.toneBreakdown),
    now,
    now
  ).run();

  return {
    id,
    conversationId,
    grade,
    gradeScore,
    metrics,
    strengths,
    areasForImprovement,
    keyPatterns
  };
}

// Get summary for a conversation
export async function getSummary(db, conversationId, userId) {
  const summary = await db.prepare(`
    SELECT * FROM conversation_summaries
    WHERE conversation_id = ? AND user_id = ?
  `).bind(conversationId, userId).first();

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    strengths: JSON.parse(summary.strengths),
    areasForImprovement: JSON.parse(summary.areas_for_improvement),
    keyPatterns: JSON.parse(summary.key_patterns),
    fillerWordBreakdown: JSON.parse(summary.filler_word_breakdown),
    toneBreakdown: JSON.parse(summary.tone_breakdown)
  };
}

// Get all summaries for a user
export async function getUserSummaries(db, userId) {
  const summaries = await db.prepare(`
    SELECT cs.*, c.title, c.started_at, c.ended_at
    FROM conversation_summaries cs
    JOIN conversations c ON cs.conversation_id = c.id
    WHERE cs.user_id = ?
    ORDER BY cs.created_at DESC
  `).bind(userId).all();

  return summaries.results.map(s => ({
    ...s,
    strengths: JSON.parse(s.strengths),
    areasForImprovement: JSON.parse(s.areas_for_improvement),
    keyPatterns: JSON.parse(s.key_patterns)
  }));
}

// Helper: Calculate metrics from segments
function calculateMetrics(segments) {
  let totalWords = 0;
  let totalFillerWords = 0;
  let totalStutters = 0;
  let totalPauses = 0;
  let pauseDurations = [];
  let confidenceScores = [];
  let tones = {};
  let sentiments = {};
  let fillerWords = {};

  segments.forEach(segment => {
    // Words
    const words = segment.transcription.split(' ').filter(w => w.length > 0);
    totalWords += words.length;

    // Filler words
    const fillerData = JSON.parse(segment.filler_words || '[]');
    fillerData.forEach(fw => {
      totalFillerWords += fw.count;
      fillerWords[fw.word] = (fillerWords[fw.word] || 0) + fw.count;
    });

    // Stutters
    const stutters = JSON.parse(segment.stutters || '[]');
    totalStutters += stutters.length;

    // Pauses
    const pauses = JSON.parse(segment.pauses || '[]');
    totalPauses += pauses.length;
    pauses.forEach(p => pauseDurations.push(p.duration));

    // Confidence
    const confidence = JSON.parse(segment.confidence || '{}');
    if (confidence.score) confidenceScores.push(confidence.score);

    // Tone
    const tone = JSON.parse(segment.tone || '{}');
    if (tone.overall) {
      tones[tone.overall] = (tones[tone.overall] || 0) + 1;
    }

    // Sentiment
    if (segment.sentiment) {
      sentiments[segment.sentiment] = (sentiments[segment.sentiment] || 0) + 1;
    }
  });

  const totalDurationMin = segments.reduce((sum, s) => sum + s.duration_ms, 0) / 60000;
  const avgWordsPerMinute = totalDurationMin > 0 ? totalWords / totalDurationMin : 0;
  const fillerWordRate = totalWords > 0 ? (totalFillerWords / totalWords) * 100 : 0;
  const stutterRate = totalWords > 0 ? (totalStutters / totalWords) * 100 : 0;
  const avgPauseDuration = pauseDurations.length > 0
    ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
    : 0;
  const avgConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    : 50;

  const overallTone = Object.keys(tones).reduce((a, b) => tones[a] > tones[b] ? a : b, 'neutral');
  const overallSentiment = Object.keys(sentiments).reduce((a, b) => sentiments[a] > sentiments[b] ? a : b, 'neutral');

  return {
    totalSegments: segments.length,
    totalWords,
    avgWordsPerMinute,
    totalFillerWords,
    fillerWordRate,
    totalStutters,
    stutterRate,
    totalPauses,
    avgPauseDuration,
    confidenceScore: avgConfidence,
    overallTone,
    overallSentiment,
    fillerWordBreakdown: fillerWords,
    toneBreakdown: tones
  };
}

// Helper: Calculate grade based on metrics
function calculateGrade(metrics) {
  let score = 100;

  // Deduct points for filler words (max -20)
  score -= Math.min(metrics.fillerWordRate * 2, 20);

  // Deduct points for stutters (max -15)
  score -= Math.min(metrics.stutterRate * 3, 15);

  // Deduct points for speaking rate issues (max -15)
  if (metrics.avgWordsPerMinute < 120) {
    score -= (120 - metrics.avgWordsPerMinute) * 0.2;
  } else if (metrics.avgWordsPerMinute > 180) {
    score -= (metrics.avgWordsPerMinute - 180) * 0.2;
  }

  // Deduct points for low confidence (max -20)
  if (metrics.confidenceScore < 70) {
    score -= (70 - metrics.confidenceScore) * 0.5;
  }

  // Deduct points for excessive pauses (max -15)
  if (metrics.avgPauseDuration > 2) {
    score -= Math.min((metrics.avgPauseDuration - 2) * 5, 15);
  }

  score = Math.max(0, Math.min(100, score));

  let grade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { grade, gradeScore: score };
}

// Helper: Generate insights
function generateInsights(metrics, segments) {
  const strengths = [];
  const areasForImprovement = [];
  const keyPatterns = [];

  // Analyze strengths
  if (metrics.fillerWordRate < 2) {
    strengths.push('Minimal use of filler words');
  }
  if (metrics.stutterRate < 1) {
    strengths.push('Smooth and fluent speech');
  }
  if (metrics.confidenceScore >= 75) {
    strengths.push('High confidence in delivery');
  }
  if (metrics.avgWordsPerMinute >= 130 && metrics.avgWordsPerMinute <= 170) {
    strengths.push('Well-paced speaking rate');
  }
  if (metrics.avgPauseDuration < 1.5) {
    strengths.push('Minimal hesitation');
  }

  // Analyze areas for improvement
  if (metrics.fillerWordRate >= 5) {
    areasForImprovement.push('Reduce filler word usage');
  }
  if (metrics.stutterRate >= 2) {
    areasForImprovement.push('Work on speech fluency');
  }
  if (metrics.confidenceScore < 60) {
    areasForImprovement.push('Build confidence in delivery');
  }
  if (metrics.avgWordsPerMinute < 120) {
    areasForImprovement.push('Increase speaking pace');
  } else if (metrics.avgWordsPerMinute > 180) {
    areasForImprovement.push('Slow down speaking pace');
  }
  if (metrics.avgPauseDuration > 2.5) {
    areasForImprovement.push('Reduce long pauses');
  }

  // Key patterns
  if (metrics.fillerWordBreakdown) {
    const topFiller = Object.entries(metrics.fillerWordBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    if (topFiller && topFiller[1] > 3) {
      keyPatterns.push(`Frequently uses "${topFiller[0]}" (${topFiller[1]} times)`);
    }
  }

  if (metrics.overallTone !== 'neutral') {
    keyPatterns.push(`Overall tone: ${metrics.overallTone}`);
  }

  return { strengths, areasForImprovement, keyPatterns };
}
