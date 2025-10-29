import { useState, useEffect } from 'react';
import { Sparkles, Brain, Target, TrendingUp, Lightbulb, RefreshCw, Zap } from 'lucide-react';
import type { User, AIInsight } from '@/shared/types';

interface AIInsightsProps {
  user: User;
}

export default function AIInsights({ user }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsight = async (type: string = 'motivation_tip') => {
    setGenerating(true);
    
    try {
      const userContext = {
        totalSessions: user.total_sessions_completed,
        totalLessons: user.total_lessons_completed,
        currentStreak: user.current_streak,
        level: user.level,
        focusGoal: user.focus_goal_minutes,
        preferredSessionLength: user.preferred_session_length,
      };

      const response = await fetch('/api/ai/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          insightType: type,
          userContext,
        }),
      });

      if (response.ok) {
        await fetchInsights(); // Refresh insights
      }
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity_pattern': return TrendingUp;
      case 'learning_preference': return Brain;
      case 'motivation_tip': return Zap;
      case 'session_recommendation': return Target;
      default: return Lightbulb;
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case 'productivity_pattern': return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-700', bgLight: 'from-blue-50 to-cyan-50' };
      case 'learning_preference': return { bg: 'from-purple-500 to-pink-500', text: 'text-purple-700', bgLight: 'from-purple-50 to-pink-50' };
      case 'motivation_tip': return { bg: 'from-orange-500 to-red-500', text: 'text-orange-700', bgLight: 'from-orange-50 to-red-50' };
      case 'session_recommendation': return { bg: 'from-green-500 to-teal-500', text: 'text-green-700', bgLight: 'from-green-50 to-teal-50' };
      default: return { bg: 'from-indigo-500 to-purple-500', text: 'text-indigo-700', bgLight: 'from-indigo-50 to-purple-50' };
    }
  };

  const formatInsightTitle = (type: string) => {
    switch (type) {
      case 'productivity_pattern': return 'Productivity Pattern';
      case 'learning_preference': return 'Learning Insight';
      case 'motivation_tip': return 'Motivation Boost';
      case 'session_recommendation': return 'Session Tip';
      default: return 'AI Insight';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Insights</h3>
            <p className="text-sm text-gray-500">Personalized for you</p>
          </div>
        </div>
        
        <button
          onClick={() => generateNewInsight()}
          disabled={generating}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Thinking...' : 'Refresh'}
        </button>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        {insights.length > 0 ? (
          insights.map((insight) => {
            const IconComponent = getInsightIcon(insight.insight_type);
            const colors = getInsightColors(insight.insight_type);
            
            return (
              <div
                key={insight.id}
                className={`relative bg-gradient-to-r ${colors.bgLight} rounded-2xl p-5 border border-white/50 hover:shadow-lg transition-all duration-300 overflow-hidden group`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {formatInsightTitle(insight.insight_type)}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.bg}`}></div>
                          <span className="text-xs text-gray-500">AI</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {insight.insight_data}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Brain className="w-3 h-3" />
                          <span>Confidence: {Math.round(insight.confidence_score * 100)}%</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(insight.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sparkle decoration for high-confidence insights */}
                {insight.confidence_score > 0.8 && (
                  <div className="absolute top-3 right-3">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">No insights yet</h4>
            <p className="text-sm text-gray-500 mb-4">
              Complete more sessions to unlock personalized AI insights!
            </p>
            <button
              onClick={() => generateNewInsight('motivation_tip')}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Get First Insight'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {insights.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200/50">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => generateNewInsight('session_recommendation')}
              disabled={generating}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Target className="w-3 h-3 mr-1" />
              Session Tip
            </button>
            <button
              onClick={() => generateNewInsight('motivation_tip')}
              disabled={generating}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3 mr-1" />
              Motivation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
