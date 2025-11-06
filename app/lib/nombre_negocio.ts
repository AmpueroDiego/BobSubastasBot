import { query } from './db';
import { getIdNegocio } from '@/app/lib/get-id-negocio';

// ==========================================

// ==========================================
// NEGOCIO - Interfaces y tipos
// ==========================================

export interface Negocio {
  id: number;
  path: string;
  webhook: string | null;
  numero: string | null;
  nombre_negocio: string | null;
  numero_admin: string | null;
  logo_imagen: string | null;
}

// ==========================================
// NEGOCIO - Obtener datos del negocio actual
// ==========================================

export async function fetchNegocio(): Promise<Negocio> {
  const idNegocio = await getIdNegocio();
  
  try {
    const result = await query(
      `SELECT 
         id,
         path,
         webhook,
         numero,
         nombre_negocio,
         numero_admin
       FROM negocio
       WHERE id = $1`,
      [idNegocio]
    );

    if (result.rows.length === 0) {
      throw new Error('No se encontró el negocio');
    }

    return result.rows[0] as Negocio;
  } catch (error) {
    console.error('Error al obtener negocio:', error);
    throw new Error('Failed to fetch negocio.');
  }
}