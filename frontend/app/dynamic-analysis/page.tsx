'use client';
// Dynamic Analysis has been consolidated into Dynamic Testing (the recon pipeline).
// This route now redirects to /recon to keep old links working.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DynamicAnalysisRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/recon');
  }, [router]);
  return null;
}
