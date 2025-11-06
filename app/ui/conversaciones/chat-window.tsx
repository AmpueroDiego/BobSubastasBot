'use client';

import { useState, useEffect, useRef } from 'react';
import { getNombreAMostrar } from '@/app/lib/utils';
import { ArrowPathIcon, PowerIcon } from '@heroicons/react/24/outline';

interface Mensaje {
  id: string | number;
  type: 'human' | 'ai';
  content: string;
  timestamp?: number;
}

interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  alias: string | null;
  numero: string | null;
  activo: boolean;
}

interface Props {
  clienteNumero: string;
  clientes: Cliente[];
}

// Función para formatear número - mostrar solo 9 dígitos
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

function limpiarContenidoMensaje(content: string): string {
  if (!content) return '';
  
  if (content.includes('Mensaje del cliente:')) {
    let limpio = content.split('Analiza el mensaje y:')[0];
    limpio = limpio.replace('Mensaje del cliente:', '').trim();
    
    if (limpio.includes('Número de teléfono:')) {
      limpio = limpio.split('Número de teléfono:')[0].trim();
    }
    
    if (limpio.includes('Fecha y hora actual:')) {
      limpio = limpio.split('Fecha y hora actual:')[0].trim();
    }
    
    return limpio;
  }
  
  let limpio = content;
  if (limpio.includes('mensaje:')) {
    limpio = limpio.split('id_cliente')[0];
    limpio = limpio.replace('mensaje:', '').trim();
  }
  
  return limpio;
}

function formatearHora(timestamp?: number): string {
  if (!timestamp) return '';
  const fecha = new Date(timestamp * 1000);
  return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({ clienteNumero, clientes }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cliente = clientes.find(c => c.numero === clienteNumero);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const cargarMensajes = async (mostrarCarga = true) => {
    if (!clienteNumero) {
      setMensajes([]);
      return;
    }

    if (mostrarCarga) setCargando(true);

    try {
      const response = await fetch(
        `/api/conversaciones/mensajes?sessionId=${encodeURIComponent(clienteNumero)}&limit=100`
      );
      
      if (response.ok) {
        const data = await response.json();
        const mensajesFormateados = data.data.map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          content: limpiarContenidoMensaje(msg.content),
          timestamp: msg.timestamp
        }));
        setMensajes(mensajesFormateados);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  };

  const refrescarMensajes = async () => {
    setRefreshing(true);
    await cargarMensajes(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Toggle estado del bot
  const toggleEstadoBot = async () => {
    if (!cliente) return;

    try {
      setCambiandoEstado(true);
      
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activo: !cliente.activo,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado del bot');
      }

      // Actualizar el estado del cliente en la lista
      const clienteActualizado = clientes.find(c => c.id === cliente.id);
      if (clienteActualizado) {
        clienteActualizado.activo = !cliente.activo;
      }

      // Recargar la página para reflejar el cambio
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar estado del bot:', error);
      alert('Error al cambiar estado del bot');
    } finally {
      setCambiandoEstado(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, [clienteNumero]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    if (!clienteNumero) return;
    
    const interval = setInterval(() => {
      if (!document.hidden) {
        cargarMensajes(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [clienteNumero]);

  if (!clienteNumero) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm md:text-base">
            Selecciona una conversación para comenzar
          </p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  const nombreAMostrar = getNombreAMostrar(
    cliente?.nombre || null,
    cliente?.apellido || null,
    cliente?.alias || null,
    cliente?.numero || null
  );

  const numeroFormateado = formatearNumeroParaMostrar(cliente?.numero || null);

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header - Responsive con botón de bot */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm md:text-base">
              {nombreAMostrar.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                {nombreAMostrar}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                {numeroFormateado}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón activar/desactivar bot */}
            {cliente && (
              <button
                onClick={toggleEstadoBot}
                disabled={cambiandoEstado}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                  cliente.activo
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={cliente.activo ? 'Desactivar bot' : 'Activar bot'}
              >
                <PowerIcon className={`w-4 h-4 md:w-5 md:h-5 ${cambiandoEstado ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">
                  {cambiandoEstado ? 'Cambiando...' : cliente.activo ? 'Bot ON' : 'Bot OFF'}
                </span>
              </button>
            )}
            
            {/* Botón refrescar */}
            <button
              onClick={refrescarMensajes}
              className="flex-shrink-0 p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refrescar mensajes"
            >
              <ArrowPathIcon className={`h-4 w-4 md:h-5 md:w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes - Responsive */}
      {/* IMPORTANTE: 'human' = cliente (izquierda), 'ai' = bot (derecha) */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gray-50">
        {mensajes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm md:text-base">No hay mensajes</p>
          </div>
        ) : (
          mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`flex ${
                mensaje.type === 'human' 
                  ? 'justify-start'  /* Cliente a la IZQUIERDA */
                  : 'justify-end'    /* Bot a la DERECHA */
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                  mensaje.type === 'human'
                    ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'  /* Cliente: blanco */
                    : 'bg-blue-500 text-white rounded-br-sm'  /* Bot: azul */
                }`}
              >
                <p className="text-sm md:text-base break-words whitespace-pre-wrap">
                  {mensaje.content}
                </p>
                {mensaje.timestamp && (
                  <p
                    className={`text-xs mt-1 ${
                      mensaje.type === 'human' ? 'text-gray-500' : 'text-blue-100'
                    }`}
                  >
                    {formatearHora(mensaje.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer info - Responsive */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 md:px-6 py-2 md:py-3 bg-gray-50">
        <p className="text-xs md:text-sm text-gray-500 text-center">
          Esta es una conversación de solo lectura • {cliente?.activo ? '🟢 Bot activo' : '🔴 Bot inactivo'}
        </p>
      </div>
    </div>
  );
}