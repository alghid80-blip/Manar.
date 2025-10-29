import { useState, useEffect } from 'react';
import { Trophy, Crown, Shield, Star, Gift, Zap, Clock, BookOpen, Flame } from 'lucide-react';
import type { User, Reward } from '@/shared/types';

interface RewardsPanelProps {
  user: User;
}

interface UserStats {
  user: User;
  recentSessions: any[];
  rewards: Reward[];
  nextReward?: Reward & { condition_type: string; condition_value: number };
  nextRewardProgress?: number;
}

export default function RewardsPanel({ user }: RewardsPanelProps) {
  const [userRewards, setUserRewards] = useState<Reward[]>([]);
  const [nextReward, setNextReward] = useState<any>(null);
  const [nextRewardProgress, setNextRewardProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllRewards, setShowAllRewards] = useState(false);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/users/stats', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data: UserStats = await response.json();
          setUserRewards(data.rewards);
          setNextReward(data.nextReward);
          setNextRewardProgress(data.nextRewardProgress || 0);
        }
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const getRewardIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Timer: Clock,
      BookOpen: BookOpen,
      Shield: Shield,
      GraduationCap: BookOpen,
      Fire: Flame,
      Crown: Crown,
      Clock: Clock,
    };
    return icons[iconName] || Trophy;
  };

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'common': return { bg: 'from-gray-400 to-gray-500', border: 'border-gray-300', glow: 'shadow-gray-200' };
      case 'rare': return { bg: 'from-blue-400 to-blue-500', border: 'border-blue-300', glow: 'shadow-blue-200' };
      case 'epic': return { bg: 'from-purple-400 to-purple-500', border: 'border-purple-300', glow: 'shadow-purple-200' };
      case 'legendary': return { bg: 'from-yellow-400 to-orange-500', border: 'border-yellow-300', glow: 'shadow-yellow-200' };
      default: return { bg: 'from-gray-400 to-gray-500', border: 'border-gray-300', glow: 'shadow-gray-200' };
    }
  };

  const calculateProgress = () => {
    const currentLevel = user.level;
    const currentXP = user.experience_points;
    const xpForCurrentLevel = (currentLevel - 1) * 1000;
    const xpForNextLevel = currentLevel * 1000;
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    
    return {
      percentage: (xpInCurrentLevel / xpNeededForNext) * 100,
      current: xpInCurrentLevel,
      needed: xpNeededForNext,
      total: currentXP,
    };
  };

  const progress = calculateProgress();

  const getProgressText = (reward: any, user: User) => {
    let currentValue = 0;
    let unit = '';
    
    switch (reward.condition_type) {
      case "sessions_completed":
        currentValue = user.total_sessions_completed;
        unit = currentValue === 1 ? 'session' : 'sessions';
        break;
      case "lessons_completed":
        currentValue = user.total_lessons_completed;
        unit = currentValue === 1 ? 'lesson' : 'lessons';
        break;
      case "total_minutes":
        currentValue = user.total_focus_minutes;
        unit = 'minutes';
        break;
      case "streak_days":
        currentValue = user.current_streak;
        unit = currentValue === 1 ? 'day' : 'days';
        break;
    }
    
    const remaining = reward.condition_value - currentValue;
    return `${remaining} more ${unit}`;
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedRewards = showAllRewards ? userRewards : userRewards.slice(0, 3);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
            <p className="text-sm text-gray-500">{userRewards.length} earned</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">Level {user.level}</div>
          <div className="text-xs text-amber-600 font-semibold">{user.experience_points} XP</div>
        </div>
      </div>

      {/* Next Reward Goal */}
      {nextReward && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getRarityColors(nextReward.rarity).bg} flex items-center justify-center`}>
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-indigo-800">Next Reward</div>
              <div className="text-xs text-indigo-600 font-semibold">{nextReward.name}</div>
            </div>
          </div>
          
          <div className="w-full bg-indigo-200/50 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(nextRewardProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          
          <div className="text-xs text-indigo-700">
            {getProgressText(nextReward, user)} to unlock!
          </div>
        </div>
      )}

      {/* Level Progress */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-amber-800">Level Progress</span>
          <span className="text-xs text-amber-700">
            {progress.current} / {progress.needed} XP
          </span>
        </div>
        
        <div className="w-full bg-amber-200/50 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-amber-700">
          {Math.max(0, progress.needed - progress.current)} XP until Level {user.level + 1}
        </div>
      </div>

      {/* Rewards List */}
      {userRewards.length > 0 ? (
        <div className="space-y-3">
          {displayedRewards.map((reward) => {
            const IconComponent = getRewardIcon(reward.icon || 'Trophy');
            const colors = getRarityColors(reward.rarity);
            
            return (
              <div
                key={reward.id}
                className={`relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${colors.border} hover:shadow-lg ${colors.glow} transition-all duration-300 group overflow-hidden`}
              >
                {/* Animated background for legendary items */}
                {reward.rarity === 'legendary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-yellow-400/10 animate-pulse"></div>
                )}
                
                <div className="relative flex items-center space-x-4">
                  {/* Reward Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Reward Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {reward.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${colors.bg} text-white`}>
                        {reward.rarity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {reward.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Zap className="w-3 h-3" />
                        <span>+{reward.points_value} XP</span>
                      </div>
                      {reward.earned_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(reward.earned_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Sparkle effect for epic and legendary */}
                {(reward.rarity === 'epic' || reward.rarity === 'legendary') && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Show More Button */}
          {userRewards.length > 3 && (
            <button
              onClick={() => setShowAllRewards(!showAllRewards)}
              className="w-full py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              {showAllRewards ? 'Show Less' : `Show ${userRewards.length - 3} More`}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900 mb-1">No achievements yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Complete focus sessions and lessons to earn your first rewards!
          </p>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-3 h-3" />
              <span>Complete 1 session → First Timer badge</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="w-3 h-3" />
              <span>Read 1 lesson → Learning Explorer badge</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-indigo-600">{user.total_sessions_completed}</div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{user.total_lessons_completed}</div>
            <div className="text-xs text-gray-500">Lessons</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{user.current_streak}</div>
            <div className="text-xs text-gray-500">Day Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}
