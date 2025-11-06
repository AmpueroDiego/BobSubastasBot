'use client';

import { CalendarIcon, ClockIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CitaDetalle {
  id: number;
  hora: string;
  servicio: string;
  cliente: string;
  fecha: string | Date;
  asistio: boolean | null;
  descripcion?: string;
}

interface CitasAgrupadasPorDia {
  dia: string;
  total_citas: number;
  citas: CitaDetalle[];
}

function formatearFecha(fechaStr: string | Date): string {
  try {
    // Convertir a string si es Date
    let fechaLimpia: string;
    if (fechaStr instanceof Date) {
      fechaLimpia = fechaStr.toISOString().split('T')[0];
    } else if (typeof fechaStr === 'string') {
      fechaLimpia = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
    } else {
      fechaLimpia = String(fechaStr).split('T')[0];
    }
    
    // Parsear la fecha
    const [year, month, day] = fechaLimpia.split('-').map(Number);
    
    // Crear fecha en UTC para evitar problemas de timezone
    const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const diaSemana = dias[fecha.getUTCDay()];
    const diaNum = fecha.getUTCDate();
    const mes = meses[fecha.getUTCMonth()];
    
    return `${diaSemana}, ${diaNum} de ${mes}`;
  } catch (error) {
    console.error('Error formateando fecha:', fechaStr, error);
    return String(fechaStr);
  }
}

export default function CitasList({
  citas,
  tipo
}: {
  citas: CitasAgrupadasPorDia[];
  tipo: 'futuras' | 'pasadas';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [citaExpandida, setCitaExpandida] = useState<number | null>(null);

  const toggleExpandir = (citaId: number) => {
    setCitaExpandida(citaExpandida === citaId ? null : citaId);
  };

  const marcarAsistencia = async (citaId: number, asistio: boolean) => {
    setLoading(citaId);
    
    try {
      const response = await fetch(`/api/citas/${citaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ asistio }),
        cache: 'no-store'
      });

      if (response.ok) {
        router.refresh();
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        alert('Error al actualizar la asistencia: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al marcar asistencia:', error);
      alert('Error al actualizar la asistencia');
    } finally {
      setLoading(null);
    }
  };

  // ✅ FUNCIÓN CORREGIDA - Compara fecha + hora en timezone Lima
  const puedeMarcarAsistencia = (cita: CitaDetalle): boolean => {
    // Convertir fecha a string si es Date
    let fechaCita: string;
    if (cita.fecha instanceof Date) {
      fechaCita = cita.fecha.toISOString().split('T')[0];
    } else if (typeof cita.fecha === 'string') {
      fechaCita = cita.fecha.split('T')[0];
    } else {
      fechaCita = String(cita.fecha).split('T')[0];
    }
    
    // Para citas pasadas, siempre se puede marcar
    if (tipo === 'pasadas') {
      return true;
    }
    
    // Obtener hora actual en zona horaria de Lima
    const ahoraLima = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
    const ahora = new Date(ahoraLima);
    
    // Construir fecha/hora completa de la cita
    const [horas, minutos] = cita.hora.split(':').map(Number);
    const fechaCitaObj = new Date(fechaCita + 'T00:00:00');
    fechaCitaObj.setHours(horas, minutos, 0, 0);
    
    // Comparar fecha + hora completa
    return ahora >= fechaCitaObj;
  };

  if (citas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">
          {tipo === 'futuras' 
            ? 'No hay citas futuras programadas' 
            : 'No hay citas pasadas'}
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <div className="inline-block min-w-full align-middle">
        {/* Vista móvil */}
        <div className="md:hidden space-y-4">
          {citas.map((grupo) => (
            <div key={grupo.dia} className="mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4 shadow-md">
                <div className="flex items-center gap-3 text-white">
                  <CalendarIcon className="h-6 w-6" />
                  <div>
                    <p className="font-bold text-lg">{formatearFecha(grupo.dia)}</p>
                    <p className="text-sm text-blue-100">
                      {grupo.total_citas} cita{grupo.total_citas !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 bg-gray-50 rounded-b-lg p-4">
                {grupo.citas.map((cita) => {
                  const puedeMarcar = puedeMarcarAsistencia(cita);
                  const expandida = citaExpandida === cita.id;
                  
                  return (
                    <div key={cita.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              <span className="font-bold">{cita.hora}</span>
                            </div>
                          </div>
                          {cita.asistio === null && (
                            <button
                              onClick={() => toggleExpandir(cita.id)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              {expandida ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                              )}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-semibold text-sm text-gray-500">Servicio:</span>
                            <span className="font-medium">{cita.servicio}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{cita.cliente}</span>
                          </div>
                        </div>

                        {cita.asistio !== null && (
                          <div className="mt-3">
                            {cita.asistio ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                <CheckIcon className="h-4 w-4" />
                                Asistió
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                <XMarkIcon className="h-4 w-4" />
                                No asistió
                              </span>
                            )}
                          </div>
                        )}

                        {expandida && cita.asistio === null && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {cita.descripcion && (
                              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded">
                                {cita.descripcion}
                              </p>
                            )}
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Marcar asistencia:
                              </p>
                              {!puedeMarcar && (
                                <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded">
                                  ⏰ Disponible a partir de las {cita.hora}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => marcarAsistencia(cita.id, true)}
                                  disabled={!puedeMarcar || loading === cita.id}
                                  className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                                    puedeMarcar && loading !== cita.id
                                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" />
                                  <span className="font-medium">Sí</span>
                                </button>
                                <button
                                  onClick={() => marcarAsistencia(cita.id, false)}
                                  disabled={!puedeMarcar || loading === cita.id}
                                  className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                                    puedeMarcar && loading !== cita.id
                                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                  <span className="font-medium">No</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Vista desktop - Tabla */}
        <table className="hidden min-w-full text-gray-900 md:table">
          <thead className="rounded-lg text-left text-sm font-semibold bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-gray-700">
                Día
              </th>
              <th scope="col" className="px-4 py-4 text-gray-700">
                Hora
              </th>
              <th scope="col" className="px-4 py-4 text-gray-700">
                Servicio
              </th>
              <th scope="col" className="px-4 py-4 text-gray-700">
                Cliente
              </th>
              <th scope="col" className="px-4 py-4 text-gray-700">
                Asistencia
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {citas.map((grupo) => (
              <>
                <tr key={`header-${grupo.dia}`} className="bg-gradient-to-r from-blue-50 to-white">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-base">{formatearFecha(grupo.dia)}</span>
                        <span className="ml-3 text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                          {grupo.total_citas} cita{grupo.total_citas !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
                {grupo.citas.map((cita) => {
                  const puedeMarcar = puedeMarcarAsistencia(cita);
                  
                  return (
                    <tr
                      key={cita.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4"></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full w-fit">
                          <ClockIcon className="h-4 w-4" />
                          <span className="font-bold text-sm">{cita.hora}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{cita.servicio}</span>
                        {cita.descripcion && (
                          <p className="text-xs text-gray-500 mt-1">{cita.descripcion}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{cita.cliente}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {cita.asistio === null ? (
                          puedeMarcar ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => marcarAsistencia(cita.id, true)}
                                disabled={loading === cita.id}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                              >
                                <CheckIcon className="h-4 w-4" />
                                <span className="font-medium text-sm">Sí</span>
                              </button>
                              <button
                                onClick={() => marcarAsistencia(cita.id, false)}
                                disabled={loading === cita.id}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                              >
                                <XMarkIcon className="h-4 w-4" />
                                <span className="font-medium text-sm">No</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                              Disponible a las {cita.hora}
                            </span>
                          )
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            cita.asistio 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cita.asistio ? (
                              <>
                                <CheckIcon className="h-3 w-3" />
                                Asistió
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="h-3 w-3" />
                                No asistió
                              </>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}