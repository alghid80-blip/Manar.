import { useState, useEffect } from 'react';
import { Brain, Play, Pause, CheckCircle2, Timer, Heart } from 'lucide-react';
import type { User, MindfulnessExercise } from '@/shared/types';

interface MindfulnessExercisesProps {
  user?: User;
}

const exerciseIcons = {
  breathing: Heart,
  meditation: Brain,
  body_scan: Timer,
  gratitude: CheckCircle2,
  visualization: Brain
};

const exerciseColors = {
  breathing: 'from-blue-500 to-cyan-500',
  meditation: 'from-purple-500 to-pink-500',
  body_scan: 'from-green-500 to-emerald-500',
  gratitude: 'from-yellow-500 to-orange-500',
  visualization: 'from-indigo-500 to-purple-500'
};

export default function MindfulnessExercises({ }: MindfulnessExercisesProps) {
  const [exercises, setExercises] = useState<MindfulnessExercise[]>([]);
  const [activeExercise, setActiveExercise] = useState<MindfulnessExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preSession, setPreSession] = useState({
    mood: '',
    stressLevel: 5
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            completeExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/mindfulness/exercises', { credentials: 'include' });
      const data = await response.json();
      setExercises(data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExercise = (exercise: MindfulnessExercise) => {
    setActiveExercise(exercise);
    setTimeRemaining(exercise.duration_minutes * 60);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const completeExercise = async () => {
    if (!activeExercise) return;

    try {
      await fetch('/api/mindfulness/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          exercise_id: activeExercise.id,
          duration_minutes: activeExercise.duration_minutes,
          mood_before: preSession.mood,
          stress_level_before: preSession.stressLevel,
          mood_after: 'relaxed', // Could be collected via a form
          stress_level_after: Math.max(1, preSession.stressLevel - 2)
        })
      });

      setActiveExercise(null);
      setPreSession({ mood: '', stressLevel: 5 });
    } catch (error) {
      console.error('Failed to complete exercise:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeExercise) {
    const Icon = exerciseIcons[activeExercise.exercise_type];
    const colorClass = exerciseColors[activeExercise.exercise_type];
    const progress = ((activeExercise.duration_minutes * 60 - timeRemaining) / (activeExercise.duration_minutes * 60)) * 100;

    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
            <Icon className="w-12 h-12 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{activeExercise.title}</h3>
          <p className="text-gray-600 mb-6">{activeExercise.description}</p>
          
          <div className="mb-6">
            <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${colorClass} rounded-full h-2 transition-all duration-1000`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={togglePlay}
              className={`
                px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2
                ${isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }
              `}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'Pause' : 'Start'}</span>
            </button>
            
            <button
              onClick={() => setActiveExercise(null)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Stop
            </button>
          </div>

          {activeExercise.instructions && (
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
              <p className="text-gray-700 text-sm">{activeExercise.instructions}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Mindfulness & Wellness</h3>
        <Brain className="w-5 h-5 text-purple-600" />
      </div>

      <div className="space-y-3">
        {exercises.map((exercise) => {
          const Icon = exerciseIcons[exercise.exercise_type];
          const colorClass = exerciseColors[exercise.exercise_type];
          
          return (
            <div key={exercise.id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{exercise.title}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{exercise.duration_minutes} min</span>
                      <span>•</span>
                      <span className="capitalize">{exercise.difficulty_level}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => startExercise(exercise)}
                  className="flex items-center space-x-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              </div>
              
              <p className="text-gray-600 text-sm mt-2 ml-13">{exercise.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
