import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Coffee, Brain, Heart, Zap, Lightbulb } from 'lucide-react';
import type { User, FocusSession } from '@/shared/types';

interface PomodoroTimerProps {
  user: User;
}

type SessionType = 'focus' | 'short_break' | 'long_break';
type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface TimerState {
  timeLeft: number;
  sessionType: SessionType;
  status: TimerStatus;
  currentSession: FocusSession | null;
}

const SESSION_DURATIONS = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};

const SESSION_COLORS = {
  focus: 'from-blue-500 to-indigo-500',
  short_break: 'from-green-500 to-teal-500', 
  long_break: 'from-purple-500 to-pink-500',
};

const SESSION_ICONS = {
  focus: Brain,
  short_break: Coffee,
  long_break: Heart,
};

export default function PomodoroTimer({ user }: PomodoroTimerProps) {
  const [timer, setTimer] = useState<TimerState>({
    timeLeft: user.preferred_session_length * 60,
    sessionType: 'focus',
    status: 'idle',
    currentSession: null,
  });
  const [moodBefore, setMoodBefore] = useState('');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    moodAfter: '',
    focusRating: 3,
    notes: '',
  });
  const [aiRecommendation, setAiRecommendation] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer.status === 'running' && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.status === 'running') {
      handleTimerComplete();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.status, timer.timeLeft]);

  const handleTimerComplete = () => {
    setTimer(prev => ({ ...prev, status: 'completed' }));
    if (timer.sessionType === 'focus') {
      setShowCompletionModal(true);
    } else {
      // Auto-complete break sessions
      completeSession();
    }
  };

  const startSession = async () => {
    if (timer.sessionType === 'focus' && !moodBefore) {
      setShowMoodModal(true);
      return;
    }

    try {
      const response = await fetch('/api/sessions/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionType: timer.sessionType,
          plannedDuration: Math.ceil(timer.timeLeft / 60),
          moodBefore: timer.sessionType === 'focus' ? moodBefore : null,
        }),
      });

      if (response.ok) {
        const session = await response.json();
        setTimer(prev => ({
          ...prev,
          status: 'running',
          currentSession: session,
        }));
        
        // Generate AI recommendation for this session
        generateSessionRecommendation();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const generateSessionRecommendation = async () => {
    try {
      const userContext = {
        sessionType: timer.sessionType,
        mood: moodBefore,
        totalSessions: user.total_sessions_completed,
        preferredLength: user.preferred_session_length,
        timeOfDay: new Date().getHours(),
      };

      const response = await fetch('/api/ai/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          insightType: 'session_recommendation',
          userContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.insight) {
          setAiRecommendation(data.insight);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI recommendation:', error);
    }
  };

  const pauseSession = () => {
    setTimer(prev => ({ ...prev, status: 'paused' }));
  };

  const resumeSession = () => {
    setTimer(prev => ({ ...prev, status: 'running' }));
  };

  const stopSession = () => {
    if (timer.currentSession && timer.sessionType === 'focus') {
      setShowCompletionModal(true);
    } else {
      resetTimer();
    }
  };

  const completeSession = async () => {
    if (!timer.currentSession) return;

    const actualDuration = Math.ceil((SESSION_DURATIONS[timer.sessionType] * 60 - timer.timeLeft) / 60);

    try {
      await fetch(`/api/sessions/focus/${timer.currentSession.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          actualDuration,
          moodAfter: completionData.moodAfter || null,
          focusRating: timer.sessionType === 'focus' ? completionData.focusRating : null,
          notes: completionData.notes || null,
        }),
      });

      resetTimer();
      setShowCompletionModal(false);
      setCompletionData({ moodAfter: '', focusRating: 3, notes: '' });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const resetTimer = () => {
    setTimer({
      timeLeft: SESSION_DURATIONS[timer.sessionType] * 60,
      sessionType: timer.sessionType,
      status: 'idle',
      currentSession: null,
    });
    setMoodBefore('');
    setAiRecommendation('');
  };

  const switchSessionType = (type: SessionType) => {
    if (timer.status !== 'idle') return;
    
    setTimer({
      timeLeft: SESSION_DURATIONS[type] * 60,
      sessionType: type,
      status: 'idle',
      currentSession: null,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((SESSION_DURATIONS[timer.sessionType] * 60 - timer.timeLeft) / (SESSION_DURATIONS[timer.sessionType] * 60)) * 100;
  const SessionIcon = SESSION_ICONS[timer.sessionType];

  return (
    <>
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="text-center">
          {/* Session Type Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1">
              {(Object.keys(SESSION_DURATIONS) as SessionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => switchSessionType(type)}
                  disabled={timer.status !== 'idle'}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    timer.sessionType === type
                      ? `bg-gradient-to-r ${SESSION_COLORS[type]} text-white shadow-lg`
                      : 'text-gray-600 hover:text-gray-900'
                  } ${timer.status !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type === 'focus' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Circle */}
          <div className="relative w-80 h-80 mx-auto mb-8">
            {/* Background Circle */}
            <div className="absolute inset-0 rounded-full bg-gray-200"></div>
            
            {/* Progress Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.827} ${283 - progress * 2.827}`}
                className="transition-all duration-1000 ease-in-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${timer.sessionType === 'focus' ? 'stop-blue-500' : timer.sessionType === 'short_break' ? 'stop-green-500' : 'stop-purple-500'}`} />
                  <stop offset="100%" className={`${timer.sessionType === 'focus' ? 'stop-indigo-500' : timer.sessionType === 'short_break' ? 'stop-teal-500' : 'stop-pink-500'}`} />
                </linearGradient>
              </defs>
            </svg>

            {/* Timer Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <SessionIcon className={`w-12 h-12 mb-4 ${timer.sessionType === 'focus' ? 'text-blue-500' : timer.sessionType === 'short_break' ? 'text-green-500' : 'text-purple-500'}`} />
              <div className="text-6xl font-bold text-gray-900 mb-2 font-mono">
                {formatTime(timer.timeLeft)}
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                {timer.sessionType.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          {aiRecommendation && timer.status === 'running' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/50">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-indigo-800 mb-1">AI Tip for this session</h4>
                  <p className="text-sm text-gray-700">{aiRecommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {timer.status === 'idle' && (
              <button
                onClick={startSession}
                className={`inline-flex items-center px-8 py-4 bg-gradient-to-r ${SESSION_COLORS[timer.sessionType]} text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
              >
                <Play className="w-5 h-5 mr-2" />
                Start {timer.sessionType === 'focus' ? 'Focus' : 'Break'}
              </button>
            )}

            {timer.status === 'running' && (
              <>
                <button
                  onClick={pauseSession}
                  className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </button>
                <button
                  onClick={stopSession}
                  className="inline-flex items-center px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </button>
              </>
            )}

            {timer.status === 'paused' && (
              <>
                <button
                  onClick={resumeSession}
                  className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${SESSION_COLORS[timer.sessionType]} text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all`}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </button>
                <button
                  onClick={stopSession}
                  className="inline-flex items-center px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mood Before Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">How are you feeling?</h3>
            <p className="text-gray-600 mb-6">Let's capture your mood before we start this focus session.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Energized', 'Calm', 'Focused', 'Tired', 'Stressed', 'Excited'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => setMoodBefore(mood)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    moodBefore === mood
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMoodModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMoodModal(false);
                  startSession();
                }}
                disabled={!moodBefore}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Great work! 🎉</h3>
              <p className="text-gray-600">How did that session go?</p>
            </div>

            <div className="space-y-6">
              {/* Mood After */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How do you feel now?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Accomplished', 'Energized', 'Focused', 'Tired', 'Satisfied', 'Ready for more'].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setCompletionData(prev => ({ ...prev, moodAfter: mood }))}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        completionData.moodAfter === mood
                          ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Quality (1-5): {completionData.focusRating}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={completionData.focusRating}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, focusRating: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="What did you work on? Any insights?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={completeSession}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
