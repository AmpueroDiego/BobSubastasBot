'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

interface NegocioData {
  logo_imagen: string;
  nombre_negocio: string;
}

export default function BusinessLogo() {
  const [negocio, setNegocio] = useState<NegocioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cargarNegocio = async () => {
      try {
        const response = await fetch('/api/negocio');
        if (response.ok) {
          const data = await response.json();
          console.log('Datos del negocio cargados:', data);
          setNegocio(data);
        } else {
          console.error('Error en respuesta:', response.status);
          setError(true);
        }
      } catch (err) {
        console.error('Error al cargar negocio:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    cargarNegocio();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full h-full rounded-md bg-blue-600/50 flex items-center justify-center overflow-hidden">
        <div className="animate-pulse text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (error || !negocio) {
    return (
      <div className="relative w-full h-full rounded-md bg-blue-600 flex flex-col items-center justify-center gap-2 p-4 overflow-hidden">
        <BuildingStorefrontIcon className="w-12 h-12 text-white" />
        <span className={`${lusitana.className} text-xl text-white font-semibold text-center`}>
          Mi Negocio
        </span>
      </div>
    );
  }

  const hasCustomLogo = negocio.logo_imagen && 
                        negocio.logo_imagen !== '/logo-default.png' &&
                        negocio.logo_imagen.includes('/logos/');

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden">
      {hasCustomLogo ? (
        <>
          <Image
            src={negocio.logo_imagen}
            alt={negocio.nombre_negocio}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 128px, 160px"
          />
          
          <div className="absolute inset-0 bg-black/30"></div>
          
          <div className="absolute inset-0 flex items-end justify-start p-4">
            <p className={`${lusitana.className} text-2xl md:text-4xl text-white drop-shadow-lg font-bold`}>
              {negocio.nombre_negocio}
            </p>
          </div>
        </>
      ) : (
        <div className="relative w-full h-full rounded-md bg-blue-600 flex flex-col items-center justify-center gap-2 p-4">
          <BuildingStorefrontIcon className="w-12 h-12 text-white" />
          <span className={`${lusitana.className} text-xl md:text-2xl text-white font-semibold text-center`}>
            {negocio.nombre_negocio || 'Mi Negocio'}
          </span>
        </div>
      )}
    </div>
  );
}