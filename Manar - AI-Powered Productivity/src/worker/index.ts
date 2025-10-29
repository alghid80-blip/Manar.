import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import type { MochaUser } from "@getmocha/users-service/shared";
import OpenAI from "openai";

interface ExtendedEnv extends Env {
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  OPENAI_API_KEY: string;
}

const app = new Hono<{ Bindings: ExtendedEnv }>();

app.use("/*", cors({
  origin: ["http://localhost:5173", "https://*.workers.dev"],
  credentials: true,
}));

// Authentication routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  try {
    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Session creation failed:", error);
    return c.json({ error: "Authentication failed" }, 400);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  // Check if user exists in our database, create if not
  const existingUser = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  let user = existingUser;
  if (!user) {
    // Create new user in our database
    const result = await c.env.DB.prepare(`
      INSERT INTO users (mocha_user_id, email, name, avatar_url) 
      VALUES (?, ?, ?, ?)
    `).bind(
      mochaUser.id,
      mochaUser.email,
      mochaUser.google_user_data.name || mochaUser.email,
      mochaUser.google_user_data.picture || null
    ).run();

    user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(result.meta.last_row_id as number).first();
  }

  return c.json(user);
});

app.put("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { name, focus_goal_minutes, learning_goal_lessons, preferred_session_length } = await c.req.json();
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE users 
    SET name = ?, focus_goal_minutes = ?, learning_goal_lessons = ?, 
        preferred_session_length = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    name || user.name,
    focus_goal_minutes || user.focus_goal_minutes,
    learning_goal_lessons || user.learning_goal_lessons,
    preferred_session_length || user.preferred_session_length,
    user.id
  ).run();

  const updatedUser = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(user.id).first();

  return c.json(updatedUser);
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// User stats and progress
app.get("/api/users/stats", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get recent sessions
  const recentSessions = await c.env.DB.prepare(`
    SELECT * FROM focus_sessions 
    WHERE user_id = ? 
    ORDER BY started_at DESC 
    LIMIT 10
  `).bind(Number(user.id)).all();

  // Get user rewards
  const userRewards = await c.env.DB.prepare(`
    SELECT r.*, ur.earned_at 
    FROM user_rewards ur 
    JOIN rewards r ON ur.reward_id = r.id 
    WHERE ur.user_id = ?
    ORDER BY ur.earned_at DESC
  `).bind(Number(user.id)).all();

  // Get next achievable reward
  const allRewards = await c.env.DB.prepare(`
    SELECT r.* FROM rewards r
    LEFT JOIN user_rewards ur ON r.id = ur.reward_id AND ur.user_id = ?
    WHERE ur.id IS NULL
    ORDER BY r.condition_value ASC
  `).bind(Number(user.id)).all();

  let nextReward = null;
  let progress = 0;

  for (const reward of allRewards.results) {
    let currentValue = 0;
    
    switch (reward.condition_type) {
      case "sessions_completed":
        currentValue = Number(user.total_sessions_completed);
        break;
      case "lessons_completed":
        currentValue = Number(user.total_lessons_completed);
        break;
      case "total_minutes":
        currentValue = Number(user.total_focus_minutes);
        break;
      case "streak_days":
        currentValue = Number(user.current_streak);
        break;
    }

    if (currentValue < Number(reward.condition_value)) {
      nextReward = reward;
      progress = (currentValue / Number(reward.condition_value)) * 100;
      break;
    }
  }

  return c.json({
    user,
    recentSessions: recentSessions.results,
    rewards: userRewards.results,
    nextReward,
    nextRewardProgress: progress,
  });
});

// Focus session management
app.post("/api/sessions/focus", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { sessionType, plannedDuration, moodBefore } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO focus_sessions (user_id, session_type, planned_duration_minutes, started_at, mood_before)
    VALUES (?, ?, ?, datetime('now'), ?)
  `).bind(Number(user.id), sessionType, plannedDuration, moodBefore || null).run();

  const session = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(session);
});

app.put("/api/sessions/focus/:id/complete", authMiddleware, async (c) => {
  const sessionId = c.req.param("id");
  const { actualDuration, moodAfter, focusRating, notes } = await c.req.json();

  await c.env.DB.prepare(`
    UPDATE focus_sessions 
    SET is_completed = 1, completed_at = datetime('now'), 
        actual_duration_minutes = ?, mood_after = ?, focus_rating = ?, notes = ?
    WHERE id = ?
  `).bind(actualDuration, moodAfter || null, focusRating || null, notes || null, sessionId).run();

  // Update user stats
  const session = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE id = ?"
  ).bind(sessionId).first();

  if (session && session.session_type === 'focus') {
    await c.env.DB.prepare(`
      UPDATE users 
      SET total_focus_minutes = total_focus_minutes + ?, 
          total_sessions_completed = total_sessions_completed + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(actualDuration, session.user_id).run();

    // Check for new rewards
    await checkAndAwardRewards(c, Number(session.user_id));
  }

  const updatedSession = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE id = ?"
  ).bind(sessionId).first();

  return c.json(updatedSession);
});

// Learning content
app.get("/api/learning/categories", authMiddleware, async (c) => {
  const categories = await c.env.DB.prepare(
    "SELECT * FROM learning_categories ORDER BY name"
  ).all();

  return c.json(categories.results);
});

app.get("/api/learning/lessons", authMiddleware, async (c) => {
  const categoryId = c.req.query("categoryId");
  const limit = parseInt(c.req.query("limit") || "10");

  let query = `
    SELECT l.*, c.name as category_name, c.color as category_color
    FROM learning_lessons l 
    JOIN learning_categories c ON l.category_id = c.id
  `;
  let params: any[] = [];

  if (categoryId) {
    query += " WHERE l.category_id = ?";
    params.push(categoryId);
  }

  query += " ORDER BY l.created_at DESC LIMIT ?";
  params.push(limit);

  const lessons = await c.env.DB.prepare(query).bind(...params).all();

  return c.json(lessons.results);
});

app.get("/api/learning/lessons/personalized", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get lessons the user hasn't completed yet
  const lessons = await c.env.DB.prepare(`
    SELECT l.*, c.name as category_name, c.color as category_color
    FROM learning_lessons l 
    JOIN learning_categories c ON l.category_id = c.id
    LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id AND ulp.user_id = ?
    WHERE ulp.id IS NULL OR ulp.is_completed = 0
    ORDER BY RANDOM()
    LIMIT 5
  `).bind(Number(user.id)).all();

  return c.json(lessons.results);
});

app.post("/api/learning/lessons/:id/complete", authMiddleware, async (c) => {
  const lessonId = c.req.param("id");
  const mochaUser = c.get("user") as MochaUser;
  const { rating, notes } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO user_lesson_progress 
    (user_id, lesson_id, is_completed, completion_date, rating, notes)
    VALUES (?, ?, 1, datetime('now'), ?, ?)
  `).bind(Number(user.id), lessonId, rating || null, notes || null).run();

  // Update user stats
  await c.env.DB.prepare(`
    UPDATE users 
    SET total_lessons_completed = total_lessons_completed + 1,
        experience_points = experience_points + 25,
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(Number(user.id)).run();

  // Check for new rewards
  await checkAndAwardRewards(c, Number(user.id));

  return c.json({ success: true });
});

// AI-powered insights and recommendations
app.get("/api/ai/insights", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const insights = await c.env.DB.prepare(`
    SELECT * FROM ai_insights 
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
    LIMIT 3
  `).bind(Number(user.id)).all();

  return c.json(insights.results);
});

app.post("/api/ai/generate-insight", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { insightType, userContext } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  try {
    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    let prompt = "";
    switch (insightType) {
      case "session_recommendation":
        prompt = `Based on this user's productivity data: ${JSON.stringify(userContext)}, provide a personalized recommendation for their next focus session. Keep it motivational and specific.`;
        break;
      case "motivation_tip":
        prompt = `Create a motivational tip for a user who has completed ${user.total_sessions_completed} focus sessions and ${user.total_lessons_completed} learning lessons. Make it personal and encouraging.`;
        break;
      default:
        prompt = `Generate a helpful productivity insight for a user with this context: ${JSON.stringify(userContext)}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful productivity coach. Provide concise, actionable, and encouraging advice. Keep responses under 100 words." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const insight = response.choices[0]?.message?.content;

    if (insight) {
      await c.env.DB.prepare(`
        INSERT INTO ai_insights (user_id, insight_type, insight_data, confidence_score)
        VALUES (?, ?, ?, ?)
      `).bind(Number(user.id), insightType, insight, 0.8).run();
    }

    return c.json({ insight });
  } catch (error) {
    console.error("AI insight generation failed:", error);
    return c.json({ error: "Failed to generate insight" }, 500);
  }
});

// Health tracking endpoints
app.get("/api/health/habits", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const habits = await c.env.DB.prepare(`
    SELECT * FROM health_habits WHERE user_id = ?
  `).bind(Number(user.id)).all();

  return c.json(habits.results);
});

app.get("/api/health/logs", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [todayLogs, weekLogs] = await Promise.all([
    c.env.DB.prepare(`
      SELECT * FROM health_logs 
      WHERE user_id = ? AND logged_date = ?
      ORDER BY logged_at DESC
    `).bind(Number(user.id), today).all(),
    c.env.DB.prepare(`
      SELECT * FROM health_logs 
      WHERE user_id = ? AND logged_date >= ?
      ORDER BY logged_date DESC, logged_at DESC
    `).bind(Number(user.id), weekAgo).all()
  ]);

  return c.json({
    today: todayLogs.results,
    week: weekLogs.results
  });
});

app.post("/api/health/log", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { habit_type, value, unit, notes, logged_date } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    INSERT INTO health_logs (user_id, habit_type, value, unit, notes, logged_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(Number(user.id), habit_type, value, unit, notes || null, logged_date).run();

  // Update challenge progress
  await updateChallengeProgress(c, Number(user.id), habit_type, value);

  return c.json({ success: true });
});

// Study material endpoints
app.get("/api/study/materials", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const materials = await c.env.DB.prepare(`
    SELECT * FROM study_materials WHERE user_id = ? ORDER BY created_at DESC
  `).bind(Number(user.id)).all();

  return c.json(materials.results);
});

app.get("/api/study/sessions", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const sessions = await c.env.DB.prepare(`
    SELECT * FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC
  `).bind(Number(user.id)).all();

  return c.json(sessions.results);
});

app.post("/api/study/upload", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // For now, simulate file upload - in production this would handle actual PDF files
  const formData = await c.req.formData();
  const title = formData.get('title') as string;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO study_materials (user_id, title, file_path, mime_type, is_processed)
    VALUES (?, ?, ?, ?, ?)
  `).bind(Number(user.id), title, `/uploads/${Date.now()}.pdf`, 'application/pdf', 1).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

app.post("/api/study/sessions", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { material_id, session_name, start_page, end_page, planned_duration_minutes } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO study_sessions (user_id, material_id, session_name, start_page, end_page, planned_duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(Number(user.id), material_id, session_name, start_page, end_page || null, planned_duration_minutes).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

app.put("/api/study/sessions/:id/start", authMiddleware, async (c) => {
  const sessionId = c.req.param("id");

  await c.env.DB.prepare(`
    UPDATE study_sessions SET started_at = datetime('now') WHERE id = ?
  `).bind(sessionId).run();

  return c.json({ success: true });
});

// Mindfulness endpoints
app.get("/api/mindfulness/exercises", authMiddleware, async (c) => {
  const exercises = await c.env.DB.prepare(`
    SELECT * FROM mindfulness_exercises ORDER BY difficulty_level, duration_minutes
  `).all();

  return c.json(exercises.results);
});

app.post("/api/mindfulness/complete", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const { exercise_id, duration_minutes, mood_before, stress_level_before, mood_after, stress_level_after, notes } = await c.req.json();

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    INSERT INTO mindfulness_sessions (user_id, exercise_id, duration_minutes, mood_before, mood_after, stress_level_before, stress_level_after, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(Number(user.id), exercise_id, duration_minutes, mood_before, mood_after, stress_level_before, stress_level_after, notes || null).run();

  // Award experience points
  await c.env.DB.prepare(`
    UPDATE users SET experience_points = experience_points + ? WHERE id = ?
  `).bind(duration_minutes * 2, Number(user.id)).run();

  return c.json({ success: true });
});

// Wellness challenges endpoints
app.get("/api/wellness/challenges", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const challenges = await c.env.DB.prepare(`
    SELECT wc.*, 
           COALESCE(ucp.current_value, 0) as current_value,
           COALESCE(ucp.is_completed, 0) as is_completed,
           CASE 
             WHEN wc.target_value > 0 THEN (COALESCE(ucp.current_value, 0) / wc.target_value) * 100 
             ELSE 0 
           END as progress_percentage
    FROM wellness_challenges wc
    LEFT JOIN user_challenge_progress ucp ON wc.id = ucp.challenge_id AND ucp.user_id = ?
    WHERE wc.is_active = 1
    ORDER BY wc.challenge_type, wc.created_at DESC
  `).bind(Number(user.id)).all();

  return c.json(challenges.results);
});

app.post("/api/wellness/challenges/:id/join", authMiddleware, async (c) => {
  const challengeId = c.req.param("id");
  const mochaUser = c.get("user") as MochaUser;

  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO user_challenge_progress (user_id, challenge_id)
    VALUES (?, ?)
  `).bind(Number(user.id), challengeId).run();

  return c.json({ success: true });
});

// Helper function to update challenge progress
async function updateChallengeProgress(c: any, userId: number, habitType: string, value: number) {
  // Get active challenges that match this habit type
  const challenges = await c.env.DB.prepare(`
    SELECT wc.*, ucp.current_value, ucp.id as progress_id
    FROM wellness_challenges wc
    LEFT JOIN user_challenge_progress ucp ON wc.id = ucp.challenge_id AND ucp.user_id = ?
    WHERE wc.is_active = 1 AND wc.target_unit LIKE ?
  `).bind(userId, `%${habitType}%`).all();

  for (const challenge of challenges.results) {
    const newValue = (challenge.current_value || 0) + value;
    const isCompleted = newValue >= challenge.target_value;

    if (challenge.progress_id) {
      await c.env.DB.prepare(`
        UPDATE user_challenge_progress 
        SET current_value = ?, is_completed = ?, completed_at = CASE WHEN ? THEN datetime('now') ELSE completed_at END
        WHERE id = ?
      `).bind(newValue, isCompleted ? 1 : 0, isCompleted, challenge.progress_id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO user_challenge_progress (user_id, challenge_id, current_value, is_completed, completed_at)
        VALUES (?, ?, ?, ?, CASE WHEN ? THEN datetime('now') ELSE NULL END)
      `).bind(userId, challenge.id, newValue, isCompleted ? 1 : 0, isCompleted).run();
    }

    // Award points if completed
    if (isCompleted && !challenge.is_completed) {
      await c.env.DB.prepare(`
        UPDATE users SET experience_points = experience_points + ? WHERE id = ?
      `).bind(challenge.points_reward, userId).run();
    }
  }
}

// Helper function to check and award rewards
async function checkAndAwardRewards(c: any, userId: number) {
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(userId).first();

  if (!user) return;

  const rewards = await c.env.DB.prepare(
    "SELECT * FROM rewards"
  ).all();

  for (const reward of rewards.results) {
    // Check if user already has this reward
    const existing = await c.env.DB.prepare(
      "SELECT * FROM user_rewards WHERE user_id = ? AND reward_id = ?"
    ).bind(userId, reward.id).first();

    if (existing) continue;

    let shouldAward = false;

    switch (reward.condition_type) {
      case "sessions_completed":
        shouldAward = Number(user.total_sessions_completed) >= Number(reward.condition_value);
        break;
      case "lessons_completed":
        shouldAward = Number(user.total_lessons_completed) >= Number(reward.condition_value);
        break;
      case "total_minutes":
        shouldAward = Number(user.total_focus_minutes) >= Number(reward.condition_value);
        break;
      case "streak_days":
        shouldAward = Number(user.current_streak) >= Number(reward.condition_value);
        break;
    }

    if (shouldAward) {
      await c.env.DB.prepare(`
        INSERT INTO user_rewards (user_id, reward_id)
        VALUES (?, ?)
      `).bind(userId, reward.id).run();

      // Award bonus points
      await c.env.DB.prepare(`
        UPDATE users 
        SET experience_points = experience_points + ?
        WHERE id = ?
      `).bind(reward.points_value, userId).run();
    }
  }
}

export default app;
