// components/VoiceInterface.tsx
import React from 'react';
import { Mic, X } from 'lucide-react';

interface VoiceInterfaceProps {
  isListening: boolean; // Should be true while actively listening; set to false after 5s silence.
  isSpeaking: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onStart: () => void; // Called to start listening.
  onStop: () => void;  // (Not used in this interface if conversation is fluid.)
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  isListening, 
  isSpeaking, 
  isDarkMode,
  onClose, 
  onStart, 
  //onStop 
}) => {
  // Determine status:
  // - If assistant is speaking, show "Assistant Speaking..."
  // - If actively listening, show "Listening..."
  // - Otherwise (after 5 seconds silence) show "Click to Speak"
  const status = isSpeaking 
    ? 'Assistant Speaking...' 
    : isListening 
      ? 'Listening...' 
      : 'Click to Speak';

  // The center button should only be clickable when the system is idle 
  // (i.e. isListening is false and isSpeaking is false).
  const handleClick = () => {
    if (!isListening && !isSpeaking) {
      onStart();
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-3xl transition-all duration-300`}>
      <div className={`p-16 mx-auto max-w-4xl rounded-3xl ${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'} relative`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute -top-6 -right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 neumorphic-dark' : 'bg-gray-100 hover:bg-gray-200 neumorphic-light'}`}
          aria-label="Close voice interface"
        >
          <X className={`w-8 h-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>

        <div className="relative">
          {/* Ring animation container */}
          <div className={`w-64 h-64 rounded-full relative ${(isListening || isSpeaking) ? 'animate-spin-slow' : ''}`}>
            {/* Outer gradient ring */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="w-full h-full rounded-full bg-gradient-to-r from-teal-600 via-purple-600 to-blue-500 p-4 bg-[length:300%_300%] animate-spin-slow">
                {/* Inner circle background */}
                <div className={`w-full h-full rounded-full ${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'}`} />
              </div>
            </div>

            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleClick}
                className={`w-32 h-32 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isDarkMode 
                    ? `bg-gray-800 ${(!isListening && !isSpeaking) ? 'neumorphic-dark' : 'neumorphic-dark-inset'}`
                    : `bg-gray-100 ${(!isListening && !isSpeaking) ? 'neumorphic-light' : 'neumorphic-light-inset'}`
                }`}
                disabled={isListening || isSpeaking}
              >
                {isListening ? (
                  <div className="w-4 h-4 bg-teal-400 rounded-full animate-pulse" />
                ) : isSpeaking ? (
                  <div className="flex space-x-1">
                    <div className="w-1 h-8 bg-blue-500 animate-pulse" />
                    <div className="w-1 h-8 bg-indigo-500 animate-pulse delay-75" />
                    <div className="w-1 h-8 bg-teal-500 animate-pulse delay-150" />
                  </div>
                ) : (
                  <Mic className={`w-12 h-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                )}
              </button>
            </div>
          </div>

          {/* Status text below the button */}
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
