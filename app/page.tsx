"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anonKey);
}

const supabase = getSupabaseClient();

export default function HomePage() {
  const [checking, setChecking] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    const goToLogin = () => {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    };

    const verifyUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (!data.session) {
          setAuthenticated(false);
          setChecking(false);
          goToLogin();
          return;
        }

        setAuthenticated(true);
        setChecking(false);
      } catch {
        if (!active) return;
        setAuthenticated(false);
        setChecking(false);
        goToLogin();
      }
    };

    verifyUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        if (!session) {
          setAuthenticated(false);
          setChecking(false);
          goToLogin();
        } else {
          setAuthenticated(true);
          setChecking(false);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking || !authenticated) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center shadow-sm max-w-sm w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
            Universal Engicon Pvt. Ltd.
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-1.5">
            Opening Sign In...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border-b-4 border-[#C59B27] shadow">
          <p className="text-[11px] uppercase tracking-widest text-[#E6C567] font-semibold">
            Universal Engicon Pvt. Ltd.
          </p>
          <h1 className="text-xl font-bold mt-1">Enterprise ERP Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">
            Authenticated session active. Select a module to continue.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/site-payments"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-[#C59B27] uppercase">Mobile Log</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Site Daily Payments</p>
          </Link>

          <Link
            href="/mr"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Material Requests</p>
          </Link>

          <Link
            href="/po"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Purchase Orders</p>
          </Link>

          <Link
            href="/store"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Store</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Inventory &amp; GRN</p>
          </Link>

          <Link
            href="/sales"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Real Estate</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Unit Matrix &amp; Sales</p>
          </Link>

          <Link
            href="/reports"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Analytics</p>
            <p className="text-sm font-extrabold text-[#0B1F3A] mt-1">Reports &amp; Ledger</p>
          </Link>
        </div>
      </div>
    </div>
  );
}