import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';

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
// GET - Obtener citas del negocio
// ==========================================

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const clienteId = searchParams.get('cliente_id');
    const soloFuturas = searchParams.get('futuras') === 'true';
    const soloPendientes = searchParams.get('pendientes') === 'true';

    let queryText = `
      SELECT 
        c.id,
        c.fecha,
        TO_CHAR(c.hora, 'HH24:MI') as hora,
        c.descripcion,
        c.asistio,
        c.recordatorio_enviado,
        TO_CHAR(c.duracion, 'HH24:MI') as duracion,
        c.id_cliente,
        cl.nombre as cliente_nombre,
        cl.apellido as cliente_apellido,
        cl.numero as cliente_numero,
        c.id_servicio,
        s.nombre as servicio_nombre
      FROM citas c
      INNER JOIN clientes cl ON c.id_cliente = cl.id
      LEFT JOIN servicios s ON c.id_servicio = s.id
      WHERE cl.id_negocio = $1
    `;

    const params: any[] = [idNegocio];
    let paramIndex = 2;

    if (fecha) {
      queryText += ` AND c.fecha = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }

    if (clienteId) {
      queryText += ` AND c.id_cliente = $${paramIndex}`;
      params.push(clienteId);
      paramIndex++;
    }

    if (soloFuturas) {
      queryText += ` AND (c.fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::date >= CURRENT_DATE`;
    }

    if (soloPendientes) {
      queryText += ` AND (c.asistio IS NULL OR c.asistio = false)`;
    }

    queryText += ` ORDER BY c.fecha ASC, c.hora ASC`;

    const result = await query(queryText, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}



// ==========================================
// POST - Crear nueva cita
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { id_cliente, fecha, hora, descripcion, id_servicio, duracion } = await request.json();

    // Validación básica
    if (!id_cliente || !fecha || !hora) {
      return NextResponse.json(
        { error: 'id_cliente, fecha y hora son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece al negocio
    const clienteCheck = await query(
      'SELECT id FROM clientes WHERE id = $1 AND id_negocio = $2',
      [id_cliente, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Verificar que el servicio pertenece al negocio (si se proporciona)
    if (id_servicio) {
      const servicioCheck = await query(
        'SELECT id FROM servicios WHERE id = $1 AND id_negocio = $2',
        [id_servicio, idNegocio]
      );

      if (servicioCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Servicio no encontrado o no pertenece a este negocio' },
          { status: 404 }
        );
      }
    }

    // Insertar la cita
    const result = await query(
      `INSERT INTO citas (id_cliente, fecha, hora, descripcion, id_servicio, duracion, id_negocio, recordatorio_enviado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING id, fecha, TO_CHAR(hora, 'HH24:MI') as hora, descripcion, asistio, id_servicio, TO_CHAR(duracion, 'HH24:MI') as duracion`,
      [id_cliente, fecha, hora, descripcion || null, id_servicio || null, duracion || null, idNegocio]
    );

    // Revalidar caché
    revalidateTag('citas');
    revalidateTag('dashboard');

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear cita:', error);
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    );
  }
}