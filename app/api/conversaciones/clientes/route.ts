// app/api/conversaciones/clientes/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// ==========================================
// GET - Clientes con últimos mensajes (SIN ID_NEGOCIO)
// ==========================================

export async function GET(request: Request) {
  try {
    console.log('📞 GET /api/conversaciones/clientes - SIN id_negocio');

    // Query simplificada - traer TODOS los clientes con mensajes
    const result = await query(`
      SELECT 
        c.id,
        c.nombre_apellido as nombre,
        c.telefono as numero,
        c.push_name as alias,
        c.ultimo_mensaje,
        c.estado as activo,
        c.score1,
        -- Último mensaje del historial
        ch.message->>'content' as ultimo_mensaje_contenido,
        ch.message->>'type' as ultimo_mensaje_tipo,
        -- Contar mensajes sin leer
        (
          SELECT COUNT(*)::integer
          FROM n8n_chat_histories ch2
          WHERE ch2.session_id = c.telefono
            AND ch2.message->>'type' = 'human'
            AND ch2.id > COALESCE((
              SELECT MAX(id)
              FROM n8n_chat_histories
              WHERE session_id = c.telefono
                AND message->>'type' = 'ai'
            ), 0)
        ) as mensajes_sin_leer
      
      FROM cliente c
      
      -- Último mensaje
      LEFT JOIN LATERAL (
        SELECT message
        FROM n8n_chat_histories
        WHERE session_id = c.telefono
        ORDER BY id DESC
        LIMIT 1
      ) ch ON true
      
      WHERE c.telefono IS NOT NULL
        AND c.telefono != ''
      ORDER BY c.ultimo_mensaje DESC NULLS LAST
      LIMIT 100
    `);

    console.log('✅ Clientes encontrados:', result.rows.length);

    // Formatear respuesta
    const clientesFormateados = result.rows.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: null,
      alias: row.alias,
      edad: null,
      numero: row.numero,
      primer_mensaje: null,
      ultimo_mensaje: row.ultimo_mensaje,
      activo: row.activo === 'activo' || row.activo === true,
      id_negocio: null,
      score1: row.score1,
      ultimo_mensaje_contenido: row.ultimo_mensaje_contenido,
      ultimo_mensaje_tipo: row.ultimo_mensaje_tipo,
      mensajes_sin_leer: row.mensajes_sin_leer || 0
    }));

    return NextResponse.json(clientesFormateados, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Error en GET /api/conversaciones/clientes:', error);
    
    return NextResponse.json(
      {
        error: 'Error al obtener clientes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}