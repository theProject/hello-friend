'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  PublicClientApplication,
  Configuration,
  BrowserCacheLocation,
  EventType,
  AuthenticationResult,
  LogLevel
} from '@azure/msal-browser';
import { MsalProvider as DefaultMsalProvider } from '@azure/msal-react';
import { useRouter } from 'next/navigation';

// Global instance to avoid duplicate initialization
let msalInstance: PublicClientApplication | null = null;

export default function MsalProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [instance, setInstance] = useState<PublicClientApplication | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeMsal = async () => {
      // If already initialized, use the existing instance
      if (msalInstance) {
        console.log('MSAL instance already exists. Using existing instance.');
        setInstance(msalInstance);
        setIsInitialized(true);
        return;
      }

      console.log('Creating new MSAL instance');
      const msalConfig: Configuration = {
        auth: {
          clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
          authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
          // Change the redirect URI to point to the login page:
          redirectUri: window.location.origin + '/login',
          postLogoutRedirectUri: window.location.origin,
          navigateToLoginRequestUrl: true
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          storeAuthStateInCookie: false
        },
        system: {
          loggerOptions: {
            loggerCallback: (level: LogLevel, message: string) => {
              switch (level) {
                case LogLevel.Error:
                  console.error('MSAL:', message);
                  break;
                case LogLevel.Info:
                  console.info('MSAL:', message);
                  break;
                case LogLevel.Verbose:
                  console.debug('MSAL:', message);
                  break;
                case LogLevel.Warning:
                  console.warn('MSAL:', message);
                  break;
              }
            },
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: false
          }
        }
      };

      console.log('MSAL Config:', {
        ...msalConfig,
        auth: {
          ...msalConfig.auth,
          clientId: msalConfig.auth.clientId ? '(set)' : '(not set)',
          redirectUri: msalConfig.auth.redirectUri,
          authority: msalConfig.auth.authority
        }
      });

      msalInstance = new PublicClientApplication(msalConfig);

      try {
        await msalInstance.initialize();
        console.log('MSAL initialized successfully');

        // Process the redirect response if it exists
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          console.log('Received authentication response');
          msalInstance.setActiveAccount(response.account);

          // Redirect after processing the response.
          if (response.state) {
            console.log('Redirecting to:', response.state);
            router.push(response.state);
          } else {
            console.log('No state found, redirecting to home');
            router.push('/');
          }
        } else {
          console.log('No redirect response');
        }

        // Register an event callback if desired
        const callbackId = msalInstance.addEventCallback((event) => {
          console.log('MSAL Event:', event.eventType);
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            const result = event.payload as AuthenticationResult;
            msalInstance?.setActiveAccount(result.account);
          }
        });

        setInstance(msalInstance);
        setIsInitialized(true);
        console.log('MSAL Provider fully initialized');

        return () => {
          if (callbackId) {
            msalInstance?.removeEventCallback(callbackId);
          }
        };
      } catch (error) {
        console.error('MSAL initialization error:', error);
        setIsInitialized(true);
      }
    };

    // You can try using [] as the dependency array if router stability is an issue.
    initializeMsal();
  }, [router]);

  if (!isInitialized || !instance) {
    console.log('MSAL Provider not yet initialized');
    return null;
  }

  return (
    <DefaultMsalProvider instance={instance}>
      {children}
    </DefaultMsalProvider>
  );
}
