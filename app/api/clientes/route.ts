import { query } from '@/app/lib/db';
import { NextResponse } from 'next/server';
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
// GET - Obtener todos los clientes
// ==========================================

export async function GET(request: Request) {
  try {
    const idNegocio = await getIdNegocio();

    const result = await query(
      `
      SELECT 
        id, nombre, apellido, alias, edad, numero, genero,
        primer_mensaje, ultimo_mensaje, activo, id_negocio
      FROM clientes 
      WHERE id_negocio = $1 AND activo = true
      ORDER BY ultimo_mensaje DESC NULLS LAST
      `,
      [idNegocio]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - Crear nuevo cliente
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { nombre, apellido, numero, edad, genero, alias } = await request.json();

    // Validación
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    // Insertar cliente
    const result = await query(
      `INSERT INTO clientes (
        nombre, apellido, numero, edad, genero, alias, 
        id_negocio, activo, primer_mensaje, ultimo_mensaje
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      RETURNING id, nombre, apellido, alias, numero, edad, genero, activo`,
      [
        nombre.trim(),
        apellido?.trim() || null,
        numero?.trim() || null,
        edad || null,
        genero || 'otro',
        alias?.trim() || null,
        idNegocio
      ]
    );

    // Revalidar caché
    revalidateTag('clientes');

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}