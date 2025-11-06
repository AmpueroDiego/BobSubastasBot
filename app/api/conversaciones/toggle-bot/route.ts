import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { numero, activo } = body;

    if (!numero || typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'Datos inválidos. Se requiere numero y activo (boolean)' },
        { status: 400 }
      );
    }

    // Actualizar el estado activo del cliente
    const result = await query(
      `UPDATE clientes 
       SET activo = $1
       WHERE numero = $2
       RETURNING *`,
      [activo, numero]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cliente: result.rows[0],
      message: `Bot ${activo ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('Error al actualizar estado del bot:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado del bot' },
      { status: 500 }
    );
  }
}