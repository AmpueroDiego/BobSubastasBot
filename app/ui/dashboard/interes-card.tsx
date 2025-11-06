// app/ui/dashboard/interes-card.tsx
import { fetchDashboardInicioData } from '@/app/lib/data';

export default async function InteresCard() {
  const data = await fetchDashboardInicioData();
  const { sin_definir: hoy_sin_def, bajo: hoy_bajo, medio: hoy_medio, alto: hoy_alto } = data.interesHoy;
  const { sin_definir: total_sin_def, bajo: total_bajo, medio: total_medio, alto: total_alto } = data.interesTotal;
  
  const totalHoy = hoy_sin_def + hoy_bajo + hoy_medio + hoy_alto;
  const totalGeneral = total_sin_def + total_bajo + total_medio + total_alto;

  const interesData = [
    { label: 'Sin Definir', hoy: hoy_sin_def, total: total_sin_def, bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    { label: 'Bajo', hoy: hoy_bajo, total: total_bajo, bgColor: 'bg-red-100', textColor: 'text-red-600' },
    { label: 'Medio', hoy: hoy_medio, total: total_medio, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
    { label: 'Alto', hoy: hoy_alto, total: total_alto, bgColor: 'bg-green-100', textColor: 'text-green-600' },
  ];

  return (
    <div className="w-full rounded-lg bg-white p-4 sm:p-6 shadow">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-6">Leads por Interés</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
        {/* LEADS DEL DÍA */}
        <div className="w-full">
          <h3 className="font-semibold text-center mb-4 text-blue-600 border-b-2 border-blue-300 pb-2 text-sm sm:text-base md:text-lg">Hoy</h3>
          
          <div className="flex justify-between p-3 sm:p-4 bg-blue-100 rounded font-bold mb-4">
            <span className="text-sm sm:text-base">Total</span>
            <span className="text-blue-600 text-sm sm:text-base md:text-lg">{totalHoy}</span>
          </div>

          <div className="space-y-2">
            {interesData.map((item, i) => (
              <div key={i} className={`flex justify-between p-3 sm:p-4 ${item.bgColor} rounded text-sm sm:text-base hover:shadow transition`}>
                <span className="font-medium">{item.label}</span>
                <span className={`font-bold ${item.textColor}`}>{item.hoy}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL GENERAL DEL MES */}
        <div className="w-full">
          <h3 className="font-semibold text-center mb-4 text-purple-600 border-b-2 border-purple-300 pb-2 text-sm sm:text-base md:text-lg">Total General del Mes</h3>
          
          <div className="flex justify-between p-3 sm:p-4 bg-purple-100 rounded font-bold mb-4">
            <span className="text-sm sm:text-base">Total</span>
            <span className="text-purple-600 text-sm sm:text-base md:text-lg">{totalGeneral}</span>
          </div>

          <div className="space-y-2">
            {interesData.map((item, i) => (
              <div key={i} className={`flex justify-between p-3 sm:p-4 ${item.bgColor} rounded text-sm sm:text-base hover:shadow transition`}>
                <span className="font-medium">{item.label}</span>
                <span className={`font-bold ${item.textColor}`}>{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}