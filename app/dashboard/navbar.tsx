// app/dashboard/navbar.tsx
'use client';

import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Conversaciones', href: '/dashboard/conversaciones', icon: ChatBubbleLeftRightIcon },
  { name: 'Clientes', href: '/dashboard/clientes', icon: UserGroupIcon },
  { name: 'Citas', href: '/dashboard/citas', icon: CalendarDaysIcon },
  { name: 'Configuración', href: '/dashboard/configuraciones', icon: CogIcon }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Primera fila: Logo, Búsqueda y Usuario */}
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-blue-600">Bob Subastas</h1>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Íconos de la derecha */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <BellIcon className="h-6 w-6" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <UserCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Segunda fila: Menú horizontal con scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 pb-2 min-w-max">
            {navLinks.map((link) => {
              const LinkIcon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg 
                    transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-sm">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}