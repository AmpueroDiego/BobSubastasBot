// app/hooks/useUmbrales.ts
'use client';

import { useState, useEffect } from 'react';

interface Umbrales {
  umbral_bajo: number;
  umbral_alto: number;
}

export function useUmbrales() {
  const [umbrales, setUmbrales] = useState<Umbrales>({
    umbral_bajo: 30,
    umbral_alto: 70
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarUmbrales = async () => {
      try {
        const response = await fetch('/api/configuraciones');
        if (response.ok) {
          const data = await response.json();
          setUmbrales(data);
        } else {
          throw new Error('Error al cargar umbrales');
        }
      } catch (err) {
        console.error('Error al cargar umbrales:', err);
        setError('Error al cargar configuraciones');
        // Mantener valores por defecto si falla
      } finally {
        setLoading(false);
      }
    };

    cargarUmbrales();
  }, []);

  return { umbrales, loading, error };
}