/**
 * ============================================================================
 * USER MODAL - Modal de Criação/Edição de Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente modal para criar ou editar um usuário.
 * Inclui formulário com validação.
 *
 * PROPS:
 * ------
 * - isOpen: se o modal está aberto
 * - editingUser: usuário sendo editido (null para criar)
 * - formData: dados do formulário
 * - onFormChange: função chamada ao alterar o formulário
 * - onSubmit: função chamada ao submeter
 * - onClose: função chamada ao fechar
 * - isPending: se está processando
 * - t: função de tradução
 * ============================================================================
 */

import type { UserListItem, CreateUserPayload, UpdateUserPayload } from '@/services/user.service';

/**
 * Props do componente UserModal.
 */
interface UserModalProps {
  isOpen: boolean;
  editingUser: UserListItem | null;
  formData: CreateUserPayload | UpdateUserPayload;
  onFormChange: (data: CreateUserPayload | UpdateUserPayload) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  t: (key: string) => string;
}

/**
 * Componente UserModal - Modal de criação/edição de usuário.
 */
export function UserModal({
  isOpen,
  editingUser,
  formData,
  onFormChange,
  onSubmit,
  onClose,
  isPending,
  t,
}: UserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header do modal */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingUser ? t('modal.editTitle') : t('modal.createTitle')}
          </h2>
        </div>

        {/* Formulário */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.firstName')}
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => onFormChange({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modal.lastName')}
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => onFormChange({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.email')}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => onFormChange({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.role')}</label>
            <select
              value={formData.role}
              onChange={(e) => onFormChange({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STANDARD">{t('roles.STANDARD')}</option>
              <option value="HR">{t('roles.HR')}</option>
              <option value="ADMIN">{t('roles.ADMIN')}</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4">
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
              {editingUser ? t('modal.save') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
