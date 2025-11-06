import { query } from './db';
import { auth } from '@/auth';

async function getIdNegocio(): Promise<number> {
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;
  
  if (!idNegocio) {
    throw new Error('No se pudo obtener el id_negocio de la sesión');
  }
  
  return idNegocio;
}

export async function fetchDashboardCompleto() {
  try {
    const result = await query(`
      WITH 
        citas_semana AS (
          SELECT 
            TO_CHAR(c.fecha, 'Day') as dia,
            EXTRACT(DOW FROM c.fecha) as dia_num,
            COUNT(*) as total
          FROM citas c
          WHERE c.fecha >= CURRENT_DATE - INTERVAL '7 days'
            AND c.fecha <= CURRENT_DATE
          GROUP BY TO_CHAR(c.fecha, 'Day'), EXTRACT(DOW FROM c.fecha)
        ),
        horarios_populares AS (
          SELECT 
            EXTRACT(HOUR FROM c.hora) as hora,
            COUNT(*) as total
          FROM citas c
          GROUP BY EXTRACT(HOUR FROM c.hora)
        ),
        crecimiento_clientes AS (
          SELECT 
            TO_CHAR(DATE_TRUNC('month', TO_TIMESTAMP(fecha_registro, 'DD/MM/YYYY')), 'Month YYYY') as mes,
            DATE_TRUNC('month', TO_TIMESTAMP(fecha_registro, 'DD/MM/YYYY')) as mes_fecha,
            COUNT(*) as nuevos_clientes
          FROM cliente
          WHERE fecha_registro IS NOT NULL
            AND TO_TIMESTAMP(fecha_registro, 'DD/MM/YYYY') >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(fecha_registro, 'DD/MM/YYYY'))
        ),
        distribucion_servicios AS (
          SELECT 
            COALESCE(s.nombre, 'Sin servicio') as nombre,
            COUNT(*) as total,
            ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM citas), 0)), 1) as porcentaje
          FROM citas c
          LEFT JOIN servicios s ON c.id_servicio = s.id
          GROUP BY s.nombre
          ORDER BY total DESC
          LIMIT 5
        ),
        clientes_frecuentes AS (
          SELECT 
            cl.nombre_apellido,
            COUNT(c.id) as total_citas
          FROM cliente cl
          INNER JOIN citas c ON c.id_cliente = cl.id
          GROUP BY cl.id, cl.nombre_apellido
          ORDER BY total_citas DESC
          LIMIT 10
        ),
        tasa_asistencia AS (
          SELECT 
            COUNT(*) FILTER (WHERE asistio = true) as asistieron,
            COUNT(*) FILTER (WHERE asistio = false) as no_asistieron,
            COUNT(*) FILTER (WHERE asistio IS NULL) as pendientes,
            COUNT(*) as total
          FROM citas
          WHERE fecha <= CURRENT_DATE
        )
      SELECT 
        (SELECT row_to_json(citas_semana) FROM citas_semana) as citas_semana,
        (SELECT row_to_json(horarios_populares) FROM horarios_populares) as horarios_populares,
        (SELECT row_to_json(crecimiento_clientes) FROM crecimiento_clientes) as crecimiento_clientes,
        (SELECT row_to_json(distribucion_servicios) FROM distribucion_servicios) as distribucion_servicios,
        (SELECT row_to_json(clientes_frecuentes) FROM clientes_frecuentes) as clientes_frecuentes,
        (SELECT row_to_json(tasa_asistencia) FROM tasa_asistencia) as tasa_asistencia
    `);

    const row = result.rows[0];
    
    return {
      citasSemana: row.citas_semana || [],
      horariosPopulares: row.horarios_populares || [],
      crecimientoClientes: row.crecimiento_clientes || [],
      distribucionServicios: row.distribucion_servicios || [],
      clientesFrecuentes: row.clientes_frecuentes || [],
      tasaAsistencia: row.tasa_asistencia || { asistieron: 0, no_asistieron: 0, pendientes: 0, total: 0 }
    };
  } catch (error) {
    console.error('Error al cargar dashboard completo:', error);
    throw new Error('Failed to fetch dashboard completo');
  }
}

export async function fetchCitasPorSemana() {
  const data = await fetchDashboardCompleto();
  return data.citasSemana;
}

export async function fetchHorariosPopulares() {
  const data = await fetchDashboardCompleto();
  return data.horariosPopulares;
}

export async function fetchCrecimientoClientes() {
  const data = await fetchDashboardCompleto();
  return data.crecimientoClientes;
}
export async function fetchDistribucionServicios() {
  const data = await fetchDashboardCompleto();
  return data.distribucionServicios;
}

export async function fetchClientesFrecuentes() {
  const data = await fetchDashboardCompleto();
  return data.clientesFrecuentes;
}

export async function fetchTasaAsistencia() {
  const data = await fetchDashboardCompleto();
  const tasa = data.tasaAsistencia;
  
  return {
    asistieron: Number(tasa.asistieron || 0),
    no_asistieron: Number(tasa.no_asistieron || 0),
    pendientes: Number(tasa.pendientes || 0),
    total: Number(tasa.total || 0),
    tasa_asistencia: tasa.total > 0 
      ? ((Number(tasa.asistieron) / (Number(tasa.asistieron) + Number(tasa.no_asistieron))) * 100).toFixed(1)
      : 0
  };
}