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
 * - Gerenciar turbinas (adicionar, editar, remover)
 * - Gerenciar membros da equipe (adicionar, remover)
 * ============================================================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit2, Wind, Users } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Serviço
import {
  getProjectById,
  updateProject,
  createTurbine,
  updateTurbine,
  deleteTurbine,
  addMember,
  updateMember,
  removeMember,
  type ProjectDetail,
  type Turbine,
  type ProjectMember,
  type CreateTurbinePayload,
  type UpdateTurbinePayload,
  type AddMemberPayload,
  type UpdateMemberPayload,
} from '@/services/project.service';
import { getUsers as fetchUsers } from '@/services/user.service';

/**
 * Componente ProjectDetailPage - Página de detalhes do projeto.
 */
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('projects');
  const queryClient = useQueryClient();

  // Estados de aba
  const [activeTab, setActiveTab] = useState<'info' | 'turbines' | 'members'>('info');

  // Estados de modais
  const [isTurbineModalOpen, setIsTurbineModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editingTurbine, setEditingTurbine] = useState<Turbine | null>(null);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [turbineFormData, setTurbineFormData] = useState<CreateTurbinePayload | UpdateTurbinePayload>({
    name: '',
    location: '',
    manufacturer: '',
    model: '',
    nacelleHeight: undefined,
    latitude: undefined,
    longitude: undefined,
    status: 'OPERATIONAL',
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');

  // Estados para edição do projeto
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    client: '',
    location: '',
    scope: '',
    description: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    startDate: '',
    status: 'PLANNING' as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
  });

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
  const updateProjectMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProject>[1]) => updateProject(id!, payload),
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.updateError'));
    },
  });

  const createTurbineMutation = useMutation({
    mutationFn: (payload: CreateTurbinePayload) => createTurbine(id!, payload),
    onSuccess: () => {
      toast.success(t('toast.turbineCreateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeTurbineModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineCreateError'));
    },
  });

  const updateTurbineMutation = useMutation({
    mutationFn: ({ turbineId, payload }: { turbineId: string; payload: UpdateTurbinePayload }) =>
      updateTurbine(id!, turbineId, payload),
    onSuccess: () => {
      toast.success(t('toast.turbineUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeTurbineModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineUpdateError'));
    },
  });

  const deleteTurbineMutation = useMutation({
    mutationFn: (turbineId: string) => deleteTurbine(id!, turbineId),
    onSuccess: () => {
      toast.success(t('toast.turbineDeleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.turbineDeleteError'));
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: AddMemberPayload) => addMember(id!, payload),
    onSuccess: () => {
      toast.success(t('toast.memberAddSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeMemberModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberAddError'));
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberPayload }) =>
      updateMember(id!, memberId, payload),
    onSuccess: () => {
      toast.success(t('toast.memberUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      closeEditMemberModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberUpdateError'));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(id!, memberId),
    onSuccess: () => {
      toast.success(t('toast.memberRemoveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.memberRemoveError'));
    },
  });

  // Handlers
  function openTurbineCreateModal() {
    setEditingTurbine(null);
    setTurbineFormData({
      name: '',
      location: '',
      manufacturer: '',
      model: '',
      nacelleHeight: undefined,
      latitude: undefined,
      longitude: undefined,
      status: 'OPERATIONAL',
    });
    setIsTurbineModalOpen(true);
  }

  function openTurbineEditModal(turbine: Turbine) {
    setEditingTurbine(turbine);
    setTurbineFormData({
      name: turbine.name,
      location: turbine.location || '',
      manufacturer: turbine.manufacturer || '',
      model: turbine.model || '',
      nacelleHeight: turbine.nacelleHeight,
      latitude: turbine.latitude,
      longitude: turbine.longitude,
      status: turbine.status,
    });
    setIsTurbineModalOpen(true);
  }

  function closeTurbineModal() {
    setIsTurbineModalOpen(false);
    setEditingTurbine(null);
  }

  function openMemberModal() {
    setSelectedUserId('');
    setMemberRole('');
    setIsMemberModalOpen(true);
  }

  function closeMemberModal() {
    setIsMemberModalOpen(false);
    setSelectedUserId('');
    setMemberRole('');
  }

  function openProjectEditModal() {
    if (!project) return;
    setProjectFormData({
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
    setIsProjectEditModalOpen(true);
  }

  function closeProjectEditModal() {
    setIsProjectEditModalOpen(false);
  }

  function openEditMemberModal(member: ProjectMember) {
    setEditingMember(member);
    setEditMemberRole(member.role || '');
    setIsEditMemberModalOpen(true);
  }

  function closeEditMemberModal() {
    setIsEditMemberModalOpen(false);
    setEditingMember(null);
    setEditMemberRole('');
  }

  function handleTurbineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingTurbine) {
      updateTurbineMutation.mutate({
        turbineId: editingTurbine.id,
        payload: turbineFormData as UpdateTurbinePayload,
      });
    } else {
      createTurbineMutation.mutate(turbineFormData as CreateTurbinePayload);
    }
  }

  function handleMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    addMemberMutation.mutate({
      userId: selectedUserId,
      role: memberRole || undefined,
    });
  }

  function handleDeleteTurbine(turbine: Turbine) {
    if (confirm(t('actions.confirmDeleteTurbine', { name: turbine.name }))) {
      deleteTurbineMutation.mutate(turbine.id);
    }
  }

  function handleRemoveMember(member: ProjectMember) {
    if (confirm(t('actions.confirmRemoveMember', { name: `${member.user.firstName} ${member.user.lastName}` }))) {
      removeMemberMutation.mutate(member.id);
    }
  }

  function handleProjectEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProjectMutation.mutate({
      name: projectFormData.name,
      client: projectFormData.client,
      location: projectFormData.location,
      scope: projectFormData.scope || undefined,
      description: projectFormData.description || undefined,
      latitude: projectFormData.latitude,
      longitude: projectFormData.longitude,
      startDate: projectFormData.startDate || undefined,
      status: projectFormData.status,
    });
  }

  function handleEditMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    updateMemberMutation.mutate({
      memberId: editingMember.id,
      payload: { role: editMemberRole || undefined },
    });
  }

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
              onClick={openProjectEditModal}
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.name')}</label>
              <p className="mt-1 text-gray-900">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.client')}</label>
              <p className="mt-1 text-gray-900">{project.client}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.location')}</label>
              <p className="mt-1 text-gray-900">{project.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.scope')}</label>
              <p className="mt-1 text-gray-900">{project.scope || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">{t('modal.description')}</label>
              <p className="mt-1 text-gray-900">{project.description || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.latitude')}</label>
              <p className="mt-1 text-gray-900">{project.latitude ?? '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.longitude')}</label>
              <p className="mt-1 text-gray-900">{project.longitude ?? '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.startDate')}</label>
              <p className="mt-1 text-gray-900">
                {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('modal.status')}</label>
              <p className="mt-1 text-gray-900">{t(`status.${project.status}`)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'turbines' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-end">
            <button
              onClick={openTurbineCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              {t('actions.addTurbine')}
            </button>
          </div>
          {project.turbines?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.location')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.manufacturer')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.model')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.nacelleHeight')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.status')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {project.turbines.map((turbine) => (
                    <tr key={turbine.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{turbine.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{turbine.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{turbine.manufacturer || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{turbine.model || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{turbine.nacelleHeight ? `${turbine.nacelleHeight}m` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          turbine.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' :
                          turbine.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                          turbine.status === 'OFFLINE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t(`turbineStatus.${turbine.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTurbineEditModal(turbine)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTurbine(turbine)}
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
              <Wind size={48} className="mx-auto mb-3 text-gray-300" />
              <p>{t('turbineTable.empty')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-end">
            <button
              onClick={openMemberModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              {t('actions.addMember')}
            </button>
          </div>
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
                            onClick={() => openEditMemberModal(member)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={t('actions.editMemberRole')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member)}
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
      )}

      {/* Modal de Turbina */}
      {isTurbineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTurbine ? t('turbineModal.editTitle') : t('turbineModal.createTitle')}
              </h2>
            </div>
            <form onSubmit={handleTurbineSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('turbineModal.name')} *
                </label>
                <input
                  type="text"
                  required
                  value={turbineFormData.name}
                  onChange={(e) => setTurbineFormData({ ...turbineFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('turbineModal.manufacturer')}
                  </label>
                  <input
                    type="text"
                    value={turbineFormData.manufacturer || ''}
                    onChange={(e) => setTurbineFormData({ ...turbineFormData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('turbineModal.model')}
                  </label>
                  <input
                    type="text"
                    value={turbineFormData.model || ''}
                    onChange={(e) => setTurbineFormData({ ...turbineFormData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('turbineModal.location')}
                </label>
                <input
                  type="text"
                  value={turbineFormData.location || ''}
                  onChange={(e) => setTurbineFormData({ ...turbineFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('turbineModal.nacelleHeight')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={turbineFormData.nacelleHeight ?? ''}
                    onChange={(e) => setTurbineFormData({ ...turbineFormData, nacelleHeight: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                    value={turbineFormData.latitude ?? ''}
                    onChange={(e) => setTurbineFormData({ ...turbineFormData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                    value={turbineFormData.longitude ?? ''}
                    onChange={(e) => setTurbineFormData({ ...turbineFormData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('turbineModal.status')}
                </label>
                <select
                  value={turbineFormData.status || 'OPERATIONAL'}
                  onChange={(e) => setTurbineFormData({ ...turbineFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPERATIONAL">{t('turbineStatus.OPERATIONAL')}</option>
                  <option value="MAINTENANCE">{t('turbineStatus.MAINTENANCE')}</option>
                  <option value="OFFLINE">{t('turbineStatus.OFFLINE')}</option>
                  <option value="DECOMMISSIONED">{t('turbineStatus.DECOMMISSIONED')}</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeTurbineModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createTurbineMutation.isPending || updateTurbineMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {editingTurbine ? t('modal.save') : t('modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Membro */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('memberModal.title')}
              </h2>
            </div>
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
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
                  {usersData?.data.map((user) => (
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
                  onClick={closeMemberModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição do Projeto */}
      {isProjectEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('editProjectModal.title')}
              </h2>
            </div>
            <form onSubmit={handleProjectEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('modal.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
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
                    value={projectFormData.client}
                    onChange={(e) => setProjectFormData({ ...projectFormData, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.location')} *
                </label>
                <input
                  type="text"
                  required
                  value={projectFormData.location}
                  onChange={(e) => setProjectFormData({ ...projectFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.scope')}
                </label>
                <input
                  type="text"
                  value={projectFormData.scope}
                  onChange={(e) => setProjectFormData({ ...projectFormData, scope: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.description')}
                </label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
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
                    value={projectFormData.latitude ?? ''}
                    onChange={(e) => setProjectFormData({ ...projectFormData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                    value={projectFormData.longitude ?? ''}
                    onChange={(e) => setProjectFormData({ ...projectFormData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('modal.status')}
                  </label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as typeof projectFormData.status })}
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeProjectEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Função do Membro */}
      {isEditMemberModalOpen && editingMember && (
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
            <form onSubmit={handleEditMemberSubmit} className="p-6 space-y-4">
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
                  onClick={closeEditMemberModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updateMemberMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
