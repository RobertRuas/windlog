/**
 * ============================================================================
 * FEEDBACKS PAGE - Página de Gestão de Feedbacks (ADMIN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página administrativa para gestão de todos os feedbacks do sistema.
 * Apenas ADMIN pode acessar esta página.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Estatísticas (total, novos, por status/categoria/prioridade)
 * - Filtros (status, categoria, prioridade, busca textual)
 * - Tabela de feedbacks com paginação
 * - Modal de detalhes com edição de status/prioridade/notas
 * - Soft delete de feedbacks
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  ChevronDown,
  Trash2,
  Eye,
  AlertCircle,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  AlertTriangle,
  FileText,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import {
  getFeedbacks,
  getFeedbackStats,
  deleteFeedback,
  type Feedback,
  type FeedbackFilters,
  type FeedbackStatus,
  type FeedbackPriority,
  type FeedbackCategory,
} from '@/services/feedback.service';
import { FeedbackDetailModal } from './components/FeedbackDetailModal';

/**
 * Cores para cada status.
 */
const STATUS_COLORS: Record<FeedbackStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  TRIAGED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

/**
 * Cores para cada prioridade.
 */
const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

/**
 * Ícones para cada categoria.
 */
const CATEGORY_ICONS: Record<FeedbackCategory, typeof Bug> = {
  BUG: Bug,
  UI_ISSUE: Palette,
  FEATURE: Lightbulb,
  INCONSISTENCY: AlertTriangle,
  PERFORMANCE: Zap,
  OTHER: FileText,
};

/**
 * Componente FeedbacksPage - Página de gestão de feedbacks (ADMIN).
 */
export function FeedbacksPage() {
  const { t } = useTranslation('feedback');
  const queryClient = useQueryClient();

  // Estado dos filtros
  const [filters, setFilters] = useState<FeedbackFilters>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estado do modal de detalhes
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // Query: lista de feedbacks
  const { data: feedbacksData, isLoading } = useQuery({
    queryKey: ['feedbacks', filters],
    queryFn: () => getFeedbacks(filters),
    refetchInterval: 30000,
  });

  // Query: estatísticas
  const { data: stats } = useQuery({
    queryKey: ['feedback-stats'],
    queryFn: getFeedbackStats,
    refetchInterval: 60000,
  });

  // Mutation: eliminar feedback
  const deleteMutation = useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      toast.success(t('toast.delete_success'));
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
    },
    onError: () => {
      toast.error(t('toast.delete_error'));
    },
  });

  function handleSearch() {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  }

  function handleClearFilters() {
    setFilters({ page: 1, limit: 10 });
    setSearchInput('');
  }

  function openDetail(feedback: Feedback) {
    setSelectedFeedback(feedback);
  }

  function handleDelete(id: string) {
    if (window.confirm(t('toast.confirm_delete'))) {
      deleteMutation.mutate(id);
    }
  }

  const feedbacks = feedbacksData?.data || [];
  const meta = feedbacksData?.meta;

  /**
   * Colunas da tabela de feedbacks.
   */
  const feedbackColumns: DataTableColumn<Feedback>[] = [
    {
      header: t('fields.title'),
      sortable: true,
      sortKey: 'title',
      render: (fb) => (
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{fb.title}</p>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{fb.description}</p>
        </div>
      ),
    },
    {
      header: t('fields.category'),
      sortable: true,
      sortKey: 'category',
      render: (fb) => {
        const CatIcon = CATEGORY_ICONS[fb.category];
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
            <CatIcon size={14} />
            {t(`categories.${fb.category}`)}
          </span>
        );
      },
    },
    {
      header: t('table.status'),
      sortable: true,
      sortKey: 'status',
      render: (fb) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[fb.status]}`}>
          {t(`statuses.${fb.status}`)}
        </span>
      ),
    },
    {
      header: t('table.priority'),
      sortable: true,
      sortKey: 'priority',
      render: (fb) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${PRIORITY_COLORS[fb.priority]}`}>
          {t(`priorities.${fb.priority}`)}
        </span>
      ),
    },
    {
      header: t('list.reported_by'),
      render: (fb) => (
        <span className="text-sm text-gray-700 whitespace-nowrap">{fb.reporter.firstName} {fb.reporter.lastName}</span>
      ),
    },
    {
      header: t('table.date'),
      sortable: true,
      sortKey: 'createdAt',
      render: (fb) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(fb.createdAt).toLocaleDateString('pt-BR')}</span>
      ),
    },
    {
      header: t('table.actions'),
      align: 'right',
      sticky: true,
      minWidth: '80px',
      render: (fb) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openDetail(fb)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('actions.view')}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleDelete(fb.id)}
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
    <AppLayout>
      <PageHeader
        title={t('admin_title')}
        subtitle={t('admin_subtitle')}
      />

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{t('stats.total')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-blue-600 font-medium">{t('stats.new')}</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.newCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <p className="text-xs text-red-600 font-medium">{t('stats.by_priority')}</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.byPriority.find((p) => p.priority === 'HIGH' || p.priority === 'CRITICAL')?.count || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4">
            <p className="text-xs text-green-600 font-medium">{t('statuses.RESOLVED')}</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.byStatus.find((s) => s.status === 'RESOLVED')?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Busca e filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('filters.search_placeholder')}
              className="form-input w-full !pl-9"
            />
          </div>

          {/* Toggle filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 form-button-secondary !h-[40px] ${
              showFilters ? '!border-blue-500 !bg-blue-50 !text-blue-700 dark:!bg-blue-900/20 dark:!text-blue-400' : '!border-gray-200 !text-gray-600 hover:!bg-gray-50 dark:!border-[#38383a] dark:!text-[#a1a1a6] dark:hover:!bg-[#2c2c2e]'
            }`}
          >
            <Filter size={16} />
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {/* Filtro por status */}
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: (e.target.value || undefined) as FeedbackStatus | undefined, page: 1 }))}
              className="form-select"
            >
              <option value="">{t('filters.all_statuses')}</option>
              {(['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as FeedbackStatus[]).map((s) => (
                <option key={s} value={s}>{t(`statuses.${s}`)}</option>
              ))}
            </select>

            {/* Filtro por categoria */}
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: (e.target.value || undefined) as FeedbackCategory | undefined, page: 1 }))}
              className="form-select"
            >
              <option value="">{t('filters.all_categories')}</option>
              {(['BUG', 'UI_ISSUE', 'FEATURE', 'INCONSISTENCY', 'PERFORMANCE', 'OTHER'] as FeedbackCategory[]).map((c) => (
                <option key={c} value={c}>{t(`categories.${c}`)}</option>
              ))}
            </select>

            {/* Filtro por prioridade */}
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: (e.target.value || undefined) as FeedbackPriority | undefined, page: 1 }))}
              className="form-select"
            >
              <option value="">{t('filters.all_priorities')}</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as FeedbackPriority[]).map((p) => (
                <option key={p} value={p}>{t(`priorities.${p}`)}</option>
              ))}
            </select>

            {/* Limpar filtros */}
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t('table.clear')}
            </button>
          </div>
        )}
      </div>

      {/* Tabela de feedbacks */}
      <DataTable
        columns={feedbackColumns}
        data={feedbacks}
        isLoading={isLoading}
        clientSort
        emptyIcon={AlertCircle}
        emptyMessage={t('list.empty')}
        loadingMessage={t('status.loading', { ns: 'common' })}
        pagination={meta && meta.totalPages > 1 ? {
          page: meta.page,
          totalPages: meta.totalPages,
          total: meta.total,
          hasPreviousPage: meta.page > 1,
          hasNextPage: meta.page < meta.totalPages,
          onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
          paginationLabel: t('table.pagination_info', { total: meta.total, page: meta.page, totalPages: meta.totalPages }),
        } : undefined}
      />

      {/* ── Modal de Detalhes / Edição ─────────────────────────────── */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </AppLayout>
  );
}
