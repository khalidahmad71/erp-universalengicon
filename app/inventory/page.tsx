"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { ArrowLeft, Plus, Package, Truck, FileText, Search, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' ya 'grn'
  const [loading, setLoading] = useState(true);

  // --- STOCK (Purana Code) STATES ---
  const [materials, setMaterials] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "", category: "Cement", quantity: "", unit: "Bags",
  });

  // --- GRN (Naya Code) STATES ---
  const [grnList, setGrnList] = useState<any[]>([]);
  const [approvedPOs, setApprovedPOs] = useState<any[]>([]);
  const [grnNumber, setGrnNumber] = useState("");
  const [selectedPOId, setSelectedPOId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [receivedQty, setReceivedQty] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [savingGRN, setSavingGRN] = useState(false);

  useEffect(() => {
    fetchMaterials();
    fetchApprovedPOs();
    fetchGRNs();
    generateGRNNumber();
  }, []);

  // --- STOCK FUNCTIONS ---
  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("id", { ascending: false });
      if (data) setMaterials(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSavingStock(true);
    try {
      const { error } = await supabase.from("materials").insert([
        {
          name: newMaterial.name,
          category: newMaterial.category,
          quantity: Number(newMaterial.quantity),
          unit: newMaterial.unit,
        },
      ]);
      if (!error) {
        setNewMaterial({ name: "", category: "Cement", quantity: "", unit: "Bags" });
        setShowForm(false);
        fetchMaterials();
      } else alert("Error: " + error.message);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingStock(false);
    }
  }

  // --- GRN FUNCTIONS ---
  const generateGRNNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setGrnNumber(`GRN-UE-${randomNum}`);
  };

  const fetchApprovedPOs = async () => {
    const { data } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("status", "Approved")
      .order("created_at", { ascending: false });
    if (data) setApprovedPOs(data);
  };

  const fetchGRNs = async () => {
    const { data } = await supabase
      .from("goods_receipt_notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setGrnList(data);
  };

  const handlePOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPOId(id);
    if (id) {
      const selectedPO = approvedPOs.find(po => po.id.toString() === id);
      if (selectedPO) {
        setPoNumber(selectedPO.po_number);
        setProjectName(selectedPO.project_name);
        setMaterialDesc(selectedPO.material_desc);
      }
    } else {
      setPoNumber(""); setProjectName(""); setMaterialDesc("");
    }
  };

  const handleSaveGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOId) return alert("Select PO first.");
    setSavingGRN(true);
    
    const qty = parseFloat(receivedQty);
    const { error } = await supabase.from("goods_receipt_notes").insert([
      { grn_number: grnNumber, po_number: poNumber, project_name: projectName, material_desc: materialDesc, received_qty: qty, challan_number: challanNumber, vehicle_number: vehicleNumber },
    ]);

    if (!error) {
      // Bonus: Automatic Master Stock Update (Jab truck aayega toh main inventory bhi badhegi)
      const existingMaterial = materials.find(m => m.name.toLowerCase() === materialDesc.toLowerCase() || materialDesc.toLowerCase().includes(m.name.toLowerCase()));
      if(existingMaterial) {
        await supabase.from("materials").update({ quantity: existingMaterial.quantity + qty }).eq("id", existingMaterial.id);
      }

      setSelectedPOId(""); setPoNumber(""); setProjectName(""); setMaterialDesc(""); setReceivedQty(""); setChallanNumber(""); setVehicleNumber("");
      generateGRNNumber();
      fetchGRNs();
      fetchMaterials(); // Stock wapas load karein updated quantity ke sath
    } else alert("Error saving GRN: " + error.message);
    
    setSavingGRN(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Package className="text-orange-600" /> Store & Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-1">Live Stock Dashboard & Goods Receipt (GRN)</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-medium bg-slate-100 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft size={18} /> Dashboard
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab("stock")} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${activeTab === "stock" ? "bg-orange-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
            <LayoutDashboard size={18} /> Live Master Stock
          </button>
          <button onClick={() => setActiveTab("grn")} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${activeTab === "grn" ? "bg-orange-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
            <Truck size={18} /> Receive Truck (GRN)
          </button>
        </div>

        {/* --- TAB 1: LIVE MASTER STOCK --- */}
        {activeTab === "stock" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setShowForm(!showForm)} className="bg-slate-800 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-slate-900 transition font-medium flex items-center gap-2">
                {showForm ? "✖ Cancel" : <><Plus size={18} /> Add New Item to Catalog</>}
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Add Item to Master Stock</h2>
                <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500" value={newMaterial.category} onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}>
                      <option value="Cement">Cement</option><option value="Steel">Steel / TMT</option><option value="Sand">Sand</option><option value="Bricks">Bricks</option><option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Material Name</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} placeholder="e.g. Nuvoco Cement" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Qty</label>
                    <input type="number" required className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500" value={newMaterial.quantity} onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500" value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}>
                      <option value="Bags">Bags</option><option value="Tons">Tons</option><option value="CFT">CFT</option><option value="Pieces">Pieces</option>
                    </select>
                  </div>
                  <div className="md:col-span-5 flex justify-end mt-2">
                    <button type="submit" disabled={savingStock} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition">
                      {savingStock ? "Adding..." : "Save to Catalog"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-sm">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Material Name</th>
                    <th className="py-4 px-6 font-semibold">Category</th>
                    <th className="py-4 px-6 font-semibold">Total Stock Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : materials.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-500">Store is empty.</td></tr>
                  ) : materials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-bold text-slate-800">{item.name}</td>
                      <td className="py-4 px-6"><span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{item.category}</span></td>
                      <td className="py-4 px-6 font-black text-xl text-orange-600">{item.quantity.toLocaleString("en-IN")} <span className="text-sm font-medium text-slate-500">{item.unit}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: RECEIVE TRUCK (GRN) --- */}
        {activeTab === "grn" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Truck size={20} className="text-orange-600" /> Inward Entry (GRN)
              </h2>
              <form onSubmit={handleSaveGRN} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <label className="block text-sm font-bold text-amber-800 flex items-center gap-1 mb-1">
                    <Search size={14} /> Link PO Number
                  </label>
                  <select required value={selectedPOId} onChange={handlePOChange} className="block w-full px-3 py-2 bg-white border border-amber-300 rounded-md outline-none focus:border-orange-500 text-sm">
                    <option value="">-- Select PO to receive --</option>
                    {approvedPOs.map(po => <option key={po.id} value={po.id}>{po.po_number} - {po.vendor_name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700">GRN Number</label><input readOnly type="text" value={grnNumber} className="mt-1 block w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-600 font-bold" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-semibold text-slate-700">Delivery Site</label><input readOnly type="text" value={projectName} className="mt-1 block w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" placeholder="Auto-filled" /></div>
                  <div className="col-span-2"><label className="block text-sm font-semibold text-slate-700">Material</label><input readOnly type="text" value={materialDesc} className="mt-1 block w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" placeholder="Auto-filled" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-slate-700">Qty Recd</label><input required type="number" step="any" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500" placeholder="0" /></div>
                  <div><label className="block text-sm font-semibold text-slate-700">Challan No.</label><input type="text" value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500" placeholder="Opt." /></div>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700">Vehicle / Truck No.</label><input required type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500" placeholder="e.g. BR-01-XX-1234" /></div>
                <button disabled={savingGRN} type="submit" className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <FileText size={18} /> {savingGRN ? "Saving..." : "Generate GRN"}
                </button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-x-auto">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Inward Truck History (GRNs)</h2>
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm">
                    <th className="p-3 rounded-l-lg font-semibold">GRN & PO</th>
                    <th className="p-3 font-semibold">Site Location</th>
                    <th className="p-3 font-semibold">Material & Truck</th>
                    <th className="p-3 rounded-r-lg font-semibold text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {grnList.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 text-sm">
                      <td className="p-3"><span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{item.grn_number}</span><p className="text-xs text-slate-500 mt-1">PO: {item.po_number}</p></td>
                      <td className="p-3 font-bold text-slate-800">{item.project_name}</td>
                      <td className="p-3"><p className="font-medium text-slate-700">{item.material_desc}</p><p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Truck size={12}/> {item.vehicle_number}</p></td>
                      <td className="p-3 font-black text-orange-600 text-right text-lg">{item.received_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}