import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// POST - Activar o desactivar todos los clientes
export async function POST(request: Request) {
  try {
    const { activo } = await request.json();

    if (typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'El parámetro activo debe ser un boolean' },
        { status: 400 }
      );
    }

    // Actualizar todos los clientes
    const result = await query(
      `UPDATE clientes 
       SET activo = $1
       RETURNING id`,
      [activo]
    );

    return NextResponse.json({
      message: `Bot ${activo ? 'activado' : 'desactivado'} correctamente`,
      clientesActualizados: result.rows.length,
      activo: activo
    });
  } catch (error) {
    console.error('Error al cambiar estado del bot:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado del bot' },
      { status: 500 }
    );
  }
}