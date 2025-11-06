import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idNegocio = await getIdNegocio();
    const { nombre, descripcion, precio } = await request.json();
    const id = params.id;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre del servicio es obligatorio' },
        { status: 400 }
      );
    }

    if (!precio || precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE servicios 
       SET nombre = $1, descripcion = $2, precio = $3
       WHERE id = $4 AND id_negocio = $5
       RETURNING id, nombre, descripcion, precio`,
      [nombre.trim(), descripcion?.trim() || null, precio, id, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para modificarlo' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
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
    const id = params.id;

    const result = await query(
      `DELETE FROM servicios 
       WHERE id = $1 AND id_negocio = $2
       RETURNING id`,
      [id, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para eliminarlo' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}