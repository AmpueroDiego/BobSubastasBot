import { Suspense } from 'react';
import { fetchClientesConChats } from '@/app/lib/chat-data';
import ConversacionesList from '@/app/ui/conversaciones/conversaciones-list';
import { ChatSkeleton } from '@/app/ui/skeletons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConversacionesPage({
  searchParams,
}: {
  searchParams?: {
    cliente?: string;
  };
}) {
  const clienteSeleccionado = searchParams?.cliente || '';
  const clientes = await fetchClientesConChats();

  return (
    <div className="w-full h-[calc(100vh-8rem)]">
      <div className="flex w-full items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Conversaciones</h1>
      </div>
      
      <Suspense fallback={<ChatSkeleton />}>
        <ConversacionesList 
          clientes={clientes}
          clienteSeleccionado={clienteSeleccionado}
        />
      </Suspense>
    </div>
  );
}