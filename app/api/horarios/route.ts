import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getIdNegocio } from '@/app/lib/get-id-negocio';

// ==========================================

// ==========================================
// HELPER: Crear horarios por defecto
// ==========================================

async function crearHorariosDefecto(idNegocio: number) {
  console.log(`📅 Iniciando creación de horarios para negocio ${idNegocio}...`);
  
  const horariosDefecto = [
    { dia: 'Lunes', hora_inicio: '09:00', hora_final: '18:00', activo: true },
    { dia: 'Martes', hora_inicio: '09:00', hora_final: '18:00', activo: true },
    { dia: 'Miércoles', hora_inicio: '09:00', hora_final: '18:00', activo: true },
    { dia: 'Jueves', hora_inicio: '09:00', hora_final: '18:00', activo: true },
    { dia: 'Viernes', hora_inicio: '09:00', hora_final: '18:00', activo: true },
    { dia: 'Sábado', hora_inicio: '09:00', hora_final: '14:00', activo: true },
    { dia: 'Domingo', hora_inicio: '09:00', hora_final: '18:00', activo: false }
  ];

  const horariosCreados = [];

  for (const horario of horariosDefecto) {
    console.log(`  ➕ Creando horario: ${horario.dia}`);
    const result = await query(
      `INSERT INTO horarios (dia, hora_inicio, hora_final, activo, id_negocio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, dia, TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio, 
                 TO_CHAR(hora_final, 'HH24:MI') as hora_final, activo`,
      [horario.dia, horario.hora_inicio, horario.hora_final, horario.activo, idNegocio]
    );
    
    horariosCreados.push(result.rows[0]);
  }

  console.log(`✅ ${horariosCreados.length} horarios creados automáticamente`);
  return horariosCreados;
}

// ==========================================
// GET - Obtener horarios (con auto-generación)
// ==========================================

export async function GET() {
  console.log('\n🔵 ===== GET /api/horarios INICIADO =====');
  
  try {
    console.log('1️⃣ Obteniendo ID del negocio...');
    const idNegocio = await getIdNegocio();

    console.log('2️⃣ Consultando horarios existentes...');
    const result = await query(
      `SELECT id, dia, 
              TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio,
              TO_CHAR(hora_final, 'HH24:MI') as hora_final,
              activo
       FROM horarios
       WHERE id_negocio = $1
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
      [idNegocio]
    );

    console.log(`3️⃣ Horarios encontrados: ${result.rows.length}`);

    // Si no hay horarios, crear automáticamente
    if (result.rows.length === 0) {
      console.log('⚠️  No hay horarios, generando automáticamente...');
      const horariosGenerados = await crearHorariosDefecto(idNegocio);
      
      console.log('✅ Retornando horarios generados');
      return NextResponse.json({
        horarios: horariosGenerados,
        generados_automaticamente: true,
        mensaje: 'Horarios generados automáticamente. Puedes personalizarlos según tus necesidades.'
      });
    }

    console.log('✅ Retornando horarios existentes');
    return NextResponse.json({
      horarios: result.rows,
      generados_automaticamente: false
    });

  } catch (error) {
    console.error('❌ ERROR en GET /api/horarios:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Error al obtener horarios', detalle: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  } finally {
    console.log('🔵 ===== GET /api/horarios FINALIZADO =====\n');
  }
}

// ==========================================
// POST - Crear nuevo horario
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { dia, hora_inicio, hora_final, activo } = await request.json();

    if (!dia || !hora_inicio || !hora_final) {
      return NextResponse.json(
        { error: 'Día, hora de inicio y hora final son obligatorios' },
        { status: 400 }
      );
    }

    const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (!diasValidos.includes(dia)) {
      return NextResponse.json(
        { error: 'Día no válido' },
        { status: 400 }
      );
    }

    if (hora_final <= hora_inicio) {
      return NextResponse.json(
        { error: 'La hora final debe ser mayor que la hora de inicio' },
        { status: 400 }
      );
    }

    const conflicto = await query(
      `SELECT id FROM horarios 
       WHERE id_negocio = $1 
         AND dia = $2 
         AND (
           (hora_inicio < $4::time AND hora_final > $3::time) OR
           (hora_inicio >= $3::time AND hora_inicio < $4::time) OR
           (hora_final > $3::time AND hora_final <= $4::time)
         )`,
      [idNegocio, dia, hora_inicio, hora_final]
    );

    if (conflicto.rows.length > 0) {
      return NextResponse.json(
        { error: 'Existe un conflicto con otro horario en el mismo día' },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO horarios (dia, hora_inicio, hora_final, activo, id_negocio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, dia, TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio, TO_CHAR(hora_final, 'HH24:MI') as hora_final, activo`,
      [dia, hora_inicio, hora_final, activo !== false, idNegocio]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear horario:', error);
    return NextResponse.json(
      { error: 'Error al crear horario' },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT - Actualizar horario
// ==========================================

export async function PUT(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { id, dia, hora_inicio, hora_final, activo } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID del horario es obligatorio' },
        { status: 400 }
      );
    }

    // Construir query dinámica
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (dia !== undefined) {
      const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      if (!diasValidos.includes(dia)) {
        return NextResponse.json(
          { error: 'Día no válido' },
          { status: 400 }
        );
      }
      updates.push(`dia = $${paramCounter++}`);
      values.push(dia);
    }

    if (hora_inicio !== undefined) {
      updates.push(`hora_inicio = $${paramCounter++}`);
      values.push(hora_inicio);
    }

    if (hora_final !== undefined) {
      updates.push(`hora_final = $${paramCounter++}`);
      values.push(hora_final);
    }

    if (activo !== undefined) {
      updates.push(`activo = $${paramCounter++}`);
      values.push(activo);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id);
    values.push(idNegocio);

    const result = await query(
      `UPDATE horarios 
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter++} AND id_negocio = $${paramCounter}
       RETURNING id, dia, TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio, TO_CHAR(hora_final, 'HH24:MI') as hora_final, activo`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horario no encontrado o no pertenece a este negocio' },
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

// ==========================================
// DELETE - Eliminar horario
// ==========================================

export async function DELETE(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del horario es obligatorio' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM horarios WHERE id = $1 AND id_negocio = $2 RETURNING id',
      [id, idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Horario no encontrado o no pertenece a este negocio' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Horario eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar horario' },
      { status: 500 }
    );
  }
}