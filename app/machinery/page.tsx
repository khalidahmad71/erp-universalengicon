'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function FinancialAccountingModule() {
  // Simulated Financial Ledgers for Universal Engicon Pvt. Ltd.
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'Income', category: 'Real Estate Sales', desc: 'Flat 402 Booking & Agreement (Rajesh Kumar)', amount: 1350000, date: '2026-03-10' },
    { id: 2, type: 'Income', category: 'Commercial Sales', desc: 'Shop 12 Booking (Amitabh Sinha)', amount: 650000, date: '2026-02-01' },
    { id: 3, type: 'Expense', category: 'Material Purchase', desc: 'Cement & Steel PO to UltraTech & Tata Steel', amount: 850000, date: '2026-02-15' },
    { id: 4, type: 'Expense', category: 'Contractor Billing', desc: 'RA Bill #1 Paid to Maa Construction', amount: 450000, date: '2026-03-01' },
    { id: 5, type: 'Expense', category: 'Labor Wages', desc: 'Weekly Muster Roll Payout', amount: 185000, date: '2026-03-08' },
    { id: 6, type: 'Expense', category: 'Machinery & Fuel', desc: 'Diesel & Maintenance for Innova & JCB', amount: 65000, date: '2026-03-12' }
  ]);

  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 pb-20">
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Corporate Financial Accounting & Profit/Loss Statement</h2>
        </div>
        <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
          ← Dashboard
        </Link>
      </div>

      {/* P&L Executive Summary Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase">Total Gross Inflows (Revenue)</p>
          <p className="text-3xl font-black text-emerald-700 mt-1">₹ {totalIncome.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl shadow-sm border border-rose-200">
          <p className="text-xs font-bold text-rose-800 uppercase">Total Outflows (Expenses)</p>
          <p className="text-3xl font-black text-rose-700 mt-1">₹ {totalExpense.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-blue-300 uppercase">Net Operating Profit / Surplus</p>
          <p className="text-3xl font-black mt-1">₹ {netProfit.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
          Consolidated Financial Ledger & Cash Flow Statement
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-700 border-b">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tx.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-800">{tx.category}</td>
                <td className="py-3 px-4 text-slate-600">{tx.desc}</td>
                <td className={`py-3 px-4 text-right font-black ${tx.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {tx.type === 'Income' ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}