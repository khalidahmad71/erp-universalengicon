// lib/rbac.ts

export type ErpRole =
  | 'admin'
  | 'accountant'
  | 'site_engineer'
  | 'store_manager'
  | 'purchase_officer'
  | 'purchase_manager'
  | 'vp_procurement';

export interface RoutePermissionRule {
  prefix: string;
  roles: ErpRole[];
  label: string;
}

export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  {
    prefix: '/users',
    roles: ['admin'],
    label: 'User & Role Management',
  },
  {
    prefix: '/md-approvals',
    roles: ['admin'],
    label: 'MD Approval Center',
  },
  {
    prefix: '/audit-logs',
    roles: ['admin'],
    label: 'Audit Logs',
  },
  {
    prefix: '/finance',
    roles: ['admin', 'accountant'],
    label: 'Finance & Ledger',
  },
  {
    prefix: '/sales',
    roles: ['admin', 'accountant'],
    label: 'Real Estate Sales',
  },
  {
    prefix: '/milestones',
    roles: ['admin', 'accountant'],
    label: 'Payment Milestones',
  },
  {
    prefix: '/vendors',
    roles: ['admin', 'accountant', 'purchase_officer', 'purchase_manager', 'vp_procurement'],
    label: 'Vendor Master',
  },
  {
    prefix: '/po',
    roles: ['admin', 'accountant', 'purchase_officer', 'purchase_manager', 'vp_procurement'],
    label: 'Purchase Orders',
  },
  {
    prefix: '/work-orders',
    roles: ['admin', 'accountant', 'site_engineer', 'purchase_manager'],
    label: 'Work Orders & Billing',
  },
  {
    prefix: '/boq',
    roles: ['admin', 'site_engineer', 'accountant'],
    label: 'BOQ & RA Billing',
  },
  {
    prefix: '/inventory',
    roles: ['admin', 'store_manager', 'site_engineer'],
    label: 'Inventory & GRN',
  },
  {
    prefix: '/dpr',
    roles: ['admin', 'site_engineer'],
    label: 'Daily Progress & Plant',
  },
];

export function normalizeRole(role?: string | null): ErpRole | null {
  if (!role) return null;
  const cleaned = role.trim().toLowerCase();
  const validRoles: ErpRole[] = [
    'admin',
    'accountant',
    'site_engineer',
    'store_manager',
    'purchase_officer',
    'purchase_manager',
    'vp_procurement',
  ];
  return validRoles.includes(cleaned as ErpRole) ? (cleaned as ErpRole) : null;
}

export function canAccessRoute(pathname: string, role?: string | null): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  const matchedRule = ROUTE_PERMISSIONS.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
  );

  if (!matchedRule) {
    return true;
  }

  return matchedRule.roles.includes(normalizedRole);
}