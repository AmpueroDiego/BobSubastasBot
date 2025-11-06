// app/dashboard/conversaciones/clientes-sidebar.tsx
'use client';

import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getNombreAMostrar } from '@/app/lib/utils';
import { ClienteConUltimoMensaje } from '@/app/lib/chat-data';
import { useState } from 'react';
import { useUmbrales } from '@/app/hooks/useUmbrales';


interface Props {
  clientes: ClienteConUltimoMensaje[];
  selectedClient: string;
  onSelectClient: (numero: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => Promise<void>;
}

function formatearNumeroParaMostrar(numero: string | null): string {
  if (!numero) return '';
  
  if (numero.includes('@s.whatsapp.net')) {
    const match = numero.match(/(\d+)@s\.whatsapp\.net/);
    if (match && match[1]) {
      const digitos = match[1];
      if (digitos.startsWith('51') && digitos.length > 9) {
        return digitos.substring(2);
      }
      return digitos;
    }
  }
  
  if (numero.startsWith('51') && numero.length > 9) {
    return numero.substring(2);
  }
  
  return numero.replace(/\D/g, '');
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '';
  
  const date = new Date(fecha);
  const ahora = new Date();
  const diff = ahora.getTime() - date.getTime();
  const horas = Math.floor(diff / (1000 * 60 * 60));
  
  if (horas < 1) {
    const minutos = Math.floor(diff / (1000 * 60));
    return `Hace ${minutos}m`;
  } else if (horas < 24) {
    return `Hace ${horas}h`;
  } else {
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias}d`;
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}

function truncarMensaje(mensaje: string | null | undefined, maxLength: number = 50): string {
  if (!mensaje) return 'Sin mensajes';
  
  // Limpiar el mensaje
  let limpio = mensaje;
  if (limpio.includes('Mensaje del cliente:')) {
    limpio = limpio.split('Analiza el mensaje y:')[0];
    limpio = limpio.replace('Mensaje del cliente:', '').trim();
  }
  
  if (limpio.length > maxLength) {
    return limpio.substring(0, maxLength) + '...';
  }
  return limpio;
}

// Función para obtener el color y nivel de intención de compra
function getIntencionCompra(
  score1: number | null | undefined,
  umbral_bajo: number,
  umbral_alto: number
): {
  nivel: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  const score = score1 ?? 0;
  
  if (score >= umbral_alto) {
    return {
      nivel: 'Alto',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    };
  } else if (score >= umbral_bajo) {
    return {
      nivel: 'Medio',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    };
  } else {
    return {
      nivel: 'Bajo',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  }
}

export default function ClientesSidebar({
  clientes,
  selectedClient,
  onSelectClient,
  searchTerm,
  onSearchChange,
  onRefresh
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const { umbrales } = useUmbrales(); // ← AGREGAR ESTA LÍNEA

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
          <button
            onClick={handleRefresh}
            className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            disabled={refreshing}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Contador */}
        <div className="mt-2 text-xs text-gray-500">
          {clientes.length} {clientes.length === 1 ? 'conversación' : 'conversaciones'}
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="flex-1 overflow-y-auto">
        {clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No hay conversaciones</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Intenta con otra búsqueda' : 'Las conversaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clientes.map((cliente) => {
              const nombreMostrar = getNombreAMostrar(
                cliente.nombre,
                cliente.apellido,
                cliente.alias,
                cliente.numero
              );
              const numeroMostrar = formatearNumeroParaMostrar(cliente.numero);
              const isSelected = cliente.numero === selectedClient;
              const tieneNuevosMensajes = (cliente.mensajes_sin_leer ?? 0) > 0;
              const intencion = getIntencionCompra(cliente.score1, umbrales.umbral_bajo, umbrales.umbral_alto);


              return (
                <button
                  key={cliente.numero}
                  onClick={() => onSelectClient(cliente.numero || '')}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors relative ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Nombre y estado */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {nombreMostrar}
                        </h3>
                        {!cliente.activo && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Bot OFF
                          </span>
                        )}
                      </div>

                      {/* Número e intención de compra */}
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-gray-500">
                          +51 {numeroMostrar}
                        </p>
                        {/* Indicador de intención de compra */}
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${intencion.color}`} />
                          <span className={`text-xs font-medium ${intencion.textColor}`}>
                            {intencion.nivel}
                          </span>
                        </div>
                      </div>

                      {/* Último mensaje */}
                      <p className={`text-sm ${tieneNuevosMensajes ? 'font-semibold text-gray-900' : 'text-gray-600'} truncate`}>
                        {truncarMensaje(cliente.ultimo_mensaje_contenido)}
                      </p>
                    </div>

                    {/* Hora y badge */}
                    <div className="flex-shrink-0 ml-3 flex flex-col items-end">
                      <span className="text-xs text-gray-500 mb-1">
                        {formatearFecha(cliente.ultimo_mensaje)}
                      </span>
                      {tieneNuevosMensajes && (
                        <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                          {(cliente.mensajes_sin_leer ?? 0) > 9 ? '9+' : cliente.mensajes_sin_leer ?? 0}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}