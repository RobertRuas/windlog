/**
 * ============================================================================
 * PROJECT DETAIL PAGE - Página de Detalhes do Projeto
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página de detalhes de um projeto específico.
 * Permite visualizar e gerenciar turbinas e membros da equipe.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Visualizar informações do projeto
 * - Editar informações básicas do projeto
 * - Gerenciar turbinas (adicionar, editar, remover)
 * - Gerenciar membros da equipe (adicionar, editar função, remover)
 *
 * ESTRUTURA:
 * ----------
 * Esta página é um orquestrador que utiliza componentes separados:
 * - ProjectInfoTab: Aba de informações
 * - ProjectTurbinesTab: Aba de turbinas (com modal)
 * - ProjectMembersTab: Aba de membros (com modais)
 * - ProjectEditModal: Modal de edição do projeto
 * - useProjectMutations: Hook com todas as mutations
 * ============================================================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit2 } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Serviços
import { getProjectById, type UpdateProjectPayload } from '@/services/project.service';
import { getUsers as fetchUsers } from '@/services/user.service';

// Componentes
import { ProjectInfoTab } from './components/ProjectInfoTab';
import { ProjectTurbinesTab } from './components/ProjectTurbinesTab';
import { ProjectMembersTab } from './components/ProjectMembersTab';
import { ProjectFilesTab } from './components/ProjectFilesTab';
import { ProjectEditModal } from './components/ProjectEditModal';

// Hooks
import { useProjectMutations } from './hooks/useProjectMutations';

/**
 * Componente ProjectDetailPage - Página de detalhes do projeto.
 */
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('projects');

  // Estado de aba
  const [activeTab, setActiveTab] = useState<'info' | 'turbines' | 'members' | 'files'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Buscar dados do projeto
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id!),
    enabled: !!id,
  });

  // Buscar usuários disponíveis
  const { data: usersData } = useQuery({
    queryKey: ['users-for-members'],
    queryFn: () => fetchUsers({ limit: 100 }),
  });

  // Mutations
  const {
    updateProjectMutation,
    createTurbineMutation,
    updateTurbineMutation,
    deleteTurbineMutation,
    addMemberMutation,
    updateMemberMutation,
    removeMemberMutation,
  } = useProjectMutations(id!);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  function openEditModal() {
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
  }

  function handleProjectEdit(payload: UpdateProjectPayload) {
    updateProjectMutation.mutate(payload, {
      onSuccess: () => closeEditModal(),
    });
  }

  function handleCreateTurbine(payload: Parameters<typeof createTurbineMutation.mutate>[0], options?: { onSuccess: () => void }) {
    createTurbineMutation.mutate(payload, options);
  }

  function handleUpdateTurbine(turbineId: string, payload: Parameters<typeof updateTurbineMutation.mutate>[0]['payload'], options?: { onSuccess: () => void }) {
    updateTurbineMutation.mutate({ turbineId, payload }, options);
  }

  function handleDeleteTurbine(turbineId: string) {
    deleteTurbineMutation.mutate(turbineId);
  }

  function handleAddMember(payload: Parameters<typeof addMemberMutation.mutate>[0], options?: { onSuccess: () => void }) {
    addMemberMutation.mutate(payload, options);
  }

  function handleUpdateMemberRole(memberId: string, payload: Parameters<typeof updateMemberMutation.mutate>[0]['payload'], options?: { onSuccess: () => void }) {
    updateMemberMutation.mutate({ memberId, payload }, options);
  }

  function handleRemoveMember(memberId: string) {
    removeMemberMutation.mutate(memberId);
  }

  // =========================================================================
  // ESTADOS DE CARREGAMENTO
  // =========================================================================

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('table.loading')}</div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('errors.notFound')}</div>
        </div>
      </AppLayout>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} />
          {t('actions.backToList')}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{project.client} • {project.location}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              project.status === 'PLANNING' ? 'bg-gray-100 text-gray-700' :
              project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
              project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {t(`status.${project.status}`)}
            </span>
            <button
              onClick={openEditModal}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('actions.editProject')}
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabs.info')}
          </button>
          <button
            onClick={() => setActiveTab('turbines')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'turbines'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabs.turbines')} ({project.turbines?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabs.members')} ({project.members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabs.files')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <ProjectInfoTab project={project} />
      )}

      {activeTab === 'turbines' && (
        <ProjectTurbinesTab
          project={project}
          onCreateTurbine={handleCreateTurbine}
          onUpdateTurbine={handleUpdateTurbine}
          onDeleteTurbine={handleDeleteTurbine}
          isCreatePending={createTurbineMutation.isPending}
          isUpdatePending={updateTurbineMutation.isPending}
        />
      )}

      {activeTab === 'members' && (
        <ProjectMembersTab
          project={project}
          users={usersData?.data || []}
          onAddMember={handleAddMember}
          onUpdateMemberRole={handleUpdateMemberRole}
          onRemoveMember={handleRemoveMember}
          isAddPending={addMemberMutation.isPending}
          isUpdatePending={updateMemberMutation.isPending}
        />
      )}

      {activeTab === 'files' && (
        <ProjectFilesTab project={project} />
      )}

      {/* Modal de Edição do Projeto */}
      <ProjectEditModal
        project={project}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleProjectEdit}
        isPending={updateProjectMutation.isPending}
      />
    </AppLayout>
  );
}
