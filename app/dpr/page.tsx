"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, IndianRupee, Users, ArrowRight, LayoutDashboard, LogOut, Calculator, ClipboardList } from "lucide-react";
import { supabase } from "@/utils/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>("");
  const [loading, setLoading] = useState(true);

  // Dynamic Data States
  const [activeProjects, setActiveProjects] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [todayLabour, setTodayLabour] = useState(0);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      // 1. Auth Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email || "Admin");

      // 2. Fetch Live Dashboard Stats
      await fetchDashboardStats();
      setLoading(false);
    };

    checkUserAndFetchData();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      // BOQ Data for Projects & Budget Value
      const { data: boqData } = await supabase.from("boq").select("project_name, amount");
      if (boqData) {
        const uniqueProjects = new Set(boqData.map(b => b.project_name)).size;
        setActiveProjects(uniqueProjects);
        
        const valueSum = boqData.reduce((sum, item) => sum + (item.amount || 0), 0);
        setTotalValue(valueSum);
      }

      // DPR Data for Today's Labour count
      const today = new Date().toISOString().split('T')[0];
      const { data: dprData } = await supabase.from("dpr").select("labour_count").eq("report_date", today);
      if (dprData) {
        const labourSum = dprData.reduce((sum, item) => sum + (item.labour_count || 0), 0);
        setTodayLabour(labourSum);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Loading Live Dashboard...</p>
        </div>
      </div>
    );
  }

  // Format currency in Crores for display
  const valueInCr = (totalValue / 10000000).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide uppercase">Universal Engicon</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wider">Enterprise ERP</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-400 hidden sm:block">
              {userEmail}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-slate-500 mt-1">Live summary of your estimates and site progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Projects</p>
                <h3 className="text-4xl font-black text-slate-800">{activeProjects}</h3>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                <Briefcase size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Estimated Budget</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">₹ {valueInCr} Cr</h3>
                <p className="text-xs text-emerald-600 font-semibold mt-1">₹ {totalValue.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                <IndianRupee size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Labour</p>
                <h3 className="text-4xl font-black text-slate-800">{todayLabour}</h3>
              </div>
              <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                <Users size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Quick Access Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BOQ Shortcut */}
            <Link href="/boq" className="group block bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center text-white">
                <div>
                  <h4 className="text-xl font-bold mb-1 flex items-center gap-2"><Calculator size={20}/> BOQ Estimates</h4>
                  <p className="text-teal-100 text-sm">Add project materials & calculate budgets</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white group-hover:text-teal-600 transition-colors">
                  <ArrowRight size={24} />
                </div>
              </div>
            </Link>

            {/* DPR Shortcut */}
            <Link href="/dpr" className="group block bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center text-white">
                <div>
                  <h4 className="text-xl font-bold mb-1 flex items-center gap-2"><ClipboardList size={20}/> DPR Module</h4>
                  <p className="text-orange-100 text-sm">Track daily site progress & labour</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white group-hover:text-red-500 transition-colors">
                  <ArrowRight size={24} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}