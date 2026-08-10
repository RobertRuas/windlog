/**
 * ============================================================================
 * TIMESHEET TABLE - Tabela de Timesheets com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de timesheets com paginação.
 * Utiliza o componente reutilizável DataTable para manter o estilo
 * padronizado em todo o sistema (mesmo visual da tabela de projetos).
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Scroll horizontal em ecrãs pequenos
 * - Coluna de ações fixa (sticky) à direita
 * - Paginação integrada
 * - Resumo de horas com ícones
 * - Ações: visualizar, editar, excluir (com controlo de permissões)
 * ============================================================================
 */

import { Eye, Pencil, Trash2, Wrench, Clock, Plane } from 'lucide-react';
import type { TimesheetListItem } from '@/services/weekly-timesheet.service';
import type { ProfileResponse } from '@/types/user.types';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

/**
 * Props do componente TimesheetTable.
 */
interface TimesheetTableProps {
  timesheets: TimesheetListItem[];
  isLoading: boolean;
  currentUser?: ProfileResponse | null;
  onView: (id: string, e: React.MouseEvent) => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Formata horas em formato curto (ex: "12.5h" ou "0h").
 */
function formatHours(hours: number | undefined): string {
  if (!hours || hours === 0) return '0h';
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

/**
 * Badge de status do timesheet.
 */
function StatusBadge({ status, label }: { status: string; label: string }) {
  const config: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${config[status] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}

/**
 * Componente TimesheetTable - Tabela de timesheets com DataTable.
 */
export function TimesheetTable({
  timesheets,
  isLoading,
  currentUser,
  onView,
  onEdit,
  onDelete,
  meta,
  onPageChange,
  t,
}: TimesheetTableProps) {
  /**
   * Verifica se o usuário atual pode editar/excluir um timesheet.
   */
  function canEditOrDelete(ts: TimesheetListItem): boolean {
    if (!currentUser) return false;
    return (
      currentUser.role !== 'STANDARD' ||
      currentUser.isTeamLeader ||
      ts.createdBy === currentUser.id
    );
  }

  /**
   * Colunas da tabela (configuração para DataTable).
   */
  const columns: DataTableColumn<TimesheetListItem>[] = [
    {
      header: t('table.week'),
      align: 'center',
      sortable: true,
      sortKey: 'week',
      mobile: { asSubtitle: true, order: 0 },
      render: (ts) => <span className="whitespace-nowrap text-gray-600">#{ts.week}</span>,
    },
    {
      header: t('table.project'),
      mobile: { asTitle: true },
      render: (ts) => <span className="whitespace-nowrap font-medium text-gray-900">{ts.project.name}</span>,
    },
    {
      header: t('table.createdBy'),
      mobile: { asSubtitle: true, order: 1 },
      render: (ts) => (
        <span className="whitespace-nowrap text-gray-600">
          {ts.creator.firstName} {ts.creator.lastName}
        </span>
      ),
    },
    {
      header: t('table.status'),
      align: 'center',
      sortable: true,
      sortKey: 'status',
      mobile: { hideLabel: true },
      render: (ts) => <StatusBadge status={ts.status} label={t(`status.${ts.status}`)} />,
    },
    {
      header: t('table.hoursSummary'),
      align: 'center',
      mobile: { hideLabel: true },
      render: (ts) => (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
          {/* Largura fixa + números tabulares mantêm tudo alinhado entre as linhas */}
          <span className="w-9 flex items-center justify-center gap-0.5 tabular-nums" title={t('sheet.workingHrs')}>
            <Wrench size={12} className="text-blue-500" />
            {formatHours(ts._totals?.workingHrs)}
          </span>
          <span className="w-9 flex items-center justify-center gap-0.5 tabular-nums" title={t('sheet.standbyHrs')}>
            <Clock size={12} className="text-amber-500" />
            {formatHours(ts._totals?.standbyHrs)}
          </span>
          <span className="w-9 flex items-center justify-center gap-0.5 tabular-nums" title={t('sheet.travelHrs')}>
            <Plane size={12} className="text-green-500" />
            {formatHours(ts._totals?.travelHrs)}
          </span>
        </div>
      ),
    },
    {
      header: t('table.actions'),
      align: 'center',
      sticky: true,
      minWidth: '120px',
      render: (ts) => (
        <div className="flex items-center justify-center gap-1">
          {/* Visualizar (modal modo impressão) */}
          <button
            onClick={(e) => onView(ts.id, e)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title={t('actions.view')}
          >
            <Eye size={16} />
          </button>
          {/* Editar (modo edição) — apenas para criador ou ADMIN/HR/TeamLeader */}
          {canEditOrDelete(ts) && (
            <button
              onClick={(e) => onEdit(ts.id, e)}
              className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
              title={t('actions.edit')}
            >
              <Pencil size={16} />
            </button>
          )}
          {/* Excluir (com confirmação) — apenas para criador ou ADMIN/HR/TeamLeader */}
          {canEditOrDelete(ts) && (
            <button
              onClick={(e) => onDelete(ts.id, e)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title={t('actions.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  /**
   * Constrói objeto de paginação para DataTable (se aplicável).
   */
  const pagination = meta && meta.totalPages > 1
    ? {
        page: meta.page,
        totalPages: meta.totalPages,
        total: meta.total,
        hasPreviousPage: meta.page > 1,
        hasNextPage: meta.page < meta.totalPages,
        onPageChange,
        paginationLabel: t('table.pagination', {
          page: meta.page,
          totalPages: meta.totalPages,
          total: meta.total,
        }),
      }
    : undefined;

  return (
    <DataTable
      columns={columns}
      data={timesheets}
      isLoading={isLoading}
      clientSort
      emptyMessage={t('table.empty')}
      loadingMessage={t('table.loading')}
      pagination={pagination}
    />
  );
}
