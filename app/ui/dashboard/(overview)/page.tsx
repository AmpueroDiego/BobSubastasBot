

import { lusitana } from "@/app/ui/fonts";
import React, { Suspense } from "react";
import CardWrapper from "@/app/ui/dashboard/cards";
import CitasHoy from "@/app/ui/dashboard/citas-hoy";
import ServiciosSolicitados from "@/app/ui/dashboard/servicios-solicitados";
import EstadisticasAsistencia from "@/app/ui/dashboard/estadisticas-asistencia";
import CitasSemanaChart from "@/app/ui/dashboard/citas-semana-chart";
import HorariosPopulares from "@/app/ui/dashboard/horarios-populares";
import ClientesFrecuentes from "@/app/ui/dashboard/clientes-frecuentes";
import CrecimientoClientes from "@/app/ui/dashboard/crecimiento-clientes";
import DistribucionServicios from "@/app/ui/dashboard/distribucion-servicios";
import { CardsSkeleton } from '@/app/ui/skeletons';

function SectionSkeleton() {
  return (
    <div className="flex w-full flex-col md:col-span-4">
      <div className="mb-4 h-8 w-48 rounded-md bg-gray-100 animate-pulse" />
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-8">
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Inicio
      </h1>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Suspense fallback={<SectionSkeleton />}>
          <EstadisticasAsistencia />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <CitasSemanaChart />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">


        <Suspense fallback={<SectionSkeleton />}>
          <ServiciosSolicitados />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Suspense fallback={<SectionSkeleton />}>
          <HorariosPopulares />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <DistribucionServicios />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Suspense fallback={<SectionSkeleton />}>
          <ClientesFrecuentes />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <CrecimientoClientes />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Suspense fallback={<SectionSkeleton />}>
          <CitasHoy />
        </Suspense>
      </div>
    </main>
  );
}



