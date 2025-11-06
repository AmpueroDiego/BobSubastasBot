import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - Obtener datos del negocio
export async function GET() {
  try {
    const session = await auth();
    // @ts-ignore
    const idNegocio = session?.user?.id_negocio;

    if (!idNegocio) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT id, path, webhook, numero, nombre_negocio, numero_admin, logo_imagen
       FROM negocio
       WHERE id = $1`,
      [idNegocio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener negocio:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del negocio' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar datos del negocio
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    // @ts-ignore
    const idNegocio = session?.user?.id_negocio;

    if (!idNegocio) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const nombreNegocio = formData.get('nombre_negocio') as string;
    const webhook = formData.get('webhook') as string;
    const numero = formData.get('numero') as string;
    const numeroAdmin = formData.get('numero_admin') as string;
    const logoFile = formData.get('logo') as File | null;

    let logoPath: string | null = null;

    // Si hay un archivo de logo, guardarlo
    if (logoFile && logoFile.size > 0) {
      // Crear directorio si no existe
      const uploadsDir = path.join(process.cwd(), 'public', 'logos');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directorio ya existe
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = path.extname(logoFile.name);
      const filename = `logo-${idNegocio}-${timestamp}${extension}`;
      const filepath = path.join(uploadsDir, filename);

      // Convertir File a Uint8Array y guardar
      const bytes = await logoFile.arrayBuffer();
      const buffer = new Uint8Array(bytes);
      await writeFile(filepath, buffer);

      // Guardar ruta relativa para la BD
      logoPath = `/logos/${filename}`;
    }

    // Actualizar en la base de datos
    const updateQuery = logoPath
      ? `UPDATE negocio 
         SET nombre_negocio = $1, webhook = $2, numero = $3, numero_admin = $4, logo_imagen = $5
         WHERE id = $6
         RETURNING *`
      : `UPDATE negocio 
         SET nombre_negocio = $1, webhook = $2, numero = $3, numero_admin = $4
         WHERE id = $5
         RETURNING *`;

    const params = logoPath
      ? [nombreNegocio, webhook, numero, numeroAdmin, logoPath, idNegocio]
      : [nombreNegocio, webhook, numero, numeroAdmin, idNegocio];

    const result = await query(updateQuery, params);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el negocio' },
      { status: 500 }
    );
  }
}