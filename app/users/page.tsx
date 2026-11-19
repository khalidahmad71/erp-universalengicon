'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, UserCheck, UserX, RefreshCw } from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'site_engineer' | 'accountant'
  is_active: boolean
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage({ type: 'error', text: `Error loading staff: ${error.message}` })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'site_engineer' | 'accountant') => {
    setUpdatingId(userId)
    setMessage(null)
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: `Failed to update role: ${error.message}` })
    } else {
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)))
      setMessage({ type: 'success', text: 'Staff role updated successfully.' })
    }
    setUpdatingId(null)
  }

  const toggleActiveStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId)
    setMessage(null)
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: `Failed to update status: ${error.message}` })
    } else {
      setUsers(users.map(u => (u.id === userId ? { ...u, is_active: !currentStatus } : u)))
      setMessage({ type: 'success', text: `Account ${!currentStatus ? 'activated' : 'deactivated'}.` })
    }
    setUpdatingId(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-700" />
            Access Control & Role Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Universal Engicon Pvt. Ltd. — Manage staff permissions and ERP access levels
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh List
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className="py-3.5 px-4">Staff Name</th>
              <th className="py-3.5 px-4">Official Email</th>
              <th className="py-3.5 px-4">Assigned Role</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Loading staff profiles...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No staff profiles found.
                </td>
              </tr>
            ) : (
              users.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{staff.full_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{staff.email}</td>
                  <td className="py-3.5 px-4">
                    <select
                      disabled={updatingId === staff.id}
                      value={staff.role}
                      onChange={(e) =>
                        handleRoleChange(staff.id, e.target.value as 'admin' | 'site_engineer' | 'accountant')
                      }
                      className="border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="admin">Admin (MD / Full Access)</option>
                      <option value="site_engineer">Site Engineer (BOQ, DPR, Store, MB)</option>
                      <option value="accountant">Accountant (Finance, GST, Billing, PO)</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        staff.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {staff.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      disabled={updatingId === staff.id}
                      onClick={() => toggleActiveStatus(staff.id, staff.is_active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors ${
                        staff.is_active
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {staff.is_active ? (
                        <>
                          <UserX className="w-3.5 h-3.5" /> Disable Access
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}