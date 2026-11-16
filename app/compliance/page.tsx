"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ShieldCheck, Plus, Receipt, FileSpreadsheet, Building, X } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface Vendor {
  id: string;
  name: string;
  company_name: string;
  gst_no: string;
}

interface TaxRecord {
  id: string;
  invoice_no: string;
  vendor_name?: string;
  project_name: string;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  tds_deducted: number;
  retention_money: number;
  net_payable: number;
  filing_status: string;
  created_at: string;
}

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [invoiceNo, setInvoiceNo] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [projectName, setProjectName] = useState("Godrej Zen Estate Phase-2");
  const [taxableAmount, setTaxableAmount] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [tdsDeducted, setTdsDeducted] = useState("");
  const [retentionMoney, setRetentionMoney] = useState("");
  const [filingStatus, setFilingStatus] = useState("Pending GSTR-2B Match");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: vData } = await supabase.from("vendors").select("*").order("name");
      if (vData) setVendors(vData);

      const { data: taxData } = await supabase
        .from("tax_compliance")
        .select("*, vendors(name, company_name)")
        .order("created_at", { ascending: false });

      if (taxData) {
        setRecords(
          taxData.map((item: any) => ({
            ...item,
            vendor_name: item.vendors?.company_name || item.vendors?.name || "Direct Vendor",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const taxAmt = parseFloat(taxableAmount) || 0;
    const rate = parseFloat(gstRate) || 0;
    const gstAmt = (taxAmt * rate) / 100;
    const tds = parseFloat(tdsDeducted) || 0;
    const retention = parseFloat(retentionMoney) || 0;
    
    // Net Payable = Taxable + GST - TDS - Retention
    const netPayable = taxAmt + gstAmt - tds - retention;

    try {
      const { error } = await supabase.from("tax_compliance").insert({
        invoice_no: invoiceNo,
        vendor_id: selectedVendorId || null,
        project_name: projectName,
        taxable_amount: taxAmt,
        gst_rate: rate,
        gst_amount: gstAmt,
        tds_deducted: tds,
        retention_money: retention,
        net_payable: netPayable,
        filing_status: filingStatus,
      });

      if (error) throw error;

      alert("GST & Tax Compliance entry saved successfully!");
      setShowModal(false);
      setInvoiceNo("");
      setTaxableAmount("");
      setTdsDeducted("");
      setRetentionMoney("");
      fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-4">
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg">GST & Statutory Tax Compliance Hub</h2>
            <p className="text-[11px] text-slate-500">Universal Engicon Pvt. Ltd. | Corporate Accounts & Tax Suite</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 shrink-0 whitespace-nowrap"
          >
            <Plus size={16} /> New Tax & Invoice Entry
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {records.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No tax compliance records found. Click &quot;New Tax & Invoice Entry&quot; to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase tracking-wider">
                      <th className="p-4 font-bold">Invoice & Vendor</th>
                      <th className="p-4 font-bold">Project</th>
                      <th className="p-4 font-bold text-right">Taxable (₹)</th>
                      <th className="p-4 font-bold text-right">GST (₹)</th>
                      <th className="p-4 font-bold text-right">TDS / Retention</th>
                      <th className="p-4 font-bold text-right">Net Payable (₹)</th>
                      <th className="p-4 font-bold text-center">GSTR Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="font-black text-slate-800 block">{r.invoice_no}</span>
                          <span className="text-[11px] text-slate-500">{r.vendor_name}</span>
                        </td>
                        <td className="p-4 font-medium text-slate-700">{r.project_name}</td>
                        <td className="p-4 text-right font-bold text-slate-900">₹ {Number(r.taxable_amount).toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-blue-600">₹ {Number(r.gst_amount).toLocaleString()} ({r.gst_rate}%)</td>
                        <td className="p-4 text-right">
                          <span className="text-amber-600 block">TDS: ₹ {Number(r.tds_deducted).toLocaleString()}</span>
                          <span className="text-purple-600 text-[10px]">Ret: ₹ {Number(r.retention_money).toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600 text-sm">₹ {Number(r.net_payable).toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {r.filing_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal for New Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm">GST & Statutory Tax Entry</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-9021"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Vendor *</label>
                  <select
                    required
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.company_name || v.name} ({v.gst_no || 'No GSTIN'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Taxable Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={taxableAmount}
                    onChange={(e) => setTaxableAmount(e.target.value)}
                    placeholder="Base amount"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GST Rate (%) *</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">TDS Deducted (₹)</label>
                  <input
                    type="number"
                    value={tdsDeducted}
                    onChange={(e) => setTdsDeducted(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Retention / SD (₹)</label>
                  <input
                    type="number"
                    value={retentionMoney}
                    onChange={(e) => setRetentionMoney(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">GSTR Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="Pending GSTR-2B Match">Pending GSTR-2B Match</option>
                  <option value="Matched & ITC Claimed">Matched & ITC Claimed</option>
                  <option value="Filed & Paid">Filed & Paid</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-pink-600 text-white rounded-xl font-bold">
                  {submitting ? "Saving..." : "Save Compliance Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}