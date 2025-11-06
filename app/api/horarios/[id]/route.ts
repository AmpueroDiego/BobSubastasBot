import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// PUT - Actualizar horario específico
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { dia, hora_inicio, hora_final, activo } = await request.json();
    const id = params.id;

    const result = await query(
      `UPDATE horarios 
       SET dia = $1, hora_inicio = $2, hora_final = $3, activo = $4
       WHERE id = $5
       RETURNING id, dia, 
                 TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio,
                 TO_CHAR(hora_final, 'HH24:MI') as hora_final,
                 activo`,
      [dia, hora_inicio, hora_final, activo, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar horario' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar horario específico
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const result = await query(
      `DELETE FROM horarios WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar horario' },
      { status: 500 }
    );
  }
}