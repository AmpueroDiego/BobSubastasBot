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

export async function GET() {
  try {
    const idNegocio = await getIdNegocio();
    
    const result = await query(
      `SELECT 
         id, 
         nombre, 
         descripcion,
         precio
       FROM servicios
       WHERE id_negocio = $1
       ORDER BY nombre`,
      [idNegocio]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { nombre, descripcion, precio } = await request.json();

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
      `INSERT INTO servicios (nombre, descripcion, precio, id_negocio)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, descripcion, precio`,
      [nombre.trim(), descripcion?.trim() || null, precio, idNegocio]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}