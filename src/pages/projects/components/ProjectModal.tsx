/**
 * ============================================================================
 * PROJECT MODAL - Modal de Criação/Edição de Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente modal para criar ou editar um projeto.
 * Inclui formulário com validação para informações básicas do projeto.
 * ============================================================================
 */

import type { ProjectListItem, CreateProjectPayload, UpdateProjectPayload } from '@/services/project.service';

/**
 * Props do componente ProjectModal.
 */
interface ProjectModalProps {
  isOpen: boolean;
  editingProject: ProjectListItem | null;
  formData: CreateProjectPayload | UpdateProjectPayload;
  onFormChange: (data: CreateProjectPayload | UpdateProjectPayload) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  t: (key: string) => string;
}

/**
 * Componente ProjectModal - Modal de criação/edição de projeto.
 */
export function ProjectModal({
  isOpen,
  editingProject,
  formData,
  onFormChange,
  onSubmit,
  onClose,
  isPending,
  t,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingProject ? t('modal.editTitle') : t('modal.createTitle')}
          </h2>
        </div>

        {/* Formulário */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              {t('modal.basicInfo')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.client')} *
              </label>
              <input
                type="text"
                required
                value={formData.client}
                onChange={(e) => onFormChange({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.location')} *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Informações Complementares */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              {t('modal.additionalInfo')}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.scope')}
              </label>
              <input
                type="text"
                value={formData.scope || ''}
                onChange={(e) => onFormChange({ ...formData, scope: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.description')}
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.latitude')}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude ?? ''}
                  onChange={(e) => onFormChange({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.longitude')}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude ?? ''}
                  onChange={(e) => onFormChange({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.startDate')}
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => onFormChange({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.status')}
                </label>
                <select
                  value={formData.status || 'PLANNING'}
                  onChange={(e) => onFormChange({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLANNING">{t('status.PLANNING')}</option>
                  <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
                  <option value="ON_HOLD">{t('status.ON_HOLD')}</option>
                  <option value="COMPLETED">{t('status.COMPLETED')}</option>
                  <option value="CANCELLED">{t('status.CANCELLED')}</option>
                </select>
              </div>
            </div>
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
              {editingProject ? t('modal.save') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
