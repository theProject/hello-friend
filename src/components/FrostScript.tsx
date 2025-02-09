'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  Sun,
  Moon,
  Upload,
  Send,
  Loader,
  Image as ImageIcon,
  User,
  Download
} from 'lucide-react';
import { FaConnectdevelop } from "react-icons/fa6";
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

  const getGlassStyle = isDarkMode ? 'glass-base-dark' : 'glass-base-light';
  const getGlassMessage = isDarkMode ? 'glass-message-dark' : 'glass-message-light';
  const [hasFocused, setHasFocused] = useState(false);

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
        setMessages((prev) => [...prev, newMessage]);
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
          if (synthesizer) {
            await handleVoiceMessage(result.text, synthesizer);
          }
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

    // Optimistically add the user's message.
    setMessages((prev) => [...prev, newMessage]);

    setMessage('');
    setIsLoading(true);

    try {
      setShowVoiceInterface(true);

      const isImageGenerationRequest = text.toLowerCase().match(
        /(?:create|generate|draw|make|show me|imagine|picture of|visualize|design) (?:an?|the|some)? ?(?:image|picture|photo|illustration|artwork|drawing)/i
      );

      if (isImageGenerationRequest) {
        setIsGeneratingImage(true);
        const imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: text })
        });

        const imageData = await imageResponse.json();

        if (imageData.imageUrl) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            content: `Generated image for: "${text}"`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            imageUrl: imageData.imageUrl,
            imageAlt: text
          };
          setMessages((prev) => [...prev, assistantMessage]);

          setIsSpeaking(true);
          await new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
              "I've generated the image you requested.",
              (result) => {
                if (result.errorDetails) {
                  reject(result.errorDetails);
                } else {
                  resolve(result);
                }
              },
              (error) => reject(error)
            );
          });
        }
        setIsGeneratingImage(false);
      } else {
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

        setMessages((prev) => [...prev, assistantMessage]);

        setIsSpeaking(true);
        setIsListening(false);

        await new Promise((resolve, reject) => {
          synthesizer.speakTextAsync(
            data.response,
            (result) => {
              if (result.errorDetails) {
                console.error('Speech synthesis error:', result.errorDetails);
                reject(result.errorDetails);
              } else {
                resolve(result);
              }
            },
            (error) => {
              console.error('Speech synthesis error:', error);
              reject(error);
            }
          );
        });
      }

      setIsSpeaking(false);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tokenResponse = await fetch('/api/speech-token');
      const { token: newToken, region: newRegion } = await tokenResponse.json();

      const newSpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(newToken, newRegion);
      newSpeechConfig.speechRecognitionLanguage = 'en-US';
      const recognizer = new sdk.SpeechRecognizer(newSpeechConfig);

      setIsListening(true);

      recognizer.recognizeOnceAsync(async (result) => {
        if (result.text) {
          await handleVoiceMessage(result.text, synthesizer);
        } else {
          setIsListening(false);
        }
        recognizer.close();
      });
    } catch (error) {
      console.error('Error in voice interaction:', error);
      // Remove the user message if an error occurs.
      setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
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
      files.forEach((file) => formData.append('files', file));

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

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: `Files uploaded: ${files.map((f) => f.name).join(', ')}`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, systemMessage]);
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

    // Add the user message immediately.
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const isImageGenerationRequest = message.toLowerCase().match(
        /(?:create|generate|draw|make|show me|imagine|picture of|visualize|design) (?:an?|the|some)? ?(?:image|picture|photo|illustration|artwork|drawing)/i
      );

      if (isImageGenerationRequest) {
        setIsGeneratingImage(true);
        const imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: message })
        });

        const imageData = await imageResponse.json();

        if (imageData.imageUrl) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            content: `Generated image for: "${message}"`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            imageUrl: imageData.imageUrl,
            imageAlt: message
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
        setIsGeneratingImage(false);
      } else {
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

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== newMessage.id)
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (speechSynthesizer) {
        speechSynthesizer.close();
      }
    };
  }, [speechSynthesizer]);

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        isDarkMode ? 'gradient-dark text-gray-100' : 'gradient-light text-gray-800'
      } transition-colors duration-500`}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-purple-600/20' : 'bg-purple-400/30'
          } blur-3xl animate-pulse`}
        />
        <div
          className={`absolute bottom-1/4 right-0 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-blue-600/20' : 'bg-blue-400/30'
          } blur-3xl animate-pulse delay-700`}
        />
        <div
          className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-indigo-600/20' : 'bg-pink-400/30'
          } blur-3xl animate-pulse delay-1000 -translate-x-1/2 -translate-y-1/2`}
        />
      </div>

      {/* Header Section */}
      <div className="relative mb-8">
        <div className={`${getGlassMessage} p-4`}>
          <div className="flex flex-nowrap justify-between items-center gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-3 group">
              <div
                className={`${getGlassStyle} p-3 rounded-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
              >
                <FaConnectdevelop
                  className={`w-10 h-10 transition-colors duration-300 ${
                    isDarkMode
                      ? 'text-indigo-400 group-hover:text-indigo-600'
                      : 'text-indigo-600 group-hover:text-indigo-700'
                  }`}
                />
              </div>
              <h1 className="hidden md:block text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-800 to-indigo-600 bg-clip-text text-transparent transition-all duration-300 group-hover:tracking-wider">
                Good friend.
              </h1>
            </div>

            {/* Utility Buttons */}
            <div className="flex items-center gap-2">
              {/* File Upload Button */}
              <label
                className={`${getGlassStyle} p-2 rounded-xl transform transition-all duration-300 hover:scale-110 hover:rotate-12 hover:bg-opacity-40`}
              >
                <span className="sr-only">Upload File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Upload className="w-5 h-5" />
              </label>

              {/* Photo Upload Button */}
              <label
                className={`${getGlassStyle} p-2 rounded-xl transform transition-all duration-300 hover:scale-110 hover:-rotate-12 hover:bg-opacity-40`}
              >
                <span className="sr-only">Upload Photo</span>
                <input
                  ref={photoInputRef}
                  type="file"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  accept="image/*"
                />
                <ImageIcon className="w-5 h-5" />
              </label>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`${getGlassStyle} p-2 rounded-xl transform transition-all duration-300 hover:scale-110 hover:rotate-12 ${
                  isDarkMode
                    ? 'hover:bg-yellow-500/20 hover:text-yellow-300'
                    : 'hover:bg-blue-500/20 hover:text-blue-600'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Profile Button */}
              <div className={`${getGlassStyle} p-2 rounded-xl relative`}>
                <button className="flex items-center gap-2 transform transition-all duration-300 hover:scale-105">
                  {profile.imageUrl ? (
                    <div className="relative w-8 h-8">
                      <Image
                        src={profile.imageUrl}
                        alt={profile.name}
                        fill
                        sizes="32px"
                        className="rounded-full object-cover border-2 border-blue-400/30"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500/30 backdrop-blur-sm flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div
                    className={`${getGlassStyle} absolute right-0 mt-2 w-48 py-2 rounded-xl shadow-xl z-50 animate-fade-scale`}
                  >
                    <div className="px-4 py-2 border-b border-gray-200/20">
                      <p className="text-sm font-semibold">{profile.name}</p>
                      <p className="text-xs opacity-70">{profile.email}</p>
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors duration-200">
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors duration-200">
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={chatContainerRef}
        className="mb-4 h-[calc(100vh-12rem)] overflow-y-auto p-4 glass-scrollbar"
      >
        {messages.map((msg) => (
          <FormattedMessage
            key={msg.id}
            content={msg.content}
            isUser={msg.role === 'user'}
            imageUrl={msg.imageUrl}
            imageAlt={msg.imageAlt}
            onImageClick={(url) => setSelectedImage({ url, alt: msg.imageAlt || 'Image' })}
            glassStyle={getGlassStyle}
            messageStyle={getGlassMessage}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        )}
        {isGeneratingImage && (
          <div className={`${getGlassStyle} flex flex-col items-center gap-2 p-4 rounded-xl`}>
            <Loader className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm opacity-70">Generating image...</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`${getGlassMessage} p-4 backdrop-blur-xl`}>
        <div className="flex gap-2 items-end">
          <button
            className={`${getGlassStyle} p-2 rounded-full glass-hover ${
              isListening ? 'bg-blue-500/30 text-blue-300' : ''
            }`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label="Start voice input"
          >
            <Mic className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            {!hasFocused && message === '' && (
              <div className="absolute inset-0 flex items-center pointer-events-none px-4 py-2 opacity-70">
                <span className="block md:hidden text-sm">
                  Ask anything or describe an image to generate...
                </span>
                <span className="hidden md:block">
                  Hi Friend! Ask me anything, I can even create art!
                </span>
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setHasFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder=""
              className="w-full bg-transparent border-none outline-none resize-none min-h-[40px] max-h-32 py-2 px-4 h-auto glass-scrollbar"
              rows={1}
              aria-label="Message Input"
            />
          </div>

          <button
            className={`${getGlassStyle} p-2 rounded-xl glass-hover glass-rotate-hover disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className={`${getGlassMessage} mt-4 p-4 rounded-xl`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Uploaded Files</h2>
            <button
              onClick={() => setUploadedFiles([])}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Clear All
            </button>
          </div>
          <ul className="space-y-1">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="text-sm flex items-center justify-between">
                <span>{file.name}</span>
                {file.type === 'image' && (
                  <button
                    onClick={() => handleImageDownload(file.url, file.name)}
                    className={`${getGlassStyle} p-1 rounded-lg glass-hover`}
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
          onStop={() => setIsListening(false)}
          glassStyle={getGlassStyle}
          messageStyle={getGlassMessage}
        />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
          onDownload={() => selectedImage.url && handleImageDownload(selectedImage.url)}
          glassStyle={getGlassStyle}
        />
      )}
    </div>
  );
}
