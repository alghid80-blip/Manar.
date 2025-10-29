import { useState, useEffect } from 'react';
import { BookOpen, Clock, Star, ChevronRight, Brain, Lightbulb, Trophy, Heart, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import type { User, LearningLesson, LearningCategory } from '@/shared/types';

interface LearningSectionProps {
  user: User;
}

export default function LearningSection({ user }: LearningSectionProps) {
  const [lessons, setLessons] = useState<LearningLesson[]>([]);
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsRes, categoriesRes] = await Promise.all([
          fetch('/api/learning/lessons/personalized', { credentials: 'include' }),
          fetch('/api/learning/categories', { credentials: 'include' }),
        ]);

        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json();
          setLessons(lessonsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Failed to fetch learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completeLesson = async (lessonId: number, rating?: number) => {
    try {
      await fetch(`/api/learning/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating }),
      });

      // Remove completed lesson from the list
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      setExpandedLesson(null);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Clock: Clock,
      Brain: Brain,
      Trophy: Trophy,
      Heart: Heart,
      Lightbulb: Lightbulb,
      Cpu: Brain, // fallback
    };
    return icons[iconName] || Brain;
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'from-green-400 to-teal-400';
      case 'intermediate': return 'from-amber-400 to-orange-400';
      case 'advanced': return 'from-red-400 to-pink-400';
      default: return 'from-blue-400 to-indigo-400';
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return BookOpen;
      case 'tip': return Lightbulb;
      case 'quote': return Heart;
      case 'exercise': return Trophy;
      default: return BookOpen;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Micro-Learning</h2>
            <p className="text-gray-600">
              Personalized lessons • {user.total_lessons_completed} completed 📚
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Learning Progress Indicator */}
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Goal: {user.learning_goal_lessons}/day
            </span>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Get More Lessons
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex overflow-x-auto space-x-3 mb-8 pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Topics
        </button>
        {categories.map((category) => {
          const IconComponent = getCategoryIcon(category.icon || 'Brain');
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id.toString())}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === category.id.toString()
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Lessons */}
      <div className="space-y-4">
        {lessons.length > 0 ? (
          lessons.map((lesson) => {
            const LessonIcon = getLessonTypeIcon(lesson.lesson_type);
            const isExpanded = expandedLesson === lesson.id;
            
            return (
              <div
                key={lesson.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:shadow-lg transition-all duration-300 overflow-hidden relative"
              >
                {/* Recommended label for personalized lessons */}
                {lesson.is_ai_generated && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>Recommended</span>
                    </div>
                  </div>
                )}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      {/* Lesson Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getDifficultyColor(lesson.difficulty_level)} flex items-center justify-center shadow-lg`}>
                        <LessonIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {lesson.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(lesson.difficulty_level)} text-white`}>
                            {lesson.difficulty_level}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {lesson.estimated_read_time || 3} min read
                          </span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" style={{ color: lesson.category_color || '#6B7280' }} />
                            {lesson.category_name}
                          </span>
                          <span className="capitalize text-indigo-600 font-medium">
                            {lesson.lesson_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="pt-4">
                      <div className="prose prose-sm max-w-none text-gray-700 mb-6 leading-relaxed">
                        {lesson.content.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      {/* Tags */}
                      {lesson.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {lesson.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Complete Button */}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          Found this helpful?
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            completeLesson(lesson.id, 5);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 mb-6">
              You've completed all available lessons. Great work!
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              <Lightbulb className="w-4 h-4 mr-2" />
              Get More Lessons
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
