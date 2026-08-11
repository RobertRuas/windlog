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
 * - Criar novo usuário (senha temporária gerada automaticamente)
 * - Editar usuário existente
 * - Resetar senha de qualquer usuário (gera nova senha temporária)
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

// Layout
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

// Componentes
import { UsersTable } from './components/UsersTable';
import { UserModal } from './components/UserModal';

// Serviço
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
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
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  // Senha temporária gerada (exibida após criar ou resetar)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<CreateUserPayload | UpdateUserPayload>({
    email: '',
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
   * A senha é gerada automaticamente pelo backend.
   */
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (result) => {
      toast.success(t('toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Exibe a senha temporária no modal
      setTemporaryPassword(result.temporaryPassword);
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
   * Mutation para resetar a senha de um usuário.
   * Gera uma nova senha temporária e exibe para o admin.
   */
  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: (result) => {
      toast.success(t('toast.resetPasswordSuccess'));
      // Exibe a nova senha temporária no modal
      setTemporaryPassword(result.temporaryPassword);
      setIsModalOpen(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.resetPasswordError'));
    },
  });

  /**
   * Abre o modal para criar novo usuário.
   */
  function openCreateModal() {
    setEditingUser(null);
    setTemporaryPassword(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'STANDARD',
      isTeamLeader: false,
    });
    setIsModalOpen(true);
  }

  /**
   * Abre o modal para editar usuário existente.
   */
  function openEditModal(user: UserListItem) {
    setEditingUser(user);
    setTemporaryPassword(null);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as 'ADMIN' | 'HR' | 'STANDARD',
      isTeamLeader: user.isTeamLeader ?? false,
    });
    setIsModalOpen(true);
  }

  /**
   * Fecha o modal e limpa os dados.
   */
  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setTemporaryPassword(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'STANDARD',
      isTeamLeader: false,
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
      // Criar novo usuário (senha gerada pelo backend)
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

  /**
   * Confirma e executa o reset de senha do usuário.
   */
  function handleResetPassword(user: UserListItem) {
    if (confirm(t('actions.confirmResetPassword', { name: `${user.firstName} ${user.lastName}` }))) {
      resetPasswordMutation.mutate(user.id);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {/* Tabela de usuários com toolbar integrada */}
      <UsersTable
        data={data}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
        onPageChange={setCurrentPage}
        t={t}
        toolbar={{
          searchValue: search,
          onSearchChange: (value) => { setSearch(value); setCurrentPage(1); },
          searchPlaceholder: t('search.placeholder'),
          showFilters,
          onToggleFilters: () => setShowFilters(!showFilters),
          hasActiveFilters: !!roleFilter,
          filters: (
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="form-select !w-auto shrink"
            >
              <option value="">{t('filter.allRoles')}</option>
              <option value="ADMIN">{t('roles.ADMIN')}</option>
              <option value="HR">{t('roles.HR')}</option>
              <option value="STANDARD">{t('roles.STANDARD')}</option>
            </select>
          ),
          addLabel: t('newUser'),
          onAdd: openCreateModal,
        }}
      />

      {/* Modal de criação/edição (também exibe senha temporária) */}
      <UserModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
        isPending={createMutation.isPending || updateMutation.isPending}
        temporaryPassword={temporaryPassword}
        t={t}
      />
    </AppLayout>
  );
}
