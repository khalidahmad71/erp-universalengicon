'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ExecutiveAnalyticsModule() {
  // Master Aggregated KPIs for Universal Engicon Pvt. Ltd. (Godrej Zen Estate Phase-2)
  const [metrics] = useState({
    totalProjectBudget: 245000000,
    totalSalesRealization: 168000000,
    totalVendorPayables: 930000,
    totalMonthlyPayroll: 157000,
    activeUnitsBooked: 24,
    totalUnitsInventory: 48,
    activeMachineryCount: 4,
    openSafetyIncidents: 0
  });

  const realizationPercentage = Math.round((metrics.totalSalesRealization / metrics.totalProjectBudget) * 100);

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Executive Management Analytics & Master KPI Dashboard</h2>
        </div>
        <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
          ← Dashboard
        </Link>
      </div>

      {/* Main Project Banner */}
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-8 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
          <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Flagship Enterprise Project</span>
          <h1 className="text-3xl font-black mt-2">Godrej Zen Estate Phase-2, Kolkata</h1>
          <p className="text-sm text-slate-300 mt-1">Managed under the direct leadership of Managing Director — Universal Engicon Pvt. Ltd.</p>
        </div>
        <div className="mt-6 md:mt-0 text-right bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <p className="text-xs text-slate-400 uppercase font-bold">Overall Project Realization</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{realizationPercentage}% Completed</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Budget Outlay</p>
          <p className="text-2xl font-black text-slate-900 mt-2">₹ {(metrics.totalProjectBudget / 10000000).toFixed(2)} Cr</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Approved BOQ Allocation</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Sales Realization</p>
          <p className="text-2xl font-black text-emerald-700 mt-2">₹ {(metrics.totalSalesRealization / 10000000).toFixed(2)} Cr</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Collected via Unit Bookings</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Accounts Payable</p>
          <p className="text-2xl font-black text-rose-700 mt-2">₹ {metrics.totalVendorPayables.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Active Vendor Dues</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase">Monthly Payroll Outflow</p>
          <p className="text-2xl font-black text-teal-700 mt-2">₹ {metrics.totalMonthlyPayroll.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-teal-600 font-semibold mt-1">Staff & Supervisor Salaries</p>
        </div>

      </div>

      {/* Operational Highlights Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
          Enterprise Operational Status & Module Health
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-700 border-b">
            <tr>
              <th className="py-3 px-4">Module Domain</th>
              <th className="py-3 px-4">Status / Active Record Count</th>
              <th className="py-3 px-4 text-center">Operational Health</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-slate-50">
              <td className="py-3 px-4 font-bold text-slate-900">Real Estate Sales & Unit Inventory</td>
              <td className="py-3 px-4 text-slate-700">{metrics.activeUnitsBooked} of {metrics.totalUnitsInventory} Units Booked/Sold</td>
              <td className="py-3 px-4 text-center"><span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Optimal</span></td>
            </tr>
            <tr className="border-b hover:bg-slate-50">
              <td className="py-3 px-4 font-bold text-slate-900">Plant, Machinery & Fleet (Innova & Cranes)</td>
              <td className="py-3 px-4 text-slate-700">{metrics.activeMachineryCount} Heavy Assets Registered & Insured</td>
              <td className="py-3 px-4 text-center"><span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Active</span></td>
            </tr>
            <tr className="border-b hover:bg-slate-50">
              <td className="py-3 px-4 font-bold text-slate-900">Health, Safety & Environment (HSE)</td>
              <td className="py-3 px-4 text-slate-700">{metrics.openSafetyIncidents} Critical Hazards Pending</td>
              <td className="py-3 px-4 text-center"><span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Zero Incident Goal</span></td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="py-3 px-4 font-bold text-slate-900">Tax Compliance & GST Ledger</td>
              <td className="py-3 px-4 text-slate-700">GSTR-3B & GSTR-1 Batch Filings Up-to-Date</td>
              <td className="py-3 px-4 text-center"><span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Compliant</span></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}