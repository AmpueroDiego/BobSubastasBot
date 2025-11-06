'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getNombreAMostrar, getInicial, formatTiempo } from '@/app/lib/utils';

interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  alias: string | null;
  numero: string | null;
  activo: boolean;
  ultimo_mensaje_contenido?: string | null;
  ultimo_mensaje_tipo?: 'human' | 'ai' | null;
  mensajes_sin_leer: number;
  ultimo_mensaje: string | null;
}

interface ClientesSidebarProps {
  clientes: Cliente[];
  selectedClient: string;
  onSelectClient: (numero: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
}

export default function ClientesSidebar({
  clientes,
  selectedClient,
  onSelectClient,
  searchTerm,
  onSearchChange,
  onRefresh
}: ClientesSidebarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header con búsqueda y refresh */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Actualizar"
          >
            <ArrowPathIcon className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de clientes */}
      <div className="flex-1 overflow-y-auto">
        {clientes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No hay clientes</p>
          </div>
        ) : (
          clientes.map((cliente) => {
            const nombreAMostrar = getNombreAMostrar(
              cliente.nombre,
              cliente.apellido,
              cliente.alias,
              cliente.numero
            );

            const inicial = getInicial(
              cliente.nombre,
              cliente.apellido,
              cliente.alias,
              cliente.numero
            );

            const mensajePreview = cliente.ultimo_mensaje_contenido
              ? cliente.ultimo_mensaje_contenido.substring(0, 50)
              : 'Sin mensajes';

            return (
              <button
                key={cliente.numero}
                onClick={() => onSelectClient(cliente.numero || '')}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedClient === cliente.numero
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                      cliente.activo ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  >
                    {inicial}
                  </div>

                  {/* Info del cliente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {nombreAMostrar}
                      </h3>
                      {cliente.mensajes_sin_leer > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                          {cliente.mensajes_sin_leer}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">
                      {mensajePreview}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTiempo(cliente.ultimo_mensaje)}
                      </span>

                      {!cliente.activo && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded flex-shrink-0">
                          Bot inactivo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}