


import { fetchTasaAsistencia } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default async function EstadisticasAsistencia() {
  const datos = await fetchTasaAsistencia();

  const total_resueltas = datos.asistieron + datos.no_asistieron;
  const porcentaje_asistencia = total_resueltas > 0 
    ? ((datos.asistieron / total_resueltas) * 100).toFixed(1)
    : 0;
  const porcentaje_inasistencia = total_resueltas > 0 
    ? ((datos.no_asistieron / total_resueltas) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Tasa de Asistencia
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
              <p className={`${lusitana.className} text-2xl font-bold text-green-600`}>
                {datos.asistieron}
              </p>
              <p className="text-sm text-gray-600 mt-1">Asistieron</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
              <XCircleIcon className="h-8 w-8 text-red-600 mb-2" />
              <p className={`${lusitana.className} text-2xl font-bold text-red-600`}>
                {datos.no_asistieron}
              </p>
              <p className="text-sm text-gray-600 mt-1">No asistieron</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <ClockIcon className="h-8 w-8 text-blue-600 mb-2" />
              <p className={`${lusitana.className} text-2xl font-bold text-blue-600`}>
                {datos.pendientes}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pendientes</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Tasa de asistencia</span>
                <span className={`${lusitana.className} text-lg font-bold text-green-600`}>
                  {porcentaje_asistencia}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${porcentaje_asistencia}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-gray-700">Tasa de inasistencia</span>
                <span className={`${lusitana.className} text-lg font-bold text-red-600`}>
                  {porcentaje_inasistencia}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all"
                  style={{ width: `${porcentaje_inasistencia}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total de citas</p>
                <p className={`${lusitana.className} text-xl font-bold text-gray-900 mt-1`}>
                  {datos.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Citas resueltas</p>
                <p className={`${lusitana.className} text-xl font-bold text-gray-900 mt-1`}>
                  {total_resueltas}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}