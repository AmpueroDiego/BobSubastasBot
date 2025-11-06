'use client';

import { XMarkIcon, UserIcon, PhoneIcon, CalendarIcon, ClockIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { formatTiempo } from '@/app/lib/utils';
import { useState } from 'react';

interface ClienteDetalleModalProps {
  cliente: {
    id: number;
    nombre: string | null;
    apellido: string | null;
    alias: string | null;
    edad: number | null;
    numero: string | null;
    genero: string | null;
    primer_mensaje: string | null;
    ultimo_mensaje: string | null;
    activo: boolean;
    total_citas?: number;
    citas_asistidas?: number;
    citas_no_asistidas?: number;
    citas_pendientes?: number;
  };
  onClose: () => void;
  onSave?: () => void;
}

export default function ClienteDetalleModal({ cliente, onClose, onSave }: ClienteDetalleModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedCliente, setEditedCliente] = useState(cliente);

  const nombreCompleto = [editedCliente.nombre, editedCliente.apellido].filter(Boolean).join(' ') || 'Sin nombre';

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/clientes/${editedCliente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editedCliente.nombre,
          apellido: editedCliente.apellido,
          edad: editedCliente.edad,
          genero: editedCliente.genero,
          activo: editedCliente.activo,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        if (onSave) onSave();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar cliente');
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      alert('Error al actualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCliente(cliente);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Cliente' : 'Detalles del Cliente'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5 text-gray-600" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={editedCliente.nombre || ''}
                        onChange={(e) => setEditedCliente({ ...editedCliente, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={editedCliente.apellido || ''}
                        onChange={(e) => setEditedCliente({ ...editedCliente, apellido: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">{nombreCompleto}</h3>
                  {editedCliente.alias && (
                    <p className="text-sm text-gray-500 mt-1">Alias: {editedCliente.alias}</p>
                  )}
                </>
              )}
              <div className="mt-2">
                {isEditing ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedCliente.activo}
                      onChange={(e) => setEditedCliente({ ...editedCliente, activo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Bot activo
                    </span>
                  </label>
                ) : (
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      editedCliente.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {editedCliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <PhoneIcon className="h-5 w-5" />
                <span className="font-medium">Número</span>
              </div>
              <p className="text-gray-900">{editedCliente.numero || 'No registrado'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">Alias</span>
              </div>
              <p className="text-gray-900">{editedCliente.alias || 'No registrado'}</p>
            </div>

            <div className={`rounded-lg p-4 ${isEditing ? 'bg-white border border-gray-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">Edad</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedCliente.edad || ''}
                  onChange={(e) => setEditedCliente({ ...editedCliente, edad: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Edad"
                />
              ) : (
                <p className="text-gray-900">{editedCliente.edad ? `${editedCliente.edad} años` : 'No registrada'}</p>
              )}
            </div>

            <div className={`rounded-lg p-4 ${isEditing ? 'bg-white border border-gray-300' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserIcon className="h-5 w-5" />
                <span className="font-medium">Género</span>
              </div>
              {isEditing ? (
                <select
                  value={editedCliente.genero || ''}
                  onChange={(e) => setEditedCliente({ ...editedCliente, genero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin especificar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{editedCliente.genero || 'No registrado'}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">Primer contacto</span>
              </div>
              <p className="text-gray-900">{editedCliente.primer_mensaje ? formatTiempo(editedCliente.primer_mensaje) : 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <ClockIcon className="h-5 w-5" />
                <span className="font-medium">Último mensaje</span>
              </div>
              <p className="text-gray-900">{editedCliente.ultimo_mensaje ? formatTiempo(editedCliente.ultimo_mensaje) : 'N/A'}</p>
            </div>
          </div>

          {(editedCliente.total_citas !== undefined) && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Citas</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{editedCliente.total_citas || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{editedCliente.citas_asistidas || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Asistidas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{editedCliente.citas_no_asistidas || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">No asistidas</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{editedCliente.citas_pendientes || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Pendientes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}