import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { 
  Clock, 
  Brain, 
  Trophy, 
  Sparkles, 
  Play, 
  BookOpen, 
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (user) {
        navigate('/dashboard');
      } else {
        setIsLoaded(true);
      }
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl animate-bounce"></div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Clock,
      title: "Health Habit Tracking",
      description: "Track water, sleep, exercise, mood and build lasting wellness habits",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: BookOpen,
      title: "Smart Study Sessions",
      description: "Upload PDFs and create structured study sessions with Pomodoro timers",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Trophy,
      title: "Wellness Challenges",
      description: "Gamified challenges that motivate you to achieve your health goals",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Sparkles,
      title: "AI Health Coach",
      description: "Personalized recommendations for productivity and wellness optimization",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-8 shadow-xl shadow-emerald-500/25">
              <Brain className="w-10 h-10 text-white" />
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6" 
                style={{ fontFamily: 'Playfair Display, serif' }}>
              HealthUp
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto font-medium">
              Your interactive wellness & productivity companion
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Track habits, study smart with AI, and achieve wellness goals through gamified 
              health and productivity tracking
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={redirectToLogin}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200">
                <Target className="w-5 h-5 mr-2" />
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            Everything you need for wellness
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            HealthUp combines health tracking, smart study tools, and AI coaching 
            to help you balance wellness, productivity, and personal growth
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 border border-white/20"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Decorative gradient line */}
              <div className={`absolute bottom-0 left-8 right-8 h-1 rounded-full bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">25+</div>
              <div className="text-xl opacity-90">Focus Techniques</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">100+</div>
              <div className="text-xl opacity-90">Learning Topics</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-xl opacity-90">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-gray-50 to-emerald-50 py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to unlock your potential?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of wellness warriors who are building healthy habits and achieving their goals with HealthUp
          </p>
          
          <button
            onClick={redirectToLogin}
            className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-3xl shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
          >
            <Zap className="w-6 h-6 mr-3 group-hover:animate-pulse" />
            Get Started Free
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
