// import { fetchCitasHoy } from '@/app/lib/data';
// import { lusitana } from '@/app/ui/fonts';
// import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

// export default async function CitasHoy() {
//   const citas = await fetchCitasHoy();

//   return (
//     <div className="flex w-full flex-col md:col-span-4">
//       <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
//         Citas Agendadas para Hoy
//       </h2>
//       <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
//         <div className="bg-white px-6">
//           {citas.length === 0 ? (
//             <div className="flex items-center justify-center py-8">
//               <p className="text-gray-500">No hay citas agendadas para hoy</p>
//             </div>
//           ) : (
//             citas.map((cita, i) => {
//               const hora = cita.hora.substring(0, 5); // Formato HH:MM
              
//               return (
//                 <div
//                   key={cita.id}
//                   className={`flex flex-row items-center justify-between py-4 ${
//                     i !== 0 ? 'border-t' : ''
//                   }`}
//                 >
//                   <div className="flex items-center flex-1">
//                     <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mr-4">
//                       <ClockIcon className="h-6 w-6 text-blue-600" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-center gap-2 mb-1">
//                         <UserIcon className="h-4 w-4 text-gray-400" />
//                         <p className="truncate text-sm font-semibold md:text-base">
//                           {cita.cliente_nombre} {cita.cliente_apellido || ''}
//                         </p>
//                       </div>
//                       <p className="text-sm text-gray-600">
//                         {cita.servicio_nombre || 'Sin servicio asignado'}
//                       </p>
//                       {cita.descripcion && (
//                         <p className="text-xs text-gray-500 mt-1 line-clamp-2">
//                           {cita.descripcion}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <p className={`${lusitana.className} text-lg font-bold text-blue-600`}>
//                       {hora}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }