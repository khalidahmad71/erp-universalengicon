'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
export default function DPRPage() {
  const [projectId, setProjectId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [workDone, setWorkDone] = useState('')
  
  // Labour state
  const [skilledLabour, setSkilledLabour] = useState<number>(0)
  const [unskilledLabour, setUnskilledLabour] = useState<number>(0)
  const [supervisors, setSupervisors] = useState<number>(0)

  // Material consumption state
  const [cementBags, setCementBags] = useState<number>(0)
  const [steelTon, setSteelTon] = useState<number>(0)

  const [loading, setLoading] = useState(false)

  const handleSubmitDPR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !workDone) {
      alert('Please fill in the Project ID and Work Description.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('dpr_reports').insert([
        {
          project_id: projectId,
          report_date: reportDate,
          work_description: workDone,
          skilled_labour: skilledLabour,
          unskilled_labour: unskilledLabour,
          supervisors: supervisors,
          cement_bags_used: cementBags,
          steel_consumed_ton: steelTon
        }
      ])

      if (error) throw error

      alert('Daily Progress Report (DPR) submitted successfully!')
      // Reset form
      setWorkDone('')
      setSkilledLabour(0)
      setUnskilledLabour(0)
      setSupervisors(0)
      setCementBags(0)
      setSteelTon(0)
    } catch (err: any) {
      console.error('Error saving DPR:', err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Daily Progress Report (DPR)</h1>

      <form onSubmit={handleSubmitDPR} className="space-y-6">
        
        {/* Basic Details Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project ID / Name</label>
            <input 
              type="text" 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. PROJ-001" 
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Report Date</label>
            <input 
              type="date" 
              value={reportDate} 
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Labour Deployment Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Labour Deployment & Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Skilled Labour</label>
              <input 
                type="number" 
                value={skilledLabour || ''} 
                onChange={(e) => setSkilledLabour(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unskilled Labour</label>
              <input 
                type="number" 
                value={unskilledLabour || ''} 
                onChange={(e) => setUnskilledLabour(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supervisors / Engineers</label>
              <input 
                type="number" 
                value={supervisors || ''} 
                onChange={(e) => setSupervisors(parseInt(e.target.value) || 0)}
                placeholder="0" 
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Material Consumption Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Today's Material Consumption</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cement Bags Used</label>
              <input 
                type="number" 
                value={cementBags || ''} 
                onChange={(e) => setCementBags(parseInt(e.target.value) || 0)}
                placeholder="e.g. 150" 
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Steel Consumed (Tons)</label>
              <input 
                type="number" 
                step="0.01"
                value={steelTon || ''} 
                onChange={(e) => setSteelTon(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 2.5" 
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Work Progress Description */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Work Progress Description</h2>
          <textarea 
            rows={4}
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            placeholder="Describe today's site construction activities (e.g., First floor slab casting completed, curing in progress...)"
            className="w-full p-3 border rounded-md"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Submit DPR'}
          </button>
        </div>

      </form>
    </div>
  )
}