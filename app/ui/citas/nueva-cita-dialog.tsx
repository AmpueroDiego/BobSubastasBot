'use client';

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  alias: string | null;
  numero: string | null;
}

interface Servicio {
  id: number;
  nombre: string;
  duracion?: string;
}

interface NuevaCitaDialogProps {
  onCitaCreada?: () => void;
}

export default function NuevaCitaDialog({ onCitaCreada }: NuevaCitaDialogProps) {
  const [showModal, setShowModal] = useState(false);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  
  // Form data para cita
  const [formData, setFormData] = useState({
    id_cliente: 0,
    fecha: '',
    hora: '',
    descripcion: '',
    id_servicio: 0,
    duracion: '01:00:00',
  });

  // Form data para nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    apellido: '',
    numero: '',
    edad: null as number | null,
    genero: 'otro',
    alias: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showModal) {
      cargarClientes();
      cargarServicios();
    }
  }, [showModal]);

  const cargarClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await fetch('/api/servicios');
      if (response.ok) {
        const data = await response.json();
        setServicios(data);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_cliente) {
      newErrors.id_cliente = 'Debes seleccionar un cliente';
    }
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarNuevoCliente = () => {
    const newErrors: Record<string, string> = {};

    if (!nuevoCliente.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    // Validar número si se proporciona
    if (nuevoCliente.numero && nuevoCliente.numero.length !== 9) {
      newErrors.numero = 'El número debe tener exactamente 9 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatear número al formato de WhatsApp
  const formatearNumeroWhatsApp = (numero: string): string => {
    if (!numero || numero.trim() === '') return '';
    
    // Eliminar espacios, guiones y caracteres especiales
    let numeroLimpio = numero.replace(/[\s\-\(\)\+]/g, '');
    
    // Si ya tiene el formato completo de WhatsApp, devolverlo
    if (numeroLimpio.includes('@s.whatsapp.net')) {
      return numeroLimpio;
    }
    
    // Si empieza con 51, eliminar el código de país
    if (numeroLimpio.startsWith('51') && numeroLimpio.length > 11) {
      numeroLimpio = numeroLimpio.substring(2);
    }
    
    // Agregar código de país (51 para Perú) y formato de WhatsApp
    return `51${numeroLimpio}@s.whatsapp.net`;
  };

  // Extraer solo los dígitos del número para mostrar
  const extraerDigitosNumero = (numero: string | null): string => {
    if (!numero) return '';
    
    // Si tiene formato de WhatsApp, extraer solo los dígitos
    if (numero.includes('@s.whatsapp.net')) {
      const match = numero.match(/(\d+)@s\.whatsapp\.net/);
      if (match && match[1]) {
        // Remover el código de país 51 si existe
        const digitos = match[1];
        return digitos.startsWith('51') ? digitos.substring(2) : digitos;
      }
    }
    
    // Si es solo números, devolverlos
    return numero.replace(/\D/g, '');
  };

  // Manejar cambio de número - solo permitir dígitos
  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Solo permitir números
    const soloNumeros = valor.replace(/\D/g, '');
    setNuevoCliente({ ...nuevoCliente, numero: soloNumeros });
  };

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarNuevoCliente()) return;

    setLoading(true);
    try {
      // Formatear el número antes de enviar
      const clienteData = {
        ...nuevoCliente,
        numero: nuevoCliente.numero ? formatearNumeroWhatsApp(nuevoCliente.numero) : null,
      };

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });

      if (response.ok) {
        const clienteCreado = await response.json();
        setClientes([...clientes, clienteCreado]);
        setFormData({ ...formData, id_cliente: clienteCreado.id });
        setMostrarNuevoCliente(false);
        setNuevoCliente({
          nombre: '',
          apellido: '',
          numero: '',
          edad: null,
          genero: 'otro',
          alias: '',
        });
        alert('Cliente creado exitosamente');
      } else {
        alert('Error al crear el cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id_servicio: formData.id_servicio || null,
        }),
      });

      if (response.ok) {
        alert('Cita creada exitosamente');
        setShowModal(false);
        resetForm();
        window.dispatchEvent(new Event('citas-updated'));
        onCitaCreada?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la cita');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id_cliente: 0,
      fecha: '',
      hora: '',
      descripcion: '',
      id_servicio: 0,
      duracion: '01:00:00',
    });
    setMostrarNuevoCliente(false);
    setErrors({});
    setSearchCliente('');
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const search = searchCliente.toLowerCase();
    const nombre = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
    const alias = (cliente.alias || '').toLowerCase();
    // Buscar en los dígitos del número sin formato
    const numero = extraerDigitosNumero(cliente.numero || '');
    return nombre.includes(search) || alias.includes(search) || numero.includes(search);
  });

  const clienteSeleccionado = clientes.find((c) => c.id === formData.id_cliente);

  const handleServicioChange = (servicioId: number) => {
    const servicio = servicios.find((s) => s.id === servicioId);
    setFormData({
      ...formData,
      id_servicio: servicioId,
      duracion: servicio?.duracion || '01:00:00',
    });
  };

  return (
    <>
      {/* Botón para abrir modal */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        <PlusIcon className="w-5 h-5" />
        Nueva Cita
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {mostrarNuevoCliente ? 'Nuevo Cliente' : 'Nueva Cita'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {!mostrarNuevoCliente ? (
                /* Formulario de Cita */
                <form onSubmit={handleCrearCita} className="space-y-4">
                  {/* Selector de Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowClienteDropdown(!showClienteDropdown)}
                        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between ${
                          errors.id_cliente ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <span className={clienteSeleccionado ? 'text-gray-900' : 'text-gray-500'}>
                          {clienteSeleccionado
                            ? `${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`.trim()
                            : 'Selecciona un cliente'}
                        </span>
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      </button>

                      {/* Dropdown de clientes */}
                      {showClienteDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {/* Búsqueda */}
                          <div className="p-2 border-b">
                            <div className="relative">
                              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={searchCliente}
                                onChange={(e) => setSearchCliente(e.target.value)}
                                placeholder="Buscar cliente..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Lista de clientes */}
                          <div className="max-h-40 overflow-y-auto">
                            {clientesFiltrados.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No se encontraron clientes
                              </div>
                            ) : (
                              clientesFiltrados.map((cliente) => (
                                <button
                                  key={cliente.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, id_cliente: cliente.id });
                                    setShowClienteDropdown(false);
                                    setSearchCliente('');
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {cliente.nombre} {cliente.apellido}
                                    </p>
                                    {cliente.alias && (
                                      <p className="text-sm text-gray-500">{cliente.alias}</p>
                                    )}
                                    {cliente.numero && (
                                      <p className="text-xs text-gray-400">
                                        +51 {extraerDigitosNumero(cliente.numero)}
                                      </p>
                                    )}
                                  </div>
                                  {formData.id_cliente === cliente.id && (
                                    <CheckIcon className="w-5 h-5 text-blue-600" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>

                          {/* Botón crear nuevo cliente */}
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarNuevoCliente(true);
                              setShowClienteDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left border-t hover:bg-blue-50 flex items-center gap-2 text-blue-600 font-medium"
                          >
                            <PlusIcon className="w-5 h-5" />
                            Crear nuevo cliente
                          </button>
                        </div>
                      )}
                    </div>
                    {errors.id_cliente && (
                      <p className="mt-1 text-sm text-red-600">{errors.id_cliente}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setMostrarNuevoCliente(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Crear nuevo cliente
                    </button>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                          errors.fecha ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    {errors.fecha && <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>}
                  </div>

                  {/* Hora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora *
                    </label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                          errors.hora ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    {errors.hora && <p className="mt-1 text-sm text-red-600">{errors.hora}</p>}
                  </div>

                  {/* Servicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servicio (opcional)
                    </label>
                    <select
                      value={formData.id_servicio}
                      onChange={(e) => handleServicioChange(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Sin servicio</option>
                      {servicios.map((servicio) => (
                        <option key={servicio.id} value={servicio.id}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración (HH:MM:SS)
                    </label>
                    <input
                      type="text"
                      value={formData.duracion}
                      onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                      placeholder="01:00:00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      placeholder="Notas adicionales sobre la cita..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Cita'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Formulario de Nuevo Cliente */
                <form onSubmit={handleCrearCliente} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                      placeholder="Juan"
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.apellido}
                      onChange={(e) =>
                        setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })
                      }
                      placeholder="Pérez"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de teléfono
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.numero}
                      onChange={handleNumeroChange}
                      placeholder="985005094"
                      maxLength={9}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errors.numero ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.numero ? (
                      <p className="mt-1 text-sm text-red-600">{errors.numero}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        {nuevoCliente.numero 
                          ? `Se guardará como: 51${nuevoCliente.numero}@s.whatsapp.net`
                          : 'Ingresa 9 dígitos (sin código de país +51)'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
                    <input
                      type="text"
                      value={nuevoCliente.alias}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, alias: e.target.value })}
                      placeholder="Juanito"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                      <input
                        type="number"
                        value={nuevoCliente.edad || ''}
                        onChange={(e) =>
                          setNuevoCliente({
                            ...nuevoCliente,
                            edad: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        placeholder="25"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                      <select
                        value={nuevoCliente.genero}
                        onChange={(e) =>
                          setNuevoCliente({ ...nuevoCliente, genero: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarNuevoCliente(false);
                        setNuevoCliente({
                          nombre: '',
                          apellido: '',
                          numero: '',
                          edad: null,
                          genero: 'otro',
                          alias: '',
                        });
                        setErrors({});
                      }}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Cliente'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}