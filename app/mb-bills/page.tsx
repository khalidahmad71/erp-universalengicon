'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ContractorBillingPage() {
  const [projectList, setProjectList] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [contractorName, setContractorName] = useState('')
  const [billNo, setBillNo] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [billAmount, setBillAmount] = useState<number>(0)
  
  // Deductions
  const [retentionPercent, setRetentionPercent] = useState<number>(5) // e.g., 5% retention
  const [tdsPercent, setTdsPercent] = useState<number>(2) // e.g., 2% TDS
  const [advanceRecovery, setAdvanceRecovery] = useState<number>(0)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('*')
      if (data && data.length > 0) {
        setProjectList(data)
      } else {
        setProjectList([{ id: 'PROJ-001', name: 'Godrej Zen Estate Phase-2' }])
      }
    }
    fetchProjects()
  }, [])

  // Calculations
  const retentionAmount = (billAmount * retentionPercent) / 100
  const tdsAmount = (billAmount * tdsPercent) / 100
  const totalDeductions = retentionAmount + tdsAmount + advanceRecovery
  const netPayable = billAmount - totalDeductions

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !contractorName || billAmount <= 0) {
      alert('कृपया प्रोजेक्ट, ठेकेदार का नाम और बिल राशि सही से भरें।')
      return
    }

    setLoading(true)
    try {
      const payload = {
        project_id: selectedProjectId,
        contractor_name: contractorName,
        bill_no: billNo,
        work_description: workDescription,
        gross_amount: Number(billAmount),
        retention_amount: Number(retentionAmount),
        tds_amount: Number(tdsAmount),
        advance_recovery: Number(advanceRecovery),
        net_payable: Number(netPayable),
        status: 'Pending Approval'
      }

      const { error } = await supabase.from('contractor_bills').insert([payload])

      if (error) throw error

      alert('RA Bill & Measurement Record सफलतापूर्वक सहेज लिया गया है!')
      setContractorName('')
      setBillNo('')
      setWorkDescription('')
      setBillAmount(0)
      setAdvanceRecovery(0)
    } catch (err: any) {
      console.error('Error saving bill:', err.message)
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
          <span className="bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Universal Engicon ERP
          </span>
          <h1 className="text-3xl font-black text-white mt-2">Contractor Billing & RA Bills (MB)</h1>
          <p className="text-slate-400 text-xs mt-1">Measurement Book Recording & Net Payable Calculation Suite</p>
        </div>
      </div>

      <form onSubmit={handleSaveBill} className="space-y-6">
        
        {/* Project & Contractor Info */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contractor Name</label>
            <input 
              type="text" 
              value={contractorName} 
              onChange={(e) => setContractorName(e.target.value)}
              placeholder="ठेकेदार का नाम" 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">RA Bill No.</label>
            <input 
              type="text" 
              value={billNo} 
              onChange={(e) => setBillNo(e.target.value)}
              placeholder="उदा. RA-01 / Final" 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              required
            />
          </div>
        </div>

        {/* Work Description & Gross Amount */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h2 className="text-md font-bold text-slate-200 mb-4">कार्य का विवरण और ग्रॉस राशि (Gross Amount)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Work Description (MB Reference)</label>
              <textarea 
                rows={2}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="उदा. Ground floor column casting & shuttering work as per MB No. 42"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gross Bill Amount (₹)</label>
              <input 
                type="number" 
                value={billAmount || ''} 
                onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-bold text-lg"
                required
              />
            </div>
          </div>
        </div>

        {/* Deductions & Net Payable Summary */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
          <h2 className="text-md font-bold text-slate-200">कटौतियाँ और नेट भुगतान (Deductions & Net Payable)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Retention Money (%)</label>
              <input 
                type="number" 
                value={retentionPercent} 
                onChange={(e) => setRetentionPercent(parseFloat(e.target.value) || 0)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">TDS Deduction (%)</label>
              <input 
                type="number" 
                value={tdsPercent} 
                onChange={(e) => setTdsPercent(parseFloat(e.target.value) || 0)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Advance Recovery (₹)</label>
              <input 
                type="number" 
                value={advanceRecovery || ''} 
                onChange={(e) => setAdvanceRecovery(parseFloat(e.target.value) || 0)}
                placeholder="0.00" 
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Gross Bill</span>
              <span className="font-bold text-slate-200">₹{billAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Deductions</span>
              <span className="font-bold text-rose-400">- ₹{totalDeductions.toLocaleString()}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 uppercase block">Net Payable to Contractor</span>
              <span className="text-xl font-black text-emerald-400">₹{netPayable.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'प्रोसेसिंग...' : 'Save & Process RA Bill'}
          </button>
        </div>

      </form>
    </div>
  )
}