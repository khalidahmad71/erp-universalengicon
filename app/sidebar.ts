export interface SidebarItem {
  name: string;
  href: string;
  section: 'EXECUTIVE' | 'PROCUREMENT & STORE' | 'SITE EXECUTION' | 'FINANCE & LEGAL' | 'REAL ESTATE & HR';
}

export const SIDEBAR_MENU: SidebarItem[] = [
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