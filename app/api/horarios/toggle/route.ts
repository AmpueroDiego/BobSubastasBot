import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// POST - Toggle estado activo de un horario
export async function POST(request: Request) {
  try {
    const { id, activo } = await request.json();

    if (id === undefined || activo === undefined) {
      return NextResponse.json(
        { error: 'ID y estado activo son requeridos' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE horarios 
       SET activo = $1
       WHERE id = $2
       RETURNING id, dia, 
                 TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio,
                 TO_CHAR(hora_final, 'HH24:MI') as hora_final,
                 activo`,
      [activo, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      horario: result.rows[0],
      mensaje: activo 
        ? `Horario de ${result.rows[0].dia} activado` 
        : `Horario de ${result.rows[0].dia} desactivado`
    });
  } catch (error) {
    console.error('Error al actualizar estado del horario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado del horario' },
      { status: 500 }
    );
  }
}

// GET - Obtener horarios activos (útil para validar disponibilidad)
export async function GET() {
  try {
    const result = await query(
      `SELECT id, dia, 
              TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio,
              TO_CHAR(hora_final, 'HH24:MI') as hora_final,
              activo
       FROM horarios
       WHERE activo = true
       ORDER BY 
         CASE dia
           WHEN 'Lunes' THEN 1
           WHEN 'Martes' THEN 2
           WHEN 'Miércoles' THEN 3
           WHEN 'Jueves' THEN 4
           WHEN 'Viernes' THEN 5
           WHEN 'Sábado' THEN 6
           WHEN 'Domingo' THEN 7
         END`,
      []
    );

    return NextResponse.json({
      success: true,
      horariosActivos: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener horarios activos:', error);
    return NextResponse.json(
      { error: 'Error al obtener horarios activos' },
      { status: 500 }
    );
  }
}