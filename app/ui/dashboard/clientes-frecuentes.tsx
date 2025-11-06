import { fetchClientesFrecuentes } from '@/app/lib/analytics-data';
import { lusitana } from '@/app/ui/fonts';
import { UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';
import { ClienteFrecuente } from '@/app/lib/definitions';  

export default async function ClientesFrecuentes() {
  const clientes = await fetchClientesFrecuentes();

  return (
    <div className="flex w-full flex-col">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Top 10 Clientes Frecuentes
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          {clientes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay datos de clientes</p>
            </div>
          ) : (
            <div className="space-y-3">
                {clientes.map((cliente: ClienteFrecuente, index: number) => {                const nombre_completo = `${cliente.nombre} ${cliente.apellido || ''}`.trim();
                const total = Number(cliente.total_citas);
                const completadas = Number(cliente.citas_completadas);
                const tasa_completadas = total > 0 ? ((completadas / total) * 100).toFixed(0) : 0;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
                        {index < 3 ? (
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <UserGroupIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nombre_completo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {completadas} de {total} completadas ({tasa_completadas}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 ml-4">
                      <span className={`${lusitana.className} text-lg font-bold text-gray-900`}>
                        {total}
                      </span>
                      <span className="text-xs text-gray-500">citas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


