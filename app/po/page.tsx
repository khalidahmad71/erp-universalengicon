"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvorxidiigvdznnpgxrj.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface MrRecord {
  id: string;
  mr_number?: string;
  title?: string;
  project_id?: string | null;
  project_name?: string | null;
  project_site?: string | null;
  site_name?: string | null;
  project?: string | { name?: string; title?: string } | null;
  projects?: { name?: string; title?: string; site_name?: string } | null;
  item_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  requested_by?: string | null;
  status?: string | null;
}

export interface PoRecord {
  id: string;
  po_number: string;
  mr_id: string;
  mr_number: string;
  project_name: string;
  vendor_name: string;
  item_name: string;
  quantity: number;
  rate: number;
  gst_percent: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const PO_STORAGE_KEY = "ue_purchase_orders_v1";

function extractMrProjectName(mr?: MrRecord | null): string {
  if (!mr) return "";

  if (typeof mr.project === "string" && mr.project.trim()) {
    return mr.project.trim();
  }
  if (typeof mr.project === "object" && mr.project?.name) {
    return mr.project.name.trim();
  }
  if (typeof mr.project === "object" && mr.project?.title) {
    return mr.project.title.trim();
  }

  const candidates = [
    mr.project_name,
    mr.project_site,
    mr.site_name,
    mr.projects?.name,
    mr.projects?.title,
    mr.projects?.site_name,
  ];

  const found = candidates.find(
    (val) => typeof val === "string" && val.trim().length > 0
  );
  return found ? found.trim() : "";
}

function formatINR(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
}

export default function PurchaseOrdersPage() {
  const [mrList, setMrList] = useState<MrRecord[]>([]);
  const [loadingMrs, setLoadingMrs] = useState<boolean>(true);
  const [selectedMrId, setSelectedMrId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const [vendorName, setVendorName] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [rate, setRate] = useState<string>("0");
  const [gstPercent, setGstPercent] = useState<string>("18");
  const [poList, setPoList] = useState<PoRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPoList(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(poList));
    } catch {}
  }, [poList]);

  useEffect(() => {
    let active = true;

    const loadMrs = async () => {
      setLoadingMrs(true);
      try {
        if (!supabase) {
          if (active) setLoadingMrs(false);
          return;
        }

        const { data, error } = await supabase
          .from("material_requests")
          .select("*, projects(id, name, site_name)")
          .order("created_at", { ascending: false });

        if (!active) return;

        if (!error && Array.isArray(data)) {
          setMrList(data as MrRecord[]);
        }
      } catch {
        // Ignore network errors if offline
      } finally {
        if (active) setLoadingMrs(false);
      }
    };

    loadMrs();

    return () => {
      active = false;
    };
  }, []);

  const selectedMr = useMemo(
    () => mrList.find((mr) => String(mr.id) === String(selectedMrId)) || null,
    [mrList, selectedMrId]
  );

  const handleSelectMr = (mrId: string) => {
    setSelectedMrId(mrId);
    const matched = mrList.find((mr) => String(mr.id) === String(mrId)) || null;
    const projectTitle = extractMrProjectName(matched);
    setSelectedProject(projectTitle);

    if (matched?.item_name && !itemName.trim()) {
      setItemName(String(matched.item_name));
    }
    if (matched?.quantity && Number(matched.quantity) > 0) {
      setQuantity(String(matched.quantity));
    }
  };

  const baseAmount = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const unitRate = parseFloat(rate) || 0;
    return qty * unitRate;
  }, [quantity, rate]);

  const gstAmount = useMemo(() => {
    const gst = parseFloat(gstPercent) || 0;
    return (baseAmount * gst) / 100;
  }, [baseAmount, gstPercent]);

  const totalAmount = useMemo(() => baseAmount + gstAmount, [baseAmount, gstAmount]);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");

    if (!selectedMrId) {
      setStatusMsg("Please select a Material Request (MR) first.");
      return;
    }

    const finalProject = selectedProject.trim() || extractMrProjectName(selectedMr) || "General Site";
    const qtyNum = parseFloat(quantity) || 0;
    const rateNum = parseFloat(rate) || 0;
    const gstNum = parseFloat(gstPercent) || 0;

    if (!vendorName.trim() || !itemName.trim() || qtyNum <= 0) {
      setStatusMsg("Please enter Vendor Name, Item Name, and valid Quantity.");
      return;
    }

    const newPo: PoRecord = {
      id: `PO-${Date.now()}`,
      po_number: `UE/PO/${new Date().getFullYear()}/${String(poList.length + 1).padStart(3, "0")}`,
      mr_id: selectedMrId,
      mr_number: selectedMr?.mr_number || selectedMr?.title || selectedMrId,
      project_name: finalProject,
      vendor_name: vendorName.trim(),
      item_name: itemName.trim(),
      quantity: qtyNum,
      rate: rateNum,
      gst_percent: gstNum,
      total_amount: qtyNum * rateNum + ((qtyNum * rateNum) * gstNum) / 100,
      status: "Draft",
      created_at: new Date().toISOString().split("T")[0],
    };

    setPoList((prev) => [newPo, ...prev]);
    setVendorName("");
    setItemName("");
    setRate("0");
    setStatusMsg(`PO ${newPo.po_number} created for Project: ${finalProject}`);

    if (supabase) {
      try {
        await supabase.from("purchase_orders").insert([
          {
            po_number: newPo.po_number,
            mr_id: newPo.mr_id,
            project_name: newPo.project_name,
            vendor_name: newPo.vendor_name,
            item_name: newPo.item_name,
            quantity: newPo.quantity,
            rate: newPo.rate,
            gst_percent: newPo.gst_percent,
            total_amount: newPo.total_amount,
            status: newPo.status,
          },
        ]);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-5 border-b-4 border-[#C59B27] shadow flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#E6C567] font-semibold">
              Universal Engicon Pvt. Ltd.
            </p>
            <h1 className="text-xl font-bold mt-1">Purchase Orders (PO)</h1>
            <p className="text-xs text-slate-300 mt-1">
              Select an MR to automatically display and link the indenting Project / Site.
            </p>
          </div>
          <Link
            href="/mr"
            className="px-4 py-2 rounded-xl bg-[#C59B27] text-[#0B1F3A] text-xs font-extrabold uppercase"
          >
            Open MR Module
          </Link>
        </div>

        {statusMsg && (
          <div className="bg-white border border-[#C59B27] rounded-xl px-4 py-3 text-xs font-bold text-[#0B1F3A] shadow-sm">
            {statusMsg}
          </div>
        )}

        <form
          onSubmit={handleCreatePo}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Select Material Request (MR)
              </label>
              <select
                value={selectedMrId}
                onChange={(e) => handleSelectMr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-[#0B1F3A] focus:outline-none"
              >
                <option value="">
                  {loadingMrs ? "Loading MRs..." : "-- Choose MR Indent --"}
                </option>
                {mrList.map((mr) => {
                  const mrProj = extractMrProjectName(mr);
                  return (
                    <option key={mr.id} value={mr.id}>
                      {mr.mr_number || mr.title || mr.id}
                      {mrProj ? ` — ${mrProj}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="rounded-xl border border-[#C59B27]/60 bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#E6C567]">
                  Indenting Project / Site
                </p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {selectedMrId
                    ? selectedProject || "Project not specified on this MR"
                    : "Select an MR to display Project / Site"}
                </p>
              </div>
              {selectedMrId && (
                <span className="px-2.5 py-1 rounded-lg bg-[#C59B27] text-[#0B1F3A] text-[11px] font-extrabold shrink-0">
                  Auto-Linked
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Supplier / Vendor"
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Material / Item
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Cement / Steel / Aggregate"
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rate (₹) &amp; GST (%)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Rate"
                  className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-2.5 py-2.5 text-sm font-semibold"
                />
                <input
                  type="number"
                  step="any"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  placeholder="GST %"
                  className="w-full rounded-xl border border-slate-300 bg-[#FAF9F6] px-2.5 py-2.5 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-sm font-extrabold text-[#0B1F3A]">
              Total PO Value: {formatINR(totalAmount)}
            </p>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-[#E6C567] text-xs font-extrabold uppercase tracking-wide"
            >
              Save Purchase Order
            </button>
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-extrabold text-[#0B1F3A]">Created Purchase Orders</h2>
          {poList.length === 0 ? (
            <p className="text-xs text-slate-500">No purchase orders created yet.</p>
          ) : (
            <div className="space-y-2.5">
              {poList.map((po) => (
                <div
                  key={po.id}
                  className="rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#FAF9F6]"
                >
                  <div>
                    <p className="text-xs font-extrabold text-[#0B1F3A]">
                      {po.po_number} • MR: {po.mr_number}
                    </p>
                    <p className="text-xs font-bold text-[#C59B27] mt-0.5">
                      Project / Site: {po.project_name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {po.item_name} — {po.quantity} × {formatINR(po.rate)} (+{po.gst_percent}% GST)
                      • {po.vendor_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      {formatINR(po.total_amount)}
                    </p>
                    <p className="text-[11px] text-slate-500">{po.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}