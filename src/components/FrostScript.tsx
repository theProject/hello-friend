"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Mic,
  Sun,
  Moon,
  Send,
  Loader,
  Image as ImageIcon,
  User,
  Download,
  XCircle,
  Menu,
  FileText,
  Code,
  BrainCircuit,
  Layers,
 // History,
  MessageSquare
} from "lucide-react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import FormattedMessage from "./FormattedMessage";
import VoiceInterface from "./VoiceInterface";
import ImageModal from "./ImageModal";
import { imageCache } from "@/utils/imageCache";
import { saveToDevice } from "@/utils/imageUtils";
import { sendPrompt } from "@/utils/sendPrompt";
import type { Message, UploadedFile, FileResponse } from "@/types";
import { signOut } from "next-auth/react";


/** Type guard for 'AbortError' */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export default function FrostScript() {
  // ---------------------------------
  // State Declarations
  // ---------------------------------
  const [darkMode, setDarkMode] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      content:
        "Hello, Friend - Let's disrupt the world of AI together!",
      role: "assistant",
      timestamp: new Date().toISOString(),
    },
  ]);
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
  const [hasFocused, setHasFocused] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    profile: false,
    images: false,
    documents: false,
  });

  // ---------------------------------
  // Refs
  // ---------------------------------
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------
  // Helper Functions
  // ---------------------------------
  const getMessageStyle = (isUser: boolean) => {
    if (isUser) {
      return "bg-gradient-to-br from-cyan-500 to-blue-600 text-white";
    } else {
      return darkMode
        ? "bg-gray-800 border border-gray-700"
        : "bg-white border border-gray-200";
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    return () => {
      // Clean up the speechSynthesizer
      speechSynthesizer?.close();
    };
  }, [speechSynthesizer]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Add this helper function for the right sidebar toggle
  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Fixing TypeScript error with index signature
  const toggleDropdown = (name: "profile" | "images" | "documents") => {
    setDropdownOpen({
      ...dropdownOpen,
      [name]: !dropdownOpen[name],
    });
  };

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
  // Logo Component
  // ---------------------------------
  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className={`relative w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <svg viewBox="0 0 40 40" className="w-7 h-7">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <g>
            {/* Connected abstract nodes design */}
            <circle cx="15" cy="15" r="5" fill="url(#logoGradient)" />
            <circle cx="25" cy="25" r="5" fill="url(#logoGradient)" />
            <circle cx="25" cy="10" r="3" fill="url(#logoGradient)" />
            <circle cx="10" cy="25" r="3" fill="url(#logoGradient)" />
            
            {/* Connection lines */}
            <line x1="15" y1="15" x2="25" y2="25" stroke="url(#logoGradient)" strokeWidth="1.5" />
            <line x1="15" y1="15" x2="25" y2="10" stroke="url(#logoGradient)" strokeWidth="1.5" />
            <line x1="25" y1="25" x2="10" y2="25" stroke="url(#logoGradient)" strokeWidth="1.5" />
          </g>
        </svg>
        <div className="absolute inset-0 rounded-full bg-cyan-500 animate-logo-pulse opacity-20"></div>
      </div>
      <span className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        hello, friend
      </span>
    </div>
  );
  // ---------------------------------
  // Render
  // ---------------------------------
  return (
    <div
      className={`h-screen flex flex-col ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      } transition-colors duration-300`}
    >
      {/* Header */}
      <header
        className={`flex items-center justify-between p-4 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <Logo /> 
        </div>

        <div className="flex items-center space-x-3">
          {/* Upload Images Button */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("images")}
              className={`flex items-center space-x-1 p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors ${
                dropdownOpen.images ? "bg-gray-200 bg-opacity-20" : ""
              }`}
              aria-expanded={dropdownOpen.images}
              aria-haspopup="true"
            >
              <ImageIcon size={18} />
              <span className="hidden sm:inline text-sm">Images</span>
            </button>

            {dropdownOpen.images && (
              <div
                className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                } z-10`}
              >
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <label
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    <input
                      ref={photoInputRef}
                      type="file"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      accept="image/*"
                    />
                    Upload Image
                  </label>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Generate Image
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Edit Image
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Image Gallery
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Upload Documents Button */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("documents")}
              className={`flex items-center space-x-1 p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors ${
                dropdownOpen.documents ? "bg-gray-200 bg-opacity-20" : ""
              }`}
              aria-expanded={dropdownOpen.documents}
              aria-haspopup="true"
            >
              <FileText size={18} />
              <span className="hidden sm:inline text-sm">Documents</span>
            </button>

            {dropdownOpen.documents && (
              <div
                className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                } z-10`}
              >
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <label
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    Upload Document
                  </label>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Analyze Document
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Summarize
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Document Library
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-300" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("profile")}
              className={`flex items-center space-x-2 p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-400 transition-colors ${
                dropdownOpen.profile ? "bg-gray-200 bg-opacity-20" : ""
              }`}
              aria-expanded={dropdownOpen.profile}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </button>
            {dropdownOpen.profile && (
              <div
                className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                } z-10`}
              >
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Profile Settings
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    Preferences
                  </a>
                  <a
                    href="#"
                    className={`block px-4 py-2 text-sm ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    role="menuitem"
                  >
                    API Keys
                  </a>
                  <a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    signOut();
  }}
  className={`block px-4 py-2 text-sm ${
    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
  }`}
  role="menuitem"
>
  Logout
</a>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Toggle Button */}
          <button
            onClick={toggleRightSidebar}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors"
            aria-label="Toggle history sidebar"
          >
            <MessageSquare
              size={20}
              className={rightSidebarOpen ? "text-cyan-400" : ""}
            />
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden transition-all duration-300">
          {/* Left Sidebar */}
          <div
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } fixed md:relative z-10 w-64 h-full transition-transform duration-300 ease-in-out ${
              darkMode ? "bg-gray-800 border-r border-gray-700" : "bg-white border-r border-gray-200"
            }`}
          >
            <div className="p-4 h-full overflow-y-auto">
              {/* Tools Section */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                  Tools
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <ImageIcon size={16} className="mr-3 text-cyan-500" />
                      <span>Image Edit</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <Code size={16} className="mr-3 text-cyan-500" />
                      <span>Code Genius</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <BrainCircuit size={16} className="mr-3 text-cyan-500" />
                      <span>Branding</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Projects Section */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                  Projects
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <Layers size={16} className="mr-3 text-indigo-500" />
                      <span>Website Revamp</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <Layers size={16} className="mr-3 text-indigo-500" />
                      <span>Marketing Campaign</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <Layers size={16} className="mr-3 text-indigo-500" />
                      <span>App Prototype</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Recent Chats Section */}
              <div>
                <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                  Recent Talks
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3"></span>
                      <span>Design System Setup</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3"></span>
                      <span>Content Strategy</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`flex items-center p-2 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3"></span>
                      <span>Tech Stack Discussion</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg, i) => {
                const isAI = msg.role === "assistant";
                const isLast = i === messages.length - 1;
                const isLatestAIMessage = isAI && isLast;

                return (
                  <div key={msg.id || i} className="flex justify-center">
                    <div className="w-full max-w-3xl">
                      <FormattedMessage
                        content={msg.content}
                        isUser={msg.role === "user"}
                        imageUrl={msg.imageUrl}
                        imageAlt={msg.imageAlt}
                        onImageClick={(url) => {
                          setSelectedImage({ url, alt: msg.imageAlt || "Image" });
                        }}
                        glassStyle={darkMode ? "bg-gray-800" : "bg-white"}
                        messageStyle={getMessageStyle(msg.role === "user")}
                        isLatestAIMessage={isLatestAIMessage}
                      />
                    </div>
                  </div>
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
                <div className="flex justify-center">
                  <div
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl mt-2 max-w-3xl w-full ${
                      darkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <p className="text-sm opacity-80">
                      Generating image (please wait)...
                    </p>
                    <div className="progress-bar-container">
                      <div className="progress-bar" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          className={`${
            rightSidebarOpen ? "translate-x-0" : "translate-x-full"
          } fixed right-0 md:relative z-10 w-64 h-full transition-transform duration-300 ease-in-out ${
            darkMode
              ? "bg-gray-800 border-l border-gray-700"
              : "bg-white border-l border-gray-200"
          }`}
        >
          <div className="p-4 h-full overflow-y-auto">
            {/* Recent Conversations Section */}
            <div>
              <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                Recent Threads
              </h3>
              <ul className="space-y-1">
                <li>
                  <a
                    href="#"
                    className={`flex items-center p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-3"></span>
                    <span>Active Research Thread</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`flex items-center p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3"></span>
                    <span>Creative Writing Session</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`flex items-center p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></span>
                    <span>Code Debugging Help</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`flex items-center p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-3"></span>
                    <span>Image Generation Ideas</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`flex items-center p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                    <span>Meeting Notes</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Thread Stats Section */}
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                Thread Stats
              </h3>
              <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs">Current Thread</span>
                  <span className="text-xs font-semibold">12 messages</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs">Images</span>
                  <span className="text-xs font-semibold">3 created</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Files</span>
                  <span className="text-xs font-semibold">2 uploaded</span>
                </div>
              </div>
            </div>

            {/* Context Controls */}
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wider mb-3 text-gray-500">
                Context Controls
              </h3>
              <div className="space-y-2">
                <button
                  className={`w-full text-left p-2 rounded-lg text-sm ${
                    darkMode ? "hover:bg-gray-700 bg-gray-700/50" : "hover:bg-gray-100 bg-gray-100/50"
                  }`}
                >
                  Save Current Thread
                </button>
                <button
                  className={`w-full text-left p-2 rounded-lg text-sm ${
                    darkMode ? "hover:bg-gray-700 bg-gray-700/50" : "hover:bg-gray-100 bg-gray-100/50"
                  }`}
                >
                  Copy Thread Summary
                </button>
                <button
                  className={`w-full text-left p-2 rounded-lg text-sm ${
                    darkMode ? "hover:bg-gray-700 bg-gray-700/50" : "hover:bg-gray-100 bg-gray-100/50"
                  }`}
                >
                  Clear Context
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div
        className={`p-4 border-t ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          {/* Voice Input Button */}
          <button
            type="button"
            className={`p-2 rounded-full ${
              isListening ? "bg-blue-500/30 text-blue-300" : ""
            } hover:bg-opacity-10 hover:bg-gray-400 transition-colors text-cyan-500`}
            onClick={handleSpeechToText}
            disabled={isListening}
            aria-label="Voice input"
          >
            <Mic size={20} />
          </button>

          <div className="flex-1 relative">
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
              className={`w-full p-3 pr-10 rounded-full border focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              } custom-scrollbar`}
              placeholder=""
              rows={1}
              aria-label="Message Input"
            />
            {!hasFocused && message === "" && (
              <div className="absolute inset-0 flex items-center pointer-events-none px-4 py-2 opacity-70">
                <span className="block md:hidden text-sm truncate">
                  Ask anything...
                </span>
                <span className="hidden md:block truncate">
                  Ask me anything, I can even create art!
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-opacity"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>

          {isLoading && abortController && (
            <button
              className="p-2 ml-2 rounded-xl hover:bg-opacity-10 hover:bg-gray-400 transition-colors"
              onClick={() => abortController.abort()}
              aria-label="Stop current request"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div
          className={`p-4 mt-4 rounded-xl ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } mx-4 mb-4`}
        >
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
                    className="p-1 rounded-lg hover:bg-opacity-10 hover:bg-gray-400 transition-colors"
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
          isDarkMode={darkMode}
          onClose={() => {
            setShowVoiceInterface(false);
            setIsListening(false);
            setIsSpeaking(false);
          }}
          onStart={handleSpeechToText}
          onStop={() => setIsListening(false)}
          glassStyle={`${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}
          messageStyle={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
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
          glassStyle={`${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}
        />
      )}

      {/* Progress bar styles */}
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
          background-color: #06b6d4;
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
    </div>
  );
}
