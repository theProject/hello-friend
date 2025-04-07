// src/lib/authOptions.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { UserService } from '../services/UserService';

export const allowlist = ['user1@example.com', 'user2@example.com'];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (!email || !allowlist.includes(email)) {
        console.warn(`Denied login for ${email} (not in beta allowlist)`);
        return false;
      }
      await UserService.ensureUserOnboarded(user);
      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.supabaseUserId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const supabaseId = await UserService.getUserIdByEmail(user.email!);
        token.supabaseUserId = supabaseId;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};