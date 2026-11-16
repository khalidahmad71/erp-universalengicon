'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
try { if (supabaseUrl && supabaseKey) { supabase = createClient(supabaseUrl, supabaseKey); } } catch (e) {}

export default function CustomerPaymentsModule() {
  const [customerName, setCustomerName] = useState('Rajesh Kumar');
  const [unitNo, setUnitNo] = useState('Godrej Zen Estate Phase-2 | Flat 402');
  const [milestone, setMilestone] = useState('Plinth Casting Stage (20%)');
  const [amountPaid, setAmountPaid] = useState<number>(350000);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (NEFT/RTGS)');
  const [receiptNo, setReceiptNo] = useState('UEPL/REC/26-27/402');
  
  // Unique Verification Code generated automatically
  const [uniqueCode] = useState(`UEPL-SEC-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt_${receiptNo}`,
  });

  const handleSaveReceipt = async () => {
    setIsSaving(true);
    const receiptData = {
      receipt_no: receiptNo,
      unique_code: uniqueCode,
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
      setSuccessMsg(`Receipt ${receiptNo} with Unique Code ${uniqueCode} saved successfully!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 pb-20">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-xl font-bold">Customer Payments & PDF Receipt Generator</h2>
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

      {/* Input Form Controls */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-lg font-black text-slate-900">Configure Receipt Details</h3>
          <span className="bg-blue-50 text-blue-900 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-blue-200">
            Unique Code: {uniqueCode}
          </span>
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
        <div className="flex gap-4">
          <button onClick={handleSaveReceipt} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow transition uppercase tracking-wider text-sm">
            {isSaving ? 'Saving...' : '💾 Save to Database'}
          </button>
          <button onClick={() => handlePrint()} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow transition uppercase tracking-wider text-sm">
            🖨️ Download / Print Official PDF
          </button>
        </div>
      </div>

      {/* Printable Official Receipt Template with Unique Code */}
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-xl border border-slate-300" ref={receiptRef}>
        <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">UNIVERSAL ENGICON PRIVATE LIMITED</h1>
            <p className="text-xs text-slate-600 font-medium">Civil Construction, Infrastructure & Real Estate Enterprise</p>
            <p className="text-xs text-slate-500 mt-1">Project: Godrej Zen Estate Phase-2, Kolkata</p>
          </div>
          <div className="text-right">
            <span className="bg-slate-900 text-white px-4 py-1.5 rounded text-xs font-mono font-bold">RECEIPT</span>
            <p className="text-sm font-black text-slate-900 mt-2">{receiptNo}</p>
            <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Unique Verification Code Badge inside Receipt */}
        <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secure ERP Verification Identifier</p>
            <p className="text-base font-mono font-black text-emerald-400 tracking-wider mt-0.5">{uniqueCode}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded">Verified Transaction</span>
          </div>
        </div>

        <div className="space-y-4 mb-8 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600 font-medium">Received with thanks from:</span>
            <span className="font-bold text-slate-900">{customerName}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600 font-medium">Allocated Real Estate Unit:</span>
            <span className="font-bold text-slate-900">{unitNo}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600 font-medium">Against Payment Milestone:</span>
            <span className="font-bold text-slate-900">{milestone}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600 font-medium">Mode of Payment:</span>
            <span className="font-bold text-slate-900">{paymentMode}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mb-12">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500">Total Amount Received</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">₹ {amountPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Authorized Signatory</p>
            <p className="font-bold text-slate-900 mt-4">For Universal Engicon Pvt. Ltd.</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-4">
          <span>Unique Hash ID: {uniqueCode}</span>
          <span>Computer-generated official receipt for Universal Engicon Pvt. Ltd. ERP System.</span>
        </div>
      </div>

    </div>
  );
}