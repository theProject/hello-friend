'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { Loader } from 'lucide-react';

const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read']
};

export default function LoginPage() {
  const { instance } = useMsal();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!instance) return;

    const handleLogin = async () => {
      // Prevent duplicate processing.
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          // Account exists (likely from a redirect response)
          try {
            // Attempt to acquire token silently.
            await instance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0]
            });
            console.log('Silent token acquisition succeeded. Redirecting to home.');
            router.push('/');
            return;
          } catch (error) {
            // Only if interaction is required do we fall back to loginRedirect.
            if (!(error instanceof InteractionRequiredAuthError)) {
              throw error;
            }
            console.warn('Silent token acquisition failed due to interaction required. Initiating interactive login.');
          }
        } else {
          console.log('No accounts found. Initiating interactive login.');
        }

        // If no account is available or silent token failed, trigger interactive login.
        await instance.loginRedirect({
          scopes: loginRequest.scopes,
          prompt: 'select_account'
        });
      } catch (error) {
        console.error('Login error:', error);
        setError('Failed to initialize login. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleLogin();
  }, [instance, router, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600 dark:text-gray-300">
            {error || 'Setting up secure connection...'}
          </p>
          {error && (
            <button
              onClick={() => {
                setError(null);
                setIsProcessing(false);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
