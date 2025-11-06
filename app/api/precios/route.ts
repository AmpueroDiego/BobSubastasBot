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

export async function GET() {
  try {
    const idNegocio = await getIdNegocio();
    
    const result = await query(
      `SELECT 
         id, 
         nombre, 
         costo,
         duracion_aproximada
       FROM precios_servicios
       WHERE id_negocio = $1
       ORDER BY nombre`,
      [idNegocio]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener precios:', error);
    return NextResponse.json(
      { error: 'Error al obtener precios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { nombre, costo, duracion_aproximada } = await request.json();

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
      `INSERT INTO precios_servicios (id_negocio, nombre, costo, duracion_aproximada)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, costo, duracion_aproximada`,
      [idNegocio, nombre.trim(), costo, duracion_aproximada || null]
    );

    revalidateTag('precios');

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear precio:', error);
    return NextResponse.json(
      { error: 'Error al crear precio' },
      { status: 500 }
    );
  }
}