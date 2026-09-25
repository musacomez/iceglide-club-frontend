import type { UserRole } from '@/types/api';

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  head_coach: '/coach',
  instructor: '/instructor',
  parent: '/parent',
  student: '/student',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Yönetici',
  head_coach: 'Baş Antrenör',
  instructor: 'Eğitmen',
  parent: 'Veli',
  student: 'Öğrenci',
};

export interface NavItem {
  href: string;
  label: string;
}

export function navForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'admin':
      return [
        { href: '/admin', label: 'Panel' },
        { href: '/admin/calendar', label: 'Takvim' },
        { href: '/admin/students', label: 'Öğrenciler' },
        { href: '/admin/packages', label: 'Paketler' },
        { href: '/admin/payments', label: 'Ödemeler' },
      ];
    case 'head_coach':
      return [
        { href: '/coach', label: 'Panel' },
        { href: '/coach/calendar', label: 'Takvim' },
        { href: '/coach/students', label: 'Öğrenciler' },
      ];
    case 'instructor':
      return [
        { href: '/instructor', label: 'Panel' },
        { href: '/instructor/calendar', label: 'Takvim' },
        { href: '/instructor/students', label: 'Öğrencilerim' },
      ];
    case 'parent':
      return [
        { href: '/parent', label: 'Panel' },
        { href: '/parent/children', label: 'Çocuklarım' },
        { href: '/parent/calendar', label: 'Takvim' },
        { href: '/parent/packages', label: 'Paketler' },
        { href: '/parent/payments', label: 'Ödemeler' },
      ];
    case 'student':
      return [
        { href: '/student', label: 'Panel' },
        { href: '/student/calendar', label: 'Takvim' },
        { href: '/student/packages', label: 'Paketlerim' },
        { href: '/student/payments', label: 'Ödemelerim' },
      ];
    default:
      return [];
  }
}

// Which section prefixes belong to which role - used for the client-side
// route guard. The Worker is the real authority; this only avoids showing a
// user a dashboard shell that will just 403 on every request.
export function sectionForRole(role: UserRole): string {
  return ROLE_HOME[role];
}
