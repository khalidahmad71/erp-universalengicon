export type ErpRole =
  | 'MD'
  | 'ADMIN'
  | 'ACCOUNTS'
  | 'SALES'
  | 'SITE_ENGINEER'
  | 'VIEWER';

export const ERP_ROLE_COOKIE = 'erp_role';

const VALID_ROLES: ErpRole[] = [
  'MD',
  'ADMIN',
  'ACCOUNTS',
  'SALES',
  'SITE_ENGINEER',
  'VIEWER',
];

export function normalizeErpRole(rawRole?: string | null): ErpRole {
  if (!rawRole) return 'VIEWER';
  const upper = rawRole.trim().toUpperCase();
  if (upper === 'MANAGING_DIRECTOR' || upper === 'DIRECTOR') return 'MD';
  if (upper === 'ACCOUNTANT' || upper === 'FINANCE') return 'ACCOUNTS';
  if (VALID_ROLES.includes(upper as ErpRole)) {
    return upper as ErpRole;
  }
  return 'VIEWER';
}

export function setErpRoleCookieClient(role: ErpRole): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeErpRole(role);
  const maxAgeSeconds = 60 * 60 * 24 * 7;
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ERP_ROLE_COOKIE}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

export function clearErpRoleCookieClient(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ERP_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function canAccessRoute(role: ErpRole, pathname: string): boolean {
  const normalized = normalizeErpRole(role);

  if (normalized === 'MD' || normalized === 'ADMIN') {
    return true;
  }

  if (pathname.startsWith('/md-approvals') || pathname.startsWith('/audit-logs')) {
    return false;
  }

  if (pathname.startsWith('/finance') || pathname.startsWith('/accounts')) {
    return normalized === 'ACCOUNTS';
  }

  if (pathname.startsWith('/sales') || pathname.startsWith('/real-estate')) {
    return (
      normalized === 'SALES' ||
      normalized === 'SITE_ENGINEER' ||
      normalized === 'VIEWER'
    );
  }

  return true;
}