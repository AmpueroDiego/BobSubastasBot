'use client';

import { useState, useEffect } from 'react';
import ClientesSidebar from './clientes-sidebar';
import ChatWindow from './chat-window';
import { getNombreAMostrar } from '@/app/lib/utils';
import { ClienteConUltimoMensaje } from '@/app/lib/chat-data';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface Props {
  clientes: ClienteConUltimoMensaje[];
  clienteSeleccionado?: string;
}

export default function ConversacionesList({
  clientes: clientesIniciales,
  clienteSeleccionado = ''
}: Props) {
  const [clientes, setClientes] = useState<ClienteConUltimoMensaje[]>(clientesIniciales);
  const [selectedClient, setSelectedClient] = useState(clienteSeleccionado);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Para mobile

  // Actualizar cada 60 segundos si la pestaña está visible
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const actualizarClientes = async () => {
      if (document.hidden) return;

      try {
        const response = await fetch('/api/conversaciones/clientes');
        if (response.ok) {
          const data = await response.json();
          setClientes(data);
        }
      } catch (error) {
        console.error('Error al actualizar clientes:', error);
      }
    };

    interval = setInterval(actualizarClientes, 60000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        actualizarClientes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Función para refrescar manualmente
  const refrescarClientes = async () => {
    try {
      const response = await fetch('/api/conversaciones/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error al refrescar clientes:', error);
    }
  };

  // Manejar selección de cliente (cerrar sidebar en mobile)
  const handleSelectClient = (numero: string) => {
    setSelectedClient(numero);
    setSidebarOpen(false); // Cerrar sidebar en mobile después de seleccionar
  };

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(cliente => {
    const nombreAMostrar = getNombreAMostrar(
      cliente.nombre,
      cliente.apellido,
      cliente.alias,
      cliente.numero
    );
    const numero = cliente.numero || '';
    const search = searchTerm.toLowerCase();
    return nombreAMostrar.toLowerCase().includes(search) || numero.includes(search);
  });

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
      {/* Botón hamburguesa para mobile - POSICIÓN DERECHA */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 right-4 z-50 p-2 bg-blue-500 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar de clientes - Responsive */}
      <div
        className={`
          fixed md:relative
          inset-y-0 left-0
          w-80 md:w-80
          bg-white
          transform transition-transform duration-300 ease-in-out
          z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <ClientesSidebar
          clientes={clientesFiltrados}
          selectedClient={selectedClient || ''}
          onSelectClient={handleSelectClient}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={refrescarClientes}
        />
      </div>

      {/* Ventana de chat - Responsive */}
      <div className="flex-1 w-full md:w-auto">
        <ChatWindow
          clienteNumero={selectedClient || ''}
          clientes={clientes}
        />
      </div>
    </div>
  );
}