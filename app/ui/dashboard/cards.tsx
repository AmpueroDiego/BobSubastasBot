import {
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import InteresCard from './interes-card';

const iconMap = {
  clientes: UserGroupIcon,
  citas: CalendarDaysIcon,
  servicios: BriefcaseIcon,
  horario: ClockIcon,
};

export default async function CardWrapper() {
  return <InteresCard />;
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