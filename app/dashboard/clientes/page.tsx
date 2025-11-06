'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import ClienteDetalleModal from '@/app/ui/clientes/cliente-detalle-modal';

interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  alias: string | null;
  edad: number | null;
  numero: string | null;
  genero: string | null;
  primer_mensaje: string | null;
  ultimo_mensaje: string | null;
  activo: boolean;
  total_citas?: number;
  citas_asistidas?: number;
  citas_no_asistidas?: number;
  citas_pendientes?: number;
}

// Función para formatear número - mostrar solo 9 dígitos
function formatearNumeroParaMostrar(numero: string | null): string {
  if (!numero) return '-';
  
  // Si tiene formato de WhatsApp: 51963449351@s.whatsapp.net
  if (numero.includes('@s.whatsapp.net')) {
    const match = numero.match(/(\d+)@s\.whatsapp\.net/);
    if (match && match[1]) {
      const digitos = match[1];
      // Si empieza con 51 (código de Perú), removerlo
      if (digitos.startsWith('51') && digitos.length > 9) {
        return digitos.substring(2);
      }
      return digitos;
    }
  }
  
  // Si es solo número con código 51
  if (numero.startsWith('51') && numero.length > 9) {
    return numero.substring(2);
  }
  
  // Devolver solo los dígitos
  return numero.replace(/\D/g, '');
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clientes/estadisticas');
      if (response.ok) {
        const data = await response.json();
        setClientes(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await cargarClientes();
    // Actualizar el cliente seleccionado con los datos actualizados
    if (clienteSeleccionado) {
      const response = await fetch('/api/clientes/estadisticas');
      if (response.ok) {
        const data = await response.json();
        const clienteActualizado = data.data.find((c: Cliente) => c.id === clienteSeleccionado.id);
        if (clienteActualizado) {
          setClienteSeleccionado(clienteActualizado);
        }
      }
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    
    // Buscar también en el número formateado
    const numeroFormateado = formatearNumeroParaMostrar(cliente.numero);
    
    return (
      cliente.nombre?.toLowerCase().includes(search) ||
      cliente.apellido?.toLowerCase().includes(search) ||
      cliente.alias?.toLowerCase().includes(search) ||
      cliente.numero?.includes(search) ||
      numeroFormateado.includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, alias o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
          />
        </div>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const nombreCompleto = [cliente.nombre, cliente.apellido]
                    .filter(Boolean)
                    .join(' ') || 'Sin nombre';
                  
                  // ✅ FORMATEAR NÚMERO AQUÍ
                  const numeroFormateado = formatearNumeroParaMostrar(cliente.numero);

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {nombreCompleto}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cliente.alias || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono">
                          {numeroFormateado}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cliente.total_citas !== undefined ? (
                            <div className="flex gap-2">
                              <span className="text-green-600">{cliente.citas_asistidas || 0}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-blue-600">{cliente.total_citas || 0}</span>
                            </div>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setClienteSeleccionado(cliente)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Ver / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-4">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No se encontraron clientes
          </div>
        ) : (
          clientesFiltrados.map((cliente) => {
            const nombreCompleto = [cliente.nombre, cliente.apellido]
              .filter(Boolean)
              .join(' ') || 'Sin nombre';
            
            // ✅ FORMATEAR NÚMERO AQUÍ TAMBIÉN
            const numeroFormateado = formatearNumeroParaMostrar(cliente.numero);

            return (
              <div
                key={cliente.id}
                className="bg-white rounded-lg shadow p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {nombreCompleto}
                    </h3>
                    {cliente.alias && (
                      <p className="text-xs text-gray-500 mt-1">
                        Alias: {cliente.alias}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cliente.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Número:</span>
                    <span className="text-gray-900 font-mono">{numeroFormateado}</span>
                  </div>
                  
                  {cliente.total_citas !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Citas:</span>
                      <div className="flex gap-2">
                        <span className="text-green-600">{cliente.citas_asistidas || 0}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-blue-600">{cliente.total_citas || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setClienteSeleccionado(cliente)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver / Editar
                </button>
              </div>
            );
          })
        )}
      </div>

      {clienteSeleccionado && (
        <ClienteDetalleModal
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}