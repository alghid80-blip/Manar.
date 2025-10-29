import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import Header from '@/react-app/components/Header';
import PomodoroTimer from '@/react-app/components/PomodoroTimer';
import StatsOverview from '@/react-app/components/StatsOverview';
import LearningSection from '@/react-app/components/LearningSection';
import RewardsPanel from '@/react-app/components/RewardsPanel';
import AIInsights from '@/react-app/components/AIInsights';
import HealthTracker from '@/react-app/components/HealthTracker';
import StudyMaterialManager from '@/react-app/components/StudyMaterialManager';
import MindfulnessExercises from '@/react-app/components/MindfulnessExercises';
import WellnessChallenges from '@/react-app/components/WellnessChallenges';
import type { User } from '@/shared/types';

export default function Dashboard() {
  const { user: authUser, isPending } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !authUser) {
      navigate('/');
    }
  }, [authUser, isPending, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;
      
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  if (isPending || loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to HealthUp, {user.name || 'Wellness Warrior'}! 🌟
          </h1>
          <p className="text-lg text-gray-600">
            Track your health, study smart, and achieve your wellness goals today.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Tracking */}
            <HealthTracker user={user} />
            
            {/* Pomodoro Timer */}
            <PomodoroTimer user={user} />
            
            {/* Study Materials */}
            <StudyMaterialManager user={user} />
            
            {/* Stats Overview */}
            <StatsOverview user={user} />
            
            {/* Learning Section */}
            <LearningSection user={user} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* AI Insights */}
            <AIInsights user={user} />
            
            {/* Mindfulness Exercises */}
            <MindfulnessExercises user={user} />
            
            {/* Wellness Challenges */}
            <WellnessChallenges user={user} />
            
            {/* Rewards Panel */}
            <RewardsPanel user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
