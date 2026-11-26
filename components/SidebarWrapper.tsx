"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anonKey);
}

const supabase = getSupabaseClient();

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [hasSession, setHasSession] = useState<boolean>(false);

  const isStandaloneRoute =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/site-payments" ||
    pathname.startsWith("/site-payments/");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (active) setHasSession(Boolean(session));
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (isStandaloneRoute || !hasSession) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}