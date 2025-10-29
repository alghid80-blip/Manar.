import { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import type { User, WellnessChallenge } from '@/shared/types';

interface WellnessChallengesProps {
  user: User;
}

interface ChallengeProgress {
  challenge: WellnessChallenge;
  current_value: number;
  is_completed: boolean;
  progress_percentage: number;
}

const challengeColors = {
  daily: 'from-blue-500 to-cyan-500',
  weekly: 'from-green-500 to-emerald-500',
  monthly: 'from-purple-500 to-pink-500',
  milestone: 'from-orange-500 to-red-500'
};

const challengeIcons = {
  daily: Calendar,
  weekly: TrendingUp,
  monthly: Target,
  milestone: Trophy
};

export default function WellnessChallenges({ user }: WellnessChallengesProps) {
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [user.id]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/wellness/challenges', { credentials: 'include' });
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => !c.is_completed);
  const completedChallenges = challenges.filter(c => c.is_completed);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Wellness Challenges</h3>
        <Trophy className="w-5 h-5 text-yellow-600" />
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Active Challenges</h4>
          <div className="space-y-3">
            {activeChallenges.map((challengeProgress) => {
              const { challenge } = challengeProgress;
              const Icon = challengeIcons[challenge.challenge_type];
              const colorClass = challengeColors[challenge.challenge_type];
              
              return (
                <div key={challenge.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{challenge.title}</h5>
                        <p className="text-gray-600 text-sm mt-1">{challenge.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="capitalize">{challenge.challenge_type}</span>
                          <span>•</span>
                          <span>{challenge.target_value} {challenge.target_unit}</span>
                          <span>•</span>
                          <span>{challenge.points_reward} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Progress: {challengeProgress.current_value.toFixed(1)} / {challenge.target_value} {challenge.target_unit}
                      </span>
                      <span className="font-medium text-gray-900">
                        {challengeProgress.progress_percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${colorClass} rounded-full h-2 transition-all duration-300`}
                        style={{ width: `${Math.min(challengeProgress.progress_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Completed Challenges</span>
          </h4>
          <div className="space-y-2">
            {completedChallenges.slice(0, 3).map((challengeProgress) => {
              const { challenge } = challengeProgress;
              
              return (
                <div key={challenge.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{challenge.title}</div>
                    <div className="text-xs text-gray-500">+{challenge.points_reward} points earned</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active challenges</p>
          <p className="text-sm">Complete health activities to unlock challenges</p>
        </div>
      )}
    </div>
  );
}
