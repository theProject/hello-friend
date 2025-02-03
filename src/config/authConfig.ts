import { Configuration } from '@azure/msal-browser';

// MSAL configuration for client-side
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
    loggerOptions: {
      logLevel: 3, // Error
      piiLoggingEnabled: false
    }
  }
};

// Authentication request configuration
export const loginRequest = {
  scopes: ['User.Read']
};

// Optional: Configure additional protected resource scopes
export const protectedResources = {
  graphApi: {
    endpoint: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['User.Read']
  }
  // Add other API resources as needed
};