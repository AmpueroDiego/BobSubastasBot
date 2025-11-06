


import { fetchCitasPorSemana } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default async function CitasSemanaChart() {
  const datos = await fetchCitasPorSemana();

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
const datosCompletos = diasSemana.map((dia, index) => {
  const registro = datos.find((d: any) => d.dia_num === (index + 1) % 7);
  return {
    dia,
    total: registro ? Number(registro.total) : 0
  };
});
  const maxCitas = Math.max(...datosCompletos.map(d => d.total), 1);

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Citas por Día (Última Semana)
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          <div className="space-y-3">
            {datosCompletos.map((dato, index) => {
              const porcentaje = (dato.total / maxCitas) * 100;
              const color = dato.total > 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300';
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 w-24">
                        {dato.dia}
                      </span>
                    </div>
                    <span className={`${lusitana.className} text-base font-bold text-gray-900`}>
                      {dato.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${color} h-2.5 rounded-full transition-all`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de la semana</span>
              <span className={`${lusitana.className} text-xl font-bold text-blue-600`}>
                {datosCompletos.reduce((sum, d) => sum + d.total, 0)} citas
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


