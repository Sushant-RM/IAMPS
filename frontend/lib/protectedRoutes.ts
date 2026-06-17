import { getDashboardPath } from './navigation';

export const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/browse-papers',
  '/papers',
  '/paper/',
  '/departments',
  '/department/',
  '/events',
  '/faculty/',
];

export const PUBLIC_EXACT = ['/', '/faculty'];

const STUDENT_PREFIXES = [
  '/dashboard/student',
  '/dashboard/portfolio',
  '/upload/paper',
  '/events/submit',
  '/events/my',
  '/insights',
  '/achievements',
];

const FACULTY_PREFIXES = ['/dashboard/faculty', '/events/create', '/admin/report'];

const HOD_PREFIXES = ['/dashboard/hod', '/admin/report'];

const ADMIN_PREFIXES = ['/dashboard/admin', '/admin/', '/browse-papers', '/dashboard/achievements', '/achievements'];

const COMMITTEE_PREFIXES = ['/dashboard/faculty', '/admin/report'];

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function isPublicPath(path: string): boolean {
  if (PUBLIC_EXACT.includes(path)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isPathAllowedForRole(path: string, role: string): boolean {
  if (role === 'admin') {
    return matchesPrefix(path, [...ADMIN_PREFIXES, '/dashboard/portfolio', '/insights', '/events']);
  }
  if (role === 'hod') {
    return matchesPrefix(path, [...HOD_PREFIXES, '/events', '/browse-papers', '/achievements', '/dashboard/achievements']);
  }
  if (role === 'faculty' || role === 'committee_member') {
    const allowed = role === 'committee_member' ? COMMITTEE_PREFIXES : FACULTY_PREFIXES;
    return matchesPrefix(path, [...allowed, '/events', '/browse-papers']);
  }
  if (role === 'student') {
    return matchesPrefix(path, STUDENT_PREFIXES);
  }
  if (role === 'alumni') {
    return path.startsWith('/dashboard/alumni');
  }
  return false;
}

export function requiresAuthentication(path: string): boolean {
  if (path.startsWith('/dashboard/alumni')) return true;
  if (path.startsWith('/faculty/')) return false;
  if (isPublicPath(path)) return false;
  if (path.startsWith('/dashboard')) return true;
  if (path.startsWith('/admin')) return true;
  if (path.startsWith('/upload')) return true;
  if (path.startsWith('/insights')) return true;
  if (path.startsWith('/achievements')) return true;
  if (path.startsWith('/events/submit') || path.startsWith('/events/my') || path.startsWith('/events/create')) return true;
  return false;
}

export function getDefaultDashboard(role: string): string {
  return getDashboardPath(role);
}
