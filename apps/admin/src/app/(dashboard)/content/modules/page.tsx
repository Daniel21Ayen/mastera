'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModulesRedirect(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/content/materials/modules');
  }, [router]);

  return null;
}
