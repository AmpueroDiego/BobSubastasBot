'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import CitasList from './citas-list';

interface CitaDetalle {
  id: number;
  hora: string;
  servicio: string;
  cliente: string;
  fecha: string | Date;
  asistio: boolean | null;
  descripcion?: string;
}

interface CitasAgrupadasPorDia {
  dia: string;
  total_citas: number;
  citas: CitaDetalle[];
}

// app/ui/citas/citas-tabs.tsx

export default function CitasTabs({
  citasFuturas,
  citasPasadas,
  tabActual
}: {
  citasFuturas: CitasAgrupadasPorDia[];
  citasPasadas: CitasAgrupadasPorDia[];
  tabActual: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cambiarTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  // Calcular totales correctamente
  const totalFuturas = citasFuturas.reduce((acc, grupo) => acc + Number(grupo.total_citas || 0), 0);
  const totalPasadas = citasPasadas.reduce((acc, grupo) => acc + Number(grupo.total_citas || 0), 0);

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => cambiarTab('futuras')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tabActual === 'futuras'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Citas Futuras
            {totalFuturas > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {totalFuturas}
              </span>
            )}
          </button>
          <button
            onClick={() => cambiarTab('pasadas')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tabActual === 'pasadas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Citas Pasadas
            {totalPasadas > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {totalPasadas}
              </span>
            )}
          </button>
        </nav>
      </div>

      {tabActual === 'futuras' ? (
        <CitasList citas={citasFuturas} tipo="futuras" />
      ) : (
        <CitasList citas={citasPasadas} tipo="pasadas" />
      )}
    </div>
  );
}