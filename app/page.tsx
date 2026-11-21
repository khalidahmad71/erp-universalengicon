'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const hasSession = document.cookie.includes('ue_session=');
    if (hasSession) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-lg bg-blue-800 text-white font-black text-xl flex items-center justify-center mx-auto mb-3">
          UE
        </div>
        <h1 className="text-base font-extrabold text-slate-900">UNIVERSAL ENGICON PVT. LTD.</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">Opening Enterprise ERP...</p>
      </div>
    </div>
  );
}