'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-lg bg-blue-800 text-white font-black text-xl flex items-center justify-center mx-auto mb-3">
          UE
        </div>
        <h1 className="text-base font-extrabold text-slate-900">UNIVERSAL ENGICON PVT. LTD.</h1>
        <p className="text-xs font-medium text-slate-500 mt-1">Redirecting to Enterprise ERP Login...</p>
      </div>
    </div>
  );
}