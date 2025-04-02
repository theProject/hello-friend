"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Brain, Clock, Heart, Share2 } from 'lucide-react';
import { signIn } from "next-auth/react";
import RandomSVGElements from "../../../components/RandomSVGElements";
import useSafeCallbackUrl from '../../../hooks/useSafeCallbackUrl';

interface FormData {
  email: string;
  heardFrom: string;
  reason: string;
  newsletter: boolean;
  notifyBeta: boolean;
}

const HelloFriendLanding: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    heardFrom: '',
    reason: '',
    newsletter: false,
    notifyBeta: false
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const callbackUrl = useSafeCallbackUrl();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'email') {
      setFormError('');
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    sendFormDataToEmail(formData);
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  const sendFormDataToEmail = (data: FormData): void => {
    console.log('Would send email with this data:', data);
  };

  const pulseAnimations = `
    @keyframes glowBluePulse {
      0% { box-shadow: 0 0 5px 1px rgba(59, 130, 246, 0.5); }
      50% { box-shadow: 0 0 15px 3px rgba(59, 130, 246, 0.8); }
      100% { box-shadow: 0 0 5px 1px rgba(59, 130, 246, 0.5); }
    }
    @keyframes glowPurplePulse {
      0% { box-shadow: 0 0 5px 1px rgba(168, 85, 247, 0.5); }
      50% { box-shadow: 0 0 15px 3px rgba(168, 85, 247, 0.8); }
      100% { box-shadow: 0 0 5px 1px rgba(168, 85, 247, 0.5); }
    }
    @keyframes glowPinkPulse {
      0% { box-shadow: 0 0 5px 1px rgba(236, 72, 153, 0.5); }
      50% { box-shadow: 0 0 15px 3px rgba(236, 72, 153, 0.8); }
      100% { box-shadow: 0 0 5px 1px rgba(236, 72, 153, 0.5); }
    }
    @keyframes glowTealPulse {
      0% { box-shadow: 0 0 5px 1px rgba(20, 184, 166, 0.5); }
      50% { box-shadow: 0 0 15px 3px rgba(20, 184, 166, 0.8); }
      100% { box-shadow: 0 0 5px 1px rgba(20, 184, 166, 0.5); }
    }
    .glow-blue-pulse {
      animation: glowBluePulse 2s infinite ease-in-out;
    }
    .glow-purple-pulse {
      animation: glowPurplePulse 2s infinite ease-in-out;
    }
    .glow-pink-pulse {
      animation: glowPinkPulse 2s infinite ease-in-out;
    }
    .glow-teal-pulse {
      animation: glowTealPulse 2s infinite ease-in-out;
    }
  `;

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden">
      <style>{pulseAnimations}</style>
      {/* Custom CSS geometric background with balanced blue and teal */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-500">
        {/* SVG geometric pattern overlay */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full opacity-30"
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0e7490" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* Main geometric shapes */}
          <polygon points="0,50 50,0 100,50 50,100" fill="url(#grad1)" />
          <polygon points="20,20 80,20 80,80 20,80" fill="url(#grad2)" opacity="0.3" />
          
          {/* More geometric lines */}
          <line x1="0" y1="50" x2="50" y2="0" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="50" y1="0" x2="100" y2="50" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="100" y1="50" x2="50" y2="100" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="50" y1="100" x2="0" y2="50" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="25" y1="25" x2="75" y2="75" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="75" y1="25" x2="25" y2="75" stroke="#0c4a6e" strokeWidth="0.2" />
          <line x1="0" y1="0" x2="100" y2="100" stroke="#0f766e" strokeWidth="0.2" opacity="0.5" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#0f766e" strokeWidth="0.2" opacity="0.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#0f766e" strokeWidth="0.2" opacity="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#0f766e" strokeWidth="0.2" opacity="0.5" />
          
          {/* Additional geometry */}
          <polygon points="25,25 75,25 75,75 25,75" fill="none" stroke="#0c4a6e" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#0c4a6e" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#0c4a6e" strokeWidth="0.2" />
          <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#0f766e" strokeWidth="0.15" />
          
          {/* Use the RandomSVGElements component to render random circles and lines after client mount */}
          <RandomSVGElements />
        </svg>
        
        {/* Particle dust effect overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{
          background: "radial-gradient(circle at center, transparent 70%, #000 100%), repeating-radial-gradient(circle at center, #fff 0, #fff 0.5px, transparent 1px, transparent 100px)"
        }}></div>
        
        {/* Enhanced lighting effects */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-cyan-300 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-teal-400 opacity-15 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/3 w-48 h-48 rounded-full bg-blue-300 opacity-20 blur-2xl"></div>
      </div>
      
      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 z-0 bg-black bg-opacity-30"></div>
      
      <div className="w-full max-w-6xl mx-auto relative z-10 pt-16 px-4 pb-8 flex flex-col min-h-screen">
        <div className="flex-grow">
          {/* Main title centered at the top with dramatic lighting */}
          <div className="text-center mb-16 relative">
            {/* Extra dramatic light effect for the title */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-cyan-400 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-24 bg-blue-500 opacity-15 blur-2xl rounded-full"></div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-lg relative">
              Hello, Friend.
            </h1>
            <p className="text-xl text-blue-200 mt-4 relative">
              AI as a friend, not a service
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature cards with hover glow effect */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black bg-opacity-50 backdrop-blur-sm p-5 rounded-xl border border-blue-500/30 shadow-lg flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:shadow-lg relative group">
                  <div className="absolute inset-0 rounded-xl border border-blue-400/80 opacity-0 group-hover:opacity-100 glow-blue-pulse"></div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 group-hover:bg-blue-500/40 transition-all">
                    <Brain size={24} className="text-blue-300 group-hover:text-blue-100" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Memory That Scales</h3>
                  <p className="text-sm text-gray-300 group-hover:text-white">A friend remembers everything, as they grow alongside you. Your daily moments, conversations, everything - preserved securely, for you and your friend. Not some advertiser.  We believe your data belongs to you, along with its value - here you capture it for yourself, complete control.</p>
                </div>
                
                <div className="bg-black bg-opacity-50 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30 shadow-lg flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:shadow-purple-500/50 hover:shadow-lg relative group">
                  <div className="absolute inset-0 rounded-xl border border-purple-400/80 opacity-0 group-hover:opacity-100 glow-purple-pulse"></div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 group-hover:bg-purple-500/40 transition-all">
                    <Clock size={24} className="text-purple-300 group-hover:text-purple-100" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">A Friend Reflects</h3>
                  <p className="text-sm text-gray-300 group-hover:text-white">Using our breakthrough Deep Reflection process, set your bedtime, and your friend performs magic. Adding more to an earlier conversation, connecting your daily insights with your past. Discover patterns and gain deeper understanding, just like a lifelong friend.</p>
                </div>
                
                <div className="bg-black bg-opacity-50 backdrop-blur-sm p-5 rounded-xl border border-pink-500/30 shadow-lg flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:shadow-pink-500/50 hover:shadow-lg relative group">
                  <div className="absolute inset-0 rounded-xl border border-pink-400/80 opacity-0 group-hover:opacity-100 glow-pink-pulse"></div>
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-3 group-hover:bg-pink-500/40 transition-all">
                    <Heart size={24} className="text-pink-300 group-hover:text-pink-100" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">A Powerful Companion</h3>
                  <p className="text-sm text-gray-300 group-hover:text-white">More than an assistant, your trusted companion. All the AI power tools you expect - sparking creativity, solving problems and creating gorgeous art and video... but the edge? Your friend knows you better than any AI cares to.</p>
                </div>
                
                <div className="bg-black bg-opacity-50 backdrop-blur-sm p-5 rounded-xl border border-teal-500/30 shadow-lg flex flex-col items-center text-center transform transition-all duration-200 hover:scale-105 hover:shadow-teal-500/50 hover:shadow-lg relative group">
                  <div className="absolute inset-0 rounded-xl border border-teal-400/80 opacity-0 group-hover:opacity-100 glow-teal-pulse"></div>
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-3 group-hover:bg-teal-500/40 transition-all">
                    <Share2 size={24} className="text-teal-300 group-hover:text-teal-100" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">New Insights</h3>
                  <p className="text-sm text-gray-300 group-hover:text-white">Wake up with clarity. Each night, your friend reflects on the day — uncovering deeper insights, missed moments, and connections to your past that bring new meaning each morning.  The power of Deep Reflection will stun you.</p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => signIn("google", { callbackUrl})}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Login to Beta with Google
                </button>
              </div>
            </div>
            
            {/* Beta Access Form with info fields - needs logic */}
            <div className="bg-black bg-opacity-60 backdrop-blur-md rounded-xl p-6 border border-blue-500/20 shadow-xl hover:shadow-blue-500/20 hover:shadow-lg transition-all duration-300">
              {!submitted ? (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-center text-white">Request Beta Access</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-blue-300 mb-1">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required
                        className={`w-full px-4 py-2 bg-gray-900/70 border ${formError ? 'border-red-600' : 'border-blue-800/50'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white`}
                        value={formData.email}
                        onChange={handleChange}
                      />
                      {formError && <p className="text-red-400 text-xs mt-1">{formError}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="heardFrom" className="block text-sm font-medium text-blue-300 mb-1">How did you hear about us?</label>
                      <input 
                        type="text" 
                        id="heardFrom" 
                        name="heardFrom" 
                        className="w-full px-4 py-2 bg-gray-900/70 border border-blue-800/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                        value={formData.heardFrom}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-blue-300 mb-1">Why are you looking forward to beta access?</label>
                      <textarea 
                        id="reason" 
                        name="reason" 
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-900/70 border border-blue-800/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                        value={formData.reason}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="newsletter" 
                          name="newsletter" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded"
                          checked={formData.newsletter}
                          onChange={handleChange}
                        />
                        <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-300">Subscribe to our newsletter</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="notifyBeta" 
                          name="notifyBeta" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded"
                          checked={formData.notifyBeta}
                          onChange={handleChange}
                        />
                        <label htmlFor="notifyBeta" className="ml-2 block text-sm text-gray-300">Notify me when out of beta</label>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-200"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-12 transform transition-all duration-500 animate-fadeIn">
                  <div className="text-cyan-400 text-6xl mb-6">✓</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Thank You, Friend.</h3>
                  <p className="text-blue-200 mb-2">We&apos;ve received your request for beta access.</p>
                  <p className="text-gray-400">We&apos;ll be in touch soon with next steps.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-blue-900/30 text-center text-sm text-gray-400">
          Hello, Friend. is designed and developed by <a href="https://bytheproject.com" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 transition-colors">theProject.</a> All Rights Reserved 2025
        </footer>
      </div>
    </div>
  );
};

export default HelloFriendLanding;
