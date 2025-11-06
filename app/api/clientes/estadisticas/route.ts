import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { queryWithRetry } from '@/app/lib/db';

// ==========================================
// Configuración para forzar comportamiento dinámico
// ==========================================
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

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
// GET - Obtener clientes con estadísticas
// ==========================================
export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'ultimo_mensaje';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    
    const offset = (page - 1) * limit;

    // Query directa con JOIN para incluir género
    const result = await queryWithRetry(`
      SELECT 
        mv.id,
        mv.nombre,
        mv.apellido,
        mv.alias,
        mv.edad,
        mv.numero,
        c.genero,
        mv.primer_mensaje,
        mv.ultimo_mensaje,
        mv.activo,
        mv.total_citas,
        mv.citas_asistidas,
        mv.citas_no_asistidas,
        mv.citas_pendientes
      FROM mv_clientes_resumen mv
      INNER JOIN clientes c ON c.id = mv.id
      WHERE mv.id_negocio = $1
        AND (
          $4 = '' OR
          LOWER(mv.nombre) LIKE LOWER($4) OR 
          LOWER(mv.apellido) LIKE LOWER($4) OR 
          LOWER(mv.alias) LIKE LOWER($4) OR
          mv.numero LIKE $4
        )
      ORDER BY 
        CASE 
          WHEN $5 = 'nombre' THEN mv.nombre
          WHEN $5 = 'activo' THEN mv.activo::text
          WHEN $5 = 'total_citas' THEN mv.total_citas::text
          ELSE mv.ultimo_mensaje::text
        END ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT $2
      OFFSET $3
    `, [
      idNegocio,
      limit,
      offset,
      `%${search}%`,
      sortBy
    ]);

    const countResult = await queryWithRetry(`
      SELECT COUNT(*) as total
      FROM mv_clientes_resumen
      WHERE id_negocio = $1
        AND (
          $2 = '' OR
          LOWER(nombre) LIKE LOWER($2) OR 
          LOWER(apellido) LIKE LOWER($2) OR 
          LOWER(alias) LIKE LOWER($2) OR
          numero LIKE $2
        )
    `, [idNegocio, `%${search}%`]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Error en GET /api/clientes/estadisticas:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener clientes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}