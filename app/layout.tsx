import type { Metadata } from "next";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";

export const metadata: Metadata = {
  title: "Universal Engicon ERP",
  description: "Universal Engicon Pvt. Ltd. Enterprise Resource Planning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8F7F4] text-slate-900">
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}