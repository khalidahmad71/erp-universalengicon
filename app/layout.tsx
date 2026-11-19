import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Building2, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Universal Engicon Pvt. Ltd. | Enterprise ERP',
  description: 'Civil Construction, Infrastructure & Real Estate ERP Command Center',
};

const SIDEBAR_MENU = [
  { name: 'Main Dashboard', href: '/', section: 'EXECUTIVE' },
  { name: 'Analytics & MIS', href: '/analytics', section: 'EXECUTIVE' },

  { name: 'Bill of Quantities (BOQ)', href: '/boq', section: 'PROCUREMENT & STORE' },
  { name: 'Cost Estimation', href: '/estimation', section: 'PROCUREMENT & STORE' },
  { name: 'Material Request (MR)', href: '/mr', section: 'PROCUREMENT & STORE' },
  { name: 'Purchase Orders (PO)', href: '/po', section: 'PROCUREMENT & STORE' },
  { name: 'Store Inventory & GRN', href: '/inventory', section: 'PROCUREMENT & STORE' },
  { name: 'Plant & Machinery', href: '/machinery', section: 'PROCUREMENT & STORE' },
  { name: 'Fixed Assets', href: '/assets', section: 'PROCUREMENT & STORE' },

  { name: 'Daily Progress Report (DPR)', href: '/dpr', section: 'SITE EXECUTION' },
  { name: 'Project Timeline', href: '/timeline', section: 'SITE EXECUTION' },
  { name: 'MB & Contractor Bills', href: '/contractor-bills', section: 'SITE EXECUTION' },
  { name: 'MB Bills Archive', href: '/mb-bills', section: 'SITE EXECUTION' },
  { name: 'Labor Muster Roll', href: '/labor', section: 'SITE EXECUTION' },

  { name: 'Enterprise Finance & 3-Way Audit', href: '/finance', section: 'FINANCE & LEGAL' },
  { name: 'Site Petty Cash', href: '/petty-cash', section: 'FINANCE & LEGAL' },
  { name: 'GST & Statutory Compliance', href: '/compliance', section: 'FINANCE & LEGAL' },

  { name: 'Real Estate Milestones', href: '/milestones', section: 'REAL ESTATE & HR' },
  { name: 'Customer Ledger', href: '/customer-ledger', section: 'REAL ESTATE & HR' },
  { name: 'Customer Payments', href: '/customer-payments', section: 'REAL ESTATE & HR' },
  { name: 'HR & Payroll', href: '/hr', section: 'REAL ESTATE & HR' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = [
    'EXECUTIVE',
    'PROCUREMENT & STORE',
    'SITE EXECUTION',
    'FINANCE & LEGAL',
    'REAL ESTATE & HR',
  ];

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 md:flex">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-wide text-white uppercase">
                  Universal Engicon
                </h2>
                <p className="text-[11px] text-slate-400">Enterprise ERP v2.0</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto p-4">
            {sections.map((section) => {
              const items = SIDEBAR_MENU.filter((item) => item.section === section);
              return (
                <div key={section}>
                  <p className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {section}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block w-full rounded-xl px-3.5 py-2.5 text-xs font-bold tracking-wide text-slate-100 bg-gradient-to-b from-slate-800 to-slate-900 border border-t-slate-600/80 border-l-slate-700/70 border-r-slate-950 border-b-2 border-b-slate-950 shadow-[0_3px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-200 ease-out transform hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:border-t-cyan-300/80 hover:border-b-blue-950 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_6px_16px_rgba(14,165,233,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] active:translate-y-0.5 active:scale-[0.98]"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">Supabase Live Sync</span>
            </div>
            <p className="mt-1 text-[11px]">MD Command Access</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}