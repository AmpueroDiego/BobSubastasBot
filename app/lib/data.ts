import { unstable_cache } from 'next/cache';
import { query, queryWithRetry } from './db';
import { auth } from '@/auth';

// ==========================================
// INTERFACES Y TIPOS
// ==========================================

interface CitaHoy {
  id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_numero: string;
  hora: string;
  servicio_nombre: string;
  descripcion: string;
}

interface ServicioSolicitado {
  id: number;
  nombre: string;
  total_citas: number;
}

export interface CitaDetalle {
  id: number;
  hora: string;
  servicio: string;
  descripcion: string;
  cliente: string;
  fecha: string;
  asistio: boolean | null;
}

// ==========================================
// HELPER: Obtener ID del negocio
// ==========================================

async function getIdNegocio(): Promise<number> {
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;

  if (!idNegocio) {
    return 1; // Usa 1 como negocio por defecto
  }

  return idNegocio;
}

// ==========================================
// 🚀 DASHBOARD INICIO - OPTIMIZADO CON VISTAS
// ==========================================

export const fetchDashboardInicioData = unstable_cache(
  async () => {
    try {
      const result = await queryWithRetry(`
        SELECT 
          COALESCE(
            json_build_object(
              'sin_definir', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'sin_definir'), 0),
              'bajo', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'bajo'), 0),
              'medio', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'medio'), 0),
              'alto', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'alto'), 0)
            ),
            '{}'::json
          ) as interes_total,
          COALESCE(
            json_build_object(
              'sin_definir', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'sin_definir' AND DATE(fecha_registro) = CURRENT_DATE), 0),
              'bajo', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'bajo' AND DATE(fecha_registro) = CURRENT_DATE), 0),
              'medio', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'medio' AND DATE(fecha_registro) = CURRENT_DATE), 0),
              'alto', COALESCE((SELECT COUNT(*) FROM cliente WHERE interes = 'alto' AND DATE(fecha_registro) = CURRENT_DATE), 0)
            ),
            '{}'::json
          ) as interes_hoy
      `);

      const row = result.rows[0] || { interes_total: {}, interes_hoy: {} };

      return {
        interesTotal: row.interes_total,
        interesHoy: row.interes_hoy,
      };
    } catch (error) {
      console.error('[Data] Error:', error);
      return {
        interesTotal: { sin_definir: 0, bajo: 0, medio: 0, alto: 0 },
        interesHoy: { sin_definir: 0, bajo: 0, medio: 0, alto: 0 },
      };
    }
  },
  ['dashboard-inicio'],
  { revalidate: 300, tags: ['dashboard'] }
);
// ==========================================
// FUNCIONES INDIVIDUALES (para compatibilidad)
// ==========================================

/*
export async function fetchClientesDelDia() {
  const data = await fetchDashboardInicioData();
  return data.clientesDelDia;
}

export async function fetchServiciosSolicitados() {
  const data = await fetchDashboardInicioData();
  return data.serviciosSolicitados;
}
*/

// ==========================================
// 🚀 CLIENTES - OPTIMIZADO CON VISTA
// ==========================================

export const fetchClientes = unstable_cache(
  async () => {
    const idNegocio = await getIdNegocio();

    try {
      const result = await queryWithRetry(
        `
        SELECT 
          id,
          nombre,
          apellido,
          alias,
          edad,
          numero,
          primer_mensaje,
          ultimo_mensaje,
          activo,
          total_citas,
          citas_asistidas,
          citas_no_asistidas,
          citas_pendientes
        FROM mv_clientes_resumen
        WHERE 1=1  -- Sin filtro de negocio
        ORDER BY ultimo_mensaje DESC NULLS LAST
        `,
        [idNegocio]
      );

      return result.rows;
    } catch (error) {
      console.error('[Data] Error en fetchClientes:', error);
      throw new Error('Failed to fetch clientes');
    }
  },
  ['clientes-list'],
  { revalidate: 300, tags: ['clientes'] }
);

// ==========================================
// 🚀 ESTADÍSTICAS GENERALES - OPTIMIZADO
// ==========================================

export const fetchEstadisticasGenerales = unstable_cache(
  async () => {
    const idNegocio = await getIdNegocio();

    try {
      const result = await queryWithRetry(
        `
        SELECT 
          COALESCE(ec.total_clientes, 0) as total_clientes,
          COALESCE(ec.clientes_activos, 0) as clientes_activos,
          COALESCE(cit.total_citas, 0) as total_citas,
          COALESCE(cit.citas_completadas, 0) as citas_completadas,
          COALESCE(s.total_servicios, 0) as total_servicios
        
        FROM mv_estadisticas_clientes ec
        LEFT JOIN mv_estadisticas_citas cit ON ec.id_negocio = cit.id_negocio
        LEFT JOIN (
          SELECT id_negocio, COUNT(*) as total_servicios
          FROM servicios
          GROUP BY id_negocio
        ) s ON ec.id_negocio = s.id_negocio
        
        WHERE ec.id_negocio = $1
        `,
        [idNegocio]
      );

      return result.rows[0] || {
        total_clientes: 0,
        clientes_activos: 0,
        total_citas: 0,
        citas_completadas: 0,
        total_servicios: 0,
      };
    } catch (error) {
      console.error('[Data] Error en fetchEstadisticasGenerales:', error);
      throw new Error('Failed to fetch estadisticas');
    }
  },
  ['stats-generales'],
  { revalidate: 300, tags: ['statistics'] }
);

// ==========================================
// 🚀 BÚSQUEDA DE CLIENTES - CON ÍNDICES
// ==========================================

export const fetchFilteredClientes = unstable_cache(
  async (searchQuery: string) => {
    const idNegocio = await getIdNegocio();

    try {
      const result = await queryWithRetry(
        `
        SELECT 
          id,
          nombre,
          apellido,
          alias,
          edad,
          numero,
          primer_mensaje,
          ultimo_mensaje,
          activo
        FROM mv_clientes_resumen
        WHERE 1=1  -- Sin filtro de negocio
          AND (
            LOWER(nombre) LIKE LOWER($2) OR 
            LOWER(apellido) LIKE LOWER($2) OR 
            LOWER(alias) LIKE LOWER($2) OR
            numero LIKE $2
          )
        ORDER BY ultimo_mensaje DESC NULLS LAST
        LIMIT 50
        `,
        [idNegocio, `%${searchQuery}%`]
      );

      return result.rows;
    } catch (error) {
      console.error('[Data] Error en fetchFilteredClientes:', error);
      throw new Error('Failed to fetch filtered clientes');
    }
  },
  ['clientes-filtered'],
  { revalidate: 60, tags: ['clientes'] }
);

// ==========================================
// 🚀 CITAS CON PAGINACIÓN
// ==========================================

export async function fetchCitasPages(searchQuery: string) {
  const idNegocio = await getIdNegocio();
  const ITEMS_PER_PAGE = 20;

  try {
    const result = await queryWithRetry(
      `
      SELECT COUNT(*) as count
      FROM citas c
      INNER JOIN clientes cl ON c.id_cliente = cl.id
      LEFT JOIN servicios s ON c.id_servicio = s.id
      WHERE cl.id_negocio = $1
        AND (c.fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::date = CURRENT_DATE
        AND (c.asistio IS NULL OR c.asistio = false)
        AND (
          LOWER(cl.nombre) LIKE LOWER($2) OR 
          LOWER(cl.apellido) LIKE LOWER($2) OR 
          LOWER(s.nombre) LIKE LOWER($2)
        )
      `,
      [idNegocio, `%${searchQuery}%`]
    );

    const totalCount = Number(result.rows[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error('[Data] Error en fetchCitasPages:', error);
    throw new Error('Failed to fetch citas pages');
  }
}

// ==========================================
// 🚀 SERVICIOS
// ==========================================

export const fetchServicios = unstable_cache(
  async () => {
    const idNegocio = await getIdNegocio();

    try {
      const result = await queryWithRetry(
        `
        SELECT id, nombre, descripcion
        FROM servicios
        WHERE 1=1  -- Sin filtro de negocio
        ORDER BY nombre
        `,
        [idNegocio]
      );

      return result.rows;
    } catch (error) {
      console.error('[Data] Error en fetchServicios:', error);
      throw new Error('Failed to fetch servicios');
    }
  },
  ['servicios-list'],
  { revalidate: 3600, tags: ['servicios'] }
);

// ==========================================
// FUNCIÓN PARA REFRESCAR VISTAS
// ==========================================

export async function refreshMaterializedViews() {
  try {
    await queryWithRetry('SELECT refresh_materialized_views()');
    console.log('[Data] Vistas materializadas refrescadas');
    
    return { success: true };
  } catch (error) {
    console.error('[Data] Error refrescando vistas:', error);
    throw error;
  }
}

export async function fetchCitasAgrupadas(searchQuery: string = '') {
  const idNegocio = await getIdNegocio();

  try {
    const result = await queryWithRetry(
      `
      SELECT 
        c.fecha as dia,
        COUNT(*) as total_citas,
        json_agg(
          json_build_object(
            'id', c.id,
            'hora', TO_CHAR(c.hora, 'HH24:MI'),
            'servicio', COALESCE(s.nombre, 'Sin servicio'),
            'descripcion', COALESCE(c.descripcion, ''),
            'cliente', CONCAT(COALESCE(cl.nombre, ''), ' ', COALESCE(cl.apellido, '')),
            'fecha', c.fecha::text,
            'asistio', c.asistio
          ) ORDER BY c.hora
        ) as citas
      FROM citas c
      INNER JOIN clientes cl ON c.id_cliente = cl.id
      LEFT JOIN servicios s ON c.id_servicio = s.id
      WHERE cl.id_negocio = $1
        AND c.fecha = CURRENT_DATE
        AND (c.asistio IS NULL OR c.asistio = false)
        AND (
          $2 = '' OR
          LOWER(cl.nombre) LIKE LOWER($2) OR
          LOWER(cl.apellido) LIKE LOWER($2) OR
          LOWER(s.nombre) LIKE LOWER($2)
        )
      GROUP BY c.fecha
      ORDER BY c.fecha
      `,
      [idNegocio, `%${searchQuery}%`]
    );

    return result.rows.map((row: any) => ({
      dia: row.dia,
      total_citas: row.total_citas,
      citas: row.citas || []
    }));
  } catch (error) {
    console.error('[Data] Error en fetchCitasAgrupadas:', error);
    throw new Error('Failed to fetch citas agrupadas');
  }
}
// ==========================================
// CITAS INDIVIDUALES - OPTIMIZADO SIN PAGINACIÓN
// ==========================================

// export async function fetchCitasHoy() {
//   try {
//     const result = await queryWithRetry(
//       `
//       SELECT 
//         c.id,
//         cl.nombre as cliente_nombre,
//         cl.apellido as cliente_apellido,
//         TO_CHAR(c.hora, 'HH24:MI') as hora,
//         s.nombre as servicio_nombre,
//         c.descripcion,
//         c.asistio,
//         c.fecha
//       FROM citas c
//       INNER JOIN clientes cl ON c.id_cliente = cl.id
//       LEFT JOIN servicios s ON c.id_servicio = s.id
//       WHERE DATE(c.fecha) = CURRENT_DATE
//         AND c.asistio IS NULL
//       ORDER BY c.hora
//       LIMIT 50
//       `
//     );

//     return result.rows;
//   } catch (error) {
//     console.error('[Data] Error en fetchCitasHoy:', error);
//     return []; // Retorna array vacío si hay error
//   }
// }

// En app/lib/data.ts
export async function fetchCitasFuturas(searchQuery: string = '') {
  const idNegocio = await getIdNegocio();
  
  // Obtener fecha actual en zona horaria de Lima
  const fechaLima = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima' 
  }); // Formato: YYYY-MM-DD

  const result = await queryWithRetry(
    `
    SELECT 
      c.fecha as dia,
      COUNT(*) as total_citas,
      json_agg(
        json_build_object(
          'id', c.id,
          'hora', TO_CHAR(c.hora, 'HH24:MI'),
          'servicio', COALESCE(s.nombre, 'Sin servicio'),
          'descripcion', COALESCE(c.descripcion, ''),
          'cliente', CONCAT(COALESCE(cl.nombre, ''), ' ', COALESCE(cl.apellido, '')),
          'fecha', c.fecha::text,
          'asistio', c.asistio
        ) ORDER BY c.hora
      ) as citas
    FROM citas c
    INNER JOIN clientes cl ON c.id_cliente = cl.id
    LEFT JOIN servicios s ON c.id_servicio = s.id
    WHERE cl.id_negocio = $1
      AND c.fecha >= $2::date  -- HOY y días futuros ✅
      AND (c.asistio IS NULL OR c.asistio = false)
      AND (
        $3 = '' OR
        LOWER(cl.nombre) LIKE LOWER($3) OR
        LOWER(cl.apellido) LIKE LOWER($3) OR
        LOWER(s.nombre) LIKE LOWER($3)
      )
    GROUP BY c.fecha
    ORDER BY c.fecha
    `,
    [idNegocio, fechaLima, `%${searchQuery}%`]
  );
  
  return result.rows.map((row: any) => ({
    dia: row.dia,
    total_citas: row.total_citas,
    citas: row.citas || []
  }));
}

export async function fetchCitasPasadas(searchQuery: string = '') {
  const idNegocio = await getIdNegocio();
  
  // Obtener fecha actual en zona horaria de Lima
  const fechaLima = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima' 
  }); // Formato: YYYY-MM-DD

  try {
    const result = await queryWithRetry(
      `
      SELECT 
        c.fecha as dia,
        COUNT(*) as total_citas,
        json_agg(
          json_build_object(
            'id', c.id,
            'hora', TO_CHAR(c.hora, 'HH24:MI'),
            'servicio', COALESCE(s.nombre, 'Sin servicio'),
            'descripcion', COALESCE(c.descripcion, ''),
            'cliente', CONCAT(COALESCE(cl.nombre, ''), ' ', COALESCE(cl.apellido, '')),
            'fecha', c.fecha::text,
            'asistio', c.asistio
          ) ORDER BY c.hora DESC
        ) as citas
      FROM citas c
      INNER JOIN clientes cl ON c.id_cliente = cl.id
      LEFT JOIN servicios s ON c.id_servicio = s.id
      WHERE cl.id_negocio = $1
        AND c.fecha < $2::date  -- ANTES de hoy ✅
        AND (
          $3 = '' OR
          LOWER(cl.nombre) LIKE LOWER($3) OR
          LOWER(cl.apellido) LIKE LOWER($3) OR
          LOWER(s.nombre) LIKE LOWER($3)
        )
      GROUP BY c.fecha
      ORDER BY c.fecha DESC
      LIMIT 50
      `,
      [idNegocio, fechaLima, `%${searchQuery}%`]
    );

    return result.rows.map((row: any) => ({
      dia: row.dia,
      total_citas: row.total_citas,
      citas: row.citas || []
    }));
  } catch (error) {
    console.error('[Data] Error en fetchCitasPasadas:', error);
    throw new Error('Failed to fetch citas pasadas');
  }
}