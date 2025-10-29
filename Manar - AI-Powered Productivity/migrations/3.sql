
-- Health tracking tables
CREATE TABLE health_habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  habit_type TEXT NOT NULL CHECK (habit_type IN ('sleep', 'water', 'nutrition', 'workout', 'mood', 'weight')),
  target_value REAL NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  habit_type TEXT NOT NULL CHECK (habit_type IN ('sleep', 'water', 'nutrition', 'workout', 'mood', 'weight')),
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  logged_date DATE NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study materials and PDF management
CREATE TABLE study_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  total_pages INTEGER,
  is_processed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  session_name TEXT NOT NULL,
  start_page INTEGER DEFAULT 1,
  end_page INTEGER,
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  is_completed BOOLEAN DEFAULT 0,
  comprehension_rating INTEGER CHECK (comprehension_rating BETWEEN 1 AND 5),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mindfulness and wellness
CREATE TABLE mindfulness_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('breathing', 'meditation', 'body_scan', 'gratitude', 'visualization')),
  duration_minutes INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  audio_url TEXT,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mindfulness_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  mood_before TEXT,
  mood_after TEXT,
  stress_level_before INTEGER CHECK (stress_level_before BETWEEN 1 AND 10),
  stress_level_after INTEGER CHECK (stress_level_after BETWEEN 1 AND 10),
  notes TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges and gamification
CREATE TABLE wellness_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'milestone')),
  target_value REAL NOT NULL,
  target_unit TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_challenge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  current_value REAL DEFAULT 0,
  is_completed BOOLEAN DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id)
);

-- Indexes for performance
CREATE INDEX idx_health_logs_user_date ON health_logs(user_id, logged_date);
CREATE INDEX idx_health_logs_habit_type ON health_logs(habit_type);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_mindfulness_sessions_user ON mindfulness_sessions(user_id);
CREATE INDEX idx_user_challenge_progress_user ON user_challenge_progress(user_id);
