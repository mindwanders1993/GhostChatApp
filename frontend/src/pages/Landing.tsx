import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { UserCustomization } from '../components/UserCustomization';
import { GhostIdentity, UserPreferences } from '../types';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { setGhost, stats } = useChatStore();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const statsData = await response.json();
          useChatStore.setState({ stats: statsData });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const createGhost = async (preferences: UserPreferences) => {
    if (isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ghost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create ghost identity');
      }
      
      const ghost: GhostIdentity = await response.json();
      console.log('Landing: Ghost created successfully:', ghost);
      setGhost(ghost);
      console.log('Landing: Navigating to /rooms');
      navigate('/rooms');
      
    } catch (error) {
      console.error('Error creating ghost:', error);
      setError('Failed to create anonymous identity. Please try again.');
      setIsCreating(false);
    }
  };

  const handleStartCustomization = () => {
    setShowCustomization(true);
  };

  // Show customization form if requested
  if (showCustomization) {
    return <UserCustomization onComplete={createGhost} isLoading={isCreating} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 animate-ghost-float">
            👻
          </h1>
          <h2 className="text-4xl font-bold text-white mb-2">
            GhostChatApp
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Anonymous • Temporary • Untraceable
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.active_ghosts}
            </div>
            <div className="text-sm text-gray-400">Active Ghosts</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {stats.total_rooms}
            </div>
            <div className="text-sm text-gray-400">Live Rooms</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-2xl mb-3">⏱️</div>
            <h3 className="text-lg font-semibold text-white mb-2">15 Minute Sessions</h3>
            <p className="text-sm text-gray-400">
              Your identity self-destructs automatically
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-2xl mb-3">🔥</div>
            <h3 className="text-lg font-semibold text-white mb-2">24 Hour Messages</h3>
            <p className="text-sm text-gray-400">
              All conversations vanish completely
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-2xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Zero Tracking</h3>
            <p className="text-sm text-gray-400">
              Technically impossible to surveil
            </p>
          </div>
        </div>

        {/* Privacy Principles */}
        <div className="bg-gray-800 rounded-lg p-8 mb-12 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Privacy Principles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">No email or phone required</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">No persistent database</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Automatic data destruction</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Anonymous by design</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Instant self-destruct option</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">User sovereignty over data</span>
            </div>
          </div>
        </div>

        {/* Enter Button */}
        <div className="space-y-4">
          <button
            onClick={handleStartCustomization}
            className="
              w-full 
              max-w-md 
              mx-auto 
              py-4 
              px-8 
              text-xl 
              font-bold 
              rounded-lg 
              transition-all 
              duration-200 
              transform
              bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95
            "
          >
            👻 Enter GhostChatApp
          </button>

          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500 max-w-md mx-auto">
            By entering, you acknowledge that all data will be automatically destroyed. 
            This platform provides maximum privacy through aggressive data destruction.
          </p>
        </div>

        {/* Warning */}
        <div className="mt-12 bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-2">
            <span>⚠️</span>
            <span className="font-semibold">PRIVACY WARNING</span>
          </div>
          <p className="text-sm text-yellow-300">
            This is an experimental platform. While designed for maximum privacy, 
            never share sensitive personal information in any online communication.
          </p>
        </div>
      </div>
    </div>
  );
};