// Simple ID generator for Cloudflare Workers
function generateId() {
  return crypto.randomUUID();
}

// Start a new conversation
export async function startConversation(db, userId, title = null) {
  const id = generateId();
  const now = Date.now();

  await db.prepare(`
    INSERT INTO conversations (id, user_id, title, started_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, userId, title, now, now).run();

  return {
    id,
    userId,
    title,
    startedAt: now
  };
}

// End a conversation
export async function endConversation(db, conversationId, userId) {
  const now = Date.now();

  // Get conversation start time
  const conversation = await db.prepare(`
    SELECT started_at FROM conversations
    WHERE id = ? AND user_id = ?
  `).bind(conversationId, userId).first();

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const durationMs = now - conversation.started_at;

  await db.prepare(`
    UPDATE conversations
    SET ended_at = ?, duration_ms = ?
    WHERE id = ? AND user_id = ?
  `).bind(now, durationMs, conversationId, userId).run();

  return {
    id: conversationId,
    endedAt: now,
    durationMs
  };
}

// Save a speech segment with Gemini analysis
export async function saveSegment(db, userId, segment) {
  const id = generateId();
  const now = Date.now();

  const {
    conversationId,
    transcription,
    speaker,
    sentiment,
    timestamp,
    durationMs,
    analysis
  } = segment;

  // Insert segment with analysis
  await db.prepare(`
    INSERT INTO speech_segments (
      id, conversation_id, user_id, transcription, speaker, sentiment,
      timestamp, duration_ms, stutters, pauses, tone, filler_words,
      speaking_rate, confidence, interruptions, key_insights, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    conversationId,
    userId,
    transcription,
    speaker || 'user',
    sentiment || 'neutral',
    timestamp,
    durationMs,
    JSON.stringify(analysis?.stutters || []),
    JSON.stringify(analysis?.pauses || []),
    JSON.stringify(analysis?.tone || {}),
    JSON.stringify(analysis?.fillerWords || []),
    JSON.stringify(analysis?.speakingRate || {}),
    JSON.stringify(analysis?.confidence || {}),
    JSON.stringify(analysis?.interruptions || {}),
    JSON.stringify(analysis?.keyInsights || []),
    now
  ).run();

  return {
    id,
    conversationId,
    saved: true
  };
}
