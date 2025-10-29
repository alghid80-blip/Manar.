import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import Header from '@/react-app/components/Header';
import HealthTracker from '@/react-app/components/HealthTracker';
import WellnessChallenges from '@/react-app/components/WellnessChallenges';
import MindfulnessExercises from '@/react-app/components/MindfulnessExercises';
import type { User } from '@/shared/types';

export default function HealthDashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            Your Health & Wellness Hub 🌱
          </h1>
          <p className="text-lg text-gray-600">
            Track your daily habits, practice mindfulness, and take on wellness challenges.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Tracking */}
            <HealthTracker user={user} />
            
            {/* Mindfulness Exercises */}
            <MindfulnessExercises user={user} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Wellness Challenges */}
            <WellnessChallenges user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
