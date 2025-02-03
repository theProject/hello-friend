'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus, AccountInfo } from '@azure/msal-browser';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { instance, inProgress, accounts } = useMsal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get active account
  const getActiveAccount = useCallback((): AccountInfo | null => {
    return instance.getActiveAccount() || accounts[0] || null;
  }, [instance, accounts]);

  // Handle token refresh
  const refreshToken = useCallback(async () => {
    const account = getActiveAccount();
    if (!account) return;

    try {
      await instance.acquireTokenSilent({
        account,
        scopes: ['User.Read', 'openid', 'profile', 'email']
      });
      
      // Update auth session cookie
      document.cookie = `authSession=${account.homeAccountId};path=/;max-age=86400;secure;samesite=strict`;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, redirect to login
      router.replace('/login');
    }
  }, [instance, getActiveAccount, router]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear auth session cookie
      document.cookie = 'authSession=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Log out from MSAL
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin + '/login',
      });
      
      // Force redirect to login page
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [instance, router]);

  // Set up token refresh interval
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      // Initial token refresh
      refreshToken();

      // Set up periodic refresh (every 45 minutes)
      const refreshInterval = setInterval(refreshToken, 45 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [refreshToken, inProgress]);

  return {
    isLoading,
    isAuthenticated: !!getActiveAccount(),
    account: getActiveAccount(),
    logout: handleLogout,
    refreshToken
    
  };
}