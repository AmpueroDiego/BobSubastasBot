import { fetchDistribucionServicios } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { DistribucionServicio } from '@/app/lib/definitions';

export default async function DistribucionServicios() {
  const servicios = await fetchDistribucionServicios();

  const colores = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-orange-500 to-orange-600',
    'from-teal-500 to-teal-600',
    'from-indigo-500 to-indigo-600',
  ];

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Distribución de Servicios
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          {servicios.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay datos de servicios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servicios.map((servicio: DistribucionServicio, index: number) => {
                const total = Number(servicio.total);
                const porcentaje = Number(servicio.porcentaje);
                const color = colores[index % colores.length];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ChartPieIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {servicio.servicio}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-sm text-gray-600">
                          {porcentaje}%
                        </span>
                        <span className={`${lusitana.className} text-base font-bold text-gray-900`}>
                          {total}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${color} h-3 rounded-full transition-all`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {servicios.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Servicio más solicitado</span>
                <span className={`${lusitana.className} text-lg font-bold text-blue-600 truncate max-w-[200px]`}>
                  {servicios[0].servicio}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}