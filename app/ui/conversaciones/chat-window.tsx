// app/ui/conversaciones/chat-window.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getNombreAMostrar } from '@/app/lib/utils';
import { ArrowPathIcon, PowerIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
// Agregar esta función al inicio del archivo (después de las otras funciones helper)
function getEmojiEmocion(emocion: string | null): string {
  switch (emocion) {
    case 'EM_SATISFACCION':
      return '😊';
    case 'EM_NEUTRO':
      return '😐';
    case 'EM_DUDA':
      return '🤔';
    case 'EM_MOLESTIA':
      return '😠';
    case 'EM_ENTUSIASMO':  // ← AGREGAR ESTE
      return '🤩';
    case 'EM_FELICIDAD':   // ← POR SI HAY MÁS
      return '😄';
    case 'EM_TRISTEZA':
      return '😢';
    case 'EM_PREOCUPACION':
      return '😟';
    default:
      return '❓'; // ← Cambiar de '' a '❓' para debug
  }
}
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
    emocion: string | null; // ← AGREGAR ESTA LÍNEA

}

interface Props {
  clienteNumero: string;
  clientes: Cliente[];
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

function limpiarContenidoMensaje(content: string): string {
  if (!content) return '';
  
  if (content.includes('Mensaje del cliente:')) {
    let limpio = content.split('Analiza el mensaje y:')[0];
    limpio = limpio.replace('Mensaje del cliente:', '').trim();
    
    if (limpio.includes('NÃºmero de telÃ©fono:')) {
      limpio = limpio.split('NÃºmero de telÃ©fono:')[0].trim();
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
  const [refreshing, setRefreshing] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cliente = clientes.find(c => c.numero === clienteNumero);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const cargarMensajes = async (mostrarCarga = true) => {
    console.log('🔄 cargarMensajes llamado con clienteNumero:', clienteNumero);
    console.log('   tipo:', typeof clienteNumero);
    console.log('   length:', clienteNumero?.length);
    
    if (!clienteNumero || clienteNumero === '') {
      console.log('❌ clienteNumero está vacío, no se cargarán mensajes');
      setMensajes([]);
      return;
    }

    if (mostrarCarga) setCargando(true);

    try {
      const url = `/api/conversaciones/mensajes?session_id=${encodeURIComponent(clienteNumero)}`;
      console.log('📡 Haciendo fetch a:', url);
      console.log('   clienteNumero codificado:', encodeURIComponent(clienteNumero));
      
      const response = await fetch(url);
      
      console.log('📬 Respuesta recibida:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos del servidor:', data);
        
        if (data.mensajes && Array.isArray(data.mensajes)) {
          const mensajesFormateados = data.mensajes.map((msg: any) => ({
            id: msg.id,
            type: msg.tipo === 'recibido' ? 'human' : 'ai',
            content: msg.texto || '',
            timestamp: msg.created_at ? new Date(msg.created_at).getTime() / 1000 : undefined
          }));
          
          console.log('✅ Mensajes formateados:', mensajesFormateados.length);
          setMensajes(mensajesFormateados);
        } else {
          console.warn('⚠️ Estructura de datos inesperada:', data);
          setMensajes([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', {
          status: response.status,
          error: errorText
        });
        setMensajes([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
      setMensajes([]);
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  };

  const refrescarMensajes = async () => {
    setRefreshing(true);
    await cargarMensajes(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  const toggleEstadoBot = async () => {
    if (!cliente) return;
    
    setCambiandoEstado(true);
    try {
      const response = await fetch('/api/clientes/toggle-activo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cliente.id })
      });

      if (response.ok) {
        await cargarMensajes(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setCambiandoEstado(false);
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !clienteNumero || enviando) return;

    setEnviando(true);
    try {
      const response = await fetch('/api/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: clienteNumero,
          mensaje: nuevoMensaje.trim(),
          tipo: 'ai'
        })
      });

      if (response.ok) {
        setNuevoMensaje('');
        await cargarMensajes(false);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect disparado - clienteNumero cambió a:', clienteNumero);
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

  // Vista vacía
  if (!clienteNumero) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Bienvenido a tus conversaciones
          </h3>
          <p className="text-gray-500">
            Selecciona un cliente de la lista para ver la conversación
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  const nombreMostrar = cliente ? getNombreAMostrar(
  cliente.nombre,
  cliente.apellido,
  cliente.alias,
  cliente.numero
) : 'Cliente';
const numeroMostrar = cliente ? formatearNumeroParaMostrar(cliente.numero) : '';
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header del chat */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
    {nombreMostrar.charAt(0).toUpperCase()}
  </div>
  <div>
    <h3 className="font-semibold text-gray-900">{nombreMostrar}</h3>
    <p className="text-sm text-gray-500">+51 {numeroMostrar}</p>
  </div>
  {/* EMOJI DE EMOCIÓN - AHORA ESTÁ FUERA */}
  {/* EMOJI DE EMOCIÓN CON TEXTO */}
{cliente?.emocion && (
  <div className="flex items-center gap-2 ml-2">
    <span className="text-2xl" title={cliente.emocion}>
      {getEmojiEmocion(cliente.emocion)}
    </span>
    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
      {cliente.emocion.replace('EM_', '')}
    </span>
  </div>
)}
</div>

        <div className="flex items-center gap-2">
          {/* Botón de refrescar */}
          <button
            onClick={refrescarMensajes}
            disabled={refreshing}
            className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refrescar mensajes"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          {/* Botón de estado del bot */}
          {cliente && (
            <button
              onClick={toggleEstadoBot}
              disabled={cambiandoEstado}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                cliente.activo
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title={cliente.activo ? 'Desactivar bot' : 'Activar bot'}
            >
              <PowerIcon className="h-4 w-4" />
              <span className="text-sm">
                {cambiandoEstado ? 'Cambiando...' : cliente.activo ? 'Bot ON' : 'Bot OFF'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No hay mensajes aún</p>
            <p className="text-gray-500 text-sm mt-1">
              Envía un mensaje para comenzar la conversación
            </p>
          </div>
        ) : (
          mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`flex ${mensaje.type === 'human' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  mensaje.type === 'human'
                    ? 'bg-white border border-gray-200 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{mensaje.content}</p>
                {mensaje.timestamp && (
                  <p className={`text-xs mt-1 ${
                    mensaje.type === 'human' ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {formatearHora(mensaje.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={enviarMensaje} className="flex gap-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={enviando}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!nuevoMensaje.trim() || enviando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {enviando ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5" />
                <span>Enviar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}