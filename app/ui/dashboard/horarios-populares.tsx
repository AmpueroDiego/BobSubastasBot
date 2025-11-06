import { fetchHorariosPopulares } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { ClockIcon } from '@heroicons/react/24/outline';
import { HorarioPopular } from '@/app/lib/definitions';

export default async function HorariosPopulares() {
  const datos = await fetchHorariosPopulares();

  const maxCitas = datos.length > 0 ? Math.max(...datos.map((d: HorarioPopular) => Number(d.total))) : 1;

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Horarios Más Solicitados
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          {datos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay datos de horarios</p>
            </div>
          ) : (
            <div className="space-y-3">
              {datos.map((horario: HorarioPopular) => {
                const hora_num = Number(horario.hora);
                const total = Number(horario.total);
                const porcentaje = (total / maxCitas) * 100;
                const hora_formateada = `${hora_num.toString().padStart(2, '0')}:00`;
                
                return (
                  <div key={hora_num} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 w-16">
                          {hora_formateada}
                        </span>
                      </div>
                      <span className={`${lusitana.className} text-base font-bold text-gray-900`}>
                        {total} citas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {datos.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Horario más popular</span>
                <span className={`${lusitana.className} text-lg font-bold text-purple-600`}>
                  {Number(datos[0].hora).toString().padStart(2, '0')}:00
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}