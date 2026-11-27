"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type PaymentCategory = "Labor" | "Staff" | "Vendor" | "Petty Cash";
type PaymentMode = "UPI" | "Cash" | "NEFT" | "Cheque";

interface SitePaymentEntry {
  client_ref: string;
  entry_date: string;
  project_site: string;
  category: PaymentCategory;
  payee_name: string;
  payment_mode: PaymentMode;
  amount: number;
  remarks: string;
  synced_to_supabase: boolean;
  erp_posted: boolean;
  created_at: string;
}

const STORAGE_KEY = "ue_site_daily_payments_v1";
const DEVICE_AUTH_KEY = "ue_site_pay_device_auth_v1";

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

const supabase = getSupabaseBrowserClient();

function formatINR(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function getTodayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
}

function checkExistingErpAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(DEVICE_AUTH_KEY) === "1") return true;
    if (document.cookie.includes("erp_role=")) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (
        key.includes("erp_role") ||
        key.includes("ue_user") ||
        key.includes("auth-token") ||
        key.includes("supabase.auth")
      ) {
        const val = localStorage.getItem(key);
        if (val && val !== "null" && val !== "undefined" && val !== "") {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

export default function SitePaymentsMobilePage() {
  const [authState, setAuthState] = useState<"checking" | "allowed" | "locked">("checking");

  const [activeTab, setActiveTab] = useState<"entry" | "log">("entry");
  const [entries, setEntries] = useState<SitePaymentEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const [entryDate, setEntryDate] = useState<string>(getTodayISO());
  const [projectSite, setProjectSite] = useState<string>("");
  const [category, setCategory] = useState<PaymentCategory>("Labor");
  const [payeeName, setPayeeName] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [amountInput, setAmountInput] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(
    null
  );
  const [filterSite, setFilterSite] = useState<string>("ALL");
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      if (checkExistingErpAuth()) {
        try {
          localStorage.setItem(DEVICE_AUTH_KEY, "1");
        } catch {}
        if (active) setAuthState("allowed");
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (data.session) {
          try {
            localStorage.setItem(DEVICE_AUTH_KEY, "1");
          } catch {}
          setAuthState("allowed");
        } else {
          setAuthState("locked");
        }
      } catch {
        if (!active) return;
        setAuthState("locked");
      }
    };

    verifyAccess();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authState !== "allowed") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch (e) {
      console.error("Failed to read local site payments:", e);
    }
    setIsLoaded(true);
  }, [authState]);

  useEffect(() => {
    if (authState !== "allowed" || !isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save local site payments:", e);
    }
  }, [entries, authState, isLoaded]);

  const handleLockDevice = async () => {
    try {
      localStorage.removeItem(DEVICE_AUTH_KEY);
      await supabase.auth.signOut();
    } catch {}
    setAuthState("locked");
  };

  const savedSites = useMemo(() => {
    const unique = Array.from(new Set(entries.map((e) => e.project_site.trim()).filter(Boolean)));
    return unique.slice(0, 8);
  }, [entries]);

  const savedPayees = useMemo(() => {
    const unique = Array.from(new Set(entries.map((e) => e.payee_name.trim()).filter(Boolean)));
    return unique.slice(0, 8);
  }, [entries]);

  const pendingSyncEntries = useMemo(
    () => entries.filter((e) => !e.synced_to_supabase),
    [entries]
  );

  const todayTotal = useMemo(() => {
    const today = getTodayISO();
    return entries
      .filter((e) => e.entry_date === today)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (filterSite === "ALL") return entries;
    return entries.filter((e) => e.project_site === filterSite);
  }, [entries, filterSite]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSite = projectSite.trim();
    const cleanPayee = payeeName.trim();
    const numericAmount = Number(amountInput.replace(/,/g, ""));

    if (!cleanSite) {
      showToast("Please enter Project / Site Name", "error");
      return;
    }
    if (!cleanPayee) {
      showToast("Please enter Labor / Staff / Vendor Name", "error");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      showToast("Please enter valid Amount (₹)", "error");
      return;
    }

    const newRecord: SitePaymentEntry = {
      client_ref: `UE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      entry_date: entryDate || getTodayISO(),
      project_site: cleanSite,
      category,
      payee_name: cleanPayee,
      payment_mode: paymentMode,
      amount: numericAmount,
      remarks: remarks.trim(),
      synced_to_supabase: false,
      erp_posted: false,
      created_at: new Date().toISOString(),
    };

    setEntries((prev) => [newRecord, ...prev]);
    setPayeeName("");
    setAmountInput("");
    setRemarks("");

    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const { error } = await supabase.from("site_daily_payments").upsert(
          {
            client_ref: newRecord.client_ref,
            entry_date: newRecord.entry_date,
            project_site: newRecord.project_site,
            category: newRecord.category,
            payee_name: newRecord.payee_name,
            payment_mode: newRecord.payment_mode,
            amount: newRecord.amount,
            remarks: newRecord.remarks || null,
            erp_posted: false,
          },
          { onConflict: "client_ref" }
        );

        if (!error) {
          setEntries((prev) =>
            prev.map((item) =>
              item.client_ref === newRecord.client_ref
                ? { ...item, synced_to_supabase: true }
                : item
            )
          );
          showToast(`Saved & Synced to ERP (${formatINR(numericAmount)})`, "success");
          return;
        }
      } catch {
        // Fallback silently to offline saved state
      }
    }

    showToast(`Saved on Phone (${formatINR(numericAmount)}) — Ready to Sync`, "info");
  };

  const handleSyncAllToERP = async () => {
    if (pendingSyncEntries.length === 0) {
      showToast("All entries are already synced to ERP!", "info");
      return;
    }

    setIsSyncing(true);
    try {
      const payload = pendingSyncEntries.map((item) => ({
        client_ref: item.client_ref,
        entry_date: item.entry_date,
        project_site: item.project_site,
        category: item.category,
        payee_name: item.payee_name,
        payment_mode: item.payment_mode,
        amount: item.amount,
        remarks: item.remarks || null,
        erp_posted: item.erp_posted,
      }));

      const { error } = await supabase
        .from("site_daily_payments")
        .upsert(payload, { onConflict: "client_ref" });

      if (error) throw error;

      const syncedRefs = new Set(pendingSyncEntries.map((i) => i.client_ref));
      setEntries((prev) =>
        prev.map((item) =>
          syncedRefs.has(item.client_ref) ? { ...item, synced_to_supabase: true } : item
        )
      );
      showToast(`${pendingSyncEntries.length} entries synced to Universal Engicon ERP!`, "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? `${err.message} — Please Sign In once if RLS blocked sync.`
          : "Sync failed. Please Sign In once and retry.";
      showToast(message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteLocal = (clientRef: string) => {
    setEntries((prev) => prev.filter((item) => item.client_ref !== clientRef));
    showToast("Entry removed from phone log", "info");
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      showToast("No entries available to export", "error");
      return;
    }
    const headers = [
      "entry_date",
      "project_site",
      "category",
      "payee_name",
      "payment_mode",
      "amount",
      "remarks",
      "sync_status",
    ];
    const rows = entries.map((r) =>
      [
        r.entry_date,
        `"${r.project_site.replace(/"/g, '""')}"`,
        r.category,
        `"${r.payee_name.replace(/"/g, '""')}"`,
        r.payment_mode,
        r.amount,
        `"${(r.remarks || "").replace(/"/g, '""')}"`,
        r.synced_to_supabase ? "SYNCED_TO_ERP" : "PENDING_SYNC",
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `UE_Site_Payments_${getTodayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center shadow-sm max-w-sm w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
            Universal Engicon Pvt. Ltd.
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-1.5">Loading Site Payments...</p>
        </div>
      </div>
    );
  }

  if (authState === "locked") {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-sm w-full space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C59B27]">
            Universal Engicon Pvt. Ltd.
          </p>
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">Sign In Required</h2>
          <p className="text-xs text-slate-600">
            Ek baar ERP mein sign in karein — uske baad is phone par dobara login nahi maangega.
          </p>
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl bg-[#0B1F3A] text-[#E6C567] text-xs font-extrabold uppercase tracking-wide"
          >
            Go to Sign In Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 pb-28">
      <header className="sticky top-0 z-30 bg-[#0B1F3A] text-white shadow-md border-b-2 border-[#C59B27]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#E6C567] font-semibold">
              Universal Engicon Pvt. Ltd.
            </p>
            <h1 className="text-base font-bold leading-tight">Site Daily Payment Log</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowInstallGuide((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-lg bg-[#C59B27] text-[#0B1F3A] text-xs font-bold shadow active:scale-95 transition"
            >
              + Home Screen
            </button>
            <button
              type="button"
              onClick={handleLockDevice}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-slate-200 text-xs font-semibold hover:bg-white/20"
            >
              Lock
            </button>
          </div>
        </div>

        {showInstallGuide && (
          <div className="bg-[#132C4E] border-t border-slate-700 px-4 py-3 text-xs text-slate-100 max-w-lg mx-auto space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#E6C567]">Mobile Home Screen Par Lagayein:</span>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="text-slate-300 underline"
              >
                Close
              </button>
            </div>
            <p>
              <strong>Android (Chrome):</strong> Top-right <strong>⋮ (3 dots)</strong> tap karein →{" "}
              <strong>&quot;Add to Home screen&quot;</strong> → <strong>Add</strong>.
            </p>
            <p>
              <strong>iPhone (Safari):</strong> Neeche <strong>Share (□↑)</strong> tap karein →{" "}
              <strong>&quot;Add to Home Screen&quot;</strong> → <strong>Add</strong>.
            </p>
          </div>
        )}

        <div className="bg-[#10294B] px-4 py-2.5 border-t border-white/10">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-300 block">Today&apos;s Total</span>
              <span className="text-sm font-extrabold text-white">{formatINR(todayTotal)}</span>
            </div>
            <button
              type="button"
              onClick={handleSyncAllToERP}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 ${
                pendingSyncEntries.length > 0
                  ? "bg-amber-400 text-[#0B1F3A] hover:bg-amber-300"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {isSyncing
                ? "Syncing..."
                : pendingSyncEntries.length > 0
                ? `Sync ${pendingSyncEntries.length} to ERP ↑`
                : "All Synced to ERP ✓"}
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-xs font-bold text-white text-center ${
              toast.type === "error"
                ? "bg-red-600"
                : toast.type === "info"
                ? "bg-[#0B1F3A] border border-[#C59B27]"
                : "bg-emerald-700"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("entry")}
            className={`py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === "entry"
                ? "bg-[#0B1F3A] text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            + New Payment Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("log")}
            className={`py-2.5 rounded-lg text-xs font-bold transition ${
              activeTab === "log"
                ? "bg-[#0B1F3A] text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Saved Log ({entries.length})
          </button>
        </div>

        {activeTab === "entry" && (
          <form
            onSubmit={handleSaveEntry}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#0B1F3A] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Project / Site Name (Manual)
              </label>
              <input
                type="text"
                placeholder="Type Project or Site Name..."
                value={projectSite}
                onChange={(e) => setProjectSite(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#0B1F3A] focus:outline-none"
                required
              />
              {savedSites.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {savedSites.map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() => setProjectSite(site)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        projectSite === site
                          ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Expense Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Labor", "Staff", "Vendor", "Petty Cash"] as PaymentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition ${
                      category === cat
                        ? "bg-[#0B1F3A] text-[#E6C567] border-[#0B1F3A] shadow-sm"
                        : "bg-[#FAF9F6] text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                {category} / Payee Name
              </label>
              <input
                type="text"
                placeholder={`Enter ${category} name...`}
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#0B1F3A] focus:outline-none"
                required
              />
              {savedPayees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {savedPayees.map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => setPayeeName(person)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                    >
                      {person}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["UPI", "Cash", "NEFT", "Cheque"] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      paymentMode === mode
                        ? "bg-[#C59B27] text-[#0B1F3A] border-[#C59B27] shadow-sm"
                        : "bg-[#FAF9F6] text-slate-700 border-slate-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full rounded-xl border-2 border-[#0B1F3A]/30 bg-[#FAF9F6] px-3.5 py-3 text-xl font-extrabold text-[#0B1F3A] focus:border-[#0B1F3A] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Work / Material Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Mason haziri, Sand unloading, Site tea..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0B1F3A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-[#E6C567] font-extrabold text-sm tracking-wide shadow-md active:scale-[0.99] transition"
            >
              SAVE PAYMENT ENTRY
            </button>
          </form>
        )}

        {activeTab === "log" && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="rounded-lg border border-slate-300 bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="ALL">All Projects ({entries.length})</option>
                {savedSites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
              >
                Export CSV
              </button>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm font-bold text-slate-700">No payments saved yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Switch to &quot;+ New Payment Entry&quot; to log daily labor, staff, or vendor
                  payments.
                </p>
              </div>
            ) : (
              filteredEntries.map((item) => (
                <div
                  key={item.client_ref}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-[#0B1F3A]/10 text-[#0B1F3A] text-[10px] font-extrabold uppercase">
                        {item.project_site}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{item.payee_name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {item.entry_date} • {item.category} • {item.payment_mode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-[#0B1F3A]">
                        {formatINR(item.amount)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.synced_to_supabase
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.synced_to_supabase ? "Synced in ERP ✓" : "Pending Sync"}
                      </span>
                    </div>
                  </div>

                  {item.remarks && (
                    <p className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      {item.remarks}
                    </p>
                  )}

                  <div className="flex justify-end pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDeleteLocal(item.client_ref)}
                      className="text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Remove Local Copy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}