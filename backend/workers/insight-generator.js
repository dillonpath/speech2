// Cloudflare Worker for generating conversation insights

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  if (request.method === 'POST' && new URL(request.url).pathname === '/generate') {
    return await generateInsights(request);
  }

  return new Response('Not Found', { status: 404 });
}

async function generateInsights(request) {
  try {
    const { conversationData, metrics } = await request.json();

    // Generate comprehensive insights
    const insights = {
      summary: generateSummary(metrics),
      strengths: identifyStrengths(metrics),
      improvements: identifyImprovements(metrics),
      tips: generateActionableTips(metrics),
      score: calculateScore(metrics),
      grade: scoreToGrade(calculateScore(metrics)),
    };

    return new Response(JSON.stringify({
      success: true,
      insights,
    }), {
      headers: corsHeaders(),
    });

  } catch (error) {
    console.error('Insight generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

function generateSummary(metrics) {
  const duration = Math.floor(metrics.duration / 60000);
  return `You had a ${duration}-minute conversation with ${metrics.speakingPercent}% speaking time.`;
}

function identifyStrengths(metrics) {
  const strengths = [];

  if (metrics.speakingPercent >= 45 && metrics.speakingPercent <= 55) {
    strengths.push('Excellent speaking balance');
  }

  if (metrics.interruptions === 0) {
    strengths.push('No interruptions - great listening skills');
  }

  if (metrics.wordsPerMinute >= 130 && metrics.wordsPerMinute <= 170) {
    strengths.push('Perfect speaking pace');
  }

  if (metrics.questions >= 3) {
    strengths.push('Asked engaging questions');
  }

  return strengths;
}

function identifyImprovements(metrics) {
  const improvements = [];

  if (metrics.speakingPercent > 70) {
    improvements.push('Try listening more - aim for 50/50 balance');
  }

  if (metrics.interruptions > 5) {
    improvements.push('Reduce interruptions - let others finish their thoughts');
  }

  if (metrics.wordsPerMinute > 180) {
    improvements.push('Slow down your speaking pace');
  }

  if (metrics.questions < 2) {
    improvements.push('Ask more questions to show engagement');
  }

  if (metrics.fillerWords > 10) {
    improvements.push('Reduce filler words like "um" and "like"');
  }

  return improvements;
}

function generateActionableTips(metrics) {
  // TODO: Generate personalized tips based on metrics
  return [
    'Practice the 50/50 rule: aim for equal speaking time',
    'Use the 3-second rule: pause before responding',
    'Ask open-ended questions starting with "what" or "how"',
  ];
}

function calculateScore(metrics) {
  let score = 70;

  // Speaking balance
  const balanceDiff = Math.abs(50 - metrics.speakingPercent);
  score += Math.max(0, 15 - balanceDiff / 2);

  // Interruptions
  score -= Math.min(15, metrics.interruptions * 2);

  // Pace
  if (metrics.wordsPerMinute >= 130 && metrics.wordsPerMinute <= 170) {
    score += 10;
  }

  // Questions
  score += Math.min(10, metrics.questions * 2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToGrade(score) {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  return 'F';
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function handleCORS() {
  return new Response(null, {
    headers: corsHeaders(),
  });
}
