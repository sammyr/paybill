'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftTempPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/angebote');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div>Weiterleitung...</div>
    </div>
  );
}
