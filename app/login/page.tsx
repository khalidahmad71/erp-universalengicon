"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase"; // Supabase client ko utils folder se import kar rahe hain

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError("Email ya password galat hai. (Ya account nahi bana hai)");
      setLoading(false);
    } else {
      router.push("/"); 
    }
  };

  const handleCreateAccount = async () => {
    if (!email || !password) {
      setError("Pehle email aur password daalein.");
      return;
    }
    setError("");
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError("Account banane mein error: " + error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-2xl p-8 border-t-4 border-blue-600">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">UNIVERSAL ENGICON</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1 tracking-widest uppercase">Enterprise ERP System</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition outline-none"
              placeholder="admin@universalengicon.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition outline-none"
              placeholder="Ek strong password banayein..."
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "LOGIN"}
            </button>
            
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={loading}
              className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold shadow-lg shadow-green-200 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "CREATE ACCOUNT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}