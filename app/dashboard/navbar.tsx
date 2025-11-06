// app/ui/dashboard/navbar.tsx
'use client';

import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';

export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            {/* Barra de búsqueda */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Íconos de la derecha */}
          <div className="ml-4 flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600">
              <BellIcon className="h-6 w-6" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <UserCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}