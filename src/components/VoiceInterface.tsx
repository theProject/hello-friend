// components/VoiceInterface.tsx
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
  const status = isSpeaking ? 'Assistant Speaking...' : isListening ? 'Listening...' : 'Click to Speak';
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm transition-all duration-300`}>
      {/* Outer panel with neumorphic effect */}
      <div className={`p-16 rounded-3xl ${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'} relative`}>
        {/* Close button - moved outside and up */}
        <button
          onClick={onClose}
          className={`absolute -top-6 -right-6 w-14 h-14 rounded-full 
                   flex items-center justify-center transition-all duration-300
                   ${isDarkMode 
                     ? 'bg-gray-800 hover:bg-gray-700 neumorphic-dark' 
                     : 'bg-gray-100 hover:bg-gray-200 neumorphic-light'}`}
          aria-label="Close voice interface"
        >
          <X className={`w-8 h-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>

        <div className="relative">
          {/* Ring animation container */}
          <div className={`w-64 h-64 rounded-full relative ${(isListening || isSpeaking) ? 'animate-spin-slow' : ''}`}>
            {/* Outer gradient ring */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-4 bg-[length:300%_300%]">
                {/* Inner circle background */}
                <div className={`w-full h-full rounded-full ${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'}`} />
              </div>
            </div>

            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={isListening ? onStop : onStart}
                className={`w-32 h-32 rounded-full transition-all duration-300 flex items-center justify-center
                  ${isDarkMode 
                    ? `bg-gray-800 ${isListening || isSpeaking ? 'neumorphic-dark-inset' : 'neumorphic-dark'}` 
                    : `bg-gray-100 ${isListening || isSpeaking ? 'neumorphic-light-inset' : 'neumorphic-light'}`}`}
                disabled={isSpeaking}
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
          </div>

          {/* Status text below button */}
          <div className="absolute -bottom-10 left-0 right-0 text-center">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;