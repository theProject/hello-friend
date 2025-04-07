// src/app/auth/signin/page.tsx
import { signIn } from 'next-auth/react';
import { Link } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-1100">
      <div className="flex items-center mb-6">
        <Link className="text-vercel-pink" size={32} />
        <h1 className="ml-2 text-3xl font-bold text-white">Hello, Friend</h1>
      </div>
      <button
        onClick={() => signIn('google', { callbackUrl: '/chat' })}
        className="px-4 py-2 bg-vercel-pink text-white rounded hover:bg-vercel-violet transition"
      >
        Sign in with Google
      </button>
    </div>
  );
}