import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Universal Engicon ERP',
  description: 'Enterprise Resource Planning System for Civil Construction & Real Estate',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: '📊 Dashboard Home', href: '/' },
    { name: '🏢 Unit Inventory (Godrej Zen)', href: '/inventory' },
    { name: '💰 Customer Payments', href: '/customer-payments' },
    { name: '📑 Deferred GST Ledger', href: '/customer-ledger' },
    { name: '📐 Contractor MB & RA Bills', href: '/contractor-bills' },
    { name: '👷‍♂️ Labor Muster Roll', href: '/hr' },
    { name: '🚜 Plant & Machinery Fleet', href: '/machinery' },
    { name: '📈 Financial P&L Statement', href: '/finance' },
    { name: '📦 Purchase Orders (PO)', href: '/po' },
  ];

  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 flex h-screen overflow-hidden">
        
        {/* Left Side Menu Navigation Sidebar */}
        <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shadow-xl">
          <div>
            <div className="mb-6 px-3 pt-2">
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-extrabold">Universal Engicon</span>
              <h2 className="text-base font-black text-white tracking-wide">ERP Corporate Suite</h2>
            </div>

            <nav className="space-y-1.5">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition shadow-sm"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 px-3 text-[11px] text-slate-500 font-medium">
            Godrej Zen Estate Phase-2 <br />
            <span className="text-emerald-400 font-bold">● System Connected</span>
          </div>
        </aside>

        {/* Right Side Main Content Area */}
        <main className="flex-1 bg-slate-100 text-slate-900 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}