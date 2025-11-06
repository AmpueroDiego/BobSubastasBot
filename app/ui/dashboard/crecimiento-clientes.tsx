import { fetchCrecimientoClientes } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { CrecimientoCliente } from '@/app/lib/definitions';

export default async function CrecimientoClientes() {
  const datos = await fetchCrecimientoClientes();

  const maxClientes = datos.length > 0 ? Math.max(...datos.map((d: CrecimientoCliente) => Number(d.nuevos_clientes))) : 1;

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Crecimiento de Clientes (Últimos 6 Meses)
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          {datos.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay datos de crecimiento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {datos.map((mes: CrecimientoCliente, index: number) => {
                const nuevos = Number(mes.nuevos_clientes);
                const porcentaje = (nuevos / maxClientes) * 100;
                const mes_nombre = mes.mes.trim();
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {mes_nombre}
                        </span>
                      </div>
                      <span className={`${lusitana.className} text-base font-bold text-gray-900`}>
                        +{nuevos}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total nuevos</p>
                  <p className={`${lusitana.className} text-xl font-bold text-emerald-600 mt-1`}>
                    {datos.reduce((sum: number, d: CrecimientoCliente) => sum + Number(d.nuevos_clientes), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Promedio mensual</p>
                  <p className={`${lusitana.className} text-xl font-bold text-gray-900 mt-1`}>
                    {(datos.reduce((sum: number, d: CrecimientoCliente) => sum + Number(d.nuevos_clientes), 0) / datos.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}