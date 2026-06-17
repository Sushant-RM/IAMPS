export interface StoredUser {
  _id?: string;
  fullName: string;
  email: string;
  role: string;
  usn?: string;
  departmentId?: string;
}

const REDIRECT_KEY = 'authRedirect';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken() && getStoredUser());
}

export function saveAuthRedirect(path: string) {
  if (typeof window === 'undefined') return;
  if (path === '/login' || path === '/register') return;
  sessionStorage.setItem(REDIRECT_KEY, path);
}

export function consumeAuthRedirect(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const saved = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return saved || fallback;
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
