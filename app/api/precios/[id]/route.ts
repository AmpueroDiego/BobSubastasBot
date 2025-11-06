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
    const { nombre, costo, duracion_aproximada } = await request.json();
    const id = params.id;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre del servicio es obligatorio' },
        { status: 400 }
      );
    }

    if (!costo || costo <= 0) {
      return NextResponse.json(
        { error: 'El costo debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (duracion_aproximada !== null && duracion_aproximada !== undefined && duracion_aproximada <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE precios_servicios
       SET nombre = $1, costo = $2, duracion_aproximada = $3
       WHERE id = $4 AND id_negocio = $5
       RETURNING id, nombre, costo, duracion_aproximada`,
      [nombre.trim(), costo, duracion_aproximada || null, id, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Precio no encontrado o no tienes permisos para modificarlo' },
        { status: 404 }
      );
    }

    revalidateTag('precios');

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar precio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar precio' },
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
      `DELETE FROM precios_servicios
       WHERE id = $1 AND id_negocio = $2
       RETURNING id`,
      [id, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Precio no encontrado o no tienes permisos para eliminarlo' },
        { status: 404 }
      );
    }

    revalidateTag('precios');

    return NextResponse.json({ message: 'Precio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar precio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar precio' },
      { status: 500 }
    );
  }
}