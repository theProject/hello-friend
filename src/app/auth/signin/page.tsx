import { Suspense } from 'react';
import HelloFriendLanding from './HelloFriendLanding';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <HelloFriendLanding />
    </Suspense>
  );
}
