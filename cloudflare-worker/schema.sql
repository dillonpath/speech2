-- Conversations table (recording sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_ms INTEGER,
  created_at INTEGER NOT NULL
);

-- Speech segments table (individual 10-second chunks with Gemini analysis)
CREATE TABLE IF NOT EXISTS speech_segments (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Core data
  transcription TEXT NOT NULL,
  speaker TEXT,
  sentiment TEXT,
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,

  -- Gemini analysis (stored as JSON text)
  stutters TEXT, -- JSON: [{"word": "...", "timestamp": 0, "type": "..."}]
  pauses TEXT, -- JSON: [{"duration": 2.5, "timestamp": 10, "type": "..."}]
  tone TEXT, -- JSON: {"overall": "confident", "score": 85}
  filler_words TEXT, -- JSON: [{"word": "um", "count": 3, "timestamps": [1,5,12]}]
  speaking_rate TEXT, -- JSON: {"wordsPerMinute": 150, "variance": "consistent"}
  confidence TEXT, -- JSON: {"score": 75, "indicators": ["..."]}
  interruptions TEXT, -- JSON: {"detected": false, "count": 0, "timestamps": []}
  key_insights TEXT, -- JSON: ["insight1", "insight2"]

  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Conversation summaries table (aggregated analysis and grades)
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id TEXT PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,

  -- Aggregated metrics
  total_segments INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  avg_words_per_minute REAL,
  total_filler_words INTEGER,
  filler_word_rate REAL, -- per 100 words
  total_stutters INTEGER,
  stutter_rate REAL, -- per 100 words
  total_pauses INTEGER,
  avg_pause_duration REAL,
  confidence_score REAL, -- 0-100
  overall_tone TEXT,
  overall_sentiment TEXT,

  -- Grading
  grade TEXT, -- A, B, C, D, F
  grade_score REAL, -- 0-100

  -- Analysis (stored as JSON)
  strengths TEXT, -- JSON: ["Direct communication", "Clear articulation"]
  areas_for_improvement TEXT, -- JSON: ["Reduce filler words", "Improve pacing"]
  key_patterns TEXT, -- JSON: ["Tends to pause before answering", ...]
  filler_word_breakdown TEXT, -- JSON: {"um": 15, "uh": 8, "like": 22}
  tone_breakdown TEXT, -- JSON: {"confident": 60, "nervous": 30, "calm": 10}

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- User progress tracking (optional - for tracking improvement over time)
CREATE TABLE IF NOT EXISTS user_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,

  -- Lifetime stats
  total_conversations INTEGER DEFAULT 0,
  total_segments INTEGER DEFAULT 0,
  total_words_spoken INTEGER DEFAULT 0,
  avg_grade_score REAL,
  best_grade TEXT,

  -- Recent trends (last 30 days)
  recent_avg_confidence REAL,
  recent_filler_word_rate REAL,
  recent_stutter_rate REAL,

  last_conversation_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);

CREATE INDEX IF NOT EXISTS idx_segments_conversation_id ON speech_segments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_segments_user_id ON speech_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_segments_timestamp ON speech_segments(timestamp);

CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON conversation_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_grade_score ON conversation_summaries(grade_score);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON conversation_summaries(created_at);
