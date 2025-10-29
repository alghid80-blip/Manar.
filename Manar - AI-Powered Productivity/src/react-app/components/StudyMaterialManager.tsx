import { useState, useEffect } from 'react';
import { Upload, FileText, Clock, BookOpen, Play, CheckCircle2, Plus } from 'lucide-react';
import type { User, StudyMaterial, StudySession } from '@/shared/types';

interface StudyMaterialManagerProps {
  user: User;
}

export default function StudyMaterialManager({ user }: StudyMaterialManagerProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState({
    session_name: '',
    start_page: 1,
    end_page: '',
    planned_duration_minutes: 25
  });

  useEffect(() => {
    fetchStudyData();
  }, [user.id]);

  const fetchStudyData = async () => {
    try {
      const [materialsRes, sessionsRes] = await Promise.all([
        fetch('/api/study/materials', { credentials: 'include' }),
        fetch('/api/study/sessions', { credentials: 'include' })
      ]);

      const materialsData = await materialsRes.json();
      const sessionsData = await sessionsRes.json();

      setMaterials(materialsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch study data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace('.pdf', ''));

      const response = await fetch('/api/study/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        await fetchStudyData();
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const createStudySession = async (materialId: number) => {
    try {
      const response = await fetch('/api/study/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          material_id: materialId,
          ...sessionData
        })
      });

      if (response.ok) {
        await fetchStudyData();
        setShowCreateSession(null);
        setSessionData({
          session_name: '',
          start_page: 1,
          end_page: '',
          planned_duration_minutes: 25
        });
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const startSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/study/sessions/${sessionId}/start`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchStudyData();
        // Here you could integrate with the Pomodoro timer
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Study Materials</h3>
        <BookOpen className="w-5 h-5 text-blue-600" />
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <label className="block">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <div className={`
            border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer
            hover:border-blue-500 hover:bg-blue-50 transition-colors
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              {uploading ? 'Uploading...' : 'Click to upload PDF study material'}
            </p>
            <p className="text-sm text-gray-500 mt-1">PDF files only</p>
          </div>
        </label>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No study materials uploaded yet</p>
            <p className="text-sm">Upload a PDF to get started with structured study sessions</p>
          </div>
        ) : (
          materials.map((material) => {
            const materialSessions = sessions.filter(s => s.material_id === material.id);
            const completedSessions = materialSessions.filter(s => s.is_completed);
            
            return (
              <div key={material.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{material.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{material.total_pages || 'Unknown'} pages</span>
                      </span>
                      <span>{completedSessions.length}/{materialSessions.length} sessions completed</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateSession(showCreateSession === material.id ? null : material.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Session</span>
                  </button>
                </div>

                {/* Create Session Form */}
                {showCreateSession === material.id && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Session name"
                        value={sessionData.session_name}
                        onChange={(e) => setSessionData(prev => ({ ...prev, session_name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Start page"
                          value={sessionData.start_page}
                          onChange={(e) => setSessionData(prev => ({ ...prev, start_page: parseInt(e.target.value) || 1 }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="End page"
                          value={sessionData.end_page}
                          onChange={(e) => setSessionData(prev => ({ ...prev, end_page: e.target.value }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Minutes"
                          value={sessionData.planned_duration_minutes}
                          onChange={(e) => setSessionData(prev => ({ ...prev, planned_duration_minutes: parseInt(e.target.value) || 25 }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="5"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => createStudySession(material.id)}
                        disabled={!sessionData.session_name}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Session
                      </button>
                      <button
                        onClick={() => setShowCreateSession(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Sessions List */}
                {materialSessions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-700 text-sm">Study Sessions:</h5>
                    {materialSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {session.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{session.session_name}</div>
                            <div className="text-xs text-gray-500">
                              Pages {session.start_page}-{session.end_page || '?'} • {session.planned_duration_minutes}min
                            </div>
                          </div>
                        </div>
                        {!session.is_completed && (
                          <button
                            onClick={() => startSession(session.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
