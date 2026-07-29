/**
 * ============================================================================
 * PROJECT MEMBERS TAB - Aba de Membros do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a lista de membros do projeto com ações de
 * adicionar, editar função e remover. Inclui os modais necessários.
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import type { ProjectDetail, ProjectMember, AddMemberPayload, UpdateMemberPayload } from '@/services/project.service';

/**
 * Props do componente ProjectMembersTab.
 */
interface ProjectMembersTabProps {
  project: ProjectDetail;
  users: { id: string; firstName: string; lastName: string; email: string }[];
  onAddMember: (payload: AddMemberPayload) => void;
  onUpdateMemberRole: (memberId: string, payload: UpdateMemberPayload) => void;
  onRemoveMember: (memberId: string) => void;
  isAddPending: boolean;
  isUpdatePending: boolean;
}

/**
 * Componente ProjectMembersTab - Gerencia membros do projeto.
 */
export function ProjectMembersTab({
  project,
  users,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
  isAddPending,
  isUpdatePending,
}: ProjectMembersTabProps) {
  const { t } = useTranslation('projects');

  // Estados do modal de adicionar membro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('');

  // Estados do modal de editar função
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [editMemberRole, setEditMemberRole] = useState('');

  // =========================================================================
  // HANDLERS - ADICIONAR MEMBRO
  // =========================================================================

  function openAddModal() {
    setSelectedUserId('');
    setMemberRole('');
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
    setSelectedUserId('');
    setMemberRole('');
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    onAddMember({ userId: selectedUserId, role: memberRole || undefined });
  }

  // =========================================================================
  // HANDLERS - EDITAR FUNÇÃO
  // =========================================================================

  function openEditModal(member: ProjectMember) {
    setEditingMember(member);
    setEditMemberRole(member.role || '');
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditingMember(null);
    setEditMemberRole('');
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    onUpdateMemberRole(editingMember.id, { role: editMemberRole || undefined });
  }

  // =========================================================================
  // HANDLERS - REMOVER MEMBRO
  // =========================================================================

  function handleRemove(member: ProjectMember) {
    if (confirm(t('actions.confirmRemoveMember', { name: `${member.user.firstName} ${member.user.lastName}` }))) {
      onRemoveMember(member.id);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header com botão de adicionar */}
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            {t('actions.addMember')}
          </button>
        </div>

        {/* Tabela ou estado vazio */}
        {project.members?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('memberTable.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('memberTable.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('memberTable.role')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('memberTable.projectRole')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {member.user.firstName} {member.user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        member.user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        member.user.role === 'HR' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.role || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={t('actions.editMemberRole')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRemove(member)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p>{t('memberTable.empty')}</p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar Membro */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('memberModal.title')}
              </h2>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('memberModal.user')} *
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('memberModal.selectUser')}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('memberModal.role')}
                </label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder={t('memberModal.rolePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAddPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Função do Membro */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('editMemberModal.title')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingMember.user.firstName} {editingMember.user.lastName}
              </p>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('editMemberModal.role')}
                </label>
                <input
                  type="text"
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value)}
                  placeholder={t('editMemberModal.rolePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatePending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
