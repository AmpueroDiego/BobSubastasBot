import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, queryWithRetry } from '@/app/lib/db';

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
// GET - Datos del Dashboard (una sola query)
// ==========================================

// app/api/dashboard/route.ts

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();

    // Query optimizada SIN JOIN problemático
    const result = await queryWithRetry(`
      SELECT 
        COALESCE(ec.total_clientes, 0)::integer as total_clientes,
        COALESCE(ec.clientes_activos, 0)::integer as clientes_activos,
        COALESCE(ec.clientes_hoy, 0)::integer as clientes_hoy,
        COALESCE(cit.total_citas, 0)::integer as total_citas,
        COALESCE(cit.citas_completadas, 0)::integer as citas_completadas,
        COALESCE(cit.citas_no_asistidas, 0)::integer as citas_no_asistidas,
        COALESCE(cit.citas_pendientes, 0)::integer as citas_pendientes,
        COALESCE(cit.citas_hoy, 0)::integer as citas_hoy,
        COALESCE(s.total_servicios, 0)::integer as total_servicios,
        
        -- Citas de hoy usando subquery
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ch.id,
                'cliente_nombre', ch.cliente_nombre,
                'cliente_apellido', ch.cliente_apellido,
                'hora', ch.hora,
                'servicio_nombre', COALESCE(ch.servicio_nombre, 'Sin servicio'),
                'descripcion', COALESCE(ch.descripcion, '')
              ) ORDER BY ch.hora
            )
            FROM mv_citas_hoy ch
            WHERE ch.id_negocio = $1
          ),
          '[]'::json
        ) as citas_hoy_list,
        
        -- Servicios top usando subquery (ARREGLADO)
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', st.id,
                'nombre', st.nombre,
                'total_citas', st.total_citas
              ) ORDER BY st.total_citas DESC, st.nombre
            )
            FROM (
              SELECT 
                s.id,
                s.nombre,
                COUNT(c.id) as total_citas,
                ROW_NUMBER() OVER (ORDER BY COUNT(c.id) DESC, s.nombre) as rn
              FROM servicios s
              INNER JOIN clientes cl ON s.id_negocio = cl.id_negocio
              LEFT JOIN citas c ON c.id_servicio = s.id
              WHERE s.id_negocio = $1
              GROUP BY s.id, s.nombre
            ) st
            WHERE st.rn <= 10
          ),
          '[]'::json
        ) as servicios_top
      
      FROM mv_estadisticas_clientes ec
      LEFT JOIN mv_estadisticas_citas cit ON ec.id_negocio = cit.id_negocio
      LEFT JOIN (
        SELECT id_negocio, COUNT(*)::integer as total_servicios
        FROM servicios
        GROUP BY id_negocio
      ) s ON ec.id_negocio = s.id_negocio
      
      WHERE ec.id_negocio = $1
    `, [idNegocio]);

    const data = result.rows[0] || {
      total_clientes: 0,
      clientes_activos: 0,
      clientes_hoy: 0,
      total_citas: 0,
      citas_completadas: 0,
      citas_no_asistidas: 0,
      citas_pendientes: 0,
      citas_hoy: 0,
      total_servicios: 0,
      citas_hoy_list: [],
      servicios_top: []
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Error en GET /api/dashboard:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener datos del dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - Refrescar vistas materializadas
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();

    // Solo refrescar si el usuario es admin/propietario
    // Esta validación debería estar en tu middleware de auth

    await queryWithRetry('SELECT refresh_materialized_views()');

    console.log('[API] Vistas materializadas refrescadas por usuario:', idNegocio);

    return NextResponse.json({
      success: true,
      message: 'Vistas materializadas refrescadas correctamente'
    });
  } catch (error) {
    console.error('[API] Error refrescando vistas:', error);
    return NextResponse.json(
      {
        error: 'Error al refrescar vistas',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==========================================
// Configuración de ruta
// ==========================================

export const maxDuration = 30;
export const revalidate = 300; // Revalidar cada 5 minutos