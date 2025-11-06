'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Umbrales {
  umbral_bajo: number;
  umbral_alto: number;
}

export default function ConfiguracionesForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [umbrales, setUmbrales] = useState<Umbrales>({
    umbral_bajo: 30,
    umbral_alto: 70
  });
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Cargar umbrales actuales
  useEffect(() => {
    const cargarUmbrales = async () => {
      try {
        const response = await fetch('/api/configuraciones');
        if (response.ok) {
          const data = await response.json();
          setUmbrales(data);
        }
      } catch (error) {
        console.error('Error al cargar umbrales:', error);
        setMensaje({ tipo: 'error', texto: 'Error al cargar configuraciones' });
      } finally {
        setLoading(false);
      }
    };

    cargarUmbrales();
  }, []);

  // Guardar umbrales
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (umbrales.umbral_bajo >= umbrales.umbral_alto) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'El umbral bajo debe ser menor que el umbral alto' 
      });
      return;
    }

    setSaving(true);
    setMensaje(null);

    try {
      const response = await fetch('/api/configuraciones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(umbrales),
      });

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: '✓ Configuraciones guardadas correctamente' });
        
        // Revalidar datos
        router.refresh();
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => setMensaje(null), 3000);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar umbrales:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar configuraciones' });
    } finally {
      setSaving(false);
    }
  };

  // Función para obtener el color según el rango
  const getColorForValue = (value: number) => {
    if (value < umbrales.umbral_bajo) return 'red';
    if (value < umbrales.umbral_alto) return 'yellow';
    return 'green';
  };

  // Función para obtener el label según el valor
  const getLabelForValue = (value: number) => {
    if (value < umbrales.umbral_bajo) return 'Bajo';
    if (value < umbrales.umbral_alto) return 'Medio';
    return 'Alto';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* Header del formulario */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Umbrales de Clasificación</h2>
          <p className="text-blue-100 mt-1">Ajusta los valores para clasificar tus leads</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Mensaje de feedback */}
          {mensaje && (
            <div className={`p-4 rounded-lg ${
              mensaje.tipo === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            } animate-fade-in`}>
              {mensaje.texto}
            </div>
          )}

          {/* Slider Umbral Bajo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900">
                🔴 Umbral Bajo
              </label>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-red-600">
                  {umbrales.umbral_bajo}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  puntos
                </span>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={umbrales.umbral_bajo}
                onChange={(e) => setUmbrales({ ...umbrales, umbral_bajo: parseInt(e.target.value) })}
                className="w-full h-3 bg-gradient-to-r from-red-200 via-red-400 to-red-500 rounded-lg appearance-none cursor-pointer slider-red"
                style={{
                  background: `linear-gradient(to right, #fee2e2 0%, #fca5a5 ${umbrales.umbral_bajo}%, #ef4444 ${umbrales.umbral_bajo}%, #dc2626 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Leads con puntuación <strong>menor a {umbrales.umbral_bajo}</strong> se clasificarán como <strong>interés bajo</strong>
              </p>
            </div>
          </div>

          {/* Slider Umbral Alto */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900">
                🟢 Umbral Alto
              </label>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-green-600">
                  {umbrales.umbral_alto}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  puntos
                </span>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={umbrales.umbral_alto}
                onChange={(e) => setUmbrales({ ...umbrales, umbral_alto: parseInt(e.target.value) })}
                className="w-full h-3 bg-gradient-to-r from-yellow-200 via-green-400 to-green-600 rounded-lg appearance-none cursor-pointer slider-green"
                style={{
                  background: `linear-gradient(to right, #fef3c7 0%, #fbbf24 ${umbrales.umbral_alto}%, #22c55e ${umbrales.umbral_alto}%, #16a34a 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Leads con puntuación <strong>mayor o igual a {umbrales.umbral_alto}</strong> se clasificarán como <strong>interés alto</strong>
              </p>
            </div>
          </div>

          {/* Visualización de rangos */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumen de Clasificación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bajo */}
              <div className="bg-white rounded-lg p-4 border-2 border-red-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-700">Interés Bajo</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  0 - {umbrales.umbral_bajo - 1}
                </p>
                <p className="text-xs text-gray-600 mt-1">puntos</p>
              </div>

              {/* Medio */}
              <div className="bg-white rounded-lg p-4 border-2 border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-yellow-700">Interés Medio</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {umbrales.umbral_bajo} - {umbrales.umbral_alto - 1}
                </p>
                <p className="text-xs text-gray-600 mt-1">puntos</p>
              </div>

              {/* Alto */}
              <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-700">Interés Alto</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {umbrales.umbral_alto} - 100
                </p>
                <p className="text-xs text-gray-600 mt-1">puntos</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setUmbrales({ umbral_bajo: 30, umbral_alto: 70 })}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Restablecer valores
            </button>

            <button
              type="submit"
              disabled={saving || umbrales.umbral_bajo >= umbrales.umbral_alto}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${
                saving || umbrales.umbral_bajo >= umbrales.umbral_alto
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                '💾 Guardar Configuración'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Styles para los sliders */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid currentColor;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid currentColor;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .slider-red::-webkit-slider-thumb {
          color: #ef4444;
        }

        .slider-green::-webkit-slider-thumb {
          color: #22c55e;
        }

        .slider-red::-moz-range-thumb {
          color: #ef4444;
        }

        .slider-green::-moz-range-thumb {
          color: #22c55e;
        }
      `}</style>
    </div>
  );
}