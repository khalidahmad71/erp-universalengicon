'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function CorporatePOPage() {
  const [projectList, setProjectList] = useState<any[]>([])
  const [indentList, setIndentList] = useState<any[]>([])
  const [vendorList, setVendorList] = useState<any[]>([])

  // Form Fields
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [selectedIndentId, setSelectedIndentId] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  
  // Vendor details
  const [vendorName, setVendorName] = useState('')
  const [vendorAddress, setVendorAddress] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')
  const [vendorGstin, setVendorGstin] = useState('')

  // Item details & GST
  const [itemDescription, setItemDescription] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [unit, setUnit] = useState('Bags')
  const [unitRate, setUnitRate] = useState<number>(0)
  const [gstRate, setGstRate] = useState<number>(18) // Default 18%
  const [gstType, setGstType] = useState<'LOCAL' | 'INTERSTATE'>('LOCAL') // Local = CGST+SGST, Interstate = IGST

  const [loading, setLoading] = useState(false)

  // Fetch Master Data safely
  useEffect(() => {
    async function loadMasterData() {
      try {
        // 1. Projects
        const { data: proj } = await supabase.from('projects').select('*')
        if (proj && proj.length > 0) {
          setProjectList(proj)
        } else {
          setProjectList([{ id: 'PROJ-001', name: 'Godrej Zen Estate Phase-2' }])
        }

        // 2. Fetch Indents / PR (Checking both 'purchase_requests' and 'mr' tables)
        let fetchedIndents: any[] = []
        const { data: prData } = await supabase.from('purchase_requests').select('*')
        if (prData && prData.length > 0) {
          fetchedIndents = prData
        } else {
          // Fallback to 'mr' table if purchase_requests is empty
          const { data: mrData } = await supabase.from('mr').select('*')
          if (mrData) fetchedIndents = mrData
        }
        setIndentList(fetchedIndents)

        // 3. Vendors Master
        const { data: vend } = await supabase.from('vendors_master').select('*')
        if (vend) setVendorList(vend)
      } catch (err) {
        console.error('Error loading master data:', err)
      }
    }
    loadMasterData()
  }, [])

  // Handle Project Selection
  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id)
    const found = projectList.find(p => (p.id || p.project_id)?.toString() === id)
    if (found) {
      setProjectName(found.name || found.project_name || 'Universal Engicon Site')
    }
  }

  // Handle Indent / PR Selection
  const handleIndentChange = (id: string) => {
    setSelectedIndentId(id)
    const foundIndent = indentList.find(i => i.id.toString() === id)
    if (foundIndent) {
      setItemDescription(foundIndent.item_description || foundIndent.item_name || foundIndent.material_name || '')
      setQuantity(Number(foundIndent.quantity || foundIndent.req_qty || foundIndent.qty || 0))
      setUnit(foundIndent.unit || 'Bags')
      
      if (foundIndent.project_id) {
        setSelectedProjectId(foundIndent.project_id)
        const projFound = projectList.find(p => (p.id || p.project_id)?.toString() === foundIndent.project_id.toString())
        if (projFound) {
          setProjectName(projFound.name || projFound.project_name || '')
        }
      }
    }
  }

  // Handle Vendor Selection
  const handleVendorChange = (id: string) => {
    const found = vendorList.find(v => v.id.toString() === id)
    if (found) {
      setVendorName(found.vendor_name || '')
      setVendorAddress(found.address || '')
      setVendorPhone(found.phone || '')
      setVendorGstin(found.gstin || '')
    }
  }

  // Corporate Financial Calculations (Subtotal, CGST, SGST, IGST, Grand Total)
  const subtotal = (quantity || 0) * (unitRate || 0)
  const totalGstAmount = (subtotal * gstRate) / 100
  
  let cgst = 0
  let sgst = 0
  let igst = 0

  if (gstType === 'LOCAL') {
    cgst = totalGstAmount / 2
    sgst = totalGstAmount / 2
  } else {
    igst = totalGstAmount
  }

  const grandTotal = subtotal + totalGstAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !vendorName || !itemDescription || quantity <= 0 || unitRate <= 0) {
      alert('Please fill in all mandatory fields (Project, Vendor, Item, Quantity, and Unit Rate).')
      return
    }

    setLoading(true)
    try {
      const payload = {
        project_id: selectedProjectId,
        project_name: projectName || 'Godrej Zen Estate',
        indent_id: selectedIndentId || null,
        order_date: orderDate,
        vendor_name: vendorName,
        vendor_address: vendorAddress || 'N/A',
        vendor_phone: vendorPhone || 'N/A',
        vendor_gstin: vendorGstin || 'N/A',
        item_description: itemDescription,
        quantity: Number(quantity),
        unit: unit,
        unit_rate: Number(unitRate),
        subtotal: Number(subtotal),
        gst_rate: Number(gstRate),
        cgst_amount: Number(cgst),
        sgst_amount: Number(sgst),
        igst_amount: Number(igst),
        gst_amount: Number(totalGstAmount),
        grand_total: Number(grandTotal),
        status: 'Pending Approval'
      }

      console.log('Submitting Corporate PO:', payload)

      const { error } = await supabase.from('purchase_orders').insert([payload])

      if (error) {
        console.error('Supabase Insert Error:', error)
        alert(`Database Error: ${error.message}`)
        return
      }

      alert('Corporate Purchase Order generated and filed successfully!')
      
      // Reset Item fields
      setSelectedIndentId('')
      setItemDescription('')
      setQuantity(0)
      setUnitRate(0)
    } catch (err: any) {
      console.error('Unexpected error:', err)
      alert(`Unexpected Error: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-950 text-slate-100 min-h-screen">
      
      {/* Corporate Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8 shadow-xl flex justify-between items-center">
        <div>
          <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Universal Engicon ERP
          </span>
          <h1 className="text-3xl font-black text-white mt-2">Enterprise Purchase Order & GST Module</h1>
          <p className="text-slate-400 text-xs mt-1">Automated PR Indent Linking & Corporate Tax Calculation Suite</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: PR / Indent Selection */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h2 className="text-md font-bold text-slate-200 mb-3">1. Select Purchase Indent (PR / Material Request)</h2>
          <select 
            value={selectedIndentId} 
            onChange={(e) => handleIndentChange(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Choose Approved Indent / PR --</option>
            {indentList.map(ind => (
              <option key={ind.id} value={ind.id}>
                PR/MR #{ind.id} — {ind.item_description || ind.item_name || ind.material_name || 'Material'} ({ind.quantity || ind.req_qty || ind.qty} {ind.unit || 'Nos'})
              </option>
            ))}
          </select>
          {indentList.length === 0 && (
            <p className="text-[11px] text-amber-400 mt-2">
              ⚠️ No Indents/PR found in 'purchase_requests' or 'mr' table. You can enter details manually.
            </p>
          )}
        </div>

        {/* Step 2: Project & Date */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Project Site</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Choose Project --</option>
              {projectList.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.id || p.project_id} - {p.name || p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Order Date</label>
            <input 
              type="date" 
              value={orderDate} 
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              required
            />
          </div>
        </div>

        {/* Step 3: Vendor Selection & Master Details */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h2 className="text-md font-bold text-slate-200 mb-4">2. Vendor Master & GSTIN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Vendor</label>
              <select 
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Choose Approved Vendor --</option>
                {vendorList.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} [{v.category || 'General'}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vendor Name</label>
              <input 
                type="text" 
                value={vendorName} 
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor Name" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone</label>
              <input type="text" value={vendorPhone} readOnly placeholder="Phone" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Address</label>
              <input type="text" value={vendorAddress} readOnly placeholder="Address" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">GSTIN</label>
              <input type="text" value={vendorGstin} readOnly placeholder="GSTIN" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 uppercase" />
            </div>
          </div>
        </div>

        {/* Step 4: Item Specifications & Rate */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h2 className="text-md font-bold text-slate-200 mb-4">3. Material Specification & Rate Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Item Description</label>
              <input 
                type="text" 
                value={itemDescription} 
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Pulled from PR or type here" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quantity</label>
              <input 
                type="number" 
                value={quantity || ''} 
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit Rate (₹) [Manual]</label>
              <input 
                type="number" 
                value={unitRate || ''} 
                onChange={(e) => setUnitRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-blue-400 font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 5: Corporate GST Summary & Calculation */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
          <h2 className="text-md font-bold text-slate-200">4. Corporate GST Tax Breakdown</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">GST Supply Type</label>
              <select 
                value={gstType} 
                onChange={(e) => setGstType(e.target.value as any)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              >
                <option value="LOCAL">Intra-State Supply (CGST + SGST)</option>
                <option value="INTERSTATE">Inter-State Supply (IGST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Total GST Rate (%)</label>
              <select 
                value={gstRate} 
                onChange={(e) => setGstRate(parseFloat(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              >
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% Standard GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-right bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Subtotal</span>
              <span className="font-bold text-slate-200">₹{subtotal.toLocaleString()}</span>
            </div>
            {gstType === 'LOCAL' ? (
              <>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">CGST ({gstRate/2}%)</span>
                  <span className="font-bold text-slate-200">₹{cgst.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">SGST ({gstRate/2}%)</span>
                  <span className="font-bold text-slate-200">₹{sgst.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 uppercase block">IGST ({gstRate}%)</span>
                <span className="font-bold text-slate-200">₹{igst.toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Tax</span>
              <span className="font-bold text-emerald-400">₹{totalGstAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Grand Total</span>
              <span className="text-lg font-black text-blue-400">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing PO...' : 'Generate & File Corporate Purchase Order'}
          </button>
        </div>

      </form>
    </div>
  )
}