import { Suspense } from 'react';
import CardWrapper from '@/app/ui/dashboard/cards';
import CitasHoy from '@/app/ui/dashboard/citas-hoy';
import ServiciosSolicitados from '@/app/ui/dashboard/servicios-solicitados';
import { CardSkeleton } from '@/app/ui/skeletons';

export const metadata = {
  title: 'Dashboard',
};

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <main className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Suspense fallback={<CardSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>

      {/* Sección principal - Citas y Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Citas de hoy - 2/3 del ancho */}
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSkeleton />}>
            <CitasHoy />
          </Suspense>
        </div>

        {/* Servicios solicitados - 1/3 del ancho */}
        <div className="lg:col-span-1">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiciosSolicitados />
          </Suspense>
        </div>
      </div>
    </main>
  );
}