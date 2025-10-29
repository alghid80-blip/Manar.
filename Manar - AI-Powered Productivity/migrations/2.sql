
-- Insert default learning categories
INSERT INTO learning_categories (name, description, icon, color) VALUES
('Productivity', 'Tips and techniques for better productivity and time management', 'Clock', '#3B82F6'),
('Mindfulness', 'Mindfulness exercises and mental wellness practices', 'Brain', '#10B981'),
('Skills', 'Professional and personal skill development', 'Trophy', '#F59E0B'),
('Health', 'Physical and mental health improvement tips', 'Heart', '#EF4444'),
('Creativity', 'Creative thinking and innovation techniques', 'Lightbulb', '#8B5CF6'),
('Technology', 'Latest trends and tools in technology', 'Cpu', '#06B6D4');

-- Insert sample rewards
INSERT INTO rewards (name, description, reward_type, condition_type, condition_value, points_value, icon, color, rarity) VALUES
('First Timer', 'Completed your first focus session', 'badge', 'sessions_completed', 1, 50, 'Timer', '#3B82F6', 'common'),
('Learning Explorer', 'Read your first lesson', 'badge', 'lessons_completed', 1, 25, 'BookOpen', '#10B981', 'common'),
('Focus Warrior', 'Completed 10 focus sessions', 'badge', 'sessions_completed', 10, 200, 'Shield', '#F59E0B', 'rare'),
('Knowledge Seeker', 'Read 25 lessons', 'badge', 'lessons_completed', 25, 300, 'GraduationCap', '#8B5CF6', 'rare'),
('Streak Master', 'Maintained a 7-day streak', 'badge', 'streak_days', 7, 500, 'Fire', '#EF4444', 'epic'),
('Centurion', 'Completed 100 focus sessions', 'badge', 'sessions_completed', 100, 1000, 'Crown', '#F59E0B', 'legendary'),
('Time Lord', 'Focused for 50 hours total', 'badge', 'total_minutes', 3000, 1500, 'Clock', '#8B5CF6', 'legendary');
