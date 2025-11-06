import { fetchServiciosSolicitados } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default async function ServiciosSolicitados() {
  const servicios = await fetchServiciosSolicitados();

  // Encontrar el máximo para calcular porcentajes
  const maxCitas = servicios.length > 0 
    ? Math.max(...servicios.map(s => s.total_citas)) 
    : 1;

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Servicios Más Solicitados
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6 py-6">
          {servicios.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">No hay servicios registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servicios.map((servicio, i) => {
                const porcentaje = (servicio.total_citas / maxCitas) * 100;
                
                return (
                  <div
                    key={servicio.id}
                    className={`space-y-2 ${i !== 0 ? 'pt-4 border-t' : ''}`}
                  >
                    {/* 🔧 FIX: Reorganizado el layout sin ml-11 que causaba overflow */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 flex-shrink-0">
                          <span className={`${lusitana.className} text-sm font-bold text-purple-600`}>
                            {i + 1}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold md:text-base flex-1">
                          {servicio.nombre}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        <p className={`${lusitana.className} text-base font-bold text-gray-900`}>
                          {servicio.total_citas}
                        </p>
                        <span className="text-xs text-gray-500">citas</span>
                      </div>
                    </div>
                    
                    {/* 🔧 FIX: Barra de progreso sin margin-left */}
                    <div className="flex items-center gap-3">
                      {/* Spacer invisible para alinear con el número de arriba */}
                      <div className="w-8 flex-shrink-0"></div>
                      {/* Contenedor de la barra - ahora ocupa el espacio restante correctamente */}
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
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