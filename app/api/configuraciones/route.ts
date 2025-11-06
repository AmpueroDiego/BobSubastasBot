import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET - Obtener umbrales actuales
export async function GET() {
  try {
    const result = await query(
      `SELECT umbral_bajo, umbral_alto 
       FROM clasificacion 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      // Si no existe registro, crear uno con valores por defecto
      await query(
        `INSERT INTO clasificacion (umbral_bajo, umbral_alto) 
         VALUES (30, 70)`
      );
      
      return NextResponse.json({
        umbral_bajo: 30,
        umbral_alto: 70
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener umbrales:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar umbrales
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { umbral_bajo, umbral_alto } = body;

    // Validaciones
    if (typeof umbral_bajo !== 'number' || typeof umbral_alto !== 'number') {
      return NextResponse.json(
        { error: 'Los umbrales deben ser números' },
        { status: 400 }
      );
    }

    if (umbral_bajo < 0 || umbral_bajo > 100 || umbral_alto < 0 || umbral_alto > 100) {
      return NextResponse.json(
        { error: 'Los umbrales deben estar entre 0 y 100' },
        { status: 400 }
      );
    }

    if (umbral_bajo >= umbral_alto) {
      return NextResponse.json(
        { error: 'El umbral bajo debe ser menor que el umbral alto' },
        { status: 400 }
      );
    }

    // Verificar si existe un registro
    const checkResult = await query(`SELECT COUNT(*) as count FROM clasificacion`);
    const count = parseInt(checkResult.rows[0].count);

    if (count === 0) {
      // Insertar nuevo registro
      await query(
        `INSERT INTO clasificacion (umbral_bajo, umbral_alto) 
         VALUES ($1, $2)`,
        [umbral_bajo, umbral_alto]
      );
    } else {
      // Actualizar registro existente (solo hay uno)
      await query(
        `UPDATE clasificacion 
         SET umbral_bajo = $1, umbral_alto = $2`,
        [umbral_bajo, umbral_alto]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuraciones actualizadas correctamente',
      umbral_bajo,
      umbral_alto
    });
  } catch (error) {
    console.error('Error al actualizar umbrales:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuraciones' },
      { status: 500 }
    );
  }
}