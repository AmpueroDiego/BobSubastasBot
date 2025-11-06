'use client';

import { lusitana } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import { useState } from 'react';

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="flex-1 rounded-2xl bg-white px-8 pb-10 pt-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
        
        <h1 className={`${lusitana.className} mb-8 text-3xl font-bold text-gray-900 text-center`}>
          Bienvenido
        </h1>
        
        <div className="w-full space-y-6">
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-gray-700"
              htmlFor="email"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                id="email"
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors peer-focus:text-blue-500" />
            </div>
          </div>
          
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-gray-700"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-12 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                required
                minLength={5}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
              <KeyIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors peer-focus:text-blue-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5 animate-eye-open" />
                ) : (
                  <EyeSlashIcon className={`h-5 w-5 ${isTyping ? 'animate-eye-close' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <LoginButton />
        
        <div
          className="flex h-8 items-end space-x-1 mt-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes eyeClose {
          0% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes eyeOpen {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        :global(.animate-eye-close) {
          animation: eyeClose 0.3s ease-in-out;
        }
        :global(.animate-eye-open) {
          animation: eyeOpen 0.3s ease-in-out;
        }
      `}</style>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="mt-8 w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl" aria-disabled={pending}>
      {pending ? 'Iniciando...' : 'Iniciar Sesión'} <ArrowRightIcon className="ml-auto h-5 w-5 text-white" />
    </Button>
  );
}