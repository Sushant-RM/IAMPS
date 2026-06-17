export type AppRole = 'student' | 'faculty' | 'hod' | 'admin' | 'committee_member';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

export function getDashboardPath(role: string): string {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'hod') return '/dashboard/hod';
  if (role === 'faculty' || role === 'committee_member') return '/dashboard/faculty';
  if (role === 'alumni') return '/dashboard/alumni';
  return '/dashboard/student';
}

export function getHodNavigation(pendingCount = 0): NavItem[] {
  return [
    { href: '/dashboard/hod?tab=dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/hod?tab=approvals', label: 'Approvals Queue', icon: '⏳', badge: pendingCount },
    { href: '/dashboard/hod?tab=faculty', label: 'Faculty Performance', icon: '👨‍🏫' },
    { href: '/dashboard/hod?tab=research', label: 'Research Analytics', icon: '📝' },
    { href: '/dashboard/hod?tab=achievements', label: 'Student Achievements', icon: '🏆' },
    { href: '/dashboard/hod?tab=reports', label: 'Reports Generator', icon: '📄' },
    { href: '/admin/report', label: 'Annual Report', icon: '📈' },
  ];
}

export function getRoleNavigation(role: string, options?: { pendingCount?: number }): NavItem[] {
  switch (role) {
    case 'student':
      return [
        { href: '/dashboard/student', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/portfolio', label: 'Portfolio', icon: '📁' },
        { href: '/achievements', label: 'Achievements', icon: '🏆' },
        { href: '/upload/paper', label: 'Research Papers', icon: '📝' },
        { href: '/events/my', label: 'Certificates & Events', icon: '🎫' },
        { href: '/events', label: 'Events', icon: '📅' },
        { href: '/insights', label: 'Career Insights', icon: '💡' },
      ];
    case 'faculty':
    case 'committee_member':
      return [
        { href: '/dashboard/faculty', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/faculty?tab=papers', label: 'Research Reviews', icon: '📝' },
        { href: '/events', label: 'Events', icon: '📅' },
        { href: '/events/create', label: 'Create Event', icon: '➕' },
        { href: '/admin/report', label: 'Reports', icon: '📄' },
      ];
    case 'hod':
      return getHodNavigation(options?.pendingCount || 0);
    case 'admin':
      return [
        { href: '/dashboard/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/departments', label: 'Departments', icon: '🏢' },
        { href: '/dashboard/achievements', label: 'Achievements', icon: '🏆' },
        { href: '/browse-papers', label: 'Research Papers', icon: '📝' },
        { href: '/events', label: 'Events', icon: '📅' },
        { href: '/admin/analytics', label: 'System Analytics', icon: '📈' },
        { href: '/admin/report', label: 'Reports', icon: '📄' },
      ];
    case 'alumni':
      return [{ href: '/dashboard/alumni', label: 'Dashboard', icon: '📊' }];
    default:
      return [{ href: '/dashboard/student', label: 'Dashboard', icon: '📊' }];
  }
}

export function getNavbarLinks(role?: string | null) {
  const common = [
    { href: '/browse-papers', label: 'Library' },
    { href: '/events', label: 'Events' },
  ];

  if (!role) {
    return [
      ...common,
      { href: '/departments', label: 'Departments' },
      { href: '/login', label: 'Login' },
    ];
  }

  if (role === 'admin') {
    return [
      ...common,
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/users', label: 'Users' },
      { href: '/departments', label: 'Departments' },
    ];
  }

  if (role === 'student') {
    return [
      ...common,
      { href: '/dashboard/portfolio', label: 'Portfolio' },
      { href: '/achievements', label: 'Achievements' },
      { href: '/insights', label: 'Insights' },
    ];
  }

  if (role === 'faculty' || role === 'committee_member') {
    return [
      ...common,
      { href: '/dashboard/faculty?tab=papers', label: 'Reviews' },
      { href: '/admin/report', label: 'Reports' },
    ];
  }

  if (role === 'hod') {
    return [
      ...common,
      { href: '/dashboard/hod?tab=approvals', label: 'Approvals' },
      { href: '/admin/report', label: 'Reports' },
    ];
  }

  return common;
}
