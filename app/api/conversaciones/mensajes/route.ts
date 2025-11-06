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
// GET - Obtener mensajes con paginación (SIN DUPLICADOS)
// ==========================================

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece al negocio
    const clienteCheck = await queryWithRetry(
      'SELECT id FROM clientes WHERE numero = $1 AND id_negocio = $2',
      [sessionId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const fullSessionId = `${sessionId}_${idNegocio}`;
    const offset = (page - 1) * limit;

    // Query optimizada que ELIMINA DUPLICADOS usando DISTINCT ON
    const result = await queryWithRetry(`
      SELECT DISTINCT ON (id) 
        id,
        session_id,
        message,
        message->>'type' as type,
        message->>'content' as content,
        EXTRACT(EPOCH FROM created_at)::bigint as timestamp
      FROM n8n_chat_histories
      WHERE session_id = $1
      ORDER BY id DESC
      LIMIT $2
      OFFSET $3
    `, [fullSessionId, limit, offset]);

    // Contar total de mensajes únicos
    const countResult = await queryWithRetry(
      'SELECT COUNT(DISTINCT id) as total FROM n8n_chat_histories WHERE session_id = $1',
      [fullSessionId]
    );

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Invertir orden para mostrar cronológicamente
    const mensajes = result.rows.reverse();

    return NextResponse.json({
      data: mensajes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
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

// ==========================================
// Configuración de ruta
// ==========================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;