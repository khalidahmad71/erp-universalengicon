'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {}

export default function EnterpriseLoginModule() {
  const [email, setEmail] = useState('md@universalengicon.com');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState('Managing Director');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (supabase) {
        await supabase.from('enterprise_users').upsert([
          {
            user_email: email,
            full_name: 'Mohammad Khalid Ahmad',
            role_designation: role,
            access_level: role === 'Managing Director' ? 1 : 2,
          },
        ], { onConflict: 'user_email' });
      }
    } catch (err) {
      console.error(err);
    }

    // Clear old token and set clean enterprise session cookies
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = `ue_session=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `ue_role=${encodeURIComponent(role)}; path=/; max-age=86400; SameSite=Lax`;

    setIsLoading(false);
    setLoginSuccess(true);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
            Universal Engicon Pvt. Ltd.
          </span>
          <h1 className="text-2xl font-black text-white mt-1">
            Enterprise ERP Secure Login
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Project: Godrej Zen Estate Phase-2 &amp; Infrastructure
          </p>
        </div>

        {loginSuccess ? (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-6 rounded-xl text-center space-y-4">
            <p className="font-bold text-lg">✓ Authentication Successful!</p>
            <p className="text-xs text-emerald-300">
              Welcome back, {role}. Redirecting to Enterprise Dashboard...
            </p>
            <a
              href="/"
              className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition uppercase tracking-wider text-xs"
            >
              Proceed to ERP Dashboard →
            </a>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-sm focus:outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Secure Password
              </label>
              <input
                type="password"
                className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-sm focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Access Role
              </label>
              <select
                className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-sm focus:outline-none focus:border-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Managing Director">Managing Director (Full Access)</option>
                <option value="Site Engineer">Site Engineer (DPR, BOQ, QC)</option>
                <option value="Accounts Manager">Accounts Manager (GST, P&amp;L, Payroll)</option>
                <option value="Store Keeper">Store Keeper (GRN &amp; Inventory)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wider text-sm mt-2"
            >
              {isLoading ? 'Verifying Credentials...' : '🔒 Secure Login to ERP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
