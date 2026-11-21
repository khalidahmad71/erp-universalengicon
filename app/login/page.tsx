'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function EnterpriseLoginModule() {
  const [email, setEmail] = useState('md@universalengicon.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const triggerDepartmentResetRequest = async (userRecord: any, reasonText: string) => {
    if (!supabase) return;

    await supabase
      .from('enterprise_users')
      .update({
        reset_requested: true,
        reset_requested_at: new Date().toISOString(),
      })
      .eq('id', userRecord.id);

    await supabase.from('password_reset_requests').insert([
      {
        user_email: userRecord.user_email,
        full_name: userRecord.full_name,
        department: userRecord.department || 'General',
        role_designation: userRecord.role_designation,
        reason: reasonText,
        status: 'Pending',
      },
    ]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (!supabase) throw new Error('Database connection missing');

      const cleanEmail = email.trim().toLowerCase();
      const { data: userRecord, error } = await supabase
        .from('enterprise_users')
        .select('*')
        .eq('user_email', cleanEmail)
        .single();

      if (error || !userRecord) {
        setErrorMsg('User not found. Contact MD / Admin to create your department account.');
        setIsLoading(false);
        return;
      }

      if (!userRecord.is_active) {
        setErrorMsg(
          `Account Locked! Password reset request is already sent to ${userRecord.department} / Admin.`
        );
        setIsLoading(false);
        return;
      }

      // Check Password
      if (userRecord.password_hash !== password) {
        const nextAttempts = (userRecord.failed_attempts || 0) + 1;

        if (nextAttempts >= 3) {
          // 3rd wrong attempt -> Lock account & trigger reset request to Department
          await supabase
            .from('enterprise_users')
            .update({
              failed_attempts: nextAttempts,
              is_active: false,
              reset_requested: true,
              reset_requested_at: new Date().toISOString(),
            })
            .eq('id', userRecord.id);

          await triggerDepartmentResetRequest(
            userRecord,
            '3 Failed Login Attempts - Auto Lockout Trigger'
          );

          setErrorMsg(
            `3 wrong password attempts! Account locked & automatic password reset request sent to ${userRecord.department} Head & Admin.`
          );
        } else {
          await supabase
            .from('enterprise_users')
            .update({ failed_attempts: nextAttempts })
            .eq('id', userRecord.id);

          setErrorMsg(
            `Invalid password (Attempt ${nextAttempts} of 3). After 3 failed attempts, reset request will be sent to ${userRecord.department}.`
          );
        }

        setIsLoading(false);
        return;
      }

      // Valid Login -> Reset failed_attempts to 0
      if ((userRecord.failed_attempts || 0) > 0) {
        await supabase
          .from('enterprise_users')
          .update({ failed_attempts: 0 })
          .eq('id', userRecord.id);
      }

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

  const handleManualForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your Department / Corporate Email first.');
      return;
    }

    if (!supabase) return;
    setIsLoading(true);

    const { data: userRecord } = await supabase
      .from('enterprise_users')
      .select('*')
      .eq('user_email', cleanEmail)
      .single();

    if (!userRecord) {
      setErrorMsg('Email not found in Universal Engicon directory.');
      setIsLoading(false);
      return;
    }

    await triggerDepartmentResetRequest(
      userRecord,
      'Manual Forgot Password Request by Staff'
    );

    setIsLoading(false);
    setInfoMsg(
      `Password reset request sent to ${userRecord.department} Department & Admin. They will share your new password shortly.`
    );
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
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-semibold leading-relaxed">
            {infoMsg}
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                Secure Password
              </label>
              <button
                type="button"
                onClick={handleManualForgotPassword}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter your ERP password"
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