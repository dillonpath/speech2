// Test script for Gemini speech analysis
require('dotenv').config();
const geminiService = require('./src/services/geminiService').default;
const path = require('path');

async function testSpeechAnalysis() {
  try {
    console.log('Starting Gemini speech analysis test...\n');

    const audioFilePath = path.join(__dirname, 'new recording 2.m4a');
    console.log('Audio file:', audioFilePath);
    console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
    console.log('\nAnalyzing audio...\n');

    const result = await geminiService.analyzeSpeech(audioFilePath);

    console.log('=== ANALYSIS RESULTS ===\n');
    console.log('Transcription:', result.transcription);
    console.log('\n--- Speech Patterns ---');
    console.log('Stutters:', result.analysis.stutters.length);
    if (result.analysis.stutters.length > 0) {
      console.log('  Details:', JSON.stringify(result.analysis.stutters, null, 2));
    }

    console.log('\nPauses:', result.analysis.pauses.length);
    if (result.analysis.pauses.length > 0) {
      console.log('  Details:', JSON.stringify(result.analysis.pauses, null, 2));
    }

    console.log('\nTone:', result.analysis.tone.overall, `(${result.analysis.tone.score}/100)`);

    console.log('\nFiller Words:');
    result.analysis.fillerWords.forEach(fw => {
      console.log(`  "${fw.word}": ${fw.count} times`);
    });

    console.log('\nSpeaking Rate:', result.analysis.speakingRate.wordsPerMinute, 'WPM');
    console.log('Variance:', result.analysis.speakingRate.variance);

    console.log('\nConfidence Score:', result.analysis.confidence.score + '/100');
    console.log('Indicators:', result.analysis.confidence.indicators.join(', '));

    console.log('\nInterruptions:', result.analysis.interruptions.detected ? 'Yes' : 'No');
    console.log('Count:', result.analysis.interruptions.count);

    console.log('\nSentiment:', result.analysis.sentiment);

    console.log('\n--- Key Insights ---');
    result.analysis.keyInsights.forEach((insight, i) => {
      console.log(`${i + 1}. ${insight}`);
    });

    console.log('\n=== FULL RESULT ===');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error during test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSpeechAnalysis();
