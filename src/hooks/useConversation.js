import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService';
import storage from '../utils/storage';

const useConversation = () => {
  const [isActive, setIsActive] = useState(false);
  const [conversationData, setConversationData] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    speakingPercent: 0,
    interruptions: 0,
    wordsPerMinute: 0,
    questions: 0,
    fillerWords: 0,
    duration: 0,
  });

  const startConversation = () => {
    setIsActive(true);
    setConversationData([]);
    setCurrentMetrics({
      speakingPercent: 0,
      interruptions: 0,
      wordsPerMinute: 0,
      questions: 0,
      fillerWords: 0,
      duration: 0,
    });
  };

  const stopConversation = async () => {
    setIsActive(false);

    // Save conversation to storage
    const conversationId = await storage.saveConversation({
      data: conversationData,
      metrics: currentMetrics,
      timestamp: Date.now(),
    });

    return conversationId;
  };

  const addSegment = (segment) => {
    setConversationData(prev => [...prev, segment]);
  };

  const updateMetrics = () => {
    if (conversationData.length === 0) return;

    const speakingTime = analysisService.calculateSpeakingTime(conversationData);
    const interruptions = analysisService.detectInterruptions(conversationData);

    // Get all user transcriptions
    const userSegments = conversationData.filter(s => s.speaker === 'user');
    const fullTranscription = userSegments.map(s => s.text).join(' ');
    const totalDuration = userSegments.reduce((sum, s) => sum + s.duration, 0);

    const pace = analysisService.calculateSpeakingPace(fullTranscription, totalDuration);
    const fillerWords = analysisService.countFillerWords(fullTranscription);
    const questions = analysisService.countQuestions(fullTranscription);

    setCurrentMetrics({
      speakingPercent: speakingTime.userPercent,
      interruptions: interruptions.length,
      wordsPerMinute: pace,
      questions,
      fillerWords,
      duration: speakingTime.totalTime,
    });
  };

  // Update metrics whenever conversation data changes
  useEffect(() => {
    if (isActive) {
      updateMetrics();
    }
  }, [conversationData, isActive]);

  return {
    isActive,
    conversationData,
    currentMetrics,
    startConversation,
    stopConversation,
    addSegment,
  };
};

export default useConversation;
