import { lusitana } from "@/app/ui/fonts";
import React, { Suspense } from "react";
import CardWrapper from "@/app/ui/dashboard/cards";
import { CardsSkeleton } from '@/app/ui/skeletons';

export const metadata = {
  title: 'Dashboard - Bob Subastas',
};

export default async function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold mb-2`}>
              Dashboard - Bob Subastas
            </h1>
            <p className="text-blue-100 text-sm">
              Sistema de gestión de leads en tiempo real
            </p>
          </div>
          <div className="hidden md:block">
            <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card principal de Leads por Interés */}
      <div className="mb-8">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>

      {/* Grid de información adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Resumen */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Conversión</h3>
              <p className="text-sm text-gray-500">Seguimiento de leads</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Los leads de alto interés tienen mayor probabilidad de conversión. 
            Enfócate en estos contactos para maximizar resultados.
          </p>
        </div>

        {/* Card 2: Automatización */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chatbot IA</h3>
              <p className="text-sm text-gray-500">Respuestas automáticas</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            El chatbot clasifica automáticamente a los leads según su nivel de 
            interés basándose en la conversación.
          </p>
        </div>

        {/* Card 3: Datos en tiempo real */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tiempo Real</h3>
              <p className="text-sm text-gray-500">Actualización continua</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Los datos se actualizan automáticamente cada 60 segundos desde 
            las conversaciones activas del chatbot.
          </p>
        </div>
      </div>

      {/* Guía de clasificación */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Guía de Clasificación de Leads
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sin Definir */}
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              <h3 className="font-semibold text-gray-700">Sin Definir</h3>
            </div>
            <p className="text-sm text-gray-600">
              Leads nuevos o que aún no han mostrado interés claro. Requieren seguimiento inicial.
            </p>
          </div>

          {/* Bajo */}
          <div className="border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-red-50">
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
              <h3 className="font-semibold text-red-700">Interés Bajo</h3>
            </div>
            <p className="text-sm text-red-600">
              Mostraron poco interés o no están listos para comprar. Mantener contacto esporádico.
            </p>
          </div>

          {/* Medio */}
          <div className="border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-yellow-50">
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              <h3 className="font-semibold text-yellow-700">Interés Medio</h3>
            </div>
            <p className="text-sm text-yellow-600">
              Interesados pero evaluando opciones. Enviar información adicional y ofertas.
            </p>
          </div>

          {/* Alto */}
          <div className="border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50">
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              <h3 className="font-semibold text-green-700">Interés Alto</h3>
            </div>
            <p className="text-sm text-green-600">
              Muy interesados y listos para comprar. ¡Contactar inmediatamente para cerrar venta!
            </p>
          </div>
        </div>
      </div>

      {/* Footer informativo */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-1">💡 Tip del Día</h3>
            <p className="text-gray-300 text-sm">
              Los leads de alto interés tienen 5x más probabilidad de conversión. 
              Contáctalos dentro de las primeras 24 horas.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-gray-300">Hoy</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">20</p>
              <p className="text-xs text-gray-300">Este Mes</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}