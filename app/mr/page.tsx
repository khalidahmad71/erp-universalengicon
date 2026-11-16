"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { ArrowLeft, Plus, ClipboardList, Send, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MRPage() {
  const [mrList, setMrList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [mrNumber, setMrNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    generateMRNumber();
    fetchMRs();
  }, []);

  // Automatic MR Number Generator
  const generateMRNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setMrNumber(`MR-UE-${randomNum}`);
  };

  const fetchMRs = async () => {
    const { data, error } = await supabase
      .from("material_requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setMrList(data);
    setLoading(false);
  };

  const handleSaveMR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("material_requests").insert([
      {
        mr_number: mrNumber,
        project_name: projectName,
        material_desc: materialDesc,
        quantity: parseFloat(quantity),
        status: 'Pending'
      },
    ]);

    if (!error) {
      setMaterialDesc("");
      setQuantity("");
      generateMRNumber(); 
      fetchMRs();
    } else {
      alert("Error saving MR: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-blue-600" />
              Material Requests (MR)
            </h1>
            <p className="text-slate-500 text-sm mt-1">Site material demands to Purchase Department</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium bg-slate-100 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft size={18} /> Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create MR Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" /> Raise New Demand
            </h2>
            <form onSubmit={handleSaveMR} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">MR Number</label>
                <input readOnly type="text" value={mrNumber} className="mt-1 block w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none font-mono text-slate-600 font-bold" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Project / Site Name</label>
                <select required value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option value="">Select Site</option>
                  <option value="Godrej Zen Estate Phase-2">Godrej Zen Estate Phase-2</option>
                  <option value="S. Raza Millennium School">S. Raza Millennium School</option>
                  <option value="Universal Engicon HQ">Universal Engicon HQ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Required Material</label>
                <select required value={materialDesc} onChange={(e) => setMaterialDesc(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                  <option value="">Select Material</option>
                  <option value="Nuvoco Cement">Nuvoco Cement</option>
                  <option value="TMT Steel Bars">TMT Steel Bars</option>
                  <option value="Red Bricks">Red Bricks</option>
                  <option value="River Sand">River Sand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Quantity Needed</label>
                <input required type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. 100" />
              </div>

              <button disabled={loading} type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Send size={18} /> {loading ? "Sending..." : "Send Request to Purchase"}
              </button>
            </form>
          </div>

          {/* MR List Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-x-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Material Requests from Sites</h2>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-sm">
                  <th className="p-3 rounded-l-lg font-semibold">MR Number</th>
                  <th className="p-3 font-semibold">Project Site</th>
                  <th className="p-3 font-semibold">Material Needed</th>
                  <th className="p-3 rounded-r-lg font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && mrList.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">Loading...</td></tr>
                ) : mrList.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">No requests from site yet.</td></tr>
                ) : (
                  mrList.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{item.mr_number}</span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{item.project_name}</p>
                        <p className="text-xs text-slate-500">Requested by: {item.requested_by}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-slate-700 font-medium">{item.material_desc}</p>
                        <p className="text-xs font-bold text-blue-600">Qty: {item.quantity}</p>
                      </td>
                      <td className="p-3 text-center">
                        {item.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                            <Clock size={14} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle size={14} /> {item.status}
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
      </div>
    </div>
  );
}