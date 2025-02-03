'use client';

import { useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';

export function useAuthPersistence() {
  const { instance, inProgress, accounts } = useMsal();

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      // Get current account if exists
      const currentAccount = instance.getActiveAccount();

      if (!currentAccount && accounts.length > 0) {
        // Set the first account as active if there's no active account
        instance.setActiveAccount(accounts[0]);
      }
    }
  }, [instance, inProgress, accounts]);

  // Get active account or first available account
  const getActiveAccount = useCallback((): AccountInfo | null => {
    const activeAccount = instance.getActiveAccount() || accounts[0] || null;
    return activeAccount;
  }, [instance, accounts]);

  // Handle session expiry and token refresh
  useEffect(() => {
    const handleTokenRefresh = async () => {
      const account = getActiveAccount();
      if (account) {
        try {
          // Attempt to silently acquire token
          await instance.acquireTokenSilent({
            account,
            scopes: ['User.Read']
          });
          
          // Set auth session cookie
          document.cookie = `authSession=${account.homeAccountId};path=/;max-age=86400`;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Redirect to login if refresh fails
          window.location.href = '/login';
        }
      }
    };

    // Set up periodic token refresh (every 45 minutes)
    const refreshInterval = setInterval(handleTokenRefresh, 45 * 60 * 1000);

    // Initial token acquisition
    handleTokenRefresh();

    return () => clearInterval(refreshInterval);
  }, [instance, getActiveAccount]); // Added getActiveAccount to dependencies

  return {
    account: getActiveAccount(),
    isAuthenticated: !!getActiveAccount(),
  };
}