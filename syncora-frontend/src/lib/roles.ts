import {
  LayoutDashboard,
  ClipboardList,
  ClipboardPlus,
  Users,
  Settings,
  UserCircle,
  Map,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'HQ' | 'TECHNICIAN' | 'CUSTOMER' | 'DEALER';

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
    roles: ['HQ', 'TECHNICIAN'],
  },
  {
    label: 'Work Orders',
    href: '/dashboard/work-orders',
    icon: ClipboardList,
    roles: ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
    badge: 'pending',
  },
  {
    label: 'New Order',
    href: '/dashboard/work-orders/new',
    icon: ClipboardPlus,
    roles: ['HQ', 'CUSTOMER', 'DEALER'],
  },
  {
    label: 'Map',
    href: '/dashboard/map',
    icon: Map,
    roles: ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['HQ'],
  },
  {
    label: 'People',
    href: '/dashboard/people',
    icon: Users,
    roles: ['HQ'],
  },
  {
    label: 'System Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['HQ'],
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
    roles: ['HQ', 'TECHNICIAN', 'CUSTOMER', 'DEALER'],
  },
];

export function filterNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
