'use client';

import { useRef, useEffect, useOptimistic, useState, startTransition } from 'react';
import { Mic, Sun, Moon, Upload, Send, Loader, Snowflake, Image as ImageIcon, User, Download, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import VoiceInterface from './VoiceInterface';
import FormattedMessage from './FormattedMessage';
import ImageModal from './ImageModal';
import { imageCache } from '@/utils/imageCache';
import { saveToDevice } from '@/utils/imageUtils';
import type { Message, UploadedFile, FileResponse, ProfileInfo } from '@/types';

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
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showProfileMenu] = useState(false);
  const [profile] = useState<ProfileInfo>({
    imageUrl: '/default-avatar.png',
    name: 'User Name',
    email: 'user@example.com'
  });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const getNeumorphicStyle = `${isDarkMode ? 'neumorphic-dark' : 'neumorphic-light'}`;

  // Image generation handler
  const handleImageGeneration = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content: `Generated image for prompt: "${prompt}"`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          imageUrl: data.imageUrl,
          imageAlt: prompt
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Photo upload handler
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.url) {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content: `Uploaded photo: ${file.name}`,
          role: 'user',
          timestamp: new Date().toISOString(),
          imageUrl: data.url,
          imageAlt: file.name
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  }

  // Image download handler
  const handleImageDownload = async (url: string, filename?: string) => {
    try {
      const blob = await imageCache.getOrFetch(url);
      await saveToDevice(blob, filename || `image-${Date.now()}.png`);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Rest of your existing handlers...
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

      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        id: crypto.randomUUID(),
        type: 'document'
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
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 p-2">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Snowflake className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              FrostScript
            </h1>
          </div>

          {/* Actions and Profile */}
          <div className="flex items-center gap-4">
            {/* File Upload */}
            <label className="p-2 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
                aria-label="Upload files"
              />
              <Upload className="w-5 h-5" />
            </label>

            {/* Photo Upload */}
            <label className="p-2 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-all">
              <input
                ref={photoInputRef}
                type="file"
                className="hidden"
                onChange={handlePhotoUpload}
                accept="image/*"
                aria-label="Upload photo"
              />
              <ImageIcon className="w-5 h-5" />
            </label>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Menu */}
            <div className="relative">
            <button
  className="flex items-center gap-2"
  aria-label="Profile menu"
>
  {profile.imageUrl ? (
    <div className="relative w-8 h-8">
      <Image
        src={profile.imageUrl}
        alt={profile.name}
        fill
        sizes="32px"
        className="rounded-full object-cover border-2 border-blue-600"
        priority
      />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
      <User className="w-5 h-5 text-white" />
    </div>
  )}
  <ChevronDown className="w-4 h-4" />
</button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold">{profile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="mb-4 h-[calc(100vh-12rem)] overflow-y-auto p-4 custom-scrollbar"
        >
          {optimisticMessages.map((msg) => (
            <FormattedMessage
              key={msg.id}
              content={msg.content}
              isUser={msg.role === 'user'}
              imageUrl={msg.imageUrl}
              imageAlt={msg.imageAlt}
              onImageClick={url => setSelectedImage({ url, alt: msg.imageAlt || 'Image' })}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
          {isGeneratingImage && (
            <div className="flex flex-col items-center gap-2 p-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating image...</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`flex gap-2 items-end p-4 ${getNeumorphicStyle}`}>
          <button 
            className={`p-2 rounded-full transition-all ${
              isListening ? 'text-blue-600 bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label="Start voice input"
          >
            <Mic className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message... Use /image to generate images"
              className="w-full bg-transparent border-none outline-none resize-none min-h-[40px] max-h-32 py-2 px-4 h-auto"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (message.startsWith('/image ')) {
                    const prompt = message.slice(7);
                    handleImageGeneration(prompt);
                    setMessage('');
                  } else {
                    handleSendMessage();
                  }
                }
              }}
              aria-label="Message input"
            />
          </div>
          
          <button 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
            onClick={() => {
              if (message.startsWith('/image ')) {
                const prompt = message.slice(7);
                handleImageGeneration(prompt);
                setMessage('');
              } else {
                handleSendMessage();
              }
            }}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold">Uploaded Files</h2>
              <button
                onClick={() => setUploadedFiles([])}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Clear uploaded files"
              >
                Clear All
              </button>
            </div>
            <ul className="space-y-1">
              {uploadedFiles.map((file) => (
                <li key={file.id} className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                  <span>{file.name}</span>
                  {file.type === 'image' && (
                    <button
                      onClick={() => handleImageDownload(file.url, file.name)}
                      className="p-1 hover:text-blue-600 transition-colors"
                      aria-label="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Voice Interface */}
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

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
          onDownload={() => selectedImage.url && handleImageDownload(selectedImage.url)}
        />
      )}
    </div>
  );
}