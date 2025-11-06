'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Horario {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_final: string;
  activo: boolean;
}

interface Negocio {
  id: number;
  nombre_negocio: string;
  logo_imagen: string;
}

interface Umbrales {
  umbral_bajo: number;
  umbral_alto: number;
}

export default function ConfiguracionesPage() {
  const [botActivo, setBotActivo] = useState(true);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [umbrales, setUmbrales] = useState<Umbrales>({ umbral_bajo: 30, umbral_alto: 70 });
  const [savingUmbrales, setSavingUmbrales] = useState(false);
  const [mensajeUmbrales, setMensajeUmbrales] = useState<string | null>(null);

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    logo: false,
    bot: true,
    horarios: true,
    umbrales: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [negocioRes, horariosRes, clientesRes, umbralesRes] = await Promise.all([
        fetch('/api/negocio'),
        fetch('/api/horarios'),
        fetch('/api/clientes/estado'),
        fetch('/api/configuraciones')
      ]);

      if (negocioRes.ok) {
        const negocioData = await negocioRes.json();
        setNegocio(negocioData);
      }

      if (horariosRes.ok) {
        const horariosData = await horariosRes.json();
        if (Array.isArray(horariosData)) {
          setHorarios(horariosData);
        } else if (horariosData.horarios) {
          setHorarios(horariosData.horarios);
        }
      }

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setBotActivo(clientesData.algunoActivo);
      }

      if (umbralesRes.ok) {
        const umbralesData = await umbralesRes.json();
        setUmbrales(umbralesData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeccion = (seccion: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos PNG, JPG o JPEG');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5MB');
      e.target.value = '';
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !negocio) return;

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append('nombre_negocio', negocio.nombre_negocio);
      formData.append('logo', logoFile);

      const response = await fetch('/api/negocio', {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const updatedNegocio = await response.json();
        setNegocio(updatedNegocio);
        setLogoFile(null);
        setLogoPreview(null);
        alert('Logo actualizado correctamente');
        window.location.reload();
      } else {
        alert('Error al actualizar el logo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    } finally {
      setUploadingLogo(false);
    }
  };

  const toggleBot = async () => {
    try {
      const response = await fetch('/api/clientes/estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activar: !botActivo }),
      });

      if (response.ok) {
        setBotActivo(!botActivo);
      }
    } catch (error) {
      console.error('Error al cambiar estado del bot:', error);
    }
  };

  const actualizarHorario = async (
    id: number,
    campo: 'hora_inicio' | 'hora_final' | 'activo',
    valor: string | boolean
  ) => {
    try {
      const response = await fetch('/api/horarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [campo]: valor }),
      });

      if (response.ok) {
        const horarioActualizado = await response.json();
        setHorarios(horarios.map((h) =>
          h.id === id ? { ...h, [campo]: valor } : h
        ));
      }
    } catch (error) {
      console.error('Error al actualizar horario:', error);
    }
  };

  const guardarUmbrales = async () => {
    if (umbrales.umbral_bajo >= umbrales.umbral_alto) {
      setMensajeUmbrales('El umbral bajo debe ser menor que el umbral alto');
      setTimeout(() => setMensajeUmbrales(null), 3000);
      return;
    }

    setSavingUmbrales(true);
    setMensajeUmbrales(null);

    try {
      const response = await fetch('/api/configuraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(umbrales),
      });

      if (response.ok) {
        setMensajeUmbrales('✓ Umbrales guardados correctamente');
        setTimeout(() => setMensajeUmbrales(null), 3000);
      } else {
        setMensajeUmbrales('Error al guardar umbrales');
        setTimeout(() => setMensajeUmbrales(null), 3000);
      }
    } catch (error) {
      console.error('Error al guardar umbrales:', error);
      setMensajeUmbrales('Error al conectar con el servidor');
      setTimeout(() => setMensajeUmbrales(null), 3000);
    } finally {
      setSavingUmbrales(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Configuraciones</h1>

      {/* Logo del Negocio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSeccion('logo')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold">Logo del Negocio</h2>
          {seccionesAbiertas.logo ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {seccionesAbiertas.logo && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Preview" width={160} height={160} className="object-cover w-full h-full" />
                  ) : negocio?.logo_imagen ? (
                    <Image src={negocio.logo_imagen} alt="Logo" width={160} height={160} className="object-cover w-full h-full" />
                  ) : (
                    <PhotoIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar nueva imagen
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG o JPEG (max. 5MB)
                  </p>
                </div>

                {logoFile && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingLogo ? 'Subiendo...' : 'Guardar Logo'}
                    </button>
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bot de WhatsApp */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSeccion('bot')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold">Bot de WhatsApp</h2>
          {seccionesAbiertas.bot ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {seccionesAbiertas.bot && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Estado del Bot</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {botActivo ? 'El bot está respondiendo mensajes' : 'El bot está pausado'}
                </p>
              </div>
              <button
                onClick={toggleBot}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  botActivo ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    botActivo ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Cuando el bot está activo, responderá automáticamente a los mensajes de WhatsApp.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Horarios de Atención */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSeccion('horarios')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold">Horarios de Atención</h2>
          {seccionesAbiertas.horarios ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {seccionesAbiertas.horarios && (
          <div className="p-6 border-t border-gray-200">
            {horarios.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay horarios configurados</p>
            ) : (
              <div className="space-y-3">
                {horarios.map((horario) => (
                  <div
                    key={horario.id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-lg ${
                      horario.activo
                        ? 'bg-gray-50 border border-gray-200' 
                        : 'bg-gray-100 border border-gray-300 opacity-60'
                    }`}
                  >
                    <span className={`w-24 font-medium ${horario.activo ? 'text-gray-900' : 'text-gray-500'}`}>
                      {horario.dia}
                    </span>
                    
                    <div className="flex gap-2 items-center flex-1">
                      <input
                        type="time"
                        value={horario.hora_inicio}
                        onChange={(e) => actualizarHorario(horario.id, 'hora_inicio', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={horario.hora_final}
                        onChange={(e) => actualizarHorario(horario.id, 'hora_final', e.target.value)}
                        disabled={!horario.activo}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      onClick={() => actualizarHorario(horario.id, 'activo', !horario.activo)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        horario.activo ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          horario.activo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Activa los días y define tus horarios de atención. Los días inactivos no permitirán agendar citas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Umbrales de Clasificación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSeccion('umbrales')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold">Umbrales de Clasificación de Leads</h2>
          {seccionesAbiertas.umbrales ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {seccionesAbiertas.umbrales && (
          <div className="p-6 border-t border-gray-200">
            {mensajeUmbrales && (
              <div className={`mb-4 p-3 rounded-lg ${
                mensajeUmbrales.includes('✓') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {mensajeUmbrales}
              </div>
            )}

            {/* Slider Umbral Bajo */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900">
                  🔴 Umbral Bajo
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    {umbrales.umbral_bajo}
                  </span>
                  <span className="text-sm text-gray-500">pts</span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={umbrales.umbral_bajo}
                onChange={(e) => setUmbrales({ ...umbrales, umbral_bajo: parseInt(e.target.value) })}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>

              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Leads con puntuación <strong>menor a {umbrales.umbral_bajo}</strong> = <strong>Interés Bajo</strong>
                </p>
              </div>
            </div>

            {/* Slider Umbral Alto */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900">
                  🟢 Umbral Alto
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {umbrales.umbral_alto}
                  </span>
                  <span className="text-sm text-gray-500">pts</span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={umbrales.umbral_alto}
                onChange={(e) => setUmbrales({ ...umbrales, umbral_alto: parseInt(e.target.value) })}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>

              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Leads con puntuación <strong>mayor o igual a {umbrales.umbral_alto}</strong> = <strong>Interés Alto</strong>
                </p>
              </div>
            </div>

            {/* Resumen de rangos */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">📊 Resumen de Clasificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-red-700">Bajo</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">
                    0 - {umbrales.umbral_bajo - 1}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-yellow-700">Medio</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-600">
                    {umbrales.umbral_bajo} - {umbrales.umbral_alto - 1}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-green-700">Alto</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {umbrales.umbral_alto} - 100
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setUmbrales({ umbral_bajo: 30, umbral_alto: 70 })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Restablecer
              </button>

              <button
                onClick={guardarUmbrales}
                disabled={savingUmbrales || umbrales.umbral_bajo >= umbrales.umbral_alto}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
                  savingUmbrales || umbrales.umbral_bajo >= umbrales.umbral_alto
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {savingUmbrales ? 'Guardando...' : '💾 Guardar Umbrales'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Estos umbrales se aplican automáticamente en conversaciones y dashboard para clasificar leads.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}