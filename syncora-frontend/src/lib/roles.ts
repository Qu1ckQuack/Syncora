import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'MODERATOR' | 'TECHNICIAN' | 'CUSTOMER';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: 'pending';
}

export const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
    roles: ['MODERATOR', 'TECHNICIAN'],
  },
  {
    label: 'Work Orders',
    href: '/dashboard/work-orders',
    icon: ClipboardList,
    roles: ['MODERATOR', 'TECHNICIAN', 'CUSTOMER'],
    badge: 'pending',
  },
  {
    label: 'People',
    href: '/dashboard/people',
    icon: Users,
    roles: ['MODERATOR'],
  },
  {
    label: 'System Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['MODERATOR'],
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
    roles: ['CUSTOMER'],
  },
];

export function filterNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
