'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function CorporatePurchaseOrderPage() {
  // Master lists
  const [projectList, setProjectList] = useState<any[]>([])
  const [indentList, setIndentList] = useState<any[]>([])
  const [vendorList, setVendorList] = useState<any[]>([])

  // Selected IDs & Values
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [selectedIndentId, setSelectedIndentId] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  
  // Vendor details
  const [vendorName, setVendorName] = useState('')
  const [vendorAddress, setVendorAddress] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')
  const [vendorGstin, setVendorGstin] = useState('')

  // Item details
  const [itemDescription, setItemDescription] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [unit, setUnit] = useState('Nos')
  const [unitRate, setUnitRate] = useState<number>(0)
  const [gstRate, setGstRate] = useState<number>(18)

  const [loading, setLoading] = useState(false)

  // Fetch Master Data on load
  useEffect(() => {
    fetchMasterData()
  }, [])

  async function fetchMasterData() {
    try {
      const { data: projects } = await supabase.from('projects').select('*')
      if (projects && projects.length > 0) {
        setProjectList(projects)
      } else {
        setProjectList([{ id: 'PROJ-001', name: 'Godrej Zen Estate Phase-2 & Infrastructure' }])
      }

      const { data: indents } = await supabase.from('purchase_requests').select('*')
      if (indents) setIndentList(indents)

      const { data: vendors } = await supabase.from('vendors_master').select('*')
      if (vendors) setVendorList(vendors)
    } catch (err) {
      console.error('Error fetching master data:', err)
    }
  }

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId)
    const found = projectList.find((p) => (p.id || p.project_id)?.toString() === projId)
    if (found) {
      setProjectName(found.name || found.project_name || 'Universal Engicon Project')
    }
  }

  const handleIndentChange = (indentId: string) => {
    setSelectedIndentId(indentId)
    const selected = indentList.find((item) => item.id.toString() === indentId)
    if (selected) {
      setItemDescription(selected.item_description || selected.item_name || '')
      setQuantity(selected.quantity || selected.req_qty || 0)
      setUnit(selected.unit || 'Nos')
    }
  }

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId)
    const selected = vendorList.find((v) => v.id.toString() === vendorId)
    if (selected) {
      setVendorName(selected.vendor_name || '')
      setVendorAddress(selected.address || '')
      setVendorPhone(selected.phone || '')
      setVendorGstin(selected.gstin || '')
    }
  }

  // Calculations
  const subtotal = quantity * unitRate
  const gstAmount = (subtotal * gstRate) / 100
  const grandTotal = subtotal + gstAmount

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !selectedVendorId || unitRate <= 0) {
      alert('Please select a Project, a Vendor, and enter a valid Unit Rate.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('purchase_orders').insert([
        {
          project_id: selectedProjectId,
          project_name: projectName,
          indent_id: selectedIndentId || null,
          order_date: orderDate,
          vendor_name: vendorName,
          vendor_address: vendorAddress,
          vendor_phone: vendorPhone,
          vendor_gstin: vendorGstin,
          item_description: itemDescription,
          quantity: quantity,
          unit: unit,
          unit_rate: unitRate,
          subtotal: subtotal,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          grand_total: grandTotal,
          status: 'Pending Approval'
        }
      ])

      if (error) throw error

      alert('Corporate Purchase Order successfully generated and routed for approval!')
      setSelectedProjectId('')
      setProjectName('')
      setSelectedIndentId('')
      setSelectedVendorId('')
      setVendorName('')
      setVendorAddress('')
      setVendorPhone('')
      setVendorGstin('')
      setItemDescription('')
      setQuantity(0)
      setUnitRate(0)
    } catch (err: any) {
      console.error('Error creating Purchase Order:', err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans bg-slate-100 min-h-screen">
      
      {/* Corporate Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center border border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest bg-blue-600 text-white px-3 py-1 rounded-full font-semibold">
            Enterprise Procurement Module
          </span>
          <h1 className="text-3xl font-extrabold mt-2 tracking-tight">UNIVERSAL ENGICON PRIVATE LIMITED</h1>
          <p className="text-slate-400 text-sm mt-1">Official Purchase Order (PO) Management & Vendor Contracting Suite</p>
        </div>
        <div className="mt-4 md:mt-0 text-right bg-slate-800 p-4 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-400 block">System Status</span>
          <span className="text-emerald-400 font-bold flex items-center gap-2 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Live & Secure
          </span>
        </div>
      </div>

      <form onSubmit={handleCreatePO} className="space-y-6">
        
        {/* Section 1: Project & Date */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">01</span>
            <h2 className="text-lg font-bold text-slate-800">Project Allocation & Issuance Date</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Project / Site</label>
              <select 
                value={selectedProjectId} 
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              >
                <option value="">-- Choose Corporate Project --</option>
                {projectList.map((proj) => {
                  const pId = proj.id || proj.project_id
                  const pName = proj.name || proj.project_name || 'Project'
                  return (
                    <option key={pId} value={pId}>
                      [{pId}] - {pName}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Purchase Order Date</label>
              <input 
                type="date" 
                value={orderDate} 
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>
          {projectName && (
            <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800 flex items-center justify-between">
              <span>Active Project Name: <strong className="text-blue-900">{projectName}</strong></span>
              <span className="uppercase text-[10px] tracking-wider bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Verified Site</span>
            </div>
          )}
        </div>

        {/* Section 2: Purchase Indent Reference */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">02</span>
            <h2 className="text-lg font-bold text-slate-800">Purchase Indent / PR Reference (Optional)</h2>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Approved Indent</label>
            <select 
              value={selectedIndentId} 
              onChange={(e) => handleIndentChange(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">-- Direct Corporate PO (Without Indent) --</option>
              {indentList.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  PR Reference #{ind.id} — {ind.item_description || ind.item_name} ({ind.quantity || ind.req_qty} {ind.unit || 'Nos'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Vendor Master Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">03</span>
            <h2 className="text-lg font-bold text-slate-800">Vendor Master & Credentials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Approved Vendor</label>
              <select 
                value={selectedVendorId} 
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              >
                <option value="">-- Choose Category Vendor --</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} [{v.category || 'General Supplier'}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vendor Contact Number</label>
              <input 
                type="text" 
                value={vendorPhone} 
                readOnly 
                placeholder="Auto-populated from Master Registry" 
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Registered Office Address</label>
              <input 
                type="text" 
                value={vendorAddress} 
                readOnly 
                placeholder="Auto-populated from Master Registry" 
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vendor GSTIN (Tax ID)</label>
              <input 
                type="text" 
                value={vendorGstin} 
                readOnly 
                placeholder="Auto-populated from Master Registry" 
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Item Specifications & Unit Rate */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">04</span>
            <h2 className="text-lg font-bold text-slate-800">Material Specification & Financials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Item Description / BOQ Specification</label>
              <input 
                type="text" 
                value={itemDescription} 
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Enter description or select PR" 
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Required Quantity</label>
              <input 
                type="number" 
                value={quantity || ''} 
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Agreed Unit Rate (₹)</label>
              <input 
                type="number" 
                value={unitRate || ''} 
                onChange={(e) => setUnitRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00" 
                className="w-full p-3 bg-blue-50/50 border border-blue-300 rounded-xl font-extrabold text-blue-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Tax & Corporate Summary Bar */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Applicable GST Rate (%)</label>
            <select 
              value={gstRate} 
              onChange={(e) => setGstRate(parseFloat(e.target.value))}
              className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={5}>5% GST Compliant</option>
              <option value={12}>12% GST Compliant</option>
              <option value={18}>18% Standard Corporate GST</option>
              <option value={28}>28% High-Tier GST</option>
            </select>
          </div>

          <div className="w-full md:w-2/3 grid grid-cols-3 gap-6 text-right bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">Subtotal</span>
              <span className="text-lg font-bold text-slate-200">₹{subtotal.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">GST Tax</span>
              <span className="text-lg font-bold text-slate-200">₹{gstAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase font-medium">Grand Total</span>
              <span className="text-xl font-extrabold text-blue-400">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Corporate Action Button */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/20 transition-all duration-200 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Processing Corporate PO...
              </>
            ) : (
              'Approve & Issue Purchase Order'
            )}
          </button>
        </div>

      </form>
    </div>
  )
}