// app/dashboard/conversaciones/page.tsx
import { Suspense } from 'react';
import ConversacionesList from '@/app/ui/conversaciones/conversaciones-list';
import { ClienteConUltimoMensaje } from '@/app/lib/chat-data';

async function obtenerClientes(): Promise<ClienteConUltimoMensaje[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/conversaciones/clientes`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Error al obtener clientes:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
}

export default async function ConversacionesPage() {
  const clientes = await obtenerClientes();

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Conversaciones</h1>
        <p className="text-gray-600 mt-2">Gestiona tus chats de WhatsApp</p>
      </div>

      <Suspense fallback={<ConversacionesLoading />}>
        <ConversacionesList clientes={clientes} />
      </Suspense>
    </div>
  );
}

function ConversacionesLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-16rem)]">
      <div className="flex h-full">
        {/* Skeleton de sidebar */}
        <div className="w-80 border-r border-gray-200 p-4">
          <div className="h-10 bg-gray-200 rounded-lg mb-4 animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-3">
              <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton de chat */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-gray-200 border-b border-gray-200 animate-pulse" />
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}