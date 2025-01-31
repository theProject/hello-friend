'use client';

import { useRef, useEffect, useOptimistic, useState, startTransition } from 'react';
import { Mic, Sun, Moon, Upload, Send, Loader, Snowflake, X } from 'lucide-react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import VoiceInterface from './VoiceInterface';
import FormattedMessage from './FormattedMessage';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  id: string;
}

interface UploadedFile {
  name: string;
  url: string;
  id: string;
}

interface FileResponse {
  name: string;
  url: string;
}

export default function FrostScript() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<Message[], Message>(
    messages,
    (state, newMessage) => [...state, newMessage]
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [speechSynthesizer, setSpeechSynthesizer] = useState<sdk.SpeechSynthesizer | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getNeumorphicStyle = `
    ${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'}
  `;

  async function handleSpeechToText() {
    if (isListening) return;
    
    try {
      const response = await fetch('/api/speech-token');
      const { token, region } = await response.json();
      
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
      
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
      setSpeechSynthesizer(synthesizer);
      
      const recognizer = new sdk.SpeechRecognizer(speechConfig);
      
      setIsListening(true);
      setShowVoiceInterface(true);
      
      recognizer.recognizeOnceAsync(async (result) => {
        if (result.text) {
          setMessage(result.text);
          await handleVoiceMessage(result.text, synthesizer);
        }
        setIsListening(false);
        recognizer.close();
      });
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  }

  async function handleVoiceMessage(text: string, synthesizer: sdk.SpeechSynthesizer) {
    if (!text.trim()) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    startTransition(() => {
      addOptimisticMessage(newMessage);
    });
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages((prev: Message[]) => [...prev, newMessage, assistantMessage]);
      
      setIsSpeaking(true);
      
      await new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          data.response,
          result => {
            if (result.errorDetails) {
              console.error('Speech synthesis error:', result.errorDetails);
              reject(result.errorDetails);
            } else {
              resolve(result);
            }
            setIsSpeaking(false);
          },
          error => {
            console.error('Speech synthesis error:', error);
            setIsSpeaking(false);
            reject(error);
          }
        );
      });

      // Brief pause before starting to listen again
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get fresh token for recognition
      const tokenResponse = await fetch('/api/speech-token');
      const { token, region } = await tokenResponse.json();
      
      const newSpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      newSpeechConfig.speechRecognitionLanguage = 'en-US';
      const recognizer = new sdk.SpeechRecognizer(newSpeechConfig);
      
      setIsListening(true);
      
      const timeoutId = setTimeout(() => {
        if (isListening) {
          recognizer.close();
          setIsListening(false);
        }
      }, 3000);

      recognizer.recognizeOnceAsync(async (result) => {
        clearTimeout(timeoutId);
        if (result.text) {
          setMessage(result.text);
          await handleVoiceMessage(result.text, synthesizer);
        } else {
          setIsListening(false);
        }
        recognizer.close();
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => prev.filter(msg => msg.id !== newMessage.id));
      setIsSpeaking(false);
      setIsListening(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    
    const files = Array.from(event.target.files);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      const newFiles = data.files.map((file: FileResponse) => ({
        ...file,
        id: crypto.randomUUID()
      }));
      
      setUploadedFiles((prev: UploadedFile[]) => [...prev, ...newFiles]);

      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: `Files uploaded: ${files.map(f => f.name).join(', ')}`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      setMessages((prev: Message[]) => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!message.trim() || isLoading) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    startTransition(() => {
      addOptimisticMessage(newMessage);
    });
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage.content })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages((prev: Message[]) => [...prev, newMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev: Message[]) => prev.filter(msg => msg.id !== newMessage.id));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [optimisticMessages]);

  useEffect(() => {
    return () => {
      if (speechSynthesizer) {
        speechSynthesizer.close();
      }
    };
  }, [speechSynthesizer]);

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`max-w-4xl mx-auto ${getNeumorphicStyle}`}>
        {!showVoiceInterface && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">
                FrostScript
              </h1>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-all"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        )}

        <div 
          ref={chatContainerRef}
          className={`mb-4 h-96 overflow-y-auto p-4 ${getNeumorphicStyle}`}
        >
          {optimisticMessages.map((msg) => (
            <FormattedMessage
              key={msg.id}
              content={msg.content}
              isUser={msg.role === 'user'}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        <div className={`flex gap-2 items-end ${getNeumorphicStyle}`}>
          <button 
            className={`p-2 rounded-full transition-all ${
              isListening ? 'text-blue-600' : ''
            }`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label="Start voice input"
          >
            <Mic className="w-6 h-6" />
          </button>
          
          <label className="p-2 rounded-full cursor-pointer" htmlFor="file-upload">
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
              aria-label="Upload files"
            />
            <Upload className="w-6 h-6" />
          </label>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            aria-label="Message input"
          />
          
          <button 
            className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-all"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className={`mt-4 ${getNeumorphicStyle} relative`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Uploaded Files</h2>
              <button
                onClick={() => setUploadedFiles([])}
                className={`p-2 rounded-full transition-all ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
                aria-label="Clear uploaded files"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li key={file.id} className="flex items-center gap-2">
                  <span>{file.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showVoiceInterface && (
        <VoiceInterface 
          isListening={isListening}
          isSpeaking={isSpeaking}
          isDarkMode={isDarkMode}
          onClose={() => {
            setShowVoiceInterface(false);
            setIsListening(false);
            setIsSpeaking(false);
          }}
          onStart={handleSpeechToText}
          onStop={() => {
            setIsListening(false);
          }}
        />
      )}
    </div>
  );
}