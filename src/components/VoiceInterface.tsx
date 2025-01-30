// src/components/VoiceInterface.tsx
import React from 'react';
import { Mic, X } from 'lucide-react';

interface VoiceInterfaceProps {
  isListening: boolean;
  isSpeaking: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  isListening, 
  isSpeaking, 
  isDarkMode,
  onClose, 
  onStart, 
  onStop 
}) => {
  const getNeumorphicStyle = (isPressed = false) => ({
    backgroundColor: isDarkMode ? '#1a1a1a' : '#e0e5ec',
    boxShadow: isPressed
      ? isDarkMode
        ? 'inset 5px 5px 10px #0d0d0d, inset -5px -5px 10px #272727'
        : 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff'
      : isDarkMode
      ? '5px 5px 10px #0d0d0d, -5px -5px 10px #272727'
      : '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
  });

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}>
      <div className="relative">
        {/* Rotating gradient ring */}
        <div 
          className={`w-64 h-64 rounded-full relative ${
            (isListening || isSpeaking) ? 'animate-spin-slow' : ''
          }`}
        >
          {/* Outer gradient ring */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 via-purple-600 via-pink-700 to-blue-600 p-4"
                 style={{
                   backgroundSize: '300% 300%',
                   animation: (isListening || isSpeaking) ? 'gradientRotate 3s linear infinite' : 'none'
                 }}
            >
              {/* Inner circle background */}
              <div 
                className="w-full h-full rounded-full"
                style={getNeumorphicStyle()}
              />
            </div>
          </div>

          {/* Center button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isListening ? onStop : onStart}
              className={`w-32 h-32 rounded-full transition-all duration-300 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              style={getNeumorphicStyle(isListening)}
            >
              {isListening ? (
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
              ) : isSpeaking ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-8 bg-indigo-500 animate-pulse" />
                  <div className="w-1 h-8 bg-indigo-500 animate-pulse delay-75" />
                  <div className="w-1 h-8 bg-indigo-500 animate-pulse delay-150" />
                </div>
              ) : (
                <Mic className={`w-12 h-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close" // Provides tooltip
            className={`absolute -top-2 -right-2 w-12 h-12 rounded-full 
                       flex items-center justify-center transition-all duration-300
                       ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            style={getNeumorphicStyle()}
          >
            <X className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;