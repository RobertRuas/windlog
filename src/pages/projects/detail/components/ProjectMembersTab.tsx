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

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import type { ProjectDetail, ProjectMember, AddMemberPayload, UpdateMemberPayload } from '@/services/project.service';

/**
 * Props do componente ProjectMembersTab.
 * O campo `position` é necessário para auto-preencher a função no projeto.
 */
interface ProjectMembersTabProps {
  project: ProjectDetail;
  users: { id: string; firstName: string; lastName: string; email: string; position?: string }[];
  onAddMember: (payload: AddMemberPayload, options?: { onSuccess: () => void }) => void;
  onUpdateMemberRole: (memberId: string, payload: UpdateMemberPayload, options?: { onSuccess: () => void }) => void;
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
  // LISTA DE USUÁRIOS DISPONÍVEIS (FILTRAR DUPLICADOS)
  // =========================================================================
  //
  // Filtra a lista de usuários do sistema para mostrar apenas aqueles
  // que AINDA NÃO são membros do projeto — evita duplicidade na UI,
  // seguindo o mesmo padrão do módulo de Timesheet.

  const availableUsers = useMemo(() => {
    const existingMemberIds = new Set(
      (project.members || []).map((m) => m.userId)
    );
    return users.filter((u) => !existingMemberIds.has(u.id));
  }, [users, project.members]);

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

  /**
   * Ao selecionar um usuário, a função no projeto é automaticamente
   * preenchida com o `position` (cargo) dele — mesmo padrão do Timesheet.
   */
  function handleUserSelect(userId: string) {
    setSelectedUserId(userId);
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser?.position) {
      setMemberRole(selectedUser.position);
    } else {
      setMemberRole('');
    }
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    onAddMember({ userId: selectedUserId, role: memberRole || undefined }, {
      onSuccess: () => closeAddModal(),
    });
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
    onUpdateMemberRole(editingMember.id, { role: editMemberRole || undefined }, {
      onSuccess: () => closeEditModal(),
    });
  }

  // =========================================================================
  // HANDLERS - REMOVER MEMBRO
  // =========================================================================

  function handleRemove(member: ProjectMember) {
    if (confirm(t('actions.confirmRemoveMember', { name: `${member.user.firstName} ${member.user.lastName}` }))) {
      onRemoveMember(member.id);
    }
  }

  // =========================================================================
  // AGRUPAMENTO DE MEMBROS
  // =========================================================================

  /**
   * Agrupa membros primeiro por Role do sistema (ADMIN, HR, STANDARD),
   * depois por função no projeto (role).
   * Estrutura: { ADMIN: { 'Lead Tech': [...], 'Field Eng': [...] }, HR: {...}, ... }
   */
  const groupedByRoleAndFunction = useMemo(() => {
    if (!project.members?.length) return {};

    // Ordem fixa dos roles do sistema
    const roleOrder = ['ADMIN', 'HR', 'STANDARD'];
    const result: Record<string, Record<string, ProjectMember[]>> = {};

    // Inicializa todos os roles
    roleOrder.forEach((role) => {
      result[role] = {};
    });

    project.members.forEach((member) => {
      const systemRole = member.user.role;
      const projectRole = member.role || '__no_function__';

      if (!result[systemRole]) result[systemRole] = {};
      if (!result[systemRole][projectRole]) result[systemRole][projectRole] = [];
      result[systemRole][projectRole].push(member);
    });

    return result;
  }, [project.members]);

  /**
   * Lista de roles do sistema que possuem membros, na ordem correta.
   */
  const activeSystemRoles = useMemo(() => {
    return Object.keys(groupedByRoleAndFunction).filter(
      (role) => Object.keys(groupedByRoleAndFunction[role]).length > 0
    );
  }, [groupedByRoleAndFunction]);

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

        {/* Lista agrupada por Role e Função ou estado vazio */}
        {project.members?.length ? (
          <div className="p-4 space-y-6">
            {activeSystemRoles.map((systemRole) => {
              const functionGroups = groupedByRoleAndFunction[systemRole];
              const functionKeys = Object.keys(functionGroups).sort((a, b) => {
                if (a === '__no_function__') return 1;
                if (b === '__no_function__') return -1;
                return a.localeCompare(b);
              });
              const totalInRole = functionKeys.reduce((sum, k) => sum + functionGroups[k].length, 0);

              return (
                <div key={systemRole}>
                  {/* Cabeçalho do Role */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      systemRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      systemRole === 'HR' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {systemRole}
                    </span>
                    <span className="text-xs text-gray-400">{t('memberTable.membersCount', { count: totalInRole })}</span>
                  </div>

                  {/* Subgrupos por função */}
                  <div className="space-y-2 ml-2">
                    {functionKeys.map((funcKey) => {
                      const members = functionGroups[funcKey];
                      const funcLabel = funcKey === '__no_function__' ? t('memberTable.noRole') : funcKey;

                      return (
                        <div key={funcKey} className="border border-gray-100 rounded-lg overflow-hidden">
                          {/* Cabeçalho da função */}
                          <div className="px-4 py-2 bg-gray-50/70 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-600">{funcLabel}</span>
                              <span className="text-xs text-gray-400">({members.length})</span>
                            </div>
                          </div>

                          {/* Membros */}
                          <div className="divide-y divide-gray-50">
                            {members.map((member: ProjectMember) => (
                              <div key={member.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                {/* Avatar + Nome */}
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {member.user.firstName[0]}{member.user.lastName[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {member.user.firstName} {member.user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                  </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(member)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title={t('actions.editMemberRole')}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRemove(member)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('memberModal.selectUser')}</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}{user.position ? ` — ${user.position}` : ''}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    {t('memberModal.allUsersAlreadyMembers')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('memberModal.role')}
                </label>
                <input
                  type="text"
                  value={memberRole}
                  readOnly
                  placeholder={t('memberModal.roleAutoPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {t('memberModal.roleAutoHint')}
                </p>
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
                  disabled={isAddPending || !selectedUserId}
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
