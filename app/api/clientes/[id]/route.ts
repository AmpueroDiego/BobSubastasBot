import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';

async function getIdNegocio(): Promise<number> {
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;

  if (!idNegocio) {
    throw new Error('No se pudo obtener el id_negocio de la sesión');
  }

  return idNegocio;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const clienteId = params.id;
    const body = await request.json();

    const clienteCheck = await query(
      'SELECT id FROM clientes WHERE id = $1 AND id_negocio = $2',
      [clienteId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(body.nombre);
    }

    if (body.apellido !== undefined) {
      updates.push(`apellido = $${paramIndex++}`);
      values.push(body.apellido);
    }

    if (body.edad !== undefined) {
      updates.push(`edad = $${paramIndex++}`);
      values.push(body.edad);
    }

    if (body.genero !== undefined) {
      updates.push(`genero = $${paramIndex++}`);
      values.push(body.genero);
    }

    if (body.activo !== undefined) {
      updates.push(`activo = $${paramIndex++}`);
      values.push(body.activo);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(clienteId, idNegocio);

    const result = await query(
      `UPDATE clientes 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND id_negocio = $${paramIndex}
       RETURNING id, nombre, apellido, alias, edad, genero, numero, primer_mensaje, ultimo_mensaje, activo`,
      values
    );

    revalidateTag('conversaciones');
    revalidateTag('dashboard');
    revalidateTag('clientes');

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const clienteId = params.id;
    const body = await request.json();

    const clienteCheck = await query(
      'SELECT id FROM clientes WHERE id = $1 AND id_negocio = $2',
      [clienteId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(body.nombre);
    }

    if (body.apellido !== undefined) {
      updates.push(`apellido = $${paramIndex++}`);
      values.push(body.apellido);
    }

    if (body.edad !== undefined) {
      updates.push(`edad = $${paramIndex++}`);
      values.push(body.edad);
    }

    if (body.genero !== undefined) {
      updates.push(`genero = $${paramIndex++}`);
      values.push(body.genero);
    }

    if (body.activo !== undefined) {
      updates.push(`activo = $${paramIndex++}`);
      values.push(body.activo);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(clienteId, idNegocio);

    const result = await query(
      `UPDATE clientes 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND id_negocio = $${paramIndex}
       RETURNING id, nombre, apellido, alias, edad, genero, numero, primer_mensaje, ultimo_mensaje, activo`,
      values
    );

    revalidateTag('conversaciones');
    revalidateTag('dashboard');
    revalidateTag('clientes');

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const clienteId = params.id;

    const clienteCheck = await query(
      'SELECT id FROM clientes WHERE id = $1 AND id_negocio = $2',
      [clienteId, idNegocio]
    );

    if (clienteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    await query(
      'DELETE FROM clientes WHERE id = $1 AND id_negocio = $2',
      [clienteId, idNegocio]
    );

    revalidateTag('conversaciones');
    revalidateTag('dashboard');
    revalidateTag('clientes');

    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}