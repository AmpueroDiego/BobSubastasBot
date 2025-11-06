import { headers } from 'next/headers';
import { auth } from '@/auth';

export async function getIdNegocio(): Promise<number> {
  const headersList = headers();
  const idNegocioHeader = headersList.get('x-id-negocio');
  
  if (idNegocioHeader) {
    const idNegocio = parseInt(idNegocioHeader, 10);
    if (!isNaN(idNegocio)) {
      return idNegocio;
    }
  }
  
  const session = await auth();
  // @ts-ignore
  const idNegocio = session?.user?.id_negocio;
  
  if (!idNegocio) {
    throw new Error('No se pudo obtener el id_negocio');
  }
  
  return idNegocio;
}