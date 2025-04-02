'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useSafeCallbackUrl() {
  const searchParams = useSearchParams();
  const [callbackUrl, setCallbackUrl] = useState('/');

  useEffect(() => {
    const cb = searchParams.get('callbackUrl');
    if (cb) setCallbackUrl(cb);
  }, [searchParams]);

  return callbackUrl;
}
