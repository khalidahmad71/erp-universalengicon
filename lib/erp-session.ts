import { supabase } from '@/lib/supabase';
import type { ErpRole } from '@/lib/rbac';

const COOKIE_NAME = 'erp_role';
const MAX_AGE_SECONDS = 60 * 60 * 12;

export async function setErpRoleSession(params: {
  role: ErpRole;
  userEmail?: string;
  userName?: string;
}) {
  const { role, userEmail = 'system@universalengicon.com', userName = 'ERP User' } = params;

  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
      role
    )}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
    localStorage.setItem(COOKIE_NAME, role);
  }

  try {
    await supabase.from('erp_audit_logs').insert([
      {
        action: 'ROLE_SESSION_STARTED',
        module: 'AUTH_RBAC',
        performed_by: `${userName} (${userEmail})`,
        role_used: role,
        details: `Active ERP session initialized with role: ${role}`,
      },
    ]);
  } catch (err) {
    console.warn('Audit log insert skipped:', err);
  }
}

export function clearErpRoleSession() {
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(COOKIE_NAME);
  }
}

export function getClientErpRole(): ErpRole | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    return decodeURIComponent(match.split('=')[1]) as ErpRole;
  }
  return null;
}