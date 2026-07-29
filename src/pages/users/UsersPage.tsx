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
import { Plus } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { UsersFilters } from './components/UsersFilters';
import { UsersTable } from './components/UsersTable';
import { UserModal } from './components/UserModal';

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
      <UsersFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        roleFilter={roleFilter}
        onRoleChange={(role) => {
          setRoleFilter(role);
          setCurrentPage(1);
        }}
        t={t}
      />

      {/* Tabela de usuários */}
      <UsersTable
        data={data}
        isLoading={isLoading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onPageChange={setCurrentPage}
        t={t}
      />

      {/* Modal de criação/edição */}
      <UserModal
        isOpen={isModalOpen}
        editingUser={editingUser}
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
