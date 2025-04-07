// src/app/layout.tsx
import { GeistSans } from '@vercel/geist/font/sans';
import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { authOptions } from '../../lib/authOptions';

export const metadata: Metadata = {
  title: 'Hello, Friend',
  description: 'Your second consciousness—chat, remember, disrupt.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-gray-1000 dark:bg-gray-1100 text-white">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}