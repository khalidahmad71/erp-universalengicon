import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '../components/Sidebar';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Universal Engicon Pvt. Ltd. | Corporate & Enterprise ERP',
  description: 'Civil Construction, Infrastructure & Real Estate Enterprise ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-slate-50 text-slate-900 antialiased`}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          <Sidebar />
          <main className="flex-1 w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}