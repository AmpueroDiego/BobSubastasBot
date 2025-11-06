// app/api/conversaciones/mensajes/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// ==========================================
// GET - Obtener mensajes SIN ID_NEGOCIO
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '200');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando mensajes para session_id:', sessionId);

    // Verificar que el cliente existe (por teléfono)
    const clienteCheck = await query(
      'SELECT id, nombre_apellido FROM cliente WHERE telefono = $1',
      [sessionId]
    );

    if (clienteCheck.rows.length === 0) {
      console.log('⚠️ Cliente no encontrado con telefono:', sessionId);
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', clienteCheck.rows[0]);

    // Traer mensajes directamente de n8n_chat_histories
    // El session_id en la BD es simplemente el teléfono
    const result = await query(`
      SELECT 
        id,
        session_id,
        message,
        created_at
      FROM n8n_chat_histories
      WHERE session_id = $1
      ORDER BY id ASC
      LIMIT $2
    `, [sessionId, limit]);

    console.log('📦 Mensajes encontrados:', result.rows.length);

    // Procesar mensajes
    const mensajesProcesados = result.rows.map((row: any) => {
      let messageData = row.message;
      
      // Si message es string, parsearlo
      if (typeof messageData === 'string') {
        try {
          messageData = JSON.parse(messageData);
        } catch (e) {
          console.error('Error parseando mensaje ID', row.id, ':', e);
          messageData = { type: 'ai', content: messageData };
        }
      }

      const tipo = messageData.type || messageData.data?.type || 'ai';
      const contenido = messageData.content || messageData.data?.content || messageData.text || '';

      return {
        id: row.id,
        session_id: row.session_id,
        type: tipo,
        content: contenido,
        timestamp: row.created_at ? Math.floor(new Date(row.created_at).getTime() / 1000) : null
      };
    });

    console.log('✅ Mensajes procesados:', mensajesProcesados.length);
    if (mensajesProcesados.length > 0) {
      console.log('📋 Primer mensaje:', mensajesProcesados[0]);
      console.log('📋 Último mensaje:', mensajesProcesados[mensajesProcesados.length - 1]);
    }

    return NextResponse.json({
      data: mensajesProcesados,
      total: mensajesProcesados.length,
      session_id: sessionId
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
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