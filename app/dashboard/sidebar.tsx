// app/ui/dashboard/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const links = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon 
  },
  { 
    name: 'Conversaciones', 
    href: '/dashboard/conversaciones', 
    icon: ChatBubbleLeftRightIcon 
  },
  { 
    name: 'Clientes', 
    href: '/dashboard/clientes', 
    icon: UserGroupIcon 
  },
  { 
    name: 'Citas', 
    href: '/dashboard/citas', 
    icon: CalendarDaysIcon 
  },
  { 
    name: 'Configuración', 
    href: '/dashboard/configuraciones', 
    icon: CogIcon 
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:block w-64 bg-white border-r shadow-md">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Bob Subastas</h1>
      </div>
      <nav className="p-4">
        {links.map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors 
                ${pathname === link.href 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <LinkIcon className="w-6 h-6" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}