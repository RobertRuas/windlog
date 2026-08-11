/**
 * ============================================================================
 * TURBINE MODAL - Modal de Criação/Edição de Turbina
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal reutilizável para criar ou editar uma turbina do projeto.
 * Detecta automaticamente se está em modo "criar" ou "editar" baseado
 * na prop `turbine` (null = criar, objeto = editar).
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Turbine, CreateTurbinePayload, UpdateTurbinePayload } from '@/services/project.service';

/**
 * Props do componente TurbineModal.
 */
interface TurbineModalProps {
  turbine: Turbine | null; // null = modo criar, objeto = modo editar
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTurbinePayload | UpdateTurbinePayload) => void;
  isPending: boolean;
}

/**
 * Componente TurbineModal - Modal de criação/edição de turbina.
 */
export function TurbineModal({ turbine, isOpen, onClose, onSubmit, isPending }: TurbineModalProps) {
  const { t } = useTranslation('projects');

  // Estado do formulário
  const [formData, setFormData] = useState<CreateTurbinePayload | UpdateTurbinePayload>({
    name: '',
    location: '',
    manufacturer: '',
    model: '',
    nacelleHeight: undefined,
    latitude: undefined,
    longitude: undefined,
    status: 'OPERATIONAL',
  });

  // Preenche o formulário quando abrir em modo edição
  useEffect(() => {
    if (isOpen && turbine) {
      setFormData({
        name: turbine.name,
        location: turbine.location || '',
        manufacturer: turbine.manufacturer || '',
        model: turbine.model || '',
        nacelleHeight: turbine.nacelleHeight,
        latitude: turbine.latitude,
        longitude: turbine.longitude,
        status: turbine.status,
      });
    } else if (isOpen) {
      // Reset para modo criação
      setFormData({
        name: '',
        location: '',
        manufacturer: '',
        model: '',
        nacelleHeight: undefined,
        latitude: undefined,
        longitude: undefined,
        status: 'OPERATIONAL',
      });
    }
  }, [isOpen, turbine]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {turbine ? t('turbineModal.editTitle') : t('turbineModal.createTitle')}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome (obrigatório) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('turbineModal.name')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fabricante e Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('turbineModal.manufacturer')}
              </label>
              <input
                type="text"
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('turbineModal.model')}
              </label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('turbineModal.location')}
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Altura Nacelle, Latitude, Longitude */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('turbineModal.nacelleHeight')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.nacelleHeight ?? ''}
                onChange={(e) => setFormData({ ...formData, nacelleHeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('turbineModal.latitude')}
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('turbineModal.longitude')}
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('turbineModal.status')}
            </label>
            <select
              value={formData.status || 'OPERATIONAL'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OPERATIONAL">{t('turbineStatus.OPERATIONAL')}</option>
              <option value="MAINTENANCE">{t('turbineStatus.MAINTENANCE')}</option>
              <option value="OFFLINE">{t('turbineStatus.OFFLINE')}</option>
              <option value="DECOMMISSIONED">{t('turbineStatus.DECOMMISSIONED')}</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {turbine ? t('modal.save') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
