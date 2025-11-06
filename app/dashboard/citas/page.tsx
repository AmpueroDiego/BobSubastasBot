import { Suspense } from 'react';
import { fetchCitasFuturas, fetchCitasPasadas } from '@/app/lib/data';
import Search from '@/app/ui/search';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import NuevaCitaDialog from '@/app/ui/citas/nueva-cita-dialog';
import CitasTabs from '@/app/ui/citas/citas-tabs';

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    tab?: string;
  };
}) {
  const query = searchParams?.query || '';
  const tab = searchParams?.tab || 'futuras';

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Citas</h1>
        <NuevaCitaDialog />
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8 mb-6">
        <Search placeholder="Buscar por cliente o servicio..." />
      </div>

      <Suspense key={`${tab}-${query}`} fallback={<InvoicesTableSkeleton />}>
        <CitasTabsWrapper query={query} tab={tab} />
      </Suspense>
    </div>
  );
}

async function CitasTabsWrapper({ query, tab }: { query: string; tab: string }) {
  const citasFuturas = await fetchCitasFuturas(query);
  const citasPasadas = await fetchCitasPasadas(query);
  
  return <CitasTabs citasFuturas={citasFuturas} citasPasadas={citasPasadas} tabActual={tab} />;
}