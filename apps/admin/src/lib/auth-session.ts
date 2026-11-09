import { AdminRole } from '@mastera/contracts';

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  accessToken: string;
}

const SESSION_KEY = 'mastera_admin_session';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
