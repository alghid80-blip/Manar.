import { useState, useEffect } from 'react';
import { Heart, Droplets, Dumbbell, Smile, Plus, TrendingUp } from 'lucide-react';
import type { User, HealthLog, HealthHabit } from '@/shared/types';

interface HealthTrackerProps {
  user: User;
}

interface HabitConfig {
  type: string;
  icon: any;
  label: string;
  unit: string;
  color: string;
  defaultTarget: number;
  placeholder: string;
}

const habitConfigs: HabitConfig[] = [
  {
    type: 'water',
    icon: Droplets,
    label: 'Water',
    unit: 'glasses',
    color: 'from-blue-500 to-cyan-500',
    defaultTarget: 8,
    placeholder: 'Glasses drunk today'
  },
  {
    type: 'sleep',
    icon: Heart,
    label: 'Sleep',
    unit: 'hours',
    color: 'from-purple-500 to-pink-500',
    defaultTarget: 8,
    placeholder: 'Hours slept'
  },
  {
    type: 'workout',
    icon: Dumbbell,
    label: 'Exercise',
    unit: 'minutes',
    color: 'from-orange-500 to-red-500',
    defaultTarget: 30,
    placeholder: 'Minutes exercised'
  },
  {
    type: 'mood',
    icon: Smile,
    label: 'Mood',
    unit: '/10',
    color: 'from-yellow-500 to-orange-500',
    defaultTarget: 8,
    placeholder: 'Rate 1-10'
  }
];

export default function HealthTracker({ user }: HealthTrackerProps) {
  const [habits, setHabits] = useState<HealthHabit[]>([]);
  const [todayLogs, setTodayLogs] = useState<HealthLog[]>([]);
  const [weekLogs, setWeekLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchHealthData();
  }, [user.id]);

  const fetchHealthData = async () => {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        fetch('/api/health/habits', { credentials: 'include' }),
        fetch('/api/health/logs', { credentials: 'include' })
      ]);

      const habitsData = await habitsRes.json();
      const logsData = await logsRes.json();

      setHabits(habitsData);
      setTodayLogs(logsData.today || []);
      setWeekLogs(logsData.week || []);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logHabit = async (habitType: string, value: number, unit: string) => {
    try {
      const response = await fetch('/api/health/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          habit_type: habitType,
          value,
          unit,
          logged_date: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        await fetchHealthData();
        setActiveInput(null);
        setInputValues(prev => ({ ...prev, [habitType]: '' }));
      }
    } catch (error) {
      console.error('Failed to log habit:', error);
    }
  };

  const getTodayValue = (habitType: string) => {
    return todayLogs
      .filter(log => log.habit_type === habitType)
      .reduce((sum, log) => sum + log.value, 0);
  };

  const getWeekAverage = (habitType: string) => {
    const weekValues = weekLogs.filter(log => log.habit_type === habitType);
    const dailyTotals = weekValues.reduce((acc, log) => {
      const date = log.logged_date;
      acc[date] = (acc[date] || 0) + log.value;
      return acc;
    }, {} as Record<string, number>);
    
    const values = Object.values(dailyTotals);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  };

  const getTarget = (habitType: string) => {
    const habit = habits.find(h => h.habit_type === habitType);
    const config = habitConfigs.find(c => c.type === habitType);
    return habit?.target_value || config?.defaultTarget || 0;
  };

  const getProgress = (habitType: string) => {
    const today = getTodayValue(habitType);
    const target = getTarget(habitType);
    return target > 0 ? Math.min((today / target) * 100, 100) : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Daily Health Tracking</h3>
        <TrendingUp className="w-5 h-5 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {habitConfigs.map((config) => {
          const Icon = config.icon;
          const todayValue = getTodayValue(config.type);
          const target = getTarget(config.type);
          const progress = getProgress(config.type);
          const weekAvg = getWeekAverage(config.type);
          const isActive = activeInput === config.type;

          return (
            <div key={config.type} className="relative">
              <div className={`p-4 rounded-xl bg-gradient-to-r ${config.color} text-white transform transition-all duration-200 hover:scale-105`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <button
                    onClick={() => setActiveInput(isActive ? null : config.type)}
                    className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{todayValue}</span>
                    <span className="text-sm opacity-80">/ {target} {config.unit}</span>
                  </div>
                  
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs opacity-80">
                    Week avg: {weekAvg.toFixed(1)} {config.unit}
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder={config.placeholder}
                      value={inputValues[config.type] || ''}
                      onChange={(e) => setInputValues(prev => ({ ...prev, [config.type]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={config.type === 'mood' ? "10" : undefined}
                      step={config.type === 'sleep' ? "0.5" : "1"}
                    />
                    <button
                      onClick={() => {
                        const value = parseFloat(inputValues[config.type] || '0');
                        if (value > 0) {
                          logHabit(config.type, value, config.unit);
                        }
                      }}
                      disabled={!inputValues[config.type] || parseFloat(inputValues[config.type]) <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
