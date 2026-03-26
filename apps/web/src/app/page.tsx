'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getToken } from '@/lib/auth-storage';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? '/dashboard' : '/login');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-zinc-500">
      Loading…
    </div>
  );
}
