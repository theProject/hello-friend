'use client';

import { useRef, useEffect, useOptimistic, useState } from 'react';
import { Mic, Sun, Moon, Upload, Send, Loader, StopCircle } from 'lucide-react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

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
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<Message[], Message>(
    messages,
    (state, newMessage) => [...state, newMessage]
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const getNeumorphicStyle = (isPressed = false) => ({
    backgroundColor: isDarkMode ? '#1a1a1a' : '#e0e5ec',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: isPressed
      ? isDarkMode
        ? 'inset 5px 5px 10px #0d0d0d, inset -5px -5px 10px #272727'
        : 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff'
      : isDarkMode
      ? '5px 5px 10px #0d0d0d, -5px -5px 10px #272727'
      : '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
    transition: 'all 0.3s ease',
  });

  async function handleSpeechToText() {
    if (isListening) return;
    
    try {
      const response = await fetch('/api/speech-token');
      const { token, region } = await response.json();
      
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      
      setIsListening(true);
      
      recognizer.recognizeOnceAsync((result) => {
        if (result.text) {
          setMessage((prev: string) => prev + ' ' + result.text);
        }
        setIsListening(false);
      });
    } catch (err) {
      console.error(err);
      setIsListening(false);
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
    
    addOptimisticMessage(newMessage);
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
      // Remove optimistic message if there's an error
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

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto" style={getNeumorphicStyle()}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">FrostScript</h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-all"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        <div 
          ref={chatContainerRef}
          className="mb-4 h-96 overflow-y-auto p-4" 
          style={getNeumorphicStyle()}
        >
          {optimisticMessages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'ml-auto max-w-md bg-blue-500 text-white' 
                  : 'mr-auto max-w-md bg-gray-200 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex gap-2 items-end" style={getNeumorphicStyle(true)}>
          <button 
            className={`p-2 rounded-full transition-all ${
              isListening ? 'text-blue-500' : ''
            }`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <StopCircle className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
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
          <div className="mt-4" style={getNeumorphicStyle()}>
            <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>
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
    </div>
  );
}