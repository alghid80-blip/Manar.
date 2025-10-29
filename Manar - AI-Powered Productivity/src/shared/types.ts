import z from "zod";

// User schemas
export const UserSchema = z.object({
  id: z.number(),
  mocha_user_id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  focus_goal_minutes: z.number(),
  learning_goal_lessons: z.number(),
  preferred_session_length: z.number(),
  total_focus_minutes: z.number(),
  total_sessions_completed: z.number(),
  total_lessons_completed: z.number(),
  current_streak: z.number(),
  longest_streak: z.number(),
  experience_points: z.number(),
  level: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Focus session schemas
export const FocusSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  session_type: z.enum(['focus', 'short_break', 'long_break']),
  planned_duration_minutes: z.number(),
  actual_duration_minutes: z.number().nullable(),
  is_completed: z.boolean(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  mood_before: z.string().nullable(),
  mood_after: z.string().nullable(),
  focus_rating: z.number().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  ai_encouragement: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FocusSession = z.infer<typeof FocusSessionSchema>;

// Learning schemas
export const LearningCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type LearningCategory = z.infer<typeof LearningCategorySchema>;

export const LearningLessonSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  title: z.string(),
  content: z.string(),
  lesson_type: z.enum(['article', 'tip', 'quote', 'exercise']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_read_time: z.number().nullable(),
  tags: z.string().nullable(),
  is_ai_generated: z.boolean(),
  category_name: z.string().optional(),
  category_color: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type LearningLesson = z.infer<typeof LearningLessonSchema>;

// Rewards schemas
export const RewardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  reward_type: z.enum(['badge', 'title', 'unlock', 'bonus_points']),
  condition_type: z.string(),
  condition_value: z.number(),
  points_value: z.number(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  earned_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Reward = z.infer<typeof RewardSchema>;

// AI insight schema
export const AIInsightSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  insight_type: z.enum(['productivity_pattern', 'learning_preference', 'motivation_tip', 'session_recommendation']),
  insight_data: z.string(),
  confidence_score: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AIInsight = z.infer<typeof AIInsightSchema>;

// Health tracking schemas
export const HealthHabitSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  habit_type: z.enum(['sleep', 'water', 'nutrition', 'workout', 'mood', 'weight']),
  target_value: z.number(),
  unit: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type HealthHabit = z.infer<typeof HealthHabitSchema>;

export const HealthLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  habit_type: z.enum(['sleep', 'water', 'nutrition', 'workout', 'mood', 'weight']),
  value: z.number(),
  unit: z.string(),
  notes: z.string().nullable(),
  logged_date: z.string(),
  logged_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type HealthLog = z.infer<typeof HealthLogSchema>;

// Study material schemas
export const StudyMaterialSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  file_path: z.string(),
  file_size: z.number().nullable(),
  mime_type: z.string().nullable(),
  total_pages: z.number().nullable(),
  is_processed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type StudyMaterial = z.infer<typeof StudyMaterialSchema>;

export const StudySessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  material_id: z.number(),
  session_name: z.string(),
  start_page: z.number(),
  end_page: z.number().nullable(),
  planned_duration_minutes: z.number(),
  actual_duration_minutes: z.number().nullable(),
  is_completed: z.boolean(),
  comprehension_rating: z.number().min(1).max(5).nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type StudySession = z.infer<typeof StudySessionSchema>;

// Mindfulness schemas
export const MindfulnessExerciseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  exercise_type: z.enum(['breathing', 'meditation', 'body_scan', 'gratitude', 'visualization']),
  duration_minutes: z.number(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  audio_url: z.string().nullable(),
  instructions: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MindfulnessExercise = z.infer<typeof MindfulnessExerciseSchema>;

// Wellness challenge schemas
export const WellnessChallengeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  challenge_type: z.enum(['daily', 'weekly', 'monthly', 'milestone']),
  target_value: z.number(),
  target_unit: z.string(),
  points_reward: z.number(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type WellnessChallenge = z.infer<typeof WellnessChallengeSchema>;
