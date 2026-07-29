/**
 * ============================================================================
 * PROJECTS PAGE - Página de Gestão de Projetos
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página completa para gerenciar projetos do sistema.
 * Apenas visível para usuários com role ADMIN ou HR.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Listar todos os projetos (paginado)
 * - Buscar projetos por nome ou cliente
 * - Filtrar por status
 * - Criar novo projeto
 * - Editar projeto existente
 * - Excluir projeto (soft delete)
 * - Navegar para detalhes do projeto
 *
 * SEGURANÇA:
 * ----------
 * - Rota protegida (requer autenticação)
 * - Verificação de role no frontend (ADMIN ou HR)
 * - API também valida as permissões
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { ProjectsFilters } from './components/ProjectsFilters';
import { ProjectsTable } from './components/ProjectsTable';
import { ProjectModal } from './components/ProjectModal';

// Serviço
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  type ProjectListItem,
  type CreateProjectPayload,
  type UpdateProjectPayload,
  type ProjectFilters,
} from '@/services/project.service';

/**
 * Componente ProjectsPage - Página de gestão de projetos.
 */
export function ProjectsPage() {
  const { t } = useTranslation('projects');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<CreateProjectPayload | UpdateProjectPayload>({
    name: '',
    client: '',
    location: '',
    scope: '',
    description: '',
    latitude: undefined,
    longitude: undefined,
    startDate: '',
    status: 'PLANNING',
  });

  /**
   * Busca projetos da API com paginação e filtros.
   */
  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter, currentPage],
    queryFn: () => {
      const filters: ProjectFilters = {
        page: currentPage,
        limit: 10,
      };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter as ProjectFilters['status'];
      return getProjects(filters);
    },
  });

  /**
   * Mutation para criar novo projeto.
   */
  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      toast.success(t('toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.createError'));
    },
  });

  /**
   * Mutation para atualizar projeto.
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      updateProject(id, payload),
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.updateError'));
    },
  });

  /**
   * Mutation para deletar projeto (soft delete).
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.deleteError'));
    },
  });

  /**
   * Abre o modal para criar novo projeto.
   */
  function openCreateModal() {
    setEditingProject(null);
    setFormData({
      name: '',
      client: '',
      location: '',
      scope: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
      startDate: '',
      status: 'PLANNING',
    });
    setIsModalOpen(true);
  }

  /**
   * Abre o modal para editar projeto existente.
   */
  function openEditModal(project: ProjectListItem) {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      location: project.location,
      scope: project.scope || '',
      description: project.description || '',
      latitude: project.latitude,
      longitude: project.longitude,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      status: project.status,
    });
    setIsModalOpen(true);
  }

  /**
   * Fecha o modal e limpa os dados.
   */
  function closeModal() {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({
      name: '',
      client: '',
      location: '',
      scope: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
      startDate: '',
      status: 'PLANNING',
    });
  }

  /**
   * Handle submit do formulário.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingProject) {
      // Atualizar projeto existente
      updateMutation.mutate({
        id: editingProject.id,
        payload: formData as UpdateProjectPayload,
      });
    } else {
      // Criar novo projeto
      createMutation.mutate(formData as CreateProjectPayload);
    }
  }

  /**
   * Confirma e executa a exclusão do projeto.
   */
  function handleDelete(project: ProjectListItem) {
    if (confirm(t('actions.confirmDelete', { name: project.name }))) {
      deleteMutation.mutate(project.id);
    }
  }

  /**
   * Navega para a página de detalhes do projeto.
   */
  function handleViewDetails(project: ProjectListItem) {
    navigate(`/projects/${project.id}`);
  }

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          {t('newProject')}
        </button>
      </div>

      {/* Filtros */}
      <ProjectsFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        t={t}
      />

      {/* Tabela de projetos */}
      <ProjectsTable
        data={data}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        onPageChange={setCurrentPage}
        t={t}
      />

      {/* Modal de criação/edição */}
      <ProjectModal
        isOpen={isModalOpen}
        editingProject={editingProject}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
        isPending={createMutation.isPending || updateMutation.isPending}
        t={t}
      />
    </AppLayout>
  );
}
