'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

const initialVouchers = [
  { id: 1, voucher_no: 'PC/26-27/001', expense_category: 'Hardware & Consumables', description: 'Emergency purchase of Teflon tape and PVC fittings for plumbing line', amount: 1450, paid_to: 'Gupta Hardware Store', approved_by: 'Er. Rakesh Ranjan', expense_date: '2026-11-15' },
  { id: 2, voucher_no: 'PC/26-27/002', expense_category: 'Site Refreshment & Food', description: 'Working lunch for visiting structural consultant team', amount: 2800, paid_to: 'Pista House Patna Delivery', approved_by: 'Managing Director', expense_date: '2026-11-14' },
  { id: 3, voucher_no: 'PC/26-27/003', expense_category: 'Emergency Transport', description: 'Auto freight charges for urgent delivery of core cutter machine parts', amount: 650, paid_to: 'Auto Union Stand', approved_by: 'Er. Rakesh Ranjan', expense_date: '2026-11-13' }
];

export default function PettyCashModule() {
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [voucherNo, setVoucherNo] = useState('PC/26-27/004');
  const [category, setCategory] = useState('Stationery & Print');
  const [desc, setDesc] = useState('Printing of site DPR sheets and drawing blueprints (A3 size)');
  const [amount, setAmount] = useState<number>(1200);
  const [paidTo, setPaidTo] = useState('Modern Xerox & Print');
  const [approvedBy, setApprovedBy] = useState('Er. Rakesh Ranjan');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newEntry = {
      id: vouchers.length + 1,
      voucher_no: voucherNo,
      expense_category: category,
      description: desc,
      amount: amount,
      paid_to: paidTo,
      approved_by: approvedBy,
      expense_date: expDate
    };

    try {
      if (supabase) {
        await supabase.from('site_petty_cash').insert([newEntry]);
      }
      setVouchers([newEntry, ...vouchers]);
      setSuccessMsg('Petty cash voucher recorded successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalPettyCash = vouchers.reduce((acc, v) => acc + v.amount, 0);

  return (
    <div className="p-8 pb-20">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Petty Cash & Site Expense Management</h2>
        </div>
        <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
          ← Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-center">
          ✓ {successMsg}
        </div>
      )}

      {/* Summary Stat Card */}
      <div className="max-w-6xl mx-auto bg-amber-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">Site Cash Outflow</span>
          <h3 className="text-2xl font-black mt-1">Total Petty Cash Disbursed</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-amber-300 uppercase font-bold">Cumulative Expenses</p>
          <p className="text-2xl font-black text-amber-200">₹ {totalPettyCash.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Form & Table Container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Voucher Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-fit">
          <h3 className="text-lg font-black text-slate-900 mb-4 pb-2 border-b">Record Petty Cash Voucher</h3>
          <form onSubmit={handleAddVoucher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Voucher No.</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expense Category</label>
              <select className="w-full p-3 border rounded-lg font-bold bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Hardware & Consumables">Hardware & Consumables</option>
                <option value="Site Refreshment & Food">Site Refreshment & Food</option>
                <option value="Emergency Transport">Emergency Transport</option>
                <option value="Stationery & Print">Stationery & Print</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expense Description</label>
              <textarea className="w-full p-3 border rounded-lg font-medium text-xs bg-slate-50 h-20" value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount (₹)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold text-amber-700" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expense Date</label>
                <input type="date" className="w-full p-3 border rounded-lg font-bold text-xs" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Paid To (Beneficiary)</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Approved By</label>
              <input type="text" className="w-full p-3 border rounded-lg font-bold bg-slate-50" value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} required />
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow transition uppercase tracking-wider text-sm">
              {isSaving ? 'Saving...' : '💵 Record Petty Cash Entry'}
            </button>
          </form>
        </div>

        {/* Master Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm uppercase tracking-wider">
            Godrej Zen Estate Phase-2 — Petty Cash Vouchers Register
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="py-3 px-4">Voucher & Category</th>
                <th className="py-3 px-4">Description & Beneficiary</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 block">{v.voucher_no}</span>
                    <span className="text-[11px] text-amber-700 font-semibold">{v.expense_category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs text-slate-800 font-medium">{v.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Paid to: <strong>{v.paid_to}</strong></p>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-amber-800">₹ {v.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">{v.expense_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}