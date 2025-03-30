"use client";

import React, {
  useRef,
  useEffect,
  useState,
} from "react";
import {
  Mic,
  Sun,
  Moon,
  Upload,
  Send,
  Loader,
  Image as ImageIcon,
  User,
  Download,
  XCircle,
} from "lucide-react";
import { FaConnectdevelop } from "react-icons/fa6";
import Image from "next/image";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import FormattedMessage from "./FormattedMessage";
import VoiceInterface from "./VoiceInterface";
import ImageModal from "./ImageModal";
import { imageCache } from "@/utils/imageCache";
import { saveToDevice } from "@/utils/imageUtils";
import { sendPrompt } from "@/utils/sendPrompt";
import type {
  Message,
  UploadedFile,
  FileResponse,
  ProfileInfo,
} from "@/types";

/** Type guard for 'AbortError' */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export default function FrostScript() {
  // ---------------------------------
  // State Declarations
  // ---------------------------------
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesizer, setSpeechSynthesizer] =
    useState<sdk.SpeechSynthesizer | null>(null);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile] = useState<ProfileInfo>({
    imageUrl: "/default-avatar.png",
    name: "User Name",
    email: "user@example.com",
  });
  const [hasFocused, setHasFocused] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(
    null
  );

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Glass classes
  const getGlassStyle = isDarkMode ? "glass-base-dark" : "glass-base-light";
  const getGlassMessage = isDarkMode
    ? "glass-message-dark"
    : "glass-message-light";

  // ---------------------------------
  // Effects
  // ---------------------------------
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Clean up the speechSynthesizer
      speechSynthesizer?.close();
    };
  }, [speechSynthesizer]);

  // ---------------------------------
  // File & Photo Upload
  // ---------------------------------
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);
    setIsLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`File upload error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.files) {
        throw new Error("Invalid file upload response.");
      }

      const newFiles: UploadedFile[] = data.files.map((f: FileResponse) => ({
        ...f,
        id: crypto.randomUUID(),
        type: "document",
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: `Files uploaded: ${files.map((f) => f.name).join(", ")}`,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Photo upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.url) {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content: `Uploaded photo: ${file.name}`,
          role: "user",
          timestamp: new Date().toISOString(),
          imageUrl: data.url,
          imageAlt: file.name,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  }

  async function handleImageDownload(url: string, filename?: string) {
    try {
      const blob = await imageCache.getOrFetch(url);
      await saveToDevice(blob, filename || `image-${Date.now()}.png`);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }

  // ---------------------------------
  // handleSendMessage (Text Chat)
  // ---------------------------------
  async function handleSendMessage() {
    if (!message.trim() || isLoading) return;

    // Immediately show user prompt
    const userMsg: Message = {
      id: crypto.randomUUID(),
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");

    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await sendPrompt(
        userMsg.content,
        speechSynthesizer,
        setMessages,
        setIsLoading,
        setIsGeneratingImage,
        controller.signal
      );

      if (response.blocked) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          content: response.message.content,
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        setMessages((prev) => [...prev, response.message]);
      }
    } catch (err) {
      if (isAbortError(err)) {
        console.warn("User aborted the text request.");
        const cancelMsg: Message = {
          id: crypto.randomUUID(),
          content: "Prompt was canceled.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, cancelMsg]);
      } else {
        console.error("Error processing message:", err);
        const fallback: Message = {
          id: crypto.randomUUID(),
          content: "Something went wrong. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallback]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }

  // ---------------------------------
  // Voice Chat
  // ---------------------------------
  async function handleSpeechToText() {
    if (isListening) return;
    try {
      const response = await fetch("/api/speech-token");
      if (!response.ok) {
        throw new Error(`Speech token fetch failed: ${response.statusText}`);
      }

      const { token, region } = await response.json();
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = "en-US";
      speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
      setSpeechSynthesizer(synthesizer);

      setIsListening(true);
      setShowVoiceInterface(true);

      const recognizer = new sdk.SpeechRecognizer(speechConfig);
      recognizer.recognizeOnceAsync(async (result) => {
        recognizer.close();
        setIsListening(false);

        if (result.text) {
          setMessage(result.text);
          await handleVoiceMessage(result.text);
        }
      });
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  }

  async function handleVoiceMessage(text: string) {
    if (!text.trim()) return;

    const userVoiceMsg: Message = {
      id: crypto.randomUUID(),
      content: text,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userVoiceMsg]);

    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await sendPrompt(
        text,
        speechSynthesizer,
        setMessages,
        setIsLoading,
        setIsGeneratingImage,
        controller.signal
      );

      if (response.blocked) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          content: response.message.content,
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        setMessages((prev) => [...prev, response.message]);
      }
    } catch (err) {
      if (isAbortError(err)) {
        console.warn("User aborted the voice request.");
        const cancelMsg: Message = {
          id: crypto.randomUUID(),
          content: "Voice prompt was canceled.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, cancelMsg]);
      } else {
        console.error("Voice message error:", err);
        const fallback: Message = {
          id: crypto.randomUUID(),
          content: "I'm sorry, something went wrong. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallback]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }

  // ---------------------------------
  // Render
  // ---------------------------------
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        isDarkMode ? "gradient-dark text-gray-100" : "gradient-light text-gray-800"
      } transition-colors duration-500`}
    >
      {/* Custom CSS, background pulses, etc. */}
      <style jsx global>{`
        .progress-bar-container {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          height: 8px;
        }
        .progress-bar {
          width: 50%;
          height: 8px;
          background-color: #40e0d0;
          animation: loading 1s infinite alternate;
        }
        @keyframes loading {
          0% {
            width: 20%;
          }
          100% {
            width: 90%;
          }
        }
      `}</style>

      {/* Example background pulses */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? "bg-pink-600/30" : "bg-purple-400/30"
          } blur-3xl animate-pulse`}
        />
        <div
          className={`absolute bottom-1/4 right-0 w-96 h-96 rounded-full ${
            isDarkMode ? "bg-blue-600/20" : "bg-blue-400/30"
          } blur-3xl animate-pulse delay-700`}
        />
        <div
          className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full ${
            isDarkMode ? "bg-indigo-600/20" : "bg-pink-400/30"
          } blur-3xl animate-pulse delay-1000 -translate-x-1/2 -translate-y-1/2`}
        />
      </div>

      {/* Header */}
      <div className="relative mb-8">
        <div className={`${getGlassMessage} p-4`}>
          <div className="flex flex-nowrap justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 group">
              <div className="transform transition duration-300 group-hover:scale-110 group-hover:rotate-12">
                <FaConnectdevelop
                  className={`w-12 h-12 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-pink-700 group-hover:text-pink-800"
                      : "text-pink-700 group-hover:text-pink-800"
                  }`}
                />
              </div>
              <h1
                className={`hidden md:block text-2xl ${
                  isDarkMode
                    ? "text-indigo-100 group-hover:text-white"
                    : "text-slate-800 group-hover:text-slate-900"
                } font-extrabold transition-all duration-300 group-hover:tracking-wider`}
              >
                Hello Friend.
              </h1>
            </div>

            {/* Utility Buttons */}
            <div className="flex items-center gap-2">
              {/* File Upload */}
              <label className="p-2 transform transition-all duration-300 hover:scale-110 hover:rotate-12 hover:bg-opacity-40">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                  aria-label="Upload file"
                />
                <Upload className="w-5 h-5" />
              </label>

              {/* Photo Upload */}
              <label className="p-2 transform transition-all duration-300 hover:scale-110 hover:-rotate-12 hover:bg-opacity-40">
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
                className={`p-2 transform transition-all duration-300 hover:scale-110 hover:rotate-12 ${
                  isDarkMode
                    ? "text-yellow-500 hover:fill-yellow-500/20 hover:text-yellow-300"
                    : "text-blue-500 hover:fill-blue-500/20 hover:text-blue-600"
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Profile Menu */}
              <div className="p-2 relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 transform transition-all duration-300 hover:scale-105"
                >
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
        {messages.map((msg, i) => {
          const isAI = msg.role === "assistant";
          const isLast = i === messages.length - 1;
          const isLatestAIMessage = isAI && isLast;
          return (
            <FormattedMessage
              key={msg.id}
              content={msg.content}
              isUser={msg.role === "user"}
              imageUrl={msg.imageUrl}
              imageAlt={msg.imageAlt}
              onImageClick={(url) => {
                setSelectedImage({ url, alt: msg.imageAlt || "Image" });
              }}
              glassStyle={getGlassStyle}
              messageStyle={getGlassMessage}
              isLatestAIMessage={isLatestAIMessage}
            />
          );
        })}

        {/* Typing indicator for normal text */}
        {!isGeneratingImage && isLoading && (
          <div className="flex justify-center mt-4">
            <Loader className="w-6 h-6 animate-spin text-blue-400 mr-2" />
            <span className="text-sm text-gray-400">Thinking...</span>
          </div>
        )}

        {/* Image generation progress */}
        {isGeneratingImage && (
          <div className={`${getGlassStyle} flex flex-col items-center gap-2 p-4 rounded-xl mt-2`}>
            <p className="text-sm opacity-80">Generating image (please wait)...</p>
            <div className="progress-bar-container">
              <div className="progress-bar" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`${getGlassMessage} p-4 backdrop-blur-xl`}>
        <label htmlFor="messageInput" className="sr-only">
          Message Input
        </label>
        <div className="flex gap-2 items-end">
          {/* Voice Input Button */}
          <button
            className={`${getGlassStyle} p-2 rounded-full glass-hover ${
              isListening ? "bg-blue-500/30 text-blue-300" : ""
            }`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label="Start voice input"
          >
            <Mic className="w-6 h-6" />
          </button>

          {/* Textarea for user input */}
          <div className="flex-1 relative">
            {!hasFocused && message === "" && (
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
              id="messageInput"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setHasFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent border-none outline-none resize-none min-h-[40px] max-h-32 py-2 px-4 h-auto glass-scrollbar"
              rows={1}
              aria-label="Message Input"
            />
          </div>

          {/* Send Button */}
          <button
            className={`${getGlassStyle} p-2 rounded-xl glass-hover glass-rotate-hover disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send className="w-6 h-6" />
          </button>

          {/* Stop Button */}
          {isLoading && abortController && (
            <button
              className={`${getGlassStyle} p-2 ml-2 rounded-xl glass-hover`}
              onClick={() => abortController.abort()}
              aria-label="Stop current request"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className={`${getGlassMessage} mt-4 p-4 rounded-xl`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Uploaded Files</h2>
            <button
              onClick={() => setUploadedFiles([])}
              className="opacity-70 hover:opacity-100 transition-opacity text-sm"
            >
              Clear All
            </button>
          </div>
          <ul className="space-y-1">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="text-sm flex items-center justify-between">
                <span>{file.name}</span>
                {file.type === "image" && (
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
          onDownload={() =>
            selectedImage.url &&
            handleImageDownload(selectedImage.url, "downloaded.png")
          }
          glassStyle={getGlassStyle}
        />
      )}
    </div>
  );
}
