'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function LaborMusterRollPage() {
  const [projectList, setProjectList] = useState<any[]>([])
  
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [contractorAgency, setContractorAgency] = useState('')
  
  // Labor Counts & Wage Rates
  const [skilledCount, setSkilledCount] = useState<number>(0)
  const [skilledRate, setSkilledRate] = useState<number>(600) // Default daily wage for skilled
  
  const [unskilledCount, setUnskilledCount] = useState<number>(0)
  const [unskilledRate, setUnskilledRate] = useState<number>(450) // Default daily wage for unskilled
  
  const [supervisorCount, setSupervisorCount] = useState<number>(0)
  const [supervisorRate, setSupervisorRate] = useState<number>(800) // Default daily wage for supervisor

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
  const skilledTotal = skilledCount * skilledRate
  const unskilledTotal = unskilledCount * unskilledRate
  const supervisorTotal = supervisorCount * supervisorRate
  const totalMusterAmount = skilledTotal + unskilledTotal + supervisorTotal
  const totalHeadcount = skilledCount + unskilledCount + supervisorCount

  const handleSaveMusterRoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || totalHeadcount <= 0) {
      alert('कृपया प्रोजेक्ट चुनें और कम से कम एक लेबर की उपस्थिति दर्ज करें।')
      return
    }

    setLoading(true)
    try {
      const payload = {
        project_id: selectedProjectId,
        attendance_date: attendanceDate,
        contractor_agency: contractorAgency || 'Direct Payroll',
        skilled_count: Number(skilledCount),
        skilled_rate: Number(skilledRate),
        unskilled_count: Number(unskilledCount),
        unskilled_rate: Number(unskilledRate),
        supervisor_count: Number(supervisorCount),
        supervisor_rate: Number(supervisorRate),
        total_headcount: Number(totalHeadcount),
        total_wage_amount: Number(totalMusterAmount),
        status: 'Submitted & Verified'
      }

      const { error } = await supabase.from('labor_muster_roll').insert([payload])

      if (error) throw error

      alert('Labor Muster Roll सफलतापूर्वक सहेज लिया गया है और पेरोल लेजर अपडेट हो गया!')
      setSkilledCount(0)
      setUnskilledCount(0)
      setSupervisorCount(0)
      setContractorAgency('')
    } catch (err: any) {
      console.error('Error saving muster roll:', err.message)
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
          <span className="bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Universal Engicon ERP
          </span>
          <h1 className="text-3xl font-black text-white mt-2">Labor Muster Roll & Wage Payroll</h1>
          <p className="text-slate-400 text-xs mt-1">Site Attendance, Headcount Tracking & Daily Wage Calculations</p>
        </div>
      </div>

      <form onSubmit={handleSaveMusterRoll} className="space-y-6">
        
        {/* Project, Date & Agency */}
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
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Attendance Date</label>
            <input 
              type="date" 
              value={attendanceDate} 
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gang / Contractor Agency</label>
            <input 
              type="text" 
              value={contractorAgency} 
              onChange={(e) => setContractorAgency(e.target.value)}
              placeholder="उदा. Direct / Sharma Gang" 
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>
        </div>

        {/* Labor Deployment & Wage Rates */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
          <h2 className="text-md font-bold text-slate-200">लेबर डिप्लॉयमेंट और दैनिक मजदूरी (Deployment & Rates)</h2>
          
          {/* Skilled */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-sm font-bold text-white block">Skilled Labor (कुशल मजदूर)</span>
              <span className="text-[11px] text-slate-400">Bar benders, Masons, Electricians</span>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Headcount</label>
              <input 
                type="number" 
                value={skilledCount || ''} 
                onChange={(e) => setSkilledCount(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Daily Rate (₹)</label>
              <input 
                type="number" 
                value={skilledRate} 
                onChange={(e) => setSkilledRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-bold"
              />
            </div>
          </div>

          {/* Unskilled */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-sm font-bold text-white block">Unskilled Labor (अकुशल मजदूर)</span>
              <span className="text-[11px] text-slate-400">Helpers, Mixers, General loaders</span>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Headcount</label>
              <input 
                type="number" 
                value={unskilledCount || ''} 
                onChange={(e) => setUnskilledCount(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Daily Rate (₹)</label>
              <input 
                type="number" 
                value={unskilledRate} 
                onChange={(e) => setUnskilledRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-bold"
              />
            </div>
          </div>

          {/* Supervisors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-sm font-bold text-white block">Supervisors / Engineers</span>
              <span className="text-[11px] text-slate-400">Site supervisors & Junior engineers</span>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Headcount</label>
              <input 
                type="number" 
                value={supervisorCount || ''} 
                onChange={(e) => setSupervisorCount(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Daily Rate (₹)</label>
              <input 
                type="number" 
                value={supervisorRate} 
                onChange={(e) => setSupervisorRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 font-bold"
              />
            </div>
          </div>

          {/* Payroll Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Headcount</span>
              <span className="text-lg font-bold text-slate-200">{totalHeadcount} Workers</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Daily Wage Bill</span>
              <span className="text-xl font-black text-indigo-400">₹{totalMusterAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'प्रोसेसिंग...' : 'Save & Lock Muster Roll'}
          </button>
        </div>

      </form>
    </div>
  )
}