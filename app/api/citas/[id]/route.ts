import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { auth } from '@/auth';
import { revalidateTag, revalidatePath } from 'next/cache';

async function getIdNegocio(): Promise<number> {
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;

  if (!idNegocio) {
    throw new Error('No se pudo obtener el id_negocio de la sesión');
  }

  return idNegocio;
}

// GET - Obtener una cita específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const citaId = params.id;

    const result = await query(
      `SELECT 
        c.id,
        c.fecha,
        TO_CHAR(c.hora, 'HH24:MI') as hora,
        c.descripcion,
        c.asistio,
        c.id_servicio,
        s.nombre as servicio_nombre,
        TO_CHAR(c.duracion, 'HH24:MI') as duracion,
        cl.nombre as cliente_nombre,
        cl.apellido as cliente_apellido,
        cl.numero as cliente_numero
      FROM citas c
      INNER JOIN clientes cl ON c.id_cliente = cl.id
      LEFT JOIN servicios s ON c.id_servicio = s.id
      WHERE c.id = $1 AND cl.id_negocio = $2`,
      [citaId, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cita no encontrada o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return NextResponse.json(
      { error: 'Error al obtener cita' },
      { status: 500 }
    );
  }
}

// PUT - Actualización completa de la cita
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const citaId = params.id;
    const body = await request.json();

    console.log('PUT - Actualizando cita:', citaId, 'con datos:', body);

    // Verificar que la cita pertenece al negocio
    const citaCheck = await query(
      `SELECT c.id FROM citas c
       INNER JOIN clientes cl ON c.id_cliente = cl.id
       WHERE c.id = $1 AND cl.id_negocio = $2`,
      [citaId, idNegocio]
    );

    if (citaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cita no encontrada o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Si solo se está actualizando asistio, usar lógica simplificada
    if ('asistio' in body && Object.keys(body).length === 1) {
      console.log('Actualizando solo campo asistio:', body.asistio);
      
      const result = await query(
        `UPDATE citas 
         SET asistio = $1
         WHERE id = $2
         RETURNING id, asistio, fecha, TO_CHAR(hora, 'HH24:MI') as hora`,
        [body.asistio, citaId]
      );

      console.log('Resultado de actualización:', result.rows[0]);

      // CORREGIDO: Revalidar múltiples paths y tags
      revalidateTag('citas');
      revalidateTag('dashboard');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/citas');

      return NextResponse.json({
        ...result.rows[0],
        success: true,
        message: 'Asistencia actualizada correctamente'
      });
    }

    // Actualización completa de la cita
    const { fecha, hora, descripcion, asistio, id_servicio, duracion } = body;

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

    const result = await query(
      `UPDATE citas 
       SET fecha = $1, 
           hora = $2, 
           descripcion = $3, 
           asistio = $4, 
           id_servicio = $5, 
           duracion = $6
       WHERE id = $7
       RETURNING id, fecha, TO_CHAR(hora, 'HH24:MI') as hora, descripcion, asistio, id_servicio, TO_CHAR(duracion, 'HH24:MI') as duracion`,
      [fecha, hora, descripcion, asistio, id_servicio, duracion, citaId]
    );

    // CORREGIDO: Revalidar múltiples paths y tags
    revalidateTag('citas');
    revalidateTag('dashboard');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/citas');

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    );
  }
}

// PATCH - Actualización parcial de la cita
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const citaId = params.id;
    const body = await request.json();

    console.log('PATCH - Actualizando cita:', citaId, 'con datos:', body);

    // Verificar que la cita pertenece al negocio
    const citaCheck = await query(
      `SELECT c.id FROM citas c
       INNER JOIN clientes cl ON c.id_cliente = cl.id
       WHERE c.id = $1 AND cl.id_negocio = $2`,
      [citaId, idNegocio]
    );

    if (citaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cita no encontrada o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    // Construir query dinámicamente basado en los campos proporcionados
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if ('fecha' in body) {
      updates.push(`fecha = $${paramIndex}`);
      values.push(body.fecha);
      paramIndex++;
    }

    if ('hora' in body) {
      updates.push(`hora = $${paramIndex}`);
      values.push(body.hora);
      paramIndex++;
    }

    if ('descripcion' in body) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(body.descripcion);
      paramIndex++;
    }

    if ('asistio' in body) {
      updates.push(`asistio = $${paramIndex}`);
      values.push(body.asistio);
      paramIndex++;
      console.log('Actualizando campo asistio a:', body.asistio);
    }

    if ('id_servicio' in body) {
      if (body.id_servicio !== null) {
        const servicioCheck = await query(
          'SELECT id FROM servicios WHERE id = $1 AND id_negocio = $2',
          [body.id_servicio, idNegocio]
        );

        if (servicioCheck.rows.length === 0) {
          return NextResponse.json(
            { error: 'Servicio no encontrado o no pertenece a este negocio' },
            { status: 404 }
          );
        }
      }
      updates.push(`id_servicio = $${paramIndex}`);
      values.push(body.id_servicio);
      paramIndex++;
    }

    if ('duracion' in body) {
      updates.push(`duracion = $${paramIndex}`);
      values.push(body.duracion);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(citaId);

    const updateQuery = `UPDATE citas 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, fecha, TO_CHAR(hora, 'HH24:MI') as hora, descripcion, asistio, id_servicio, TO_CHAR(duracion, 'HH24:MI') as duracion`;
    
    console.log('Query de actualización:', updateQuery);
    console.log('Valores:', values);

    const result = await query(updateQuery, values);

    console.log('Resultado de actualización:', result.rows[0]);

    // CORREGIDO: Revalidar múltiples paths y tags de forma más agresiva
    revalidateTag('citas');
    revalidateTag('dashboard');
    revalidateTag('citas-agrupadas');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/citas', 'page');

    return NextResponse.json({
      ...result.rows[0],
      success: true,
      message: 'Cita actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar cita con PATCH:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cita', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una cita
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const citaId = params.id;

    const citaCheck = await query(
      `SELECT c.id, c.fecha, TO_CHAR(c.hora, 'HH24:MI') as hora, cl.nombre, cl.apellido
       FROM citas c
       INNER JOIN clientes cl ON c.id_cliente = cl.id
       WHERE c.id = $1 AND cl.id_negocio = $2`,
      [citaId, idNegocio]
    );

    if (citaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cita no encontrada o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    await query('DELETE FROM citas WHERE id = $1', [citaId]);

    // CORREGIDO: Revalidar múltiples paths y tags
    revalidateTag('citas');
    revalidateTag('dashboard');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/citas');

    return NextResponse.json({ 
      message: 'Cita eliminada correctamente',
      cita: citaCheck.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cita' },
      { status: 500 }
    );
  }
}