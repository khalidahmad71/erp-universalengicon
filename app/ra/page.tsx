"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Building, FileText, Plus, X, Printer, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface ClientRABill {
  id: string;
  bill_no: string;
  client_name: string;
  unit_number: string;
  work_description: string;
  previous_billed_amount: number;
  current_bill_amount: number;
  gst_percentage: number;
  status: string;
  created_at: string;
}

export default function RABillsPage() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<ClientRABill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [printingBill, setPrintingBill] = useState<ClientRABill | null>(null);

  // Form States
  const [billNo, setBillNo] = useState(`RA-${Math.floor(1000 + Math.random() * 9000)}`);
  const [clientName, setClientName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [prevBilled, setPrevBilled] = useState("");
  const [currentBilled, setCurrentBilled] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from("client_ra_bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setBills(data);
    } catch (error) {
      console.error("Error fetching RA bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("client_ra_bills").insert({
        bill_no: billNo,
        client_name: clientName,
        unit_number: unitNumber,
        work_description: workDescription,
        previous_billed_amount: parseFloat(prevBilled) || 0,
        current_bill_amount: parseFloat(currentBilled) || 0,
        gst_percentage: parseFloat(gstRate) || 18,
        status: "Unpaid"
      });

      if (error) throw error;

      alert("RA Bill generated successfully!");
      setShowModal(false);
      setBillNo(`RA-${Math.floor(1000 + Math.random() * 9000)}`);
      setClientName("");
      setUnitNumber("");
      setWorkDescription("");
      setPrevBilled("");
      setCurrentBilled("");
      fetchBills();
    } catch (error: any) {
      alert("Error generating bill: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("client_ra_bills")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) fetchBills();
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
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h2 className="font-extrabold text-slate-800 text-lg">Running Account (RA) Bills & Invoicing</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-600/20"
          >
            <Plus size={16} /> Generate New RA Bill
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {bills.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No RA bills generated yet. Click &quot;Generate New RA Bill&quot; to start.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase tracking-wider">
                      <th className="p-4 font-bold">Bill No</th>
                      <th className="p-4 font-bold">Client & Unit</th>
                      <th className="p-4 font-bold">Work Description</th>
                      <th className="p-4 font-bold">Current Amount</th>
                      <th className="p-4 font-bold">GST</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((bill) => {
                      const current = Number(bill.current_bill_amount) || 0;
                      const gstAmt = (current * Number(bill.gst_percentage)) / 100;
                      const totalWithGst = current + gstAmt;

                      return (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-black text-slate-800">{bill.bill_no}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{bill.client_name}</p>
                            <p className="text-[11px] text-slate-500">Unit: {bill.unit_number}</p>
                          </td>
                          <td className="p-4 text-slate-600 max-w-xs truncate">{bill.work_description}</td>
                          <td className="p-4 font-black text-slate-900">₹ {totalWithGst.toLocaleString()}</td>
                          <td className="p-4 text-slate-500">{bill.gst_percentage}%</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setPrintingBill(bill)}
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 inline-flex items-center gap-1 shadow-sm"
                            >
                              <Printer size={12} /> Print PDF
                            </button>
                            {bill.status === 'Unpaid' ? (
                              <button
                                onClick={() => updateStatus(bill.id, 'Paid')}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStatus(bill.id, 'Unpaid')}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm"
                              >
                                Mark Unpaid
                              </button>
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
        </div>
      </main>

      {/* Modal for New Bill */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm">Generate Running Account (RA) Bill</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Bill Number *</label>
                  <input
                    type="text"
                    required
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Unit Number *</label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g. Flat 302"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Work Description / Milestone *</label>
                <textarea
                  rows={2}
                  required
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Details of construction stage completed..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Prev Billed (₹)</label>
                  <input
                    type="number"
                    value={prevBilled}
                    onChange={(e) => setPrevBilled(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Current Bill (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentBilled}
                    onChange={(e) => setCurrentBilled(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-pink-600 text-white rounded-xl font-bold">
                  {submitting ? "Generating..." : "Save & Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PDF Modal View */}
      {printingBill && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white print:hidden">
              <h3 className="font-bold text-sm">RA Bill Print Preview</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-pink-600 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setPrintingBill(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Area */}
            <div className="p-8 space-y-6 text-slate-800 text-xs bg-white">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900">UNIVERSAL ENGICON PVT. LTD.</h1>
                  <p className="text-slate-500">Civil Construction, Infrastructure & Real Estate</p>
                </div>
                <div className="text-right">
                  <h2 className="font-black text-sm uppercase text-pink-600">Running Account Bill</h2>
                  <p className="font-bold text-slate-800">Bill No: {printingBill.bill_no}</p>
                  <p className="text-slate-500">Date: {new Date(printingBill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Billed To:</p>
                  <p className="font-black text-sm text-slate-900">{printingBill.client_name}</p>
                  <p className="text-slate-600">Unit / Property: {printingBill.unit_number}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Project Details:</p>
                  <p className="font-bold text-slate-800">Godrej Zen Estate Phase-2</p>
                  <p className="text-slate-600">Status: {printingBill.status}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-3 font-bold border-b">Description of Work</th>
                    <th className="p-3 font-bold border-b text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 font-medium">{printingBill.work_description}</td>
                    <td className="p-3 text-right font-bold">₹ {Number(printingBill.current_bill_amount).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">Previous Billed Amount</td>
                    <td className="p-3 text-right text-slate-500">₹ {Number(printingBill.previous_billed_amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-bold">₹ {Number(printingBill.current_bill_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">GST ({printingBill.gst_percentage}%):</span>
                    <span className="font-bold">₹ {((Number(printingBill.current_bill_amount) * Number(printingBill.gst_percentage)) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2">
                    <span>Total Payable:</span>
                    <span className="text-pink-600">₹ {(Number(printingBill.current_bill_amount) + (Number(printingBill.current_bill_amount) * Number(printingBill.gst_percentage)) / 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-12 flex justify-between items-end border-t mt-12 text-[11px] text-slate-500">
                <p>This is a computer-generated Running Account bill for Universal Engicon Pvt. Ltd.</p>
                <div className="text-center space-y-4">
                  <div className="h-10"></div>
                  <p className="font-bold border-t border-slate-400 pt-1">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}