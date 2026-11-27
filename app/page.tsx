"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  Home,
  Wallet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Scale,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getClientErpRole } from "@/lib/erp-session";
import type { ErpRole } from "@/lib/rbac";

interface LedgerRow {
  id: string | number;
  entry_date?: string | null;
  created_at?: string | null;
  account_name?: string | null;
  ledger_name?: string | null;
  voucher_no?: string | null;
  reference_no?: string | null;
  description?: string | null;
  narration?: string | null;
  debit?: number | string | null;
  credit?: number | string | null;
  amount?: number | string | null;
  entry_type?: string | null;
  project_name?: string | null;
}

interface PoRecord {
  id: string | number;
  po_no?: string | null;
  po_number?: string | null;
  vendor_name?: string | null;
  project_name?: string | null;
  material_name?: string | null;
  item_name?: string | null;
  quantity?: number | string | null;
  rate?: number | string | null;
  total_amount?: number | string | null;
  status?: string | null;
  created_at?: string | null;
}

interface GrnRecord {
  id: string | number;
  grn_no?: string | null;
  po_no?: string | null;
  po_id?: string | number | null;
  project_name?: string | null;
  material_name?: string | null;
  item_name?: string | null;
  received_qty?: number | string | null;
  quantity?: number | string | null;
  accepted_qty?: number | string | null;
  status?: string | null;
  created_at?: string | null;
}

interface SitePaymentRecord {
  id: string | number;
  amount?: number | string | null;
  category?: string | null;
  payment_mode?: string | null;
  project_name?: string | null;
  created_at?: string | null;
}

interface ThreeWayMatchItem {
  key: string;
  poNo: string;
  grnNo: string;
  vendor: string;
  project: string;
  poQty: number;
  grnQty: number;
  poAmount: number;
  ledgerAmount: number;
  status: "MATCHED_3WAY" | "QTY_VARIANCE" | "PENDING_GRN_OR_BILL";
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(val) ? val : 0);
}

export default function HomePage() {
  const [role, setRole] = useState<ErpRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSynced, setLastSynced] = useState<string>("");
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [openMrCount, setOpenMrCount] = useState<number>(0);
  const [sitePaymentsTotal, setSitePaymentsTotal] = useState<number>(0);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [poRows, setPoRows] = useState<PoRecord[]>([]);
  const [grnRows, setGrnRows] = useState<GrnRecord[]>([]);

  const loadExecutiveData = useCallback(async () => {
    setLoading(true);
    setWarningMsg(null);
    const warnings: string[] = [];

    try {
      const [projRes, mrRes, payRes, ledRes, poRes, grnRes] = await Promise.allSettled([
        supabase.from("projects").select("*"),
        supabase.from("material_requests").select("*"),
        supabase.from("site_daily_payments").select("*"),
        supabase.from("finance_ledger").select("*").order("created_at", { ascending: false }).limit(25),
        supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(25),
        supabase.from("goods_receipt_notes").select("*").order("created_at", { ascending: false }).limit(25),
      ]);

      if (projRes.status === "fulfilled" && !projRes.value.error && Array.isArray(projRes.value.data)) {
        setProjectsCount(projRes.value.data.length);
      } else {
        warnings.push("Projects count unavailable");
      }

      if (mrRes.status === "fulfilled" && !mrRes.value.error && Array.isArray(mrRes.value.data)) {
        const pending = mrRes.value.data.filter(
          (m: Record<string, unknown>) =>
            String(m.status ?? "PENDING_APPROVAL").toUpperCase() !== "APPROVED" &&
            String(m.status ?? "").toUpperCase() !== "CLOSED"
        );
        setOpenMrCount(pending.length);
      }

      if (payRes.status === "fulfilled" && !payRes.value.error && Array.isArray(payRes.value.data)) {
        const totalPay = (payRes.value.data as SitePaymentRecord[]).reduce(
          (acc, row) => acc + toNum(row.amount),
          0
        );
        setSitePaymentsTotal(totalPay);
      }

      if (ledRes.status === "fulfilled" && !ledRes.value.error && Array.isArray(ledRes.value.data)) {
        setLedgerRows(ledRes.value.data as LedgerRow[]);
      } else {
        setLedgerRows([]);
        warnings.push("finance_ledger sync pending");
      }

      if (poRes.status === "fulfilled" && !poRes.value.error && Array.isArray(poRes.value.data)) {
        setPoRows(poRes.value.data as PoRecord[]);
      } else {
        setPoRows([]);
      }

      if (grnRes.status === "fulfilled" && !grnRes.value.error && Array.isArray(grnRes.value.data)) {
        setGrnRows(grnRes.value.data as GrnRecord[]);
      } else {
        setGrnRows([]);
      }

      if (warnings.length > 0) {
        setWarningMsg(warnings.join(" • "));
      }
      setLastSynced(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      setWarningMsg(err instanceof Error ? err.message : "Error syncing dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRole(getClientErpRole());
    loadExecutiveData();
  }, [loadExecutiveData]);

  const financeSummary = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const r of ledgerRows) {
      const d = toNum(r.debit);
      const c = toNum(r.credit);
      if (d > 0 || c > 0) {
        totalDebit += d;
        totalCredit += c;
      } else {
        const amt = toNum(r.amount);
        const type = String(r.entry_type ?? "").toUpperCase();
        if (type === "CREDIT" || type === "CR") totalCredit += amt;
        else totalDebit += amt;
      }
    }

    return {
      totalDebit,
      totalCredit,
      netPosition: totalDebit - totalCredit,
    };
  }, [ledgerRows]);

  const threeWayMatches = useMemo<ThreeWayMatchItem[]>(() => {
    return poRows.slice(0, 8).map((po, idx) => {
      const poNo = String(po.po_no ?? po.po_number ?? `PO-${po.id ?? idx + 1}`);
      const poQty = toNum(po.quantity) || 1;
      const poRate = toNum(po.rate);
      const computedPoAmt = toNum(po.total_amount) || poQty * poRate;

      const matchingGrns = grnRows.filter(
        (g) =>
          (g.po_no && String(g.po_no).trim().toLowerCase() === poNo.trim().toLowerCase()) ||
          (g.po_id !== undefined && g.po_id !== null && String(g.po_id) === String(po.id))
      );

      const grnQty = matchingGrns.reduce(
        (sum, g) => sum + (toNum(g.accepted_qty) || toNum(g.received_qty) || toNum(g.quantity)),
        0
      );

      const matchedLedgerAmt = ledgerRows
        .filter((l) => {
          const ref = String(l.voucher_no ?? l.reference_no ?? l.description ?? "").toLowerCase();
          return ref.includes(poNo.toLowerCase());
        })
        .reduce((sum, l) => sum + (toNum(l.debit) || toNum(l.credit) || toNum(l.amount)), 0);

      let status: ThreeWayMatchItem["status"] = "PENDING_GRN_OR_BILL";
      if (matchingGrns.length === 0 || matchedLedgerAmt === 0) {
        status = "PENDING_GRN_OR_BILL";
      } else if (Math.abs(poQty - grnQty) > 0.001 || Math.abs(computedPoAmt - matchedLedgerAmt) > 1) {
        status = "QTY_VARIANCE";
      } else {
        status = "MATCHED_3WAY";
      }

      return {
        key: `${poNo}-${idx}`,
        poNo,
        grnNo: matchingGrns[0]?.grn_no ? String(matchingGrns[0].grn_no) : matchingGrns.length > 0 ? `GRN-${matchingGrns[0].id}` : "Pending GRN",
        vendor: String(po.vendor_name ?? "Vendor Master"),
        project: String(po.project_name ?? "All Sites"),
        poQty,
        grnQty,
        poAmount: computedPoAmt,
        ledgerAmount: matchedLedgerAmt,
        status,
      };
    });
  }, [poRows, grnRows, ledgerRows]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Command Header */}
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border-b-4 border-[#C59B27] shadow flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#E6C567] font-semibold">
              Universal Engicon Pvt. Ltd. • Enterprise Finance &amp; Ops
            </p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">
              Executive ERP Command Center
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Active Role:{" "}
              <span className="font-bold text-[#E6C567]">
                {role ?? "Executive / Session Active"}
              </span>
              {lastSynced ? ` • Last Synced: ${lastSynced}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadExecutiveData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#143159] hover:bg-[#1c4275] text-white border border-[#C59B27]/50 text-xs font-bold uppercase tracking-wide transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E6C567] ${loading ? "animate-spin" : ""}`} />
              Sync KPIs
            </button>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-[#C59B27] hover:bg-[#d8ae37] text-[#0B1F3A] text-xs font-extrabold uppercase tracking-wide transition"
            >
              MD / Staff Sign In
            </Link>
          </div>
        </div>

        {warningMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Executive KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Active Projects / Sites</p>
            <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
              {loading ? "..." : projectsCount}
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#C59B27] mt-2"
            >
              Manage Project Master <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Open Material Requests</p>
            <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
              {loading ? "..." : openMrCount}
            </p>
            <Link
              href="/mr"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#C59B27] mt-2"
            >
              Review Indents (MR) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Site Daily Payments</p>
            <p className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
              {loading ? "..." : formatINR(sitePaymentsTotal)}
            </p>
            <Link
              href="/site-payments"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1F3A] hover:text-[#C59B27] mt-2"
            >
              Open Site Pay Log <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#0B1F3A] text-white border-2 border-[#C59B27] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-bold text-[#E6C567] uppercase">Finance Ledger Volume</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {loading ? "..." : formatINR(financeSummary.totalDebit || financeSummary.totalCredit)}
            </p>
            <p className="text-[11px] text-slate-300 mt-1.5">
              Dr: {formatINR(financeSummary.totalDebit)} • Cr: {formatINR(financeSummary.totalCredit)}
            </p>
          </div>
        </div>

        {/* Core ERP Module Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/site-payments"
            className="bg-[#0B1F3A] text-white border-2 border-[#C59B27] rounded-xl p-4 shadow-sm hover:bg-[#143159] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#E6C567] uppercase">Mobile Site Entry</p>
              <Wallet className="w-4 h-4 text-[#E6C567]" />
            </div>
            <p className="text-base font-extrabold text-white mt-1">Site Daily Payments</p>
            <p className="text-xs text-slate-300 mt-1">Labor, staff &amp; vendor payment log</p>
          </Link>

          <Link
            href="/mr"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
              <ClipboardList className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Material Requests (MR)</p>
            <p className="text-xs text-slate-600 mt-1">Site indenting &amp; approval workflow</p>
          </Link>

          <Link
            href="/po"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Procurement</p>
              <ShoppingCart className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Purchase Orders (PO)</p>
            <p className="text-xs text-slate-600 mt-1">Vendor procurement &amp; GST orders</p>
          </Link>

          <Link
            href="/store"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Store</p>
              <Warehouse className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Store Inventory &amp; GRN</p>
            <p className="text-xs text-slate-600 mt-1">Material stock &amp; site inward</p>
          </Link>

          <Link
            href="/mb-bills"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Billing</p>
              <FileSpreadsheet className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Contractor Bills &amp; MB</p>
            <p className="text-xs text-slate-600 mt-1">Measurement books &amp; RA billing</p>
          </Link>

          <Link
            href="/sales"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Real Estate</p>
              <Home className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Unit Matrix &amp; Sales</p>
            <p className="text-xs text-slate-600 mt-1">Bookings, receipts &amp; CLP milestones</p>
          </Link>

          <Link
            href="/projects"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Master Setup</p>
              <Building2 className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Projects &amp; Sites</p>
            <p className="text-xs text-slate-600 mt-1">Add &amp; link active project sites</p>
          </Link>

          <Link
            href="/finance"
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#0B1F3A] transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase">Enterprise Finance</p>
              <Scale className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <p className="text-base font-extrabold text-[#0B1F3A] mt-1">Ledger, GST &amp; Bills</p>
            <p className="text-xs text-slate-600 mt-1">Double-entry ledger &amp; invoice sync</p>
          </Link>
        </div>

        {/* 3-Way Invoice Matching Monitor (PO -> GRN -> Ledger/Bill) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C59B27]">
                Enterprise Finance Control
              </p>
              <h2 className="text-base font-extrabold text-[#0B1F3A]">
                3-Way Invoice Matching (Purchase Order → GRN → Finance Ledger)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Checks PO Qty &amp; Value against GRN Accepted Qty &amp; Ledger Posting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">PO No.</th>
                  <th className="py-2.5 px-3">GRN Ref</th>
                  <th className="py-2.5 px-3">Vendor / Project</th>
                  <th className="py-2.5 px-3 text-right">PO Qty vs GRN</th>
                  <th className="py-2.5 px-3 text-right">PO vs Ledger</th>
                  <th className="py-2.5 px-3">3-Way Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {threeWayMatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No Purchase Orders found yet. Create a PO and GRN to test 3-way invoice matching.
                    </td>
                  </tr>
                ) : (
                  threeWayMatches.map((m) => (
                    <tr key={m.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-[#0B1F3A]">{m.poNo}</td>
                      <td className="py-2.5 px-3 text-slate-700">{m.grnNo}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="font-semibold">{m.vendor}</span> • {m.project}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        {m.poQty} / {m.grnQty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        {formatINR(m.poAmount)} / {formatINR(m.ledgerAmount)}
                      </td>
                      <td className="py-2.5 px-3">
                        {m.status === "MATCHED_3WAY" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> MATCHED
                          </span>
                        ) : m.status === "QTY_VARIANCE" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                            <AlertTriangle className="w-3 h-3" /> VARIANCE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                            PENDING GRN/BILL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Finance Ledger Entries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Recent Finance Ledger Entries ({ledgerRows.length})
            </h2>
            <Link
              href="/finance"
              className="text-xs font-bold text-[#0B1F3A] hover:text-[#C59B27]"
            >
              View Full Ledger →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Voucher / Ref</th>
                  <th className="py-2.5 px-3">Account / Narration</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No ledger rows returned from `finance_ledger` yet.
                    </td>
                  </tr>
                ) : (
                  ledgerRows.slice(0, 6).map((row) => {
                    const ref = row.voucher_no || row.reference_no || `#${row.id}`;
                    const desc =
                      row.account_name ||
                      row.ledger_name ||
                      row.description ||
                      row.narration ||
                      "-";
                    const dr = toNum(row.debit);
                    const cr = toNum(row.credit);
                    const fallbackAmt = toNum(row.amount);
                    const isCr = String(row.entry_type ?? "").toUpperCase() === "CREDIT";
                    return (
                      <tr key={String(row.id)} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-[#0B1F3A]">{ref}</td>
                        <td className="py-2.5 px-3 text-slate-700">{desc}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.project_name || "-"}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {dr > 0 ? formatINR(dr) : !isCr && fallbackAmt > 0 ? formatINR(fallbackAmt) : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {cr > 0 ? formatINR(cr) : isCr && fallbackAmt > 0 ? formatINR(fallbackAmt) : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}