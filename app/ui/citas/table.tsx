'use client';

import { CalendarIcon, ClockIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, ListBulletIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
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

interface CitaFutura {
  id: number;
  fecha: string;
  hora: string;
  servicio: string;
  cliente: string;
  descripcion: string;
}

const normalizarCitas = (citasData: CitasAgrupadasPorDia[]) => {
  return citasData.map(grupo => ({
    ...grupo,
    citas: grupo.citas.map(cita => ({
      ...cita,
      fecha: cita.fecha instanceof Date 
        ? cita.fecha.toISOString().split('T')[0] 
        : String(cita.fecha),
      hora: String(cita.hora || ''),
      servicio: String(cita.servicio || ''),
      cliente: String(cita.cliente || ''),
    }))
  }));
};

export default function CitasTable({
  citasIniciales,
}: {
  citasIniciales: CitasAgrupadasPorDia[];
}) {
  const router = useRouter();
  const [citas, setCitas] = useState(normalizarCitas(citasIniciales));
  const [citasFuturas, setCitasFuturas] = useState<CitaFutura[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [citaExpandida, setCitaExpandida] = useState<number | null>(null);
  const [vistaActual, setVistaActual] = useState<'lista' | 'calendario'>('lista');
  const [loadingFuturas, setLoadingFuturas] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (vistaActual === 'calendario') {
      cargarCitasFuturas();
    }
  }, [vistaActual]);

  useEffect(() => {
    const handleRefresh = () => {
      router.refresh();
    };

    window.addEventListener('citas-updated', handleRefresh);
    return () => window.removeEventListener('citas-updated', handleRefresh);
  }, [router]);

  useEffect(() => {
    setCitas(normalizarCitas(citasIniciales));
  }, [citasIniciales]);

  const cargarCitasFuturas = async () => {
    setLoadingFuturas(true);
    try {
      const response = await fetch('/api/citas');
      if (response.ok) {
        const todasCitas = await response.json();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const futuras = todasCitas
          .filter((cita: any) => {
            const fechaCita = new Date(cita.fecha);
            return fechaCita >= hoy && (cita.asistio === null || cita.asistio === false);
          })
          .map((cita: any) => {
            const nombreCompleto = `${cita.cliente_nombre || ''} ${cita.cliente_apellido || ''}`.trim();
            const fechaStr = cita.fecha instanceof Date 
              ? cita.fecha.toISOString().split('T')[0] 
              : String(cita.fecha).split('T')[0];
            
            return {
              id: cita.id,
              fecha: fechaStr,
              hora: String(cita.hora || ''),
              servicio: cita.servicio_nombre || 'Sin servicio',
              cliente: nombreCompleto || cita.cliente_numero || 'Sin datos',
              descripcion: cita.descripcion || ''
            };
          })
          .sort((a: CitaFutura, b: CitaFutura) => {
            const fechaA = new Date(a.fecha + ' ' + a.hora);
            const fechaB = new Date(b.fecha + ' ' + b.hora);
            return fechaA.getTime() - fechaB.getTime();
          });
        
        setCitasFuturas(futuras);
      }
    } catch (error) {
      console.error('Error al cargar citas futuras:', error);
    } finally {
      setLoadingFuturas(false);
    }
  };

  const formatearFecha = (fecha: string | Date): string => {
    try {
      let fechaObj: Date;
      
      if (fecha instanceof Date) {
        fechaObj = fecha;
      } else {
        const fechaStr = String(fecha);
        if (fechaStr.includes('T')) {
          fechaObj = new Date(fechaStr.split('T')[0] + 'T12:00:00');
        } else if (fechaStr.includes('-')) {
          const [year, month, day] = fechaStr.split('-').map(Number);
          if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
            return 'Fecha inválida';
          }
          fechaObj = new Date(year, month - 1, day);
        } else {
          fechaObj = new Date(fecha);
        }
      }
      
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const diaSemana = dias[fechaObj.getDay()];
      const diaNum = fechaObj.getDate();
      const mes = meses[fechaObj.getMonth()];
      
      return `${diaSemana}, ${diaNum} de ${mes}`;
    } catch (error) {
      console.error('Error formateando fecha:', fecha, error);
      return 'Fecha inválida';
    }
  };

  const puedeMarcarAsistencia = (fechaCita: string, horaCita: string): boolean => {
    // Obtener hora actual en zona horaria de Lima
    const ahoraLima = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
    const ahora = new Date(ahoraLima);
    
    // Construir fecha/hora de la cita
    const [horas, minutos] = horaCita.split(':').map(Number);
    const fechaCitaObj = new Date(fechaCita + 'T00:00:00');
    fechaCitaObj.setHours(horas, minutos, 0, 0);
    
    return ahora >= fechaCitaObj;
  };

  const toggleExpand = (citaId: number) => {
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
        setCitas(prevCitas => {
          const citasActualizadas = prevCitas
            .map(grupo => ({
              ...grupo,
              citas: grupo.citas.filter(cita => cita.id !== citaId),
              total_citas: grupo.citas.filter(cita => cita.id !== citaId).length
            }))
            .filter(grupo => grupo.citas.length > 0);
          
          return normalizarCitas(citasActualizadas);
        });
        
        setTimeout(() => {
          router.refresh();
        }, 100);
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

  const agruparCitasPorFecha = () => {
    const agrupadas: { [key: string]: CitaFutura[] } = {};
    
    citasFuturas.forEach(cita => {
      if (!agrupadas[cita.fecha]) {
        agrupadas[cita.fecha] = [];
      }
      agrupadas[cita.fecha].push(cita);
    });
    
    return Object.entries(agrupadas).sort((a, b) => a[0].localeCompare(b[0]));
  };

  if (vistaActual === 'calendario') {
    return (
      <>
        <div className="mt-4 mb-4 flex gap-2">
          <button
            onClick={() => setVistaActual('lista')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ListBulletIcon className="h-5 w-5" />
            Vista Lista
          </button>
          <button
            onClick={() => setVistaActual('calendario')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Vista Calendario
          </button>
        </div>

        <div className="flow-root">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Citas Futuras</h2>
              
              {loadingFuturas ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-500">Cargando citas...</p>
                </div>
              ) : citasFuturas.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">No hay citas futuras programadas</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {agruparCitasPorFecha().map(([fecha, citas]) => (
                    <div key={fecha} className="border-l-4 border-blue-500 pl-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">
                        {formatearFecha(fecha)}
                      </h3>
                      <div className="space-y-3">
                        {citas.map((cita) => (
                          <div key={cita.id} className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-5 border border-blue-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                  <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full">
                                    <ClockIcon className="h-4 w-4" />
                                    <span className="font-semibold text-sm">{cita.hora}</span>
                                  </div>
                                  <span className="font-medium text-gray-900">{cita.servicio}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 ml-1">
                                  <UserIcon className="h-4 w-4 text-gray-400" />
                                  <span>{cita.cliente}</span>
                                </div>
                                {cita.descripcion && (
                                  <p className="mt-3 text-sm text-gray-600 bg-white p-2 rounded border-l-2 border-gray-300">
                                    {cita.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (citas.length === 0) {
    return (
      <>
        <div className="mt-4 mb-4 flex gap-2">
          <button
            onClick={() => setVistaActual('lista')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <ListBulletIcon className="h-5 w-5" />
            Vista Lista
          </button>
          <button
            onClick={() => setVistaActual('calendario')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Vista Calendario
          </button>
        </div>
        <div className="flow-root">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-lg bg-white shadow-sm p-12 text-center">
              <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No hay citas pendientes</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-4 mb-4 flex gap-2">
        <button
          onClick={() => setVistaActual('lista')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <ListBulletIcon className="h-5 w-5" />
          Vista Lista
        </button>
        <button
          onClick={() => setVistaActual('calendario')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <CalendarDaysIcon className="h-5 w-5" />
          Vista Calendario
        </button>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-white shadow-sm p-4">
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
                      const puedemarcar = puedeMarcarAsistencia(cita.fecha, cita.hora);
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
                              <button
                                onClick={() => toggleExpand(cita.id)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                {expandida ? (
                                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                                )}
                              </button>
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

                            {expandida && (
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
                                  {!puedemarcar && (
                                    <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded">
                                      ⏰ Disponible a partir de las {cita.hora}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() => marcarAsistencia(cita.id, true)}
                                      disabled={!puedemarcar || loading === cita.id}
                                      className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                                        puedemarcar && loading !== cita.id
                                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      <CheckIcon className="h-5 w-5" />
                                      <span className="font-medium">Sí</span>
                                    </button>
                                    <button
                                      onClick={() => marcarAsistencia(cita.id, false)}
                                      disabled={!puedemarcar || loading === cita.id}
                                      className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                                        puedemarcar && loading !== cita.id
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

            {/* Vista desktop - Tabla mejorada */}
            <table className="hidden min-w-full md:table">
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
                  <th scope="col" className="px-4 py-4 text-gray-700 text-center">
                    Asistencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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
                      const puedemarcar = puedeMarcarAsistencia(cita.fecha, cita.hora);
                      const expandida = citaExpandida === cita.id;
                      
                      return (
                        <>
                          <tr key={cita.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleExpand(cita.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {expandida ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full w-fit">
                                <ClockIcon className="h-4 w-4" />
                                <span className="font-bold text-sm">{cita.hora}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-medium text-gray-900">{cita.servicio}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">{cita.cliente}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {!puedemarcar && (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                    Disponible a las {cita.hora}
                                  </span>
                                )}
                                {puedemarcar && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandida && cita.descripcion && (
                            <tr key={`desc-${cita.id}`} className="bg-gray-50">
                              <td colSpan={5} className="px-6 py-4">
                                <div className="bg-white border-l-4 border-blue-500 p-4 rounded">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">Nota: </span>
                                    {cita.descripcion}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}