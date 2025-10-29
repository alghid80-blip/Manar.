import { useState, useEffect } from 'react';
import { Clock, Target, BookOpen, Flame, TrendingUp, Calendar } from 'lucide-react';
import GoalCelebration from '@/react-app/components/GoalCelebration';
import type { User, FocusSession } from '@/shared/types';

interface StatsOverviewProps {
  user: User;
}

interface UserStats {
  user: User;
  recentSessions: FocusSession[];
  rewards: any[];
}

export default function StatsOverview({ user }: StatsOverviewProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [celebration, setCelebration] = useState<{
    show: boolean;
    type: 'focus' | 'learning' | 'streak';
    achievement: string;
  }>({ show: false, type: 'focus', achievement: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/users/stats', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate today's stats
  const today = new Date().toDateString();
  const todaySessions = stats.recentSessions.filter(session => 
    new Date(session.started_at).toDateString() === today && session.is_completed
  );
  const todayMinutes = todaySessions.reduce((total, session) => 
    total + (session.actual_duration_minutes || 0), 0
  );

  // Calculate progress towards daily goals
  const focusProgress = Math.min((todayMinutes / user.focus_goal_minutes) * 100, 100);
  const learningProgress = Math.min((user.total_lessons_completed / user.learning_goal_lessons) * 100, 100);

  // Check for goal completion and trigger celebrations
  useEffect(() => {
    const checkGoalCompletion = () => {
      // Check focus goal completion
      if (focusProgress >= 100 && todayMinutes >= user.focus_goal_minutes) {
        const hasShownFocusCelebration = localStorage.getItem(`focus-celebration-${new Date().toDateString()}`);
        if (!hasShownFocusCelebration) {
          setCelebration({
            show: true,
            type: 'focus',
            achievement: `Daily focus goal achieved! ${todayMinutes} minutes completed.`
          });
          localStorage.setItem(`focus-celebration-${new Date().toDateString()}`, 'true');
        }
      }

      // Check learning goal completion
      if (learningProgress >= 100) {
        const hasShownLearningCelebration = localStorage.getItem(`learning-celebration-${new Date().toDateString()}`);
        if (!hasShownLearningCelebration) {
          setCelebration({
            show: true,
            type: 'learning',
            achievement: `Learning goal smashed! ${user.total_lessons_completed} lessons completed.`
          });
          localStorage.setItem(`learning-celebration-${new Date().toDateString()}`, 'true');
        }
      }

      // Check streak milestones
      if (user.current_streak > 0 && user.current_streak % 7 === 0) {
        const hasShownStreakCelebration = localStorage.getItem(`streak-celebration-${user.current_streak}`);
        if (!hasShownStreakCelebration) {
          setCelebration({
            show: true,
            type: 'streak',
            achievement: `Amazing ${user.current_streak}-day streak! You're on fire! 🔥`
          });
          localStorage.setItem(`streak-celebration-${user.current_streak}`, 'true');
        }
      }
    };

    if (stats) {
      checkGoalCompletion();
    }
  }, [stats, focusProgress, learningProgress, todayMinutes, user.focus_goal_minutes, user.total_lessons_completed, user.learning_goal_lessons, user.current_streak]);

  const statCards = [
    {
      icon: Clock,
      label: 'Focus Time Today',
      value: `${todayMinutes}m`,
      subtitle: `Goal: ${user.focus_goal_minutes}m`,
      progress: focusProgress,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      icon: Target,
      label: 'Sessions Completed',
      value: todaySessions.length.toString(),
      subtitle: `Total: ${user.total_sessions_completed}`,
      progress: todaySessions.length > 0 ? 100 : 0,
      color: 'from-green-500 to-teal-500',
      bgColor: 'from-green-50 to-teal-50',
    },
    {
      icon: BookOpen,
      label: 'Lessons Completed',
      value: user.total_lessons_completed.toString(),
      subtitle: `Goal: ${user.learning_goal_lessons}`,
      progress: learningProgress,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${user.current_streak}d`,
      subtitle: `Best: ${user.longest_streak}d`,
      progress: user.current_streak > 0 ? 100 : 0,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Progress</h2>
          <p className="text-gray-600">Keep up the great work! 🚀</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                timeframe === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300 group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stat.subtitle}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {stat.label}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(stat.progress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="border-t border-gray-200/50 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
          Recent Activity
        </h3>
        
        {stats.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.session_type === 'focus' 
                      ? 'bg-blue-100 text-blue-600'
                      : session.session_type === 'short_break'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {session.session_type === 'focus' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.session_type === 'focus' ? 'Focus Session' : 
                       session.session_type === 'short_break' ? 'Short Break' : 'Long Break'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {session.actual_duration_minutes || session.planned_duration_minutes}m
                  </div>
                  {session.focus_rating && (
                    <div className="text-sm text-gray-500">
                      {'⭐'.repeat(session.focus_rating)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity yet</p>
            <p className="text-sm text-gray-400">Start your first session to see your progress here</p>
          </div>
        )}
      </div>

      {/* Goal Celebration Modal */}
      <GoalCelebration
        show={celebration.show}
        type={celebration.type}
        achievement={celebration.achievement}
        onClose={() => setCelebration(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
