'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  FolderKanban,
  Flag,
  FileText,
  Package,
  ShoppingCart,
  Wrench,
  Receipt,
  Wallet,
  Users,
  BarChart3,
  Building2,
  HardHat,
  ShieldCheck,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string>('admin')

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role) {
          setRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const sections = [
    {
      title: 'Command & Projects',
      items: [
        { name: 'MD Command Center', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Projects & Sites', href: '/projects', icon: FolderKanban, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Project Milestones', href: '/milestones', icon: Flag, roles: ['admin', 'site_engineer', 'accountant'] },
      ],
    },
    {
      title: 'Site & Procurement',
      items: [
        { name: 'Material Requisition (MR)', href: '/mr', icon: FileText, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Store & GRN', href: '/store', icon: Package, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Purchase Orders (PO)', href: '/po', icon: ShoppingCart, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Work Orders', href: '/work-orders', icon: Wrench, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'HSE & Site Safety', href: '/safety', icon: HardHat, roles: ['admin', 'site_engineer', 'accountant'] },
      ],
    },
    {
      title: 'Finance & Commercial',
      items: [
        { name: 'Contractor RA Bills', href: '/ra', icon: Receipt, roles: ['admin', 'accountant'] },
        { name: 'Petty Cash & Site Exp', href: '/petty-cash', icon: Wallet, roles: ['admin', 'accountant'] },
        { name: 'Vendor & Sub-Contractor', href: '/vendors', icon: Users, roles: ['admin', 'accountant'] },
        { name: 'MIS & Financial Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'accountant'] },
      ],
    },
    {
      title: 'Real Estate & Governance',
      items: [
        { name: 'Real Estate Sales', href: '/sales', icon: Building2, roles: ['admin', 'site_engineer', 'accountant'] },
        { name: 'Access Control (Users)', href: '/users', icon: ShieldCheck, roles: ['admin'] },
      ],
    },
  ]

  const roleLabels: Record<string, string> = {
    admin: 'MD Command Access',
    site_engineer: 'Site Engineer Access',
    accountant: 'Finance & Accounts Access',
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div>
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-base font-bold tracking-wider text-white">UNIVERSAL ENGICON</h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">Enterprise ERP</p>
        </div>

        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-145px)]">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(role))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Supabase Live Sync</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-300">{roleLabels[role] || 'Authorized Staff'}</p>
      </div>
    </aside>
  )
}