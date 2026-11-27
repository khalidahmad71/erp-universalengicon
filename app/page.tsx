"use client";

import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border-b-4 border-[#C59B27] shadow flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#E6C567] font-semibold">
              Universal Engicon Pvt. Ltd.
            </p>
            <h1 className="text-xl font-bold mt-1">Executive ERP Command Center</h1>
            <p className="text-xs text-slate-300 mt-1">
              Select a module below or use the sidebar menu to navigate.
            </p>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#C59B27] text-[#0B1F3A] text-xs font-extrabold uppercase tracking-wide"
          >
            MD / Staff Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Link
            href="/site-payments"
            className="bg-[#0B1F3A] text-white border-2 border-[#C59B27] rounded-xl p-4 shadow-sm hover:bg-[#143159] transition"
          >
            <p className="text-xs font-bold text-[#E6C567] uppercase">Mobile Site Entry</p>
            <p className="text-base font-extrabold text-white mt-1">Site Daily Payments</p>
            <p className="text-xs text-slate-300 mt-1">Offline labor, staff &amp; vendor payment log</p>
          </Link>

          <Link
            href="/mr"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Material Requests (MR)</p>
            <p className="text-xs text-slate-600 mt-1">Site indenting &amp; approval workflow</p>
          </Link>

          <Link
            href="/po"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Purchase Orders (PO)</p>
            <p className="text-xs text-slate-600 mt-1">Vendor procurement &amp; GST orders</p>
          </Link>

          <Link
            href="/store"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Store</p>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Store Inventory &amp; GRN</p>
            <p className="text-xs text-slate-600 mt-1">Material stock &amp; site inward</p>
          </Link>

          <Link
            href="/mb-bills"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Billing</p>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Contractor Bills &amp; MB</p>
            <p className="text-xs text-slate-600 mt-1">Measurement books &amp; RA billing</p>
          </Link>

          <Link
            href="/sales"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <p className="text-xs font-bold text-slate-500 uppercase">Real Estate</p>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Unit Matrix &amp; Sales</p>
            <p className="text-xs text-slate-600 mt-1">Bookings, receipts &amp; CLP milestones</p>
          </Link>
        </div>
      </div>
    </div>
  );
}