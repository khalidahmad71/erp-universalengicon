"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Users, Plus, FileText, ArrowUpRight, ArrowDownLeft, X, Wallet, Phone, Building, MapPin, Receipt } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  company_name: string;
  address: string;
  gst_no: string;
  opening_balance: number;
}

interface LedgerTxn {
  id: string;
  vendor_id: string;
  txn_date: string;
  txn_type: string;
  reference_no: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

export default function VendorLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [transactions, setTransactions] = useState<LedgerTxn[]>([]);
  
  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);

  // New Vendor Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Material Supplier");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  // New Transaction Form
  const [txnType, setTxnType] = useState("Bill / Invoice");
  const [refNo, setRefNo] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isDebit, setIsDebit] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchTransactions(selectedVendor.id);
    }
  }, [selectedVendor]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.from("vendors").select("*").order("name");
      if (error) throw error;
      if (data) {
        setVendors(data);
        if (data.length > 0 && !selectedVendor) {
          setSelectedVendor(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (vendorId: string) => {
    const { data, error } = await supabase
      .from("vendor_ledger")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("txn_date", { ascending: true });

    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vendors").insert({
      name,
      category,
      phone,
      company_name: companyName,
      address,
      gst_no: gstNo.toUpperCase(),
      opening_balance: parseFloat(openingBalance) || 0,
    });

    if (!error) {
      alert("Vendor added successfully!");
      setShowVendorModal(false);
      setName(""); setPhone(""); setCompanyName(""); setAddress(""); setGstNo(""); setOpeningBalance("0");
      fetchVendors();
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleAddTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const numAmount = parseFloat(amount) || 0;
    const debit = isDebit ? numAmount : 0;
    const credit = !isDebit ? numAmount : 0;

    const { error } = await supabase.from("vendor_ledger").insert({
      vendor_id: selectedVendor.id,
      txn_type: txnType,
      reference_no: refNo,
      description,
      debit_amount: debit,
      credit_amount: credit,
    });

    if (!error) {
      alert("Transaction recorded successfully!");
      setShowTxnModal(false);
      setRefNo(""); setDescription(""); setAmount("");
      fetchTransactions(selectedVendor.id);
    } else {
      alert("Error: " + error.message);
    }
  };

  // Calculate Running Balance
  let runningBalance = selectedVendor ? Number(selectedVendor.opening_balance) : 0;

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
          <h2 className="font-extrabold text-slate-800 text-lg">Vendor & Contractor Ledger</h2>
          <button
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-600/20"
          >
            <Plus size={16} /> Add New Vendor / Contractor
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vendors List Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3 lg:col-span-1 h-fit">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-2">Suppliers & Contractors</h3>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {vendors.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">No vendors added yet.</p>
              ) : (
                vendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVendor(v)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedVendor?.id === v.id
                        ? "bg-slate-900 text-white shadow-md"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p className="font-bold text-xs truncate">{v.name}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${selectedVendor?.id === v.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {v.company_name || v.category}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ledger Details Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 lg:col-span-3">
            {selectedVendor ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedVendor.category}
                    </span>
                    <h2 className="text-xl font-black text-slate-800 mt-2">{selectedVendor.name}</h2>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      {selectedVendor.company_name && <span className="text-slate-900 font-bold">{selectedVendor.company_name} | </span>}
                      Phone: {selectedVendor.phone || 'N/A'}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {selectedVendor.address || 'No address provided'}</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-700"><Receipt size={13} className="text-pink-600" /> GSTIN: {selectedVendor.gst_no || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTxnModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shrink-0"
                  >
                    <Plus size={14} /> Add Transaction
                  </button>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase tracking-wider">
                        <th className="p-3 font-bold">Date</th>
                        <th className="p-3 font-bold">Type & Ref</th>
                        <th className="p-3 font-bold">Description</th>
                        <th className="p-3 font-bold text-right">Debit (Paid)</th>
                        <th className="p-3 font-bold text-right">Credit (Bill)</th>
                        <th className="p-3 font-bold text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50 font-medium">
                        <td className="p-3 text-slate-500">-</td>
                        <td className="p-3 font-bold text-slate-700">Opening Balance</td>
                        <td className="p-3 text-slate-500">Initial balance brought forward</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right font-black text-slate-800">
                          ₹ {Number(selectedVendor.opening_balance).toLocaleString()}
                        </td>
                      </tr>

                      {transactions.map((txn) => {
                        const debit = Number(txn.debit_amount) || 0;
                        const credit = Number(txn.credit_amount) || 0;
                        runningBalance = runningBalance + credit - debit;

                        return (
                          <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-600">{txn.txn_date}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{txn.txn_type}</span>
                              <span className="text-[10px] text-slate-400">{txn.reference_no}</span>
                            </td>
                            <td className="p-3 text-slate-600">{txn.description}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              {debit > 0 ? `₹ ${debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-bold text-pink-600">
                              {credit > 0 ? `₹ ${credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-black text-slate-900">
                              ₹ {runningBalance.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select a vendor from the left sidebar to view their ledger history.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm">Add New Vendor / Contractor</h3>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vendor / Person Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Kumar TMT Traders"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Material Supplier">Material Supplier</option>
                    <option value="Civil Contractor">Civil Contractor</option>
                    <option value="Electrical & Plumbing">Electrical & Plumbing</option>
                    <option value="Equipment Rental">Equipment Rental</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">GST Number (GSTIN)</label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="e.g. 10AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Complete Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Pincode..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-pink-600 text-white rounded-xl font-bold">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTxnModal && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm">Add Ledger Entry for {selectedVendor.name}</h3>
              <button onClick={() => setShowTxnModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTxn} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Transaction Type *</label>
                  <select
                    value={txnType}
                    onChange={(e) => {
                      setTxnType(e.target.value);
                      if (e.target.value === "Payment Made") setIsDebit(true);
                      else setIsDebit(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Bill / Invoice">Bill / Invoice (Credit Due)</option>
                    <option value="Payment Made">Payment Made (Debit Paid)</option>
                    <option value="Debit Note">Debit Note</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Reference No / Bill No</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="e.g. INV-1092"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-pink-600 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of materials supplied or payment mode..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTxnModal(false)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-pink-600 text-white rounded-xl font-bold">Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}