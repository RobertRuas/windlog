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
import { Search, Edit2, Trash2, Users, UserPlus, Plus, X } from 'lucide-react';
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

  // Estado do modal de adicionar membro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados do modal de editar função
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [editMemberRole, setEditMemberRole] = useState('');

  // =========================================================================
  // PESQUISA INLINE — FILTRAR USUÁRIOS DISPONÍVEIS
  // =========================================================================
  //
  // A pesquisa filtra usuários do sistema que AINDA NÃO são membros
  // do projeto. Ao clicar num resultado, o usuário é adicionado
  // diretamente com a função auto-preenchida do seu position.

  const availableUsers = useMemo(() => {
    const existingMemberIds = new Set(
      (project.members || []).map((m) => m.userId)
    );
    return users.filter((u) => !existingMemberIds.has(u.id));
  }, [users, project.members]);

  /**
   * Resultados filtrados pela pesquisa (nome ou email).
   * Mostra no máximo 8 resultados para manter o dropdown compacto.
   */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const q = searchQuery.toLowerCase();
    return availableUsers
      .filter((u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [availableUsers, searchQuery]);

  function toggleAddPanel() {
    setIsAddModalOpen((prev) => !prev);
    setSearchQuery('');
  }

  function closeAddPanel() {
    setIsAddModalOpen(false);
    setSearchQuery('');
  }

  // =========================================================================
  // HANDLERS - ADICIONAR MEMBRO (CLIQUE DIRETO)
  // =========================================================================

  /**
   * Adiciona um usuário diretamente ao projeto.
   * A função é auto-preenchida com o `position` do usuário.
   */
  function handleQuickAdd(user: { id: string; position?: string }) {
    onAddMember(
      { userId: user.id, role: user.position || undefined },
      { onSuccess: () => setSearchQuery('') }
    );
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
  // AGRUPAMENTO DE MEMBROS POR FUNÇÃO
  // =========================================================================

  /**
   * Agrupa membros diretamente pela função no projeto (member.role).
   * Membros sem função ficam no grupo '__no_function__'.
   * Estrutura: { 'Lead Technician': [...], 'Wind Turbine Tech': [...], ... }
   */
  const groupedByFunction = useMemo(() => {
    if (!project.members?.length) return {};

    const result: Record<string, ProjectMember[]> = {};

    project.members.forEach((member) => {
      const func = member.role || '__no_function__';
      if (!result[func]) result[func] = [];
      result[func].push(member);
    });

    return result;
  }, [project.members]);

  /**
   * Chaves de função ordenadas alfabeticamente,
   * com '__no_function__' sempre no final.
   */
  const sortedFunctionKeys = useMemo(() => {
    return Object.keys(groupedByFunction).sort((a, b) => {
      if (a === '__no_function__') return 1;
      if (b === '__no_function__') return -1;
      return a.localeCompare(b);
    });
  }, [groupedByFunction]);

  return (
    <>
      {/* Botão de adicionar membro */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleAddPanel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={16} />
          {t('actions.addMember')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Lista agrupada por função ou estado vazio */}
        {project.members?.length ? (
          <div className="p-4 space-y-3">
            {sortedFunctionKeys.map((funcKey) => {
              const members = groupedByFunction[funcKey];
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{t('actions.addMember')}</span>
              <button
                type="button"
                onClick={closeAddPanel}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Pesquisa */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('memberSearch.placeholder')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Resultados */}
            <div className="max-h-64 overflow-y-auto">
              {searchResults.length === 0 && searchQuery.trim() && (
                <div className="px-4 py-4 text-sm text-gray-500 text-center">
                  {t('memberSearch.noResults')}
                </div>
              )}
              {searchResults.length === 0 && !searchQuery.trim() && (
                <div className="px-4 py-4 text-sm text-amber-600 text-center">
                  {t('memberModal.allUsersAlreadyMembers')}
                </div>
              )}
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickAdd(user)}
                  disabled={isAddPending}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors disabled:opacity-50 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.position && (
                        <p className="text-xs text-gray-500">{user.position}</p>
                      )}
                    </div>
                  </div>
                  <UserPlus size={14} className="text-blue-500 flex-shrink-0" />
                </button>
              ))}
            </div>
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
