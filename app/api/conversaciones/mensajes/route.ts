// app/api/conversaciones/mensajes/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// ==========================================
// GET - Mensajes de un cliente específico
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando mensajes para session_id:', session_id);

    // 1. Verificar que el cliente existe y obtener su ultimo_mensaje
    const clienteResult = await query(
      `SELECT id, nombre_apellido, ultimo_mensaje 
       FROM cliente 
       WHERE telefono = $1`,
      [session_id]
    );

    if (clienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', {
      id: clienteResult.rows[0].id,
      nombre_apellido: clienteResult.rows[0].nombre_apellido
    });

    // 2. Obtener mensajes del historial
    // NOTA: n8n_chat_histories NO tiene created_at, usamos el id para ordenar
    const mensajesResult = await query(
      `SELECT 
        id,
        session_id,
        message->>'type' as tipo,
        message->>'content' as contenido,
        message as message_completo
      FROM n8n_chat_histories
      WHERE session_id = $1
      ORDER BY id ASC`,
      [session_id]
    );

    console.log('✅ Mensajes encontrados:', mensajesResult.rows.length);

    // 3. Formatear mensajes
    const mensajesFormateados = mensajesResult.rows.map((row: any, index: number) => {
      const esHumano = row.tipo === 'human';
      
      return {
        id: row.id,
        texto: row.contenido || '',
        remitente: esHumano ? session_id : 'bot',
        tipo: esHumano ? 'recibido' : 'enviado',
        // Usamos el ultimo_mensaje del cliente para el mensaje más reciente
        // Para los demás, podemos usar el id como referencia temporal
        created_at: index === mensajesResult.rows.length - 1 
          ? clienteResult.rows[0].ultimo_mensaje 
          : null,
        message_id: row.id,
        session_id: row.session_id,
        metadata: row.message_completo
      };
    });

    // 4. Respuesta
    return NextResponse.json({
      session_id,
      cliente: {
        id: clienteResult.rows[0].id,
        nombre: clienteResult.rows[0].nombre_apellido,
        telefono: session_id,
        ultimo_mensaje: clienteResult.rows[0].ultimo_mensaje
      },
      mensajes: mensajesFormateados,
      total: mensajesFormateados.length
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[API] Error en GET /api/conversaciones/mensajes:', error);
    
    return NextResponse.json(
      {
        error: 'Error al obtener mensajes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}