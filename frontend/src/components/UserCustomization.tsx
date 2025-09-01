import React, { useState } from 'react';
import { UserPreferences, Avatar } from '../types';

interface Props {
  onComplete: (preferences: UserPreferences) => void;
  isLoading?: boolean;
}

const AVATARS: Avatar[] = [
  { id: 'ghost', emoji: '👻', name: 'Classic Ghost', background_color: '#6366F1' },
  { id: 'skull', emoji: '💀', name: 'Skull Spirit', background_color: '#EF4444' },
  { id: 'ninja', emoji: '🥷', name: 'Shadow Ninja', background_color: '#374151' },
  { id: 'alien', emoji: '👽', name: 'Space Visitor', background_color: '#10B981' },
  { id: 'robot', emoji: '🤖', name: 'Cyber Ghost', background_color: '#3B82F6' },
  { id: 'wizard', emoji: '🧙', name: 'Mystic Sage', background_color: '#8B5CF6' },
  { id: 'vampire', emoji: '🧛', name: 'Night Walker', background_color: '#DC2626' },
  { id: 'devil', emoji: '😈', name: 'Mischief Maker', background_color: '#F59E0B' },
  { id: 'demon', emoji: '👹', name: 'Fire Demon', background_color: '#EF4444' },
  { id: 'ogre', emoji: '👺', name: 'Forest Ogre', background_color: '#059669' },
  { id: 'clown', emoji: '🤡', name: 'Chaos Clown', background_color: '#EC4899' },
  { id: 'pirate', emoji: '🏴‍☠️', name: 'Sea Phantom', background_color: '#1F2937' },
];

const COUNTRIES = [
  'Anonymous', 'Worldwide', 'Virtual Realm', 'Cyberspace', 'Unknown',
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Japan', 'Australia', 'Brazil', 'India', 'China', 'Russia',
  'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway'
];

const GENDERS = [
  'Prefer not to say', 'Non-binary', 'Spirit', 'Energy', 'Void',
  'Male', 'Female', 'Fluid', 'Other', 'Mystery', 'Ghost'
];

export const UserCustomization: React.FC<Props> = ({ onComplete, isLoading = false }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    custom_name: '',
    age: '',
    gender: '',
    country: '',
    avatar_id: 'ghost'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!preferences.custom_name.trim()) {
      newErrors.custom_name = 'Please enter a display name';
    } else if (preferences.custom_name.length > 20) {
      newErrors.custom_name = 'Name must be 20 characters or less';
    }

    if (preferences.age && (isNaN(Number(preferences.age)) || Number(preferences.age) < 1 || Number(preferences.age) > 150)) {
      newErrors.age = 'Please enter a valid age (1-150) or leave blank';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(preferences);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const selectedAvatar = AVATARS.find(a => a.id === preferences.avatar_id) || AVATARS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👻</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Customize Your Ghost
            </h1>
            <p className="text-gray-400">
              Express yourself anonymously - enter whatever you like!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={preferences.custom_name}
                onChange={(e) => updatePreference('custom_name', e.target.value)}
                placeholder="How should others see you? (e.g., MysticShadow, CoffeeGhost...)"
                className={`w-full p-3 bg-gray-700 text-white rounded-lg border ${
                  errors.custom_name ? 'border-red-500' : 'border-gray-600'
                } focus:border-green-500 focus:outline-none`}
                maxLength={20}
              />
              {errors.custom_name && (
                <p className="text-red-400 text-sm mt-1">{errors.custom_name}</p>
              )}
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => updatePreference('avatar_id', avatar.id)}
                    className={`
                      p-3 rounded-lg text-2xl border-2 transition-all
                      ${preferences.avatar_id === avatar.id
                        ? 'border-green-500 bg-gray-700'
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                      }
                    `}
                    style={{
                      backgroundColor: preferences.avatar_id === avatar.id 
                        ? avatar.background_color + '20' 
                        : undefined
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span>{avatar.emoji}</span>
                      <span className="text-xs text-gray-400 mt-1 leading-tight">
                        {avatar.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedAvatar.name}
              </p>
            </div>

            {/* Age, Gender, Country Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age (Optional)
                </label>
                <input
                  type="text"
                  value={preferences.age}
                  onChange={(e) => updatePreference('age', e.target.value)}
                  placeholder="25, 30, ∞, etc."
                  className={`w-full p-3 bg-gray-700 text-white rounded-lg border ${
                    errors.age ? 'border-red-500' : 'border-gray-600'
                  } focus:border-green-500 focus:outline-none`}
                />
                {errors.age && (
                  <p className="text-red-400 text-sm mt-1">{errors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender (Optional)
                </label>
                <select
                  value={preferences.gender}
                  onChange={(e) => updatePreference('gender', e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {GENDERS.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country (Optional)
                </label>
                <select
                  value={preferences.country}
                  onChange={(e) => updatePreference('country', e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Preview:</h3>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white border-opacity-30"
                  style={{ backgroundColor: selectedAvatar.background_color }}
                >
                  {selectedAvatar.emoji}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {preferences.custom_name || 'Your Display Name'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {[preferences.age, preferences.gender, preferences.country]
                      .filter(Boolean).join(' • ') || 'Anonymous Ghost'}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-4 px-8 text-xl font-bold rounded-lg transition-all duration-200
                ${isLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating Your Ghost...</span>
                </div>
              ) : (
                '👻 Enter GhostChatApp'
              )}
            </button>

            {/* Privacy Note */}
            <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm text-green-300">
                🔒 <strong>Privacy Guaranteed:</strong> All information is temporary and will self-destruct in 15 minutes. 
                Enter whatever you like - real or creative!
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};