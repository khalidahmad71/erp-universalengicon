'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Master Customer List for Ledger
const masterCustomerLedger = [
  {
    customer_id: 'UEPL-CUST-01',
    customer_name: 'Rajesh Kumar',
    mobile_number: '9876543210',
    address: 'Boring Road, Patna',
    unit_number: 'Flat No. 402, Block B',
    project_name: 'Godrej Zen Estate Phase-2',
    property_type: 'Residential (Non-Affordable - 5%)',
    total_cost: 4500000,
    transactions: [
      { date: '2026-01-15', receipt: 'UEPL/REC/26-27/1001', milestone: 'Booking Amount (10%)', basePaid: 450000, gstDue: 22500, status: 'Deferred' },
      { date: '2026-03-10', receipt: 'UEPL/REC/26-27/1042', milestone: 'Agreement Stage (20%)', basePaid: 900000, gstDue: 45000, status: 'Deferred' }
    ]
  },
  {
    customer_id: 'UEPL-CUST-02',
    customer_name: 'Amitabh Sinha',
    mobile_number: '9123456789',
    address: 'Kankerbagh, Patna',
    unit_number: 'Shop No. 12, Ground Floor',
    project_name: 'Godrej Zen Estate Phase-2',
    property_type: 'Commercial Shop / Office (5%)',
    total_cost: 6500000,
    transactions: [
      { date: '2026-02-01', receipt: 'UEPL/REC/26-27/1015', milestone: 'Booking Amount (10%)', basePaid: 650000, gstDue: 32500, status: 'Deferred' }
    ]
  }
];

export default function CustomerLedger() {
  const [selectedId, setSelectedId] = useState('UEPL-CUST-01');
  const customer = masterCustomerLedger.find(c => c.customer_id === selectedId) || masterCustomerLedger[0];

  const totalPaid = customer.transactions.reduce((acc, curr) => acc + curr.basePaid, 0);
  const balanceDue = customer.total_cost - totalPaid;
  const totalGstLiability = customer.transactions.reduce((acc, curr) => acc + curr.gstDue, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-8 pb-20">
      
      {/* CORPORATE APP BAR / HEADER */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white px-6 py-4 rounded-xl shadow-md print:hidden">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Universal Engicon ERP</span>
          <h2 className="text-lg font-bold">Customer Financial Ledger</h2>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-4 rounded border border-slate-700 transition">
            ← Dashboard
          </Link>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-5 rounded shadow transition flex items-center gap-2"
          >
            🖨️ Print Statement
          </button>
        </div>
      </div>

      {/* EXECUTIVE SELECTOR TOOLBAR */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 p-5 rounded-xl shadow-sm mb-8 print:hidden flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Active Client Account Selector
          </label>
          <p className="text-sm font-medium text-slate-700">Choose client to review agreement costs and installment history</p>
        </div>
        <div className="w-full md:w-1/2">
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900 text-base shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {masterCustomerLedger.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.customer_id} — {c.customer_name} ({c.unit_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRINTABLE CORPORATE STATEMENT SHEET */}
      <div className="bg-white w-full max-w-5xl mx-auto shadow-xl border border-slate-200 print:shadow-none print:border-none print:w-full p-10 rounded-xl text-slate-900">
        
        {/* Company Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Universal Engicon Pvt. Ltd.</h1>
          <p className="text-xs text-blue-800 font-bold tracking-widest mt-1 uppercase">Civil Construction, Infrastructure & Real Estate Division</p>
          <p className="text-xs text-slate-500 mt-0.5">Corporate HQ: Patna, Bihar, India | GSTIN: 10AAAAU1234A1Z5</p>
        </div>

        <div className="text-center mb-8">
          <span className="bg-slate-900 text-white px-6 py-1.5 text-xs font-bold tracking-widest uppercase rounded shadow-sm">
            Official Statement of Accounts & Unit Ledger
          </span>
        </div>

        {/* Client Profile Card */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-sm bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div>
            <p className="mb-2"><span className="font-bold text-slate-600">Customer ID:</span> <span className="font-mono text-slate-900 font-bold">{customer.customer_id}</span></p>
            <p className="mb-2"><span className="font-bold text-slate-600">Customer Name:</span> <span className="uppercase font-extrabold text-slate-900">{customer.customer_name}</span></p>
            <p className="mb-2"><span className="font-bold text-slate-600">Mobile Number:</span> {customer.mobile_number}</p>
            <p><span className="font-bold text-slate-600">Billing Address:</span> {customer.address}</p>
          </div>
          <div className="text-right">
            <p className="mb-2"><span className="font-bold text-slate-600">Project Name:</span> {customer.project_name}</p>
            <p className="mb-2"><span className="font-bold text-slate-600">Unit / Flat No:</span> <span className="font-bold text-slate-900">{customer.unit_number}</span></p>
            <p className="mb-2"><span className="font-bold text-slate-600">Category:</span> {customer.property_type}</p>
            <p className="text-base font-black text-blue-900 mt-3 pt-2 border-t border-slate-200">Total Unit Agreement Cost: ₹ {customer.total_cost.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-3 gap-5 mb-8 text-center">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Paid (Base)</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">₹ {totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Balance Due (Base)</p>
            <p className="text-2xl font-black text-blue-900 mt-1">₹ {balanceDue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Deferred GST Liability</p>
            <p className="text-2xl font-black text-amber-900 mt-1">₹ {totalGstLiability.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Transaction History Table */}
        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">Milestone Installment History</h3>
        <table className="w-full text-left border-collapse border border-slate-300 mb-8 text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="border border-slate-800 py-3 px-3 font-semibold">Date</th>
              <th className="border border-slate-800 py-3 px-3 font-semibold">Receipt No</th>
              <th className="border border-slate-800 py-3 px-3 font-semibold">Milestone Description</th>
              <th className="border border-slate-800 py-3 px-3 text-right font-semibold">Base Paid (₹)</th>
              <th className="border border-slate-800 py-3 px-3 text-right font-semibold">GST Deferred (₹)</th>
              <th className="border border-slate-800 py-3 px-3 text-center font-semibold">GST Status</th>
            </tr>
          </thead>
          <tbody>
            {customer.transactions.map((tx, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-slate-50">
                <td className="border border-slate-300 py-3 px-3 text-slate-600">{tx.date}</td>
                <td className="border border-slate-300 py-3 px-3 font-mono font-semibold text-slate-800">{tx.receipt}</td>
                <td className="border border-slate-300 py-3 px-3 font-bold text-slate-900">{tx.milestone}</td>
                <td className="border border-slate-300 py-3 px-3 text-right font-bold text-emerald-700">₹ {tx.basePaid.toLocaleString('en-IN')}</td>
                <td className="border border-slate-300 py-3 px-3 text-right font-semibold text-amber-800">₹ {tx.gstDue.toLocaleString('en-IN')}</td>
                <td className="border border-slate-300 py-3 px-3 text-center">
                  <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-1 rounded-full border border-amber-300">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Regulatory Note */}
        <div className="bg-slate-50 border-l-4 border-slate-900 p-4 text-xs text-slate-700 mb-12 rounded-r">
          <p className="font-bold text-slate-900 uppercase mb-1 tracking-wider">Compliance Note regarding GST Settlement:</p>
          <p>In accordance with corporate tax policies, accumulated GST liability (₹ {totalGstLiability.toLocaleString('en-IN')}) is maintained in the unit ledger and shall be invoiced & collected in full during final unit registration and possession handover.</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-16 text-sm font-bold text-slate-900 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="border-b-2 border-slate-400 w-48 mx-auto mb-2"></p>
            <p className="text-slate-700">Customer Acknowledgment</p>
          </div>
          <div className="text-center">
            <p className="border-b-2 border-slate-400 w-52 mx-auto mb-2"></p>
            <p className="text-slate-900 uppercase">Authorized Signatory</p>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Universal Engicon Pvt. Ltd.</p>
          </div>
        </div>

      </div>
    </div>
  );
}