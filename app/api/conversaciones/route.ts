import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getIdNegocio } from '@/app/lib/get-id-negocio';

// ==========================================

// ==========================================
// GET - Obtener mensajes de un cliente
// ==========================================

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    const numero = searchParams.get('sessionId');
    const checkOnly = searchParams.get('checkOnly') === 'true'; // Para solo verificar si hay nuevos
    const lastMessageId = searchParams.get('lastMessageId'); // ID del último mensaje conocido

    if (!numero) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // CRÍTICO: Verificar que el cliente pertenece al negocio antes de mostrar mensajes
    const clienteCheck = await query(
      `SELECT id, nombre, apellido, activo 
       FROM clientes 
       WHERE numero = $1 AND id_negocio = $2`,
      [numero, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Construir el session_id correcto: numero_idNegocio
    const sessionId = `${numero}_${idNegocio}`;

    // Si solo queremos verificar si hay mensajes nuevos (super ligero)
    if (checkOnly && lastMessageId) {
      const countResult = await query(
        `SELECT COUNT(*) as nuevos, MAX(id) as ultimo_id
         FROM n8n_chat_histories
         WHERE session_id = $1 AND id > $2`,
        [sessionId, lastMessageId]
      );

      return NextResponse.json({
        hayNuevos: parseInt(countResult.rows[0].nuevos) > 0,
        ultimoId: countResult.rows[0].ultimo_id,
        cantidadNuevos: parseInt(countResult.rows[0].nuevos)
      });
    }

    // Obtener los últimos 50 mensajes del historial
    const mensajesResult = await query(
      `SELECT 
         id,
         session_id,
         message
       FROM n8n_chat_histories
       WHERE session_id = $1
       ORDER BY id DESC
       LIMIT 50`,
      [sessionId]
    );

    // Invertir el orden para mostrar del más antiguo al más reciente
    const mensajes = mensajesResult.rows.reverse();

    return NextResponse.json({
      cliente: clienteCheck.rows[0],
      mensajes: mensajes,
      total: mensajes.length,
      ultimoId: mensajes.length > 0 ? mensajes[mensajes.length - 1].id : null
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - Enviar nuevo mensaje
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { sessionId, mensaje, tipo } = await request.json();

    if (!sessionId || !mensaje) {
      return NextResponse.json(
        { error: 'sessionId y mensaje son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece al negocio
    const clienteCheck = await query(
      `SELECT id FROM clientes WHERE numero = $1 AND id_negocio = $2`,
      [sessionId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Construir el session_id correcto con id_negocio
    const fullSessionId = `${sessionId}_${idNegocio}`;

    // Guardar mensaje en el historial
    const mensajeResult = await query(
      `INSERT INTO n8n_chat_histories (session_id, message)
       VALUES ($1, $2)
       RETURNING id, session_id, message`,
      [fullSessionId, JSON.stringify({
        type: tipo || 'ai',
        content: mensaje,
        additional_kwargs: {},
        response_metadata: {
          timestamp: new Date().toISOString()
        }
      })]
    );

    // Actualizar último mensaje del cliente
    await query(
      `UPDATE clientes 
       SET ultimo_mensaje = NOW()
       WHERE numero = $1 AND id_negocio = $2`,
      [sessionId, idNegocio]
    );

    return NextResponse.json(mensajeResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE - Eliminar conversación completa
// ==========================================

export async function DELETE(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    const numero = searchParams.get('sessionId');

    if (!numero) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece al negocio
    const clienteCheck = await query(
      `SELECT id FROM clientes WHERE numero = $1 AND id_negocio = $2`,
      [numero, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Construir el session_id correcto
    const sessionId = `${numero}_${idNegocio}`;

    // Eliminar todos los mensajes del historial
    const deleteResult = await query(
      `DELETE FROM n8n_chat_histories WHERE session_id = $1`,
      [sessionId]
    );

    return NextResponse.json({ 
      message: 'Conversación eliminada correctamente',
      sessionId,
      mensajesEliminados: deleteResult.rowCount
    });
  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar conversación' },
      { status: 500 }
    );
  }
}