import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function PUT(request: Request) {
  try {
    const { citaId, asistio } = await request.json();

    if (!citaId || typeof asistio !== 'boolean') {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE citas SET asistio = $1 WHERE id = $2',
      [asistio, citaId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    return NextResponse.json(
      { error: 'Error al actualizar asistencia' },
      { status: 500 }
    );
  }
}