/**
 * ============================================================================
 * USERS TABLE - Tabela de Usuários com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de usuários com paginação.
 * Utiliza o componente reutilizável DataTable para manter o estilo
 * padronizado em todo o sistema.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Colunas: Nome, Email, Role, Status, Ações
 * - Ações: Editar, Reset de Senha, Desativar
 * - Paginação com navegação
 * - Estados de loading e vazio
 * ============================================================================
 */

import { Edit2, Trash2, KeyRound } from 'lucide-react';
import type { UserListItem } from '@/services/user.service';
import { DataTable, type DataTableColumn, type DataTableToolbar } from '@/components/ui/DataTable';

/**
 * Props do componente UsersTable.
 */
interface UsersTableProps {
  data?: {
    data: UserListItem[];
    page: number;
    totalPages: number;
    total: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  isLoading: boolean;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onResetPassword: (user: UserListItem) => void;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Toolbar integrada (pesquisa + filtros + adicionar) */
  toolbar?: DataTableToolbar;
}

/**
 * Componente UsersTable - Tabela de usuários com design padronizado.
 * Utiliza DataTable para manter consistência visual em todo o sistema.
 */
export function UsersTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onResetPassword,
  onPageChange,
  t,
  toolbar,
}: UsersTableProps) {
  /**
   * Colunas da tabela de usuários.
   */
  const columns: DataTableColumn<UserListItem>[] = [
    {
      header: t('table.name'),
      sortable: true,
      sortKey: 'firstName',
      render: (user) => (
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
          {user.firstName} {user.lastName}
        </span>
      ),
    },
    {
      header: t('table.email'),
      sortable: true,
      sortKey: 'email',
      render: (user) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {user.email}
        </span>
      ),
    },
    {
      header: t('table.role'),
      sortable: true,
      sortKey: 'role',
      render: (user) => (
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
            user.role === 'ADMIN'
              ? 'bg-purple-100 text-purple-700'
              : user.role === 'HR'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {user.role === 'ADMIN' ? t('roles.adminShort') : user.role === 'HR' ? t('roles.hrShort') : t('roles.standardShort')}
          </span>
          {user.isTeamLeader && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
              {t('roles.teamLeaderShort')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('table.status'),
      sortable: true,
      sortKey: 'isActive',
      render: (user) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
          user.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {user.isActive ? t('status.active') : t('status.inactive')}
        </span>
      ),
    },
    {
      header: t('table.actions'),
      align: 'right',
      sticky: true,
      minWidth: '120px',
      render: (user) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('actions.edit')}
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onResetPassword(user)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={t('actions.resetPassword')}
          >
            <KeyRound size={15} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('actions.deactivate')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      clientSort
      emptyMessage={t('table.empty')}
      loadingMessage={t('table.loading')}
      toolbar={toolbar}
      mobileOptions={{
        titleField: 'firstName',
        subtitleField: 'email',
        fields: [
          { key: 'role', label: t('table.role') },
        ],
        actions: [
          { icon: Edit2, label: t('actions.edit'), color: 'text-blue-600', onPress: onEdit },
          { icon: KeyRound, label: t('actions.resetPassword'), color: 'text-amber-600', onPress: onResetPassword },
          { icon: Trash2, label: t('actions.deactivate'), color: 'text-red-600', onPress: onDelete },
        ],
        sortableColumns: [
          { key: 'firstName', label: t('table.name') },
          { key: 'email', label: t('table.email') },
          { key: 'role', label: t('table.role') },
        ],
      }}
      pagination={data && data.totalPages > 1 ? {
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage,
        onPageChange,
        paginationLabel: t('table.pagination', { page: data.page, totalPages: data.totalPages, total: data.total }),
      } : undefined}
    />
  );
}
