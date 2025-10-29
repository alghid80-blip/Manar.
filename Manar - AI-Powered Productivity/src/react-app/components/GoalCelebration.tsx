import { useEffect, useState } from 'react';
import { Target, Zap, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalCelebrationProps {
  show: boolean;
  type: 'focus' | 'learning' | 'streak';
  achievement: string;
  onClose: () => void;
}

export default function GoalCelebration({ show, type, achievement, onClose }: GoalCelebrationProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (show) {
      setAnimate(true);
      
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Auto close after 5 seconds
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  const getColors = () => {
    switch (type) {
      case 'focus':
        return {
          bg: 'from-blue-500 to-indigo-500',
          bgLight: 'from-blue-50 to-indigo-50',
          text: 'text-blue-700',
          icon: Target,
        };
      case 'learning':
        return {
          bg: 'from-green-500 to-teal-500',
          bgLight: 'from-green-50 to-teal-50',
          text: 'text-green-700',
          icon: Zap,
        };
      case 'streak':
        return {
          bg: 'from-orange-500 to-red-500',
          bgLight: 'from-orange-50 to-red-50',
          text: 'text-orange-700',
          icon: Trophy,
        };
      default:
        return {
          bg: 'from-purple-500 to-pink-500',
          bgLight: 'from-purple-50 to-pink-50',
          text: 'text-purple-700',
          icon: Trophy,
        };
    }
  };

  const colors = getColors();
  const IconComponent = colors.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`relative bg-white rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl transform transition-all duration-500 ${
          animate ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Background Pattern */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bgLight} rounded-3xl opacity-50`}></div>
        
        <div className="relative text-center">
          {/* Animated Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-xl transform ${animate ? 'animate-bounce' : ''}`}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>

          {/* Celebration Text */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Goal Achieved!
            </h2>
            <p className={`text-lg font-medium ${colors.text} mb-1`}>
              {achievement}
            </p>
            <p className="text-gray-600">
              You're building amazing habits! Keep up the great work.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${colors.bg} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Awesome!
          </button>

          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-gradient-to-r ${colors.bg} rounded-full opacity-60 animate-ping`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
