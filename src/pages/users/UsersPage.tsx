/**
 * ============================================================================
 * USERS PAGE - Página de Gestão de Usuários
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página completa para gerenciar usuários do sistema.
 * Apenas visível para usuários com role ADMIN ou HR.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Listar todos os usuários (paginado)
 * - Buscar usuários por nome ou email
 * - Filtrar por role ou status ativo
 * - Criar novo usuário
 * - Editar usuário existente
 * - Desativar usuário (soft delete)
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
import { toast } from 'sonner';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Serviço
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserListItem,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserFilters,
} from '@/services/user.service';

/**
 * Componente UsersPage - Página de gestão de usuários.
 */
export function UsersPage() {
  const { t } = useTranslation('users');
  const queryClient = useQueryClient();

  // Estados de filtros
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<CreateUserPayload | UpdateUserPayload>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STANDARD',
  });

  /**
   * Busca usuários da API com paginação e filtros.
   */
  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, currentPage],
    queryFn: () => {
      const filters: UserFilters = {
        page: currentPage,
        limit: 10,
      };
      if (search) filters.search = search;
      if (roleFilter) filters.role = roleFilter as 'ADMIN' | 'HR' | 'STANDARD';
      return getUsers(filters);
    },
  });

  /**
   * Mutation para criar novo usuário.
   */
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      toast.success(t('toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.createError'));
    },
  });

  /**
   * Mutation para atualizar usuário.
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.updateError'));
    },
  });

  /**
   * Mutation para deletar usuário (soft delete).
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success(t('toast.deactivateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.deactivateError'));
    },
  });

  /**
   * Abre o modal para criar novo usuário.
   */
  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STANDARD',
    });
    setIsModalOpen(true);
  }

  /**
   * Abre o modal para editar usuário existente.
   */
  function openEditModal(user: UserListItem) {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as 'ADMIN' | 'HR' | 'STANDARD',
    });
    setIsModalOpen(true);
  }

  /**
   * Fecha o modal e limpa os dados.
   */
  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STANDARD',
    });
  }

  /**
   * Handle submit do formulário.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingUser) {
      // Atualizar usuário existente
      updateMutation.mutate({
        id: editingUser.id,
        payload: formData as UpdateUserPayload,
      });
    } else {
      // Criar novo usuário
      createMutation.mutate(formData as CreateUserPayload);
    }
  }

  /**
   * Confirma e executa a desativação do usuário.
   */
  function handleDelete(user: UserListItem) {
    if (confirm(t('actions.confirmDeactivate', { name: `${user.firstName} ${user.lastName}` }))) {
      deleteMutation.mutate(user.id);
    }
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
          {t('newUser')}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por role */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('filter.allRoles')}</option>
            <option value="ADMIN">{t('roles.ADMIN')}</option>
            <option value="HR">{t('roles.HR')}</option>
            <option value="STANDARD">{t('roles.STANDARD')}</option>
          </select>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('table.loading')}</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-500">
            <UsersIcon size={48} className="mx-auto mb-3 text-gray-300" />
            <p>{t('table.empty')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.email')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.role')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.status')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'HR'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'ADMIN' ? t('roles.adminShort') : user.role === 'HR' ? t('roles.hrShort') : t('roles.standardShort')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? t('status.active') : t('status.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={t('actions.edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={t('actions.deactivate')}
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

            {/* Paginação */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {t('table.pagination', { page: data.page, totalPages: data.totalPages, total: data.total })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!data.hasPreviousPage}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={!data.hasNextPage}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de criação/edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Header do modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? t('modal.editTitle') : t('modal.createTitle')}
              </h2>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('modal.firstName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modal.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {editingUser ? t('modal.save') : t('modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
