'use client';

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AsistenciaButtons({ 
  citaId, 
  asistio 
}: { 
  citaId: number; 
  asistio: boolean | null;  // ← Cambiar a boolean | null
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAsistencia = async (asistio: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/citas/asistencia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citaId, asistio }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Error al actualizar la asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (asistio === true) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
          ✓ Asistió
        </span>
        <button
          onClick={() => handleAsistencia(false)}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (asistio === false) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
          ✗ No asistió
        </span>
        <button
          onClick={() => handleAsistencia(true)}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
        >
          Corregir
        </button>
      </div>
    );
  }

  // null = pendiente
  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAsistencia(true)}
        disabled={loading}
        className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        <CheckIcon className="h-4 w-4" />
        Asistió
      </button>
      <button
        onClick={() => handleAsistencia(false)}
        disabled={loading}
        className="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        <XMarkIcon className="h-4 w-4" />
        No asistió
      </button>
    </div>
  );
}