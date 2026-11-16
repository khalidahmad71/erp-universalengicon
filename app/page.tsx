'use client';

import React from 'react';
import Link from 'next/link';

export default function ERPMainDashboard() {
  const modules = [
    { title: 'Visual Unit Inventory', desc: 'Godrej Zen Estate Phase-2 flat & shop matrix (Sold/Booked/Available)', href: '/inventory', color: 'bg-emerald-50 border-emerald-300 text-emerald-900', badge: 'Sales' },
    { title: 'Customer Payments', desc: 'Milestone installment tracking & automated receipt generator', href: '/customer-payments', color: 'bg-blue-50 border-blue-300 text-blue-900', badge: 'Billing' },
    { title: 'Deferred GST Ledger', desc: 'Customer account statements & accumulated possession GST tracking', href: '/customer-ledger', color: 'bg-indigo-50 border-indigo-300 text-indigo-900', badge: 'Tax & Compliance' },
    { title: 'Contractor MB & RA Bills', desc: 'Site measurement book (MB) entries and Running Account bills', href: '/contractor-bills', color: 'bg-amber-50 border-amber-300 text-amber-900', badge: 'Execution' },
    { title: 'Labor Muster Roll', desc: 'Daily wage attendance, worker registry, and daily payout calculation', href: '/hr', color: 'bg-teal-50 border-teal-300 text-teal-900', badge: 'HR & Payroll' },
    { title: 'Machinery & Fleet Logbook', desc: 'JCB, Generators, and Innova Hycross fuel & maintenance tracking', href: '/machinery', color: 'bg-orange-50 border-orange-300 text-orange-900', badge: 'Assets' },
    { title: 'Financial P&L Statement', desc: 'Consolidated inflows, outflows, and real-time operating profit', href: '/finance', color: 'bg-slate-50 border-slate-300 text-slate-900', badge: 'Accounts' },
    { title: 'Purchase Orders (PO)', desc: 'Material procurement, vendor orders, and steel/cement tracking', href: '/po', color: 'bg-rose-50 border-rose-300 text-rose-900', badge: 'Procurement' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon Private Limited</span>
          <h1 className="text-2xl font-black mt-1">Enterprise Resource Planning (ERP) Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Project Focus: Godrej Zen Estate Phase-2 | Infrastructure & Civil Construction</p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            System Live & Secure
          </span>
        </div>
      </div>

      {/* High-Level Quick Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Active Real Estate Units</p>
          <p className="text-3xl font-black text-slate-900 mt-1">Godrej Zen Phase-2</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Registered Workers Today</p>
          <p className="text-3xl font-black text-emerald-700 mt-1">Active (Muster Locked)</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Fleet Assets Logged</p>
          <p className="text-3xl font-black text-blue-900 mt-1">Innova & JCB Operational</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Tax & Compliance</p>
          <p className="text-3xl font-black text-indigo-700 mt-1">GSTR Batches Synced</p>
        </div>
      </div>

      {/* Modules Grid (Card-based Menu Navigation with High Contrast) */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-extrabold text-slate-600 uppercase tracking-widest mb-4">Enterprise Functional Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m, idx) => (
            <Link 
              key={idx} 
              href={m.href}
              className={`p-6 rounded-2xl border-2 shadow-sm hover:shadow-md transition flex flex-col justify-between ${m.color}`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2.5 py-1 rounded">
                    {m.badge}
                  </span>
                  <span className="text-lg font-bold">→</span>
                </div>
                <h3 className="text-lg font-black mb-2">{m.title}</h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">{m.desc}</p>
              </div>
              <div className="mt-6 pt-3 border-t border-black/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1 opacity-90">
                Open Module ↗
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}