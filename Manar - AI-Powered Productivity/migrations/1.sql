
-- Users table for storing user preferences and stats
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mocha_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  focus_goal_minutes INTEGER DEFAULT 120,
  learning_goal_lessons INTEGER DEFAULT 3,
  preferred_session_length INTEGER DEFAULT 25,
  total_focus_minutes INTEGER DEFAULT 0,
  total_sessions_completed INTEGER DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  experience_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Focus sessions table for tracking Pomodoro sessions
CREATE TABLE focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  is_completed BOOLEAN DEFAULT 0,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  mood_before TEXT,
  mood_after TEXT,
  focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
  notes TEXT,
  ai_encouragement TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning categories
CREATE TABLE learning_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning lessons/content
CREATE TABLE learning_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('article', 'tip', 'quote', 'exercise')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_read_time INTEGER,
  tags TEXT,
  is_ai_generated BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress on lessons
CREATE TABLE user_lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  completion_date TIMESTAMP,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- Rewards and achievements
CREATE TABLE rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('badge', 'title', 'unlock', 'bonus_points')),
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  points_value INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User earned rewards
CREATE TABLE user_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, reward_id)
);

-- AI personalization data
CREATE TABLE ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('productivity_pattern', 'learning_preference', 'motivation_tip', 'session_recommendation')),
  insight_data TEXT NOT NULL,
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_mocha_user_id ON users(mocha_user_id);
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_date ON focus_sessions(started_at);
CREATE INDEX idx_learning_lessons_category ON learning_lessons(category_id);
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_ai_insights_user ON ai_insights(user_id);
