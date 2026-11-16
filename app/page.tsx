'use client';

import React from 'react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-blue-900">Universal Engicon ERP</h1>
        <p className="text-gray-600 mt-1">Enterprise Management System | Civil Construction & Real Estate</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Purchase Order Module */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-blue-900 mb-2">📦 Purchase Orders (PO)</h2>
          <p className="text-gray-600 text-sm mb-4">Generate vendor purchase orders, auto-calculate government GST rates, and print A4 PDF invoices.</p>
          <Link href="/po" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
            Open PO Module →
          </Link>
        </div>

        {/* Customer Payments Module */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-blue-900 mb-2">🏠 Customer Payments & GST</h2>
          <p className="text-gray-600 text-sm mb-4">Track real estate flat/shop installments, calculate 1% or 5% GST, and generate official payment receipts.</p>
          <Link href="/customer-payments" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
            Open Payments Module →
          </Link>
        </div>

        {/* Inventory / Materials Module */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-blue-900 mb-2">🏗️ Materials Database</h2>
          <p className="text-gray-600 text-sm mb-4">Manage construction material master list, units (Bags, Tons, Cu.Ft), and default tax slabs.</p>
          <span className="text-xs bg-gray-100 text-gray-500 font-bold py-1 px-2 rounded">Managed via Supabase</span>
        </div>

      </div>
    </div>
  );
}