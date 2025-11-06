// app/lib/chat-data.ts
import { query } from './db';
import { auth } from '@/auth';

// ==========================================
// TIPOS
// ==========================================

export interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  alias: string | null;
  edad: number | null;
  numero: string | null;
  primer_mensaje: string | null;
  ultimo_mensaje: string | null;
  activo: boolean;
  id_negocio: number;
}

export interface Mensaje {
  id: string;
  session_id: string;
  message: any;
  content?: string;
  type?: 'human' | 'ai';
  response_metadata?: any;
  tool_calls?: any[];
  invalid_tool_calls?: any[];
  created_at?: string;
}

export interface ClienteConUltimoMensaje extends Cliente {
  ultimo_mensaje_contenido?: string | null;
  ultimo_mensaje_tipo?: 'human' | 'ai' | null;
  mensajes_sin_leer?: number;
}

// ==========================================
// HELPER: Obtener ID del negocio
// ==========================================

async function getIdNegocio(): Promise<number> {
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;

  if (!idNegocio) {
    throw new Error('No se pudo obtener el id_negocio de la sesión');
  }

  return idNegocio;
}

// ==========================================
// CLIENTES CON CHATS - OPTIMIZADO CON LATERAL JOIN
// ==========================================

export async function fetchClientesConChats(): Promise<ClienteConUltimoMensaje[]> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.alias,
        c.edad,
        c.numero,
        c.primer_mensaje,
        c.ultimo_mensaje,
        c.activo,
        c.id_negocio,
        ult.ultimo_mensaje_contenido,
        ult.ultimo_mensaje_tipo,
        COALESCE(sin_leer.mensajes_sin_leer, 0)::integer as mensajes_sin_leer
      FROM clientes c

      -- OPTIMIZACIÓN: LATERAL JOIN para último mensaje
      LEFT JOIN LATERAL (
        SELECT 
          ch.message->>'content' as ultimo_mensaje_contenido,
          ch.message->>'type' as ultimo_mensaje_tipo
        FROM n8n_chat_histories ch
        WHERE ch.session_id = c.numero || '_' || $2
        ORDER BY ch.id DESC
        LIMIT 1
      ) ult ON true

      -- OPTIMIZACIÓN: LATERAL JOIN para mensajes sin leer
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer as mensajes_sin_leer
        FROM n8n_chat_histories ch
        WHERE ch.session_id = c.numero || '_' || $2
          AND ch.message->>'type' = 'human'
          AND ch.id > COALESCE((
            SELECT MAX(id)
            FROM n8n_chat_histories
            WHERE session_id = c.numero || '_' || $2
              AND message->>'type' = 'ai'
          ), 0)
      ) sin_leer ON true

      WHERE c.id_negocio = $1
      ORDER BY c.activo DESC, c.ultimo_mensaje DESC NULLS LAST
      LIMIT 100
      `,
      [idNegocio, idNegocio.toString()]
    );

    return result.rows as ClienteConUltimoMensaje[];
  } catch (error) {
    console.error('Error al obtener clientes con chats:', error);
    throw new Error('Failed to fetch clientes con chats.');
  }
}

// ==========================================
// OBTENER MENSAJES DE UN CLIENTE
// ==========================================

export async function fetchMensajesCliente(sessionId: string): Promise<Mensaje[]> {
  const idNegocio = await getIdNegocio();

  try {
    // Verificar que el cliente pertenece al negocio
    const clienteCheck = await query(
      `SELECT id FROM clientes WHERE numero = $1 AND id_negocio = $2`,
      [sessionId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const fullSessionId = `${sessionId}_${idNegocio}`;

    const result = await query(
      `SELECT id, session_id, message 
       FROM n8n_chat_histories 
       WHERE session_id = $1 
       ORDER BY id ASC`,
      [fullSessionId]
    );

    return result.rows as Mensaje[];
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    throw new Error('Failed to fetch mensajes.');
  }
}

// ==========================================
// CONTAR MENSAJES SIN LEER
// ==========================================

export async function contarMensajesSinLeer(sessionId: string): Promise<number> {
  const idNegocio = await getIdNegocio();

  try {
    const fullSessionId = `${sessionId}_${idNegocio}`;

    const result = await query(
      `SELECT COUNT(*)::integer as total
       FROM n8n_chat_histories
       WHERE session_id = $1
       AND message->>'type' = 'human'
       AND id > COALESCE((
         SELECT MAX(id)
         FROM n8n_chat_histories
         WHERE session_id = $1
         AND message->>'type' = 'ai'
       ), 0)`,
      [fullSessionId]
    );

    return result.rows[0]?.total ?? 0;
  } catch (error) {
    console.error('Error al contar mensajes:', error);
    throw new Error('Failed to count mensajes.');
  }
}

// ==========================================
// CONTAR CLIENTES ACTIVOS
// ==========================================

export async function contarClientesActivos(): Promise<number> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `SELECT COUNT(*) as total
       FROM clientes
       WHERE activo = true AND id_negocio = $1`,
      [idNegocio]
    );

    return Number(result.rows[0]?.total ?? 0);
  } catch (error) {
    console.error('Error al contar clientes activos:', error);
    throw new Error('Failed to count clientes activos.');
  }
}

// ==========================================
// CREAR O ACTUALIZAR CLIENTE
// ==========================================

export async function upsertCliente(
  numero: string,
  nombre: string,
  apellido?: string,
  edad?: number,
  alias?: string
): Promise<Cliente> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `INSERT INTO clientes (numero, nombre, apellido, alias, edad, id_negocio, primer_mensaje, ultimo_mensaje, activo)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), true)
       ON CONFLICT (numero, id_negocio) 
       DO UPDATE SET 
         nombre = EXCLUDED.nombre,
         apellido = EXCLUDED.apellido,
         alias = EXCLUDED.alias,
         edad = EXCLUDED.edad,
         ultimo_mensaje = NOW()
       RETURNING *`,
      [
        numero,
        nombre,
        apellido || null,
        alias || null,
        edad || null,
        idNegocio
      ]
    );

    return result.rows[0] as Cliente;
  } catch (error) {
    console.error('Error al crear/actualizar cliente:', error);
    throw new Error('Failed to upsert cliente.');
  }
}

// ==========================================
// OBTENER CLIENTE POR ID
// ==========================================

export async function fetchClienteById(clienteId: number): Promise<Cliente | null> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `SELECT id, nombre, apellido, alias, edad, numero, primer_mensaje, ultimo_mensaje, activo, id_negocio
       FROM clientes
       WHERE id = $1 AND id_negocio = $2`,
      [clienteId, idNegocio]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    throw new Error('Failed to fetch cliente.');
  }
}

// ==========================================
// OBTENER CLIENTE POR NÚMERO
// ==========================================

export async function fetchClienteByNumero(numero: string): Promise<Cliente | null> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `SELECT id, nombre, apellido, alias, edad, numero, primer_mensaje, ultimo_mensaje, activo, id_negocio
       FROM clientes
       WHERE numero = $1 AND id_negocio = $2`,
      [numero, idNegocio]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener cliente por número:', error);
    throw new Error('Failed to fetch cliente by numero.');
  }
}

// ==========================================
// ACTUALIZAR ESTADO DEL BOT (ACTIVO)
// ==========================================

export async function toggleClienteActivo(clienteId: number): Promise<Cliente> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `UPDATE clientes 
       SET activo = NOT activo
       WHERE id = $1 AND id_negocio = $2
       RETURNING *`,
      [clienteId, idNegocio]
    );

    if (result.rows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    return result.rows[0] as Cliente;
  } catch (error) {
    console.error('Error al cambiar estado del cliente:', error);
    throw new Error('Failed to toggle cliente activo.');
  }
}

// ==========================================
// ELIMINAR CONVERSACIÓN
// ==========================================

export async function eliminarConversacion(sessionId: string): Promise<void> {
  const idNegocio = await getIdNegocio();

  try {
    const fullSessionId = `${sessionId}_${idNegocio}`;

    await query(
      `DELETE FROM n8n_chat_histories 
       WHERE session_id = $1`,
      [fullSessionId]
    );
  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    throw new Error('Failed to delete conversacion.');
  }
}

// ==========================================
// OBTENER ESTADÍSTICAS DE MENSAJES
// ==========================================

export async function obtenerEstadisticasMensajes(): Promise<{
  totalMensajes: number;
  mensajesHoy: number;
  mensajesEstaSemana: number;
}> {
  const idNegocio = await getIdNegocio();

  try {
    const result = await query(
      `SELECT 
         COUNT(*) as total_mensajes,
         COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as mensajes_hoy,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as mensajes_semana
       FROM n8n_chat_histories ch
       INNER JOIN clientes c ON ch.session_id LIKE c.numero || '_%'
       WHERE c.id_negocio = $1`,
      [idNegocio]
    );

    const row = result.rows[0];
    return {
      totalMensajes: parseInt(row.total_mensajes || '0'),
      mensajesHoy: parseInt(row.mensajes_hoy || '0'),
      mensajesEstaSemana: parseInt(row.mensajes_semana || '0')
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de mensajes:', error);
    throw new Error('Failed to fetch message statistics.');
  }
}