'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/40 rounded-xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
          <ShieldAlert className="w-9 h-9 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5" />
          Access Restricted • RBAC Guard
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Unauthorized Module Access
        </h1>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          Your current ERP session or role does not have permission to open this route under{' '}
          <span className="font-semibold text-amber-400">
            UNIVERSAL ENGICON PVT. LTD.
          </span>{' '}
          access control policies.
        </p>

        <div className="mt-6 p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400">
          <span className="text-slate-200 font-semibold">Next Step:</span>{' '}
          Sign in with an authorized role on `/login` or return to the Command Center.
        </div>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-all"
          >
            <LogIn className="w-4 h-4" />
            Select ERP Role (/login)
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}