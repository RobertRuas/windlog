/**
 * ============================================================================
 * USER MODAL - Modal de Criação/Edição de Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente modal para criar ou editar um usuário.
 * Na criação, a senha é gerada automaticamente pelo backend (temporária).
 * Após criar, exibe a senha temporária para o admin copiar e enviar ao usuário.
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
 * - temporaryPassword: senha temporária gerada (após criação)
 * - t: função de tradução
 * ============================================================================
 */

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { UserListItem, CreateUserPayload, UpdateUserPayload } from '@/services/user.service';
import { PREDEFINED_FUNCTIONS } from '@/constants/functions';

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
  temporaryPassword: string | null;
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
  temporaryPassword,
  t,
}: UserModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  /**
   * Copia a senha temporária para o clipboard.
   */
  function handleCopyPassword() {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header do modal */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingUser ? t('modal.editTitle') : t('modal.createTitle')}
          </h2>
        </div>

        {/* Se acabou de criar e tem senha temporária, exibe a senha */}
        {temporaryPassword && !editingUser ? (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-1">
                {t('modal.userCreatedSuccess')}
              </p>
              <p className="text-xs text-green-700 mb-3">
                {t('modal.temporaryPasswordInfo')}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-green-300 text-sm font-mono text-gray-900">
                  {temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="p-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                  title={t('modal.copyPassword')}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        ) : (
          /* Formulário normal de criação/edição */
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.firstName')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => onFormChange({ ...formData, firstName: e.target.value })}
                  className="form-input w-full"
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
                  className="form-input w-full"
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
                className="form-input w-full"
              />
            </div>

            {!editingUser && (
              <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                {t('modal.passwordAutoGenerated')}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.role')}</label>
              <select
                value={formData.role}
                onChange={(e) => onFormChange({ ...formData, role: e.target.value as any })}
                className="form-select w-full"
              >
                <option value="STANDARD">{t('roles.STANDARD')}</option>
                <option value="HR">{t('roles.HR')}</option>
                <option value="ADMIN">{t('roles.ADMIN')}</option>
              </select>
            </div>

            {/* Team Leader toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData as CreateUserPayload).isTeamLeader ?? false}
                  onChange={(e) => onFormChange({ ...formData, isTeamLeader: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">{t('modal.isTeamLeader')}</span>
            </div>

            {/* Cargo/Função restritiva - usa PREDEFINED_FUNCTIONS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.position')}</label>
              <select
                value={(formData as CreateUserPayload).position ?? ''}
                onChange={(e) => onFormChange({ ...formData, position: e.target.value || undefined })}
                className="form-select w-full"
              >
                <option value="">{t('modal.positionPlaceholder')}</option>
                {PREDEFINED_FUNCTIONS.map((fn) => (
                  <option key={fn.id} value={fn.label}>
                    {fn.label}
                  </option>
                ))}
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
        )}
      </div>
    </div>
  );
}
