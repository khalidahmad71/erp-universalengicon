'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function StoreInventoryGRNPage() {
  const [projectList, setProjectList] = useState<any[]>([])
  const [poList, setPoList] = useState<any[]>([])

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedPoId, setSelectedPoId] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [challanNo, setChallanNo] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  
  // Received Material Details
  const [itemDescription, setItemDescription] = useState('')
  const [orderedQty, setOrderedQty] = useState<number>(0)
  const [receivedQty, setReceivedQty] = useState<number>(0)
  const [unit, setUnit] = useState('Bags')
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMasterData() {
      // Projects
      const { data: proj } = await supabase.from('projects').select('*')
      if (proj && proj.length > 0) {
        setProjectList(proj)
      } else {
        setProjectList([{ id: 'PROJ-001', name: 'Godrej Zen Estate Phase-2' }])
      }

      // Purchase Orders
      const { data: pos } = await supabase.from('purchase_orders').select('*')
      if (pos) setPoList(pos)
    }
    fetchMasterData()
  }, [])

  // Handle PO Selection (Auto-fill Vendor & Item details)
  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId)
    const foundPo = poList.find(p => p.id.toString() === poId)
    if (foundPo) {
      setVendorName(foundPo.vendor_name || '')
      setItemDescription(foundPo.item_description || '')
      setOrderedQty(Number(foundPo.quantity || 0))
      setUnit(foundPo.unit || 'Bags')
      if (foundPo.project_id) {
        setSelectedProjectId(foundPo.project_id)
      }
    }
  }

  const handleSaveGRN = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !selectedPoId || receivedQty <= 0) {
      alert('कृपया प्रोजेक्ट, PO नंबर और प्राप्त मात्रा (Received Quantity) सही से भरें।')
      return
    }

    setLoading(true)
    try {
      const payload = {
        project_id: selectedProjectId,
        po_id: selectedPoId,
        vendor_name: vendorName,
        challan_no: challanNo,
        receipt_date: receiptDate,
        item_description: itemDescription,
        ordered_quantity: orderedQty,
        received_quantity: Number(receivedQty),
        unit: unit,
        remarks: remarks,
        status: 'Verified & Stocked'
      }

      const { error } = await supabase.from('store_grn').insert([payload])

      if (error) throw error

      alert('Goods Receipt Note (GRN) सफलतापूर्वक दर्ज हो गया और स्टोर इन्वेंट्री अपडेट हो गई!')
      setSelectedPoId('')
      setVendorName('')
      setChallanNo('')
      setItemDescription('')
      setOrderedQty(0)
      setReceivedQty(0)
      setRemarks('')
    } catch (err: any) {
      console.error('Error saving GRN:', err.message)
      alert(`एरर: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-950 text-slate-100 min-h-screen">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl flex justify-between items-center">
        <div>
          <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Universal Engicon ERP
          </span>
          <h1 className="text-3xl font-black text-white mt-2">Store Inventory & Goods Receipt Note (GRN)</h1>
          <p className="text-slate-400 text-xs mt-1">Material Inward Verification & Stock Ledger Management</p>
        </div>
      </div>

      <form onSubmit={handleSaveGRN} className="space-y-6">
        
        {/* PO Selection & Challan Info */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Purchase Order (PO)</label>
            <select 
              value={selectedPoId} 
              onChange={(e) => handlePoChange(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              required
            >
              <option value="">-- PO रेफेरेंस चुनें --</option>
              {poList.map(po => (
                <option key={po.id} value={po.id}>
                  PO #{po.id} — {po.vendor_name} ({po.item_description})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vendor Name (Auto)</label>
            <input 
              type="text" 
              value={vendorName} 
              readOnly 
              placeholder="सप्लायर का नाम" 
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Challan / Invoice No.</label>
            <input 
              type="text" 
              value={challanNo} 
              onChange={(e) => setChallanNo(e.target.value)}
              placeholder="उदा. CHN-2026-89" 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            />
          </div>
        </div>

        {/* Date & Site */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Project Site</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              required
            >
              <option value="">-- प्रोजेक्ट चुनें --</option>
              {projectList.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.id || p.project_id} - {p.name || p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Receipt Date</label>
            <input 
              type="date" 
              value={receiptDate} 
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              required
            />
          </div>
        </div>

        {/* Material Inward Quantity Verification */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h2 className="text-md font-bold text-slate-200 mb-4">मटेरियल मिलान और मात्रा (Quantity Verification)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Item Description</label>
              <input 
                type="text" 
                value={itemDescription} 
                readOnly
                placeholder="PO से ऑटो-लोडेड" 
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ordered Qty</label>
              <input 
                type="number" 
                value={orderedQty || ''} 
                readOnly
                className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Received Qty (Actual)</label>
              <input 
                type="number" 
                value={receivedQty || ''} 
                onChange={(e) => setReceivedQty(parseFloat(e.target.value) || 0)}
                placeholder="प्राप्त मात्रा" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-bold text-lg"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Inspection Remarks / Quality Notes</label>
            <input 
              type="text" 
              value={remarks} 
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="उदा. Material quality verified and stored in Godown A" 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'प्रोसेसिंग...' : 'Verify & Save GRN (Update Store)'}
          </button>
        </div>

      </form>
    </div>
  )
}