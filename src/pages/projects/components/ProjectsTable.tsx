/**
 * ============================================================================
 * PROJECTS TABLE - Tabela de Projetos com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de projetos com paginação.
 * Utiliza o componente reutilizável DataTable para manter o estilo
 * padronizado em todo o sistema.
 * ============================================================================
 */

import { MapPin, Wind, Users as UsersIcon, Eye, Edit2, Trash2 } from 'lucide-react';
import type { ProjectListItem } from '@/services/project.service';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

/**
 * Props do componente ProjectsTable.
 */
interface ProjectsTableProps {
  data?: {
    data: ProjectListItem[];
    page: number;
    totalPages: number;
    total: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  isLoading: boolean;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onViewDetails: (project: ProjectListItem) => void;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Configuração visual de cada status do projeto.
 */
const STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  PLANNING:    { bg: 'bg-gray-50 text-gray-600',    dot: 'bg-gray-400' },
  IN_PROGRESS: { bg: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  ON_HOLD:     { bg: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500' },
  COMPLETED:   { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED:   { bg: 'bg-red-50 text-red-700',      dot: 'bg-red-500' },
};

/**
 * Componente ProjectsTable - Tabela de projetos com design padronizado.
 * Utiliza DataTable para manter consistência visual em todo o sistema.
 */
export function ProjectsTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  onPageChange,
  t,
}: ProjectsTableProps) {
  /**
   * Colunas da tabela de projetos.
   */
  const columns: DataTableColumn<ProjectListItem>[] = [
    {
      header: t('table.name'),
      render: (project) => (
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
          {project.name}
        </span>
      ),
    },
    {
      header: t('table.client'),
      render: (project) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {project.client}
        </span>
      ),
    },
    {
      header: t('table.location'),
      render: (project) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 whitespace-nowrap">
          <MapPin size={13} className="text-gray-400 flex-shrink-0" />
          {project.location}
        </span>
      ),
    },
    {
      header: t('table.status'),
      align: 'left',
      render: (project) => {
        const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNING;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusCfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {t(`status.${project.status}`)}
          </span>
        );
      },
    },
    {
      header: t('table.resources'),
      align: 'center',
      render: (project) => (
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm text-gray-500" title={t('table.turbines')}>
            <Wind size={14} className="text-gray-400" />
            {project._count?.turbines || 0}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-gray-500" title={t('table.members')}>
            <UsersIcon size={14} className="text-gray-400" />
            {project._count?.members || 0}
          </span>
        </div>
      ),
    },
    {
      header: t('table.actions'),
      align: 'right',
      sticky: true,
      minWidth: '120px',
      render: (project) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onViewDetails(project)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('actions.viewDetails')}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('actions.edit')}
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('actions.delete')}
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
      emptyMessage={t('table.empty')}
      loadingMessage={t('table.loading')}
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
