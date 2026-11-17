'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function EnterpriseDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 3,
    totalPortfolioValue: 675000000,
    storeItems: 5,
    pendingPOs: 12,
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      
      {/* Top Elite Corporate Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-600/30">
                Enterprise Command Center v4.2
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Real-Time Sync Active
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              UNIVERSAL ENGICON PRIVATE LIMITED
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Civil Construction, Mega Infrastructure & Real Estate Development Enterprise ERP. Overseeing Godrej Zen Estate Phase-2 and high-scale execution modules.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl text-right min-w-[220px]">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Total Asset Valuation</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              ₹67,50,00,000
            </span>
          </div>
        </div>
      </div>

      {/* Elite Key Performance Indicators (KPI) Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative group hover:border-blue-500/50 transition-all duration-300">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Mega Projects</div>
          <div className="text-3xl font-black text-white">{stats.totalProjects} Sites</div>
          <div className="mt-3 text-xs text-blue-400 font-medium">Godrej Zen Phase-2 & Urban Wings</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all duration-300">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Store Inventory Status</div>
          <div className="text-3xl font-black text-emerald-400">{stats.storeItems} Items</div>
          <div className="mt-3 text-xs text-slate-400 font-medium">Cement, TMT, Aggregates in Stock</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative group hover:border-amber-500/50 transition-all duration-300">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending PO Approvals</div>
          <div className="text-3xl font-black text-amber-400">{stats.pendingPOs} Active</div>
          <div className="mt-3 text-xs text-amber-400/80 font-medium">Awaiting MD Sign-off</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative group hover:border-indigo-500/50 transition-all duration-300">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tax & GST Compliance</div>
          <div className="text-3xl font-black text-indigo-400">100% Filed</div>
          <div className="mt-3 text-xs text-indigo-400/80 font-medium">GSTR-3B & GSTR-1 Synchronized</div>
        </div>
      </div>

      {/* Core Operational Modules Section */}
      <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Executive Operational Modules
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link href="/purchase-orders" className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 p-6 rounded-2xl shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
            PO
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Purchase Orders (PO)</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Smart vendor contracting, auto PR matching, item specs and automated GST calculations.</p>
        </Link>

        <Link href="/dpr" className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 p-6 rounded-2xl shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
            DPR
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Daily Progress Report (DPR)</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Labour attendance, material daily consumption tracking, and on-site engineering milestones.</p>
        </Link>

        <Link href="/boq" className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/60 p-6 rounded-2xl shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
            BOQ
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Bill of Quantities (BOQ)</h3>
          <p className="text-slate-400 text-xs leading-relaxed">Comprehensive structural cost estimations, material rate schedules, and budgeting analysis.</p>
        </Link>

      </div>
    </div>
  )
}