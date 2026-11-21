'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  UserPlus,
  Shield,
  Building2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EnterpriseUser {
  id: string;
  user_email: string;
  full_name: string;
  department: string;
  role_designation: string;
  password_hash: string;
  assigned_site: string;
  is_active: boolean;
  failed_attempts?: number;
  reset_requested?: boolean;
  reset_requested_at?: string;
}

const DEPARTMENTS = [
  { name: 'Management & MD Office', defaultRole: 'Managing Director' },
  { name: 'Civil Engineering & Projects', defaultRole: 'Site Engineer' },
  { name: 'Accounts & Finance', defaultRole: 'Accounts Manager' },
  { name: 'Store & Inventory', defaultRole: 'Store Keeper' },
  { name: 'Procurement & Contracts', defaultRole: 'Procurement Officer' },
  { name: 'Real Estate Sales & CRM', defaultRole: 'Sales Manager' },
  { name: 'HR & Site Administration', defaultRole: 'HR Admin' },
];

export default function DepartmentUsersPage() {
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Universal@2026');
  const [department, setDepartment] = useState('Civil Engineering & Projects');
  const [roleDesignation, setRoleDesignation] = useState('Site Engineer');
  const [assignedSite, setAssignedSite] = useState('Godrej Zen Estate Phase-2');

  // Inline Password Reset State
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('enterprise_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDepartmentChange = (deptName: string) => {
    setDepartment(deptName);
    const found = DEPARTMENTS.find((d) => d.name === deptName);
    if (found) setRoleDesignation(found.defaultRole);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('enterprise_users').upsert(
      [
        {
          full_name: fullName.trim(),
          user_email: email.trim().toLowerCase(),
          password_hash: password,
          department,
          role_designation: roleDesignation,
          assigned_site: assignedSite,
          access_level: roleDesignation === 'Managing Director' ? 1 : 2,
          is_active: true,
          failed_attempts: 0,
          reset_requested: false,
        },
      ],
      { onConflict: 'user_email' }
    );

    setSaving(false);
    if (error) {
      alert('Error creating user: ' + error.message);
    } else {
      setFullName('');
      setEmail('');
      setPassword('Universal@2026');
      fetchUsers();
    }
  };

  const handleResetAndUnlock = async (user: EnterpriseUser) => {
    const updatedPwd = (newPasswords[user.id] || 'Universal@2026').trim();
    if (!updatedPwd) {
      alert('Please enter a new password.');
      return;
    }

    await supabase
      .from('enterprise_users')
      .update({
        password_hash: updatedPwd,
        is_active: true,
        failed_attempts: 0,
        reset_requested: false,
      })
      .eq('id', user.id);

    await supabase
      .from('password_reset_requests')
      .update({ status: 'Resolved' })
      .eq('user_email', user.user_email)
      .eq('status', 'Pending');

    alert(`Password updated & account unlocked for ${user.full_name} (${user.department})!`);
    fetchUsers();
  };

  const toggleUserStatus = async (user: EnterpriseUser) => {
    await supabase
      .from('enterprise_users')
      .update({
        is_active: !user.is_active,
        failed_attempts: !user.is_active ? 0 : user.failed_attempts,
      })
      .eq('id', user.id);
    fetchUsers();
  };

  const deleteUser = async (id: string, userEmail: string) => {
    if (userEmail === 'md@universalengicon.com') {
      alert('Managing Director account cannot be deleted.');
      return;
    }
    if (!confirm(`Delete user ${userEmail}?`)) return;
    await supabase.from('enterprise_users').delete().eq('id', id);
    fetchUsers();
  };

  const pendingResetUsers = users.filter((u) => u.reset_requested || !u.is_active);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Access Control &amp; Staff Directory
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Department-Wise User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create department logins, monitor 3-attempt lockouts &amp; approve password resets
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-xs font-bold text-blue-900">
          Total Active Users: {users.filter((u) => u.is_active).length}
        </div>
      </div>

      {/* Department Password Reset & Lockout Requests Alert Panel */}
      {pendingResetUsers.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-black text-sm uppercase">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Department Password Reset &amp; Lockout Requests ({pendingResetUsers.length})
          </div>
          <p className="text-xs text-rose-700">
            The following staff accounts triggered a password reset request (3 failed login attempts or manual request). Set a new password below to unlock:
          </p>

          <div className="space-y-2.5 pt-1">
            {pendingResetUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-rose-200 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {u.full_name}{' '}
                    <span className="text-xs font-semibold text-blue-700">
                      ({u.department} • {u.role_designation})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {u.user_email} • Failed Attempts: {u.failed_attempts || 0}/3
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="New Password (e.g. Eng@2026)"
                    value={newPasswords[u.id] ?? 'Universal@2026'}
                    onChange={(e) =>
                      setNewPasswords({ ...newPasswords, [u.id]: e.target.value })
                    }
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 w-48"
                  />
                  <button
                    onClick={() => handleResetAndUnlock(u)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow cursor-pointer shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Reset &amp; Unlock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Department User Form */}
      <form
        onSubmit={handleCreateUser}
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-4 h-4 text-blue-700" />
          Create New Department Login
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
            <select
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">System Access Role *</label>
            <select
              value={roleDesignation}
              onChange={(e) => setRoleDesignation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="Managing Director">Managing Director (Full Access)</option>
              <option value="Site Engineer">Site Engineer (Projects, BOQ, MR, DPR)</option>
              <option value="Accounts Manager">Accounts Manager (Finance, GST, PO, RA)</option>
              <option value="Store Keeper">Store Keeper (Store GRN, MR, PO)</option>
              <option value="Procurement Officer">Procurement Officer (PO, Vendors, MR)</option>
              <option value="Sales Manager">Sales Manager (Real Estate Sales)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email (Login ID) *</label>
            <input
              type="email"
              placeholder="e.g. accounts@universalengicon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Login Password *</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Site / Project</label>
            <input
              type="text"
              placeholder="e.g. Godrej Zen Estate Phase-2"
              value={assignedSite}
              onChange={(e) => setAssignedSite(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm rounded-lg shadow transition-colors cursor-pointer"
          >
            {saving ? 'Saving User...' : '+ Create Department User'}
          </button>
        </div>
      </form>

      {/* Department-Wise Users List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
            Registered Enterprise Users
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Employee &amp; Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">ERP Role</th>
                  <th className="py-3 px-4">Assigned Site</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{u.full_name}</div>
                      <div className="text-slate-500 font-mono">{u.user_email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-700" />
                        {u.department || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200">
                        <Shield className="w-3 h-3" />
                        {u.role_designation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{u.assigned_site || 'All Sites'}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{u.password_hash}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold cursor-pointer ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Locked
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.user_email !== 'md@universalengicon.com' && (
                        <button
                          onClick={() => deleteUser(u.id, u.user_email)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}