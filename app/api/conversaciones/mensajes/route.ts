// app/api/conversaciones/mensajes/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// Función para limpiar el número de teléfono
function limpiarTelefono(telefono: string): string {
  // Remover espacios, guiones, paréntesis, signos +
  let limpio = telefono.replace(/[\s\-\(\)\+]/g, '');
  
  // Si empieza con 51, remover el código de país
  if (limpio.startsWith('51') && limpio.length > 9) {
    limpio = limpio.substring(2);
  }
  
  return limpio;
}

// ==========================================
// GET - Mensajes de un cliente específico
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id_raw = searchParams.get('session_id');

    console.log('📞 GET /api/conversaciones/mensajes');
    console.log('   session_id recibido:', session_id_raw);

    if (!session_id_raw) {
      return NextResponse.json(
        { error: 'session_id es requerido' },
        { status: 400 }
      );
    }

    // Limpiar el número de teléfono
    const session_id = limpiarTelefono(session_id_raw);
    console.log('   session_id limpio:', session_id);

    // 1. Verificar que el cliente existe y obtener su ultimo_mensaje
    // Buscar tanto con el número limpio como con formato WhatsApp
    const clienteResult = await query(
      `SELECT id, nombre_apellido, ultimo_mensaje, telefono
       FROM cliente 
       WHERE telefono = $1 
          OR telefono = $2
          OR telefono LIKE $3
       LIMIT 1`,
      [
        session_id,
        `+51${session_id}`,
        `%${session_id}%`
      ]
    );

    if (clienteResult.rows.length === 0) {
      console.log('❌ Cliente no encontrado con teléfono:', session_id);
      return NextResponse.json(
        { error: 'Cliente no encontrado', telefono_buscado: session_id },
        { status: 404 }
      );
    }

    const cliente = clienteResult.rows[0];
    console.log('✅ Cliente encontrado:', {
      id: cliente.id,
      nombre_apellido: cliente.nombre_apellido,
      telefono: cliente.telefono
    });

    // 2. Obtener mensajes del historial
    // Buscar usando diferentes formatos del session_id
    const mensajesResult = await query(
      `SELECT 
        id,
        session_id,
        message->>'type' as tipo,
        message->>'content' as contenido,
        message as message_completo
      FROM n8n_chat_histories
      WHERE session_id = $1
         OR session_id = $2
         OR session_id LIKE $3
         OR session_id LIKE $4
      ORDER BY id ASC`,
      [
        session_id,
        `+51${session_id}`,
        `%${session_id}%`,
        `${session_id}@s.whatsapp.net`
      ]
    );

    console.log('✅ Mensajes encontrados:', mensajesResult.rows.length);

    // 3. Formatear mensajes
    const mensajesFormateados = mensajesResult.rows.map((row: any, index: number) => {
      const esHumano = row.tipo === 'human';
      
      return {
        id: row.id,
        texto: row.contenido || '',
        remitente: esHumano ? session_id : 'bot',
        tipo: esHumano ? 'recibido' : 'enviado',
        // Usamos el ultimo_mensaje del cliente para el mensaje más reciente
        // Para los demás, podemos usar el id como referencia temporal
        created_at: index === mensajesResult.rows.length - 1 
          ? cliente.ultimo_mensaje 
          : null,
        message_id: row.id,
        session_id: row.session_id,
        metadata: row.message_completo
      };
    });

    console.log('📊 Resumen:', {
      cliente_id: cliente.id,
      total_mensajes: mensajesFormateados.length
    });

    // 4. Respuesta
    return NextResponse.json({
      session_id: session_id_raw,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre_apellido,
        telefono: cliente.telefono,
        ultimo_mensaje: cliente.ultimo_mensaje
      },
      mensajes: mensajesFormateados,
      total: mensajesFormateados.length
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[API] Error en GET /api/conversaciones/mensajes:', error);
    
    return NextResponse.json(
      {
        error: 'Error al obtener mensajes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}