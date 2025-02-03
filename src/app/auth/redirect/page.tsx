// app/auth/redirect/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { Loader } from 'lucide-react';

export default function AuthRedirectPage() {
  const { instance } = useMsal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await instance.handleRedirectPromise();
        const stateData = state ? JSON.parse(atob(state)) : null;
        const redirectPath = stateData?.redirectStartPage || '/';
        router.push(redirectPath);
      } catch (error) {
        console.error('Redirect handling error:', error);
        router.push('/login');
      }
    };

    handleRedirect();
  }, [instance, router, state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="p-8 rounded-xl neumorphic-light dark:neumorphic-dark">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600 dark:text-gray-300">Processing authentication...</p>
        </div>
      </div>
    </div>
  );
}