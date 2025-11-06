import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { queryWithRetry } from '@/app/lib/db';

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
// GET - Clientes con últimos mensajes (optimizado)
// ==========================================

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();

    // Query optimizada que trae clientes y últimos mensajes en una sola pasada
    const result = await queryWithRetry(`
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
        -- Último mensaje (con LIMIT 1 optimizado)
        ch.message->>'content' as ultimo_mensaje_contenido,
        ch.message->>'type' as ultimo_mensaje_tipo,
        -- Contar mensajes sin leer (más eficiente con window functions)
        COUNT(CASE WHEN ch2.message->>'type' = 'human' AND ch2.id > COALESCE(ch3.max_ai_id, 0) THEN 1 END)::integer as mensajes_sin_leer
      
      FROM clientes c
      
      -- Left join para el último mensaje
      LEFT JOIN LATERAL (
        SELECT message
        FROM n8n_chat_histories
        WHERE session_id = c.numero || '_' || c.id_negocio::text
        ORDER BY id DESC
        LIMIT 1
      ) ch ON true
      
      -- Left join para contar sin leer
      LEFT JOIN n8n_chat_histories ch2 ON ch2.session_id = c.numero || '_' || c.id_negocio::text
      LEFT JOIN LATERAL (
        SELECT MAX(id) as max_ai_id
        FROM n8n_chat_histories
        WHERE session_id = c.numero || '_' || c.id_negocio::text
          AND message->>'type' = 'ai'
      ) ch3 ON true
      
      WHERE c.id_negocio = $1
      GROUP BY c.id, c.nombre, c.apellido, c.alias, c.edad, c.numero, c.primer_mensaje, 
               c.ultimo_mensaje, c.activo, c.id_negocio, ch.message
      ORDER BY c.activo DESC, c.ultimo_mensaje DESC NULLS LAST
      LIMIT 100
    `, [idNegocio]);

    return NextResponse.json(result.rows, {
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
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ==========================================
// Configuración de ruta
// ==========================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;