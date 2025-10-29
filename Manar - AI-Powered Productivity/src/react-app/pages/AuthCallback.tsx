import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Brain, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 mb-8 shadow-xl shadow-indigo-500/25 animate-pulse">
          <Brain className="w-10 h-10 text-white" />
        </div>
        
        {/* Loading */}
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
          <span className="text-xl font-semibold text-gray-700">Setting up your workspace...</span>
        </div>
        
        <p className="text-gray-500 max-w-md mx-auto">
          We're personalizing your Manar experience. This will just take a moment.
        </p>
        
        {/* Progress indicator */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
