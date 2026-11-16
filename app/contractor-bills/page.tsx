"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, FileText, CheckCircle2, Clock, DollarSign, Plus, X, UserCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface ContractorBill {
  id: string;
  contractor_name: string;
  contractor_type: string;
  nature_of_work: string;
  nature_of_job: string;
  measurement_details: string;
  bill_amount: number;
  status: string;
  created_at: string;
}

export default function ContractorBillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<ContractorBill[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [contractorName, setContractorName] = useState("");
  const [contractorType, setContractorType] = useState("Structure Contractor");
  const [natureOfWork, setNatureOfWork] = useState("");
  const [natureOfJob, setNatureOfJob] = useState("");
  const [measurementDetails, setMeasurementDetails] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from("contractor_bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setBills(data);
    } catch (error) {
      console.error("Error fetching contractor bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("contractor_bills").insert({
        contractor_name: contractorName,
        contractor_type: contractorType,
        nature_of_work: natureOfWork,
        nature_of_job: natureOfJob,
        measurement_details: measurementDetails,
        bill_amount: parseFloat(billAmount) || 0,
        status: "Pending Site Engineer"
      });

      if (error) throw error;

      alert("Contractor Bill & Measurement submitted successfully!");
      setShowModal(false);
      setContractorName("");
      setNatureOfWork("");
      setNatureOfJob("");
      setMeasurementDetails("");
      setBillAmount("");
      fetchBills();
    } catch (error: any) {
      alert("Error saving bill: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBillStatus = async (id: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from("contractor_bills")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;
      fetchBills();
    } catch (error: any) {
      alert("Failed to update status: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-semibold">Loading Contractor Bills & Measurements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </a>
            <div className="bg-pink-600 p-2 rounded-lg">
              <Building size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-wide">Contractor Billing & Measurement Book (MB)</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/20"
          >
            <Plus size={16} /> New Measurement Bill
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Subcontractor Bills & Approval Workflow</h2>
            <p className="text-slate-500 text-sm mt-1">Site Engineer Measurement → Verification → Project Manager Approval → Accounts Payment.</p>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {bills.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No contractor bills submitted yet. Click &quot;New Measurement Bill&quot; to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider">
                    <th className="p-4 font-bold">Contractor & Type</th>
                    <th className="p-4 font-bold">Nature of Work / Job</th>
                    <th className="p-4 font-bold">Measurement Details (MB)</th>
                    <th className="p-4 font-bold">Bill Amount</th>
                    <th className="p-4 font-bold">Workflow Status</th>
                    <th className="p-4 font-bold text-right">Actions / Approvals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => {
                    const statusColor = 
                      bill.status === 'Paid by Accounts' ? 'bg-emerald-100 text-emerald-800' :
                      bill.status === 'Approved by Project Manager' ? 'bg-blue-100 text-blue-800' :
                      bill.status === 'Verified by Site Engineer' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800';

                    return (
                      <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-sm">{bill.contractor_name}</p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px] mt-0.5">{bill.contractor_type}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700">{bill.nature_of_work}</p>
                          <p className="text-slate-500 text-[11px]">{bill.nature_of_job}</p>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-slate-600 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">{bill.measurement_details}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900 text-sm">
                          ₹ {bill.bill_amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${statusColor}`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {bill.status === 'Pending Site Engineer' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'Verified by Site Engineer')}
                              className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                            >
                              ✓ Verify (Engineer)
                            </button>
                          )}
                          {bill.status === 'Verified by Site Engineer' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'Approved by Project Manager')}
                              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              ✓ Approve (PM)
                            </button>
                          )}
                          {bill.status === 'Approved by Project Manager' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'Paid by Accounts')}
                              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              ₹ Pay (Accounts)
                            </button>
                          )}
                          {bill.status === 'Paid by Accounts' && (
                            <span className="text-emerald-600 font-bold">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal for New Bill Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">New Measurement & Contractor Bill</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contractor Name *</label>
                  <input
                    type="text"
                    required
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g. Sharma Structure / Mazar Tiles"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contractor Type *</label>
                  <select
                    value={contractorType}
                    onChange={(e) => setContractorType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600 font-semibold"
                  >
                    <option value="Structure Contractor">Structure Contractor</option>
                    <option value="Tiles Fitting Contractor">Tiles Fitting Contractor</option>
                    <option value="Labor Contractor">Labor Contractor</option>
                    <option value="Brick Work Contractor">Brick Work Contractor</option>
                    <option value="Plumbing & Electrical">Plumbing & Electrical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nature of Work *</label>
                  <input
                    type="text"
                    required
                    value={natureOfWork}
                    onChange={(e) => setNatureOfWork(e.target.value)}
                    placeholder="e.g. RCC Slab Casting / Flooring"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nature of Job *</label>
                  <input
                    type="text"
                    required
                    value={natureOfJob}
                    onChange={(e) => setNatureOfJob(e.target.value)}
                    placeholder="e.g. 3rd Floor Roof / Vitrified Tiles"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Measurement Book (MB) Details *</label>
                <textarea
                  rows={3}
                  required
                  value={measurementDetails}
                  onChange={(e) => setMeasurementDetails(e.target.value)}
                  placeholder="Enter dimensions (Length x Breadth x Height) or quantity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-pink-600 focus:outline-none focus:border-pink-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-md shadow-pink-600/20"
                >
                  {submitting ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}