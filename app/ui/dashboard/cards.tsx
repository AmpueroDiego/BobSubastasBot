import {
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { fetchDashboardInicioData } from '@/app/lib/data';

const iconMap = {
  clientes: UserGroupIcon,
  citas: CalendarDaysIcon,
  servicios: BriefcaseIcon,
  horario: ClockIcon,
};

export default async function CardWrapper() {
  const {
    clientesDelDia,
    citasHoy,
    totalServicios,              // 👈 CAMBIO: usar totalServicios en lugar de serviciosSolicitados
    serviciosSolicitados,
  } = await fetchDashboardInicioData();

  const totalCitas = citasHoy?.length || 0;
  // const totalServicios = serviciosSolicitados?.length || 0;  ❌ ELIMINAR ESTA LÍNEA

  return (
    <>
      <Card title="Clientes del Día" value={clientesDelDia} type="clientes" />
      <Card title="Citas de Hoy" value={totalCitas} type="citas" />
      <Card title="Servicios Activos" value={totalServicios} type="servicios" />
      <Card 
        title="Próxima Cita" 
        value={citasHoy && citasHoy.length > 0 ? citasHoy[0].hora : '--:--'} 
        type="horario" 
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'clientes' | 'citas' | 'servicios' | 'horario';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl">
        {value}
      </p>
    </div>
  );
}