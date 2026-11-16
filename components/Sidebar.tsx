"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Calculator, 
  FileText, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  TrendingUp, 
  Users,
  PieChart,
  ShieldCheck,
  Cpu
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Real Estate Sales", href: "/sales", icon: Building2 },
    { name: "Material Estimation", href: "/estimation", icon: Calculator },
    { name: "Contractor Billing (MB)", href: "/contractor-bills", icon: FileText },
    { name: "Purchase Orders (PO)", href: "/po", icon: ShoppingCart },
    { name: "Store Inventory (GRN)", href: "/inventory", icon: Package },
    { name: "Daily Progress (DPR)", href: "/dpr", icon: ClipboardList },
    { name: "RA Bills & Invoicing", href: "/ra", icon: TrendingUp },
    { name: "Vendor Ledger", href: "/vendors", icon: Users },
    { name: "GST & Tax Compliance", href: "/compliance", icon: ShieldCheck },
    { name: "Financial Reports", href: "/reports", icon: PieChart },
  ];

  return (
    <aside className="w-72 bg-[#F9F8F6] text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200 shadow-sm relative select-none">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center gap-3.5 border-b border-slate-200 bg-[#F4F1EA]">
        <div className="bg-pink-600 p-2.5 rounded-2xl text-white shadow-md shadow-pink-600/30">
          <Cpu size={22} />
        </div>
        <div>
          <h1 className="font-black text-slate-900 text-sm tracking-wider uppercase font-sans">Universal Engicon</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">SAP S/4HANA Core</p>
          </div>
        </div>
      </div>

      {/* Navigation Links with Hover Color Transformation */}
      <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 font-mono">Enterprise Modules</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group ${
                isActive
                  ? "bg-pink-600 text-white shadow-md shadow-pink-600/25 scale-[1.02]"
                  : "hover:bg-pink-50 hover:text-pink-700 hover:translate-x-1 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive ? "bg-white/20 text-white" : "bg-[#EFECE6] text-slate-500 group-hover:bg-pink-100 group-hover:text-pink-600"
                }`}>
                  <Icon size={18} />
                </div>
                <span className="tracking-wide">{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-5 border-t border-slate-200 bg-[#F4F1EA] text-xs">
        <div className="bg-[#EFECE6] border border-slate-200 p-3 rounded-2xl text-center">
          <p className="font-bold text-slate-800 text-[11px]">Managing Director Suite</p>
          <p className="text-[10px] font-mono text-emerald-700 mt-0.5">● Secure Cloud Active</p>
        </div>
      </div>
    </aside>
  );
}