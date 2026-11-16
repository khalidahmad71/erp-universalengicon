import React from 'react';
import Link from 'next/link';

export default function FinanceAccounting() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <header className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">Advanced Finance & Accounting</h1>
          <p className="text-gray-500 mt-1">General Ledger, P&L, Balance Sheet & GST Compliance</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
              + New Journal Entry
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow">
              Download P&L Report
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 font-medium">Total Revenue (FY)</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">₹ 14.5 Cr</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">₹ 9.2 Cr</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-medium">Net Profit (Before Tax)</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">₹ 5.3 Cr</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <p className="text-sm text-gray-500 font-medium">Pending GST Liability</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">₹ 18.5 Lakhs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="font-bold text-lg text-gray-700 mb-4">Bank Reconciliation (HDFC Bank)</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Balance as per ERP:</span>
              <span className="font-semibold">₹ 1,42,50,000</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Balance as per Bank Statement:</span>
              <span className="font-semibold text-green-600">₹ 1,42,50,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 bg-green-100 px-2 py-1 rounded">✓ Reconciled on 15 Nov</span>
              <button className="text-blue-600 hover:underline">Upload Statement</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="font-bold text-lg text-gray-700 mb-4">Tax & Compliance</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div>
                <p className="font-semibold text-gray-800">GSTR-1</p>
                <p className="text-xs text-gray-500">Due: 11th of Next Month</p>
              </div>
              <span className="text-green-600 font-bold text-sm">Filed</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div>
                <p className="font-semibold text-gray-800">GSTR-3B</p>
                <p className="text-xs text-gray-500">Due: 20th of Next Month</p>
              </div>
              <span className="text-yellow-600 font-bold text-sm">Pending</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
              <div>
                <p className="font-semibold text-gray-800">TDS Deduction</p>
                <p className="text-xs text-gray-500">Contractor Payments</p>
              </div>
              <span className="text-blue-600 font-bold text-sm">View Ledger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}