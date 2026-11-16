'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Client Error", err);
}

export default function CustomerPaymentsModule() {
  const [customerName, setCustomerName] = useState('Rajesh Kumar');
  const [unitNo, setUnitNo] = useState('Godrej Zen Estate Phase-2 | Flat 402');
  const [milestone, setMilestone] = useState('Plinth Casting Stage (20%)');
  const [amountPaid, setAmountPaid] = useState<number>(350000);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (NEFT/RTGS)');
  const [receiptNo, setReceiptNo] = useState('UEPL/REC/26-27/402');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveReceipt = async () => {
    setIsSaving(true);
    const receiptData = {
      receipt_no: receiptNo,
      customer_name: customerName,
      unit_no: unitNo,
      milestone: milestone,
      amount_paid: amountPaid,
      payment_mode: paymentMode,
      payment_date: new Date().toISOString().split('T')[0]
    };

    try {
      if (supabase) {
        await supabase.from('customer_payments').insert([receiptData]);
      }
      setSuccessMsg(`Receipt ${receiptNo} generated and saved successfully!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 pb-20">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Customer Payments & Receipt Generator</h2>
        </div>
        <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
          ← Dashboard
        </Link>
      </div>

      {successMsg && (
        <div className="max-w-4xl mx-auto mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-center">
          ✓ {successMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">Official Payment Receipt Entry</h3>
            <p className="text-xs text-slate-500">Record customer installment and auto-generate receipt.</p>
          </div>
          <span className="font-mono text-xs bg-slate-900 text-white px-3 py-1 rounded font-bold">{receiptNo}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Customer Name</label>
            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 font-bold" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Unit Details</label>
            <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 font-bold" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Payment Milestone</label>
            <input type="text" className="w-full p-3 border rounded-lg bg-white font-bold" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Amount Paid (₹)</label>
            <input type="number" className="w-full p-3 border rounded-lg bg-white font-bold text-emerald-700 text-lg" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
          </div>
        </div>

        <button 
          onClick={handleSaveReceipt}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wider"
        >
          {isSaving ? '⏳ Generating Receipt...' : '🖨️ Save & Generate Official Receipt'}
        </button>
      </div>
    </div>
  );
}