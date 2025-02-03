'use client';

import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/config/authConfig';

export default function LoginComponent() {
  const { instance } = useMsal();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl 
                    shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
        {/* Logo/Branding Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FrostScript</h1>
          <p className="text-gray-600">AI that freezes time</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-xl
                   bg-white text-blue-600 font-medium
                   border border-gray-100
                   shadow-[5px_5px_15px_#bebebe,-5px_-5px_15px_#ffffff]
                   hover:shadow-[inset_5px_5px_15px_#bebebe,inset_-5px_-5px_15px_#ffffff]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300
                   flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-t-2 border-blue-600 border-solid rounded-full animate-spin" />
          ) : (
            <>
              <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>

        {/* Additional Info */}
        <p className="text-center mt-6 text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}