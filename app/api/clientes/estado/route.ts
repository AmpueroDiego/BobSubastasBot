import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getIdNegocio } from '@/app/lib/get-id-negocio';

// ==========================================

// ==========================================
// GET - Obtener el estado actual del bot del negocio
// ==========================================

export async function GET() {
  try {
    const idNegocio = await getIdNegocio();
    
    const result = await query(
      `SELECT 
         COUNT(*) as total_clientes,
         COUNT(*) FILTER (WHERE activo = true) as clientes_activos,
         COUNT(*) FILTER (WHERE activo = false) as clientes_inactivos
       FROM clientes
       WHERE id_negocio = $1`,
      [idNegocio]
    );

    const datos = result.rows[0];
    const totalClientes = parseInt(datos.total_clientes);
    const clientesActivos = parseInt(datos.clientes_activos);
    
    // Si hay al menos un cliente activo, consideramos el bot como activo
    const algunoActivo = clientesActivos > 0;
    
    // Si todos están activos o todos inactivos, ese es el estado
    const todosActivos = totalClientes > 0 && clientesActivos === totalClientes;
    const todosInactivos = totalClientes > 0 && clientesActivos === 0;

    return NextResponse.json({
      id_negocio: idNegocio,
      totalClientes,
      clientesActivos,
      clientesInactivos: parseInt(datos.clientes_inactivos),
      algunoActivo,
      todosActivos,
      todosInactivos
    });
  } catch (error) {
    console.error('Error al obtener estado de clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de clientes' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - Activar/Desactivar todos los clientes del negocio
// ==========================================

export async function POST(request: Request) {
  try {
    const idNegocio = await getIdNegocio();
    const { activar } = await request.json();

    if (typeof activar !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo "activar" debe ser booleano' },
        { status: 400 }
      );
    }

    // Actualizar todos los clientes del negocio
    const result = await query(
      `UPDATE clientes 
       SET activo = $1
       WHERE id_negocio = $2
       RETURNING id`,
      [activar, idNegocio]
    );

    const clientesActualizados = result.rows.length;

    return NextResponse.json({
      success: true,
      mensaje: activar 
        ? `Bot activado para ${clientesActualizados} cliente(s)` 
        : `Bot desactivado para ${clientesActualizados} cliente(s)`,
      clientesActualizados,
      nuevoEstado: activar
    });
  } catch (error) {
    console.error('Error al cambiar estado de clientes:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado de clientes' },
      { status: 500 }
    );
  }
}