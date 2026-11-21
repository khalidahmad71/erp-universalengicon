'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function EnterpriseLoginModule() {
  const [email, setEmail] = useState('md@universalengicon.com');
  const [password, setPassword] = useState('Universal@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!supabase) throw new Error('Database connection missing');

      const { data: userRecord, error } = await supabase
        .from('enterprise_users')
        .select('*')
        .eq('user_email', email.trim().toLowerCase())
        .single();

      if (error || !userRecord) {
        setErrorMsg('User not found. Contact MD / Admin to create your department account.');
        setIsLoading(false);
        return;
      }

      if (!userRecord.is_active) {
        setErrorMsg('Your account is currently disabled. Contact Management.');
        setIsLoading(false);
        return;
      }

      if (userRecord.password_hash !== password) {
        setErrorMsg('Invalid password. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Set clean enterprise session cookies with exact Department & Role
      document.cookie = 'sb-access-token=; path=/; max-age=0';
      document.cookie = `ue_session=${encodeURIComponent(userRecord.user_email)}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `ue_role=${encodeURIComponent(userRecord.role_designation)}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `ue_dept=${encodeURIComponent(userRecord.department || '')}; path=/; max-age=86400; SameSite=Lax`;

      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
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
            Department-Based Role Access • Patna &amp; Kolkata Sites
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Department / Corporate Email
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wider text-sm mt-2 cursor-pointer"
          >
            {isLoading ? 'Verifying Department Access...' : '🔒 Secure Login to ERP'}
          </button>
        </form>
      </div>
    </div>
  );
}