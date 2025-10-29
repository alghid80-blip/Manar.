
-- Drop indexes
DROP INDEX idx_user_challenge_progress_user;
DROP INDEX idx_mindfulness_sessions_user;
DROP INDEX idx_study_sessions_user;
DROP INDEX idx_health_logs_habit_type;
DROP INDEX idx_health_logs_user_date;

-- Drop tables in reverse order
DROP TABLE user_challenge_progress;
DROP TABLE wellness_challenges;
DROP TABLE mindfulness_sessions;
DROP TABLE mindfulness_exercises;
DROP TABLE study_sessions;
DROP TABLE study_materials;
DROP TABLE health_logs;
DROP TABLE health_habits;
