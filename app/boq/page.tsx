"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { ArrowLeft, Plus, Calculator, Save, Edit2, Trash2, X } from "lucide-react";
import Link from "next/link";

export default function BOQPage() {
  const [boqList, setBoqList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    fetchBOQ();
  }, []);

  const fetchBOQ = async () => {
    const { data, error } = await supabase
      .from("boq")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setBoqList(data);
    setLoading(false);
  };

  // Form Reset Function
  const resetForm = () => {
    setEditingId(null);
    setProjectName("");
    setMaterialDesc("");
    setUnit("");
    setQuantity("");
    setRate("");
  };

  // Naya Save karna YA Purana Edit karna
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      project_name: projectName,
      material_desc: materialDesc,
      unit: unit,
      quantity: parseFloat(quantity),
      rate: parseFloat(rate),
    };

    let error;

    if (editingId) {
      // Edit / Update Record
      const { error: updateError } = await supabase
        .from("boq")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      // Insert New Record
      const { error: insertError } = await supabase
        .from("boq")
        .insert([payload]);
      error = insertError;
    }

    if (!error) {
      resetForm();
      fetchBOQ();
    } else {
      alert("Error saving data: " + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setProjectName(item.project_name);
    setMaterialDesc(item.material_desc);
    setUnit(item.unit);
    setQuantity(item.quantity.toString());
    setRate(item.rate.toString());
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Kya aap sach mein is estimate ko delete karna chahte hain?")) return;

    setLoading(true);
    const { error } = await supabase.from("boq").delete().eq("id", id);
    
    if (!error) {
      fetchBOQ();
    } else {
      alert("Error deleting data: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Calculator className="text-blue-600" />
              Bill of Quantities (BOQ)
            </h1>
            <p className="text-slate-500 text-sm mt-1">Project cost and material estimation</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium bg-slate-100 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft size={18} /> Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} className="text-emerald-600" />} 
                {editingId ? "Edit Item" : "Add New Item"}
              </h2>
              {editingId && (
                <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors" title="Cancel Edit">
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Project Name</label>
                <select 
                  required 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="">Select Project</option>
                  <option value="Godrej Zen Estate Phase-2">Godrej Zen Estate Phase-2</option>
                  <option value="S. Raza Millennium School">S. Raza Millennium School</option>
                  <option value="Universal Engicon HQ">Universal Engicon HQ</option>
                </select>
              </div>

              {/* MATERIAL SELECT DROPDOWN YAHAN ADD KIYA GAYA HAI */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Material Description</label>
                <select 
                  required 
                  value={materialDesc} 
                  onChange={(e) => setMaterialDesc(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="">Select Material</option>
                  <option value="Nuvoco Cement">Nuvoco Cement</option>
                  <option value="TMT Steel Bars">TMT Steel Bars</option>
                  <option value="Red Bricks">Red Bricks</option>
                  <option value="River Sand">River Sand</option>
                  <option value="Stone Chips (Gitti)">Stone Chips (Gitti)</option>
                  <option value="Paint & Putty">Paint & Putty</option>
                  <option value="Other">Other...</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Unit</label>
                  <select required value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                    <option value="">Select</option>
                    <option value="MT">MT (Tons)</option>
                    <option value="Bags">Bags</option>
                    <option value="Cubic Feet">Cubic Feet</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Nos">Nos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Qty</label>
                  <input required type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Rate (₹)</label>
                <input required type="number" step="any" value={rate} onChange={(e) => setRate(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="0.00" />
              </div>
              <button disabled={loading} type="submit" className={`w-full mt-4 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                <Save size={18} /> {loading ? "Saving..." : editingId ? "Update BOQ Item" : "Save BOQ Item"}
              </button>
            </form>
          </div>

          {/* BOQ Data Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-x-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">BOQ Estimates</h2>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-sm">
                  <th className="p-3 rounded-l-lg font-semibold">Project</th>
                  <th className="p-3 font-semibold">Material</th>
                  <th className="p-3 font-semibold">Qty & Unit</th>
                  <th className="p-3 font-semibold">Rate</th>
                  <th className="p-3 font-semibold">Amount (₹)</th>
                  <th className="p-3 rounded-r-lg font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && boqList.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-500">Loading...</td></tr>
                ) : boqList.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-500">No BOQ items added yet.</td></tr>
                ) : (
                  boqList.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm">
                      <td className="p-3 text-slate-800 font-medium">{item.project_name}</td>
                      <td className="p-3 text-slate-600">{item.material_desc}</td>
                      <td className="p-3 text-slate-600"><span className="font-semibold text-slate-800">{item.quantity}</span> {item.unit}</td>
                      <td className="p-3 text-slate-600">₹{item.rate}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{item.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3 flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Delete">
                          <Trash2 size={16} />
                        </button>
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