/**
 * ============================================================================
 * WEEKLY TIMESHEET PAGE - Página de Listagem de Timesheets
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página principal do módulo de Weekly Timesheets.
 * Exibe uma tabela com todos os timesheets do sistema, com filtros
 * e opção de criar novo timesheet.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Tabela paginada com timesheets
 * - Filtros por projeto, semana e status
 * - Botão "Novo Timesheet" (abre modal de criação)
 * - Ações: visualizar (modal impressão), editar (página detalhes), excluir (com confirmação)
 * - Colunas sem quebras de linha (whitespace-nowrap)
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Eye, Pencil, Calendar, Wrench, Clock, Plane } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/layout/AppLayout';
import { TimesheetCreateModal } from './components/TimesheetCreateModal';
import { TimesheetViewModal } from './components/TimesheetViewModal';
import { useTimesheetMutations } from './hooks/useTimesheetMutations';
import {
  getTimesheets,
  getTimesheetById,
  type TimesheetListItem,
  type WeeklyTimesheet,
} from '@/services/weekly-timesheet.service';
import { getProfile } from '@/services/auth.service';
import { getUsers, type UserListItem } from '@/services/user.service';
import { getProjects, type ProjectListItem } from '@/services/project.service';

/**
 * Página WeeklyTimesheetPage - Listagem de timesheets.
 */
export function WeeklyTimesheetPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('timesheet');
  const mutations = useTimesheetMutations();

  // ── Perfil do usuário atual ─────────────────────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: getProfile,
  });

  // ── Estado local ────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [viewTimesheet, setViewTimesheet] = useState<WeeklyTimesheet | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const queryClient = useQueryClient();

  // ── Busca usuários e projetos para os filtros ─────────────────────
  const { data: usersData } = useQuery({
    queryKey: ['users-filter'],
    queryFn: () => getUsers({ limit: 200, isActive: true }),
  });
  const { data: projectsData } = useQuery({
    queryKey: ['projects-filter'],
    queryFn: () => getProjects({ limit: 200 }),
  });
  const users: UserListItem[] = usersData?.data || [];
  const projects: ProjectListItem[] = (projectsData as any)?.data || [];

  // ── Busca timesheets ────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: ['timesheets', page, statusFilter, weekFilter, projectFilter, authorFilter],
    queryFn: () =>
      getTimesheets({
        page,
        limit: 10,
        status: statusFilter || undefined,
        week: weekFilter || undefined,
        projectId: projectFilter || undefined,
        createdBy: authorFilter || undefined,
      }),
  });

  const timesheets = response?.data?.data || [];
  const meta = response?.data?.meta;

  /**
   * Formata horas em formato curto (ex: "12.5h" ou "0h").
   * Arredonda para 1 casa decimal.
   */
  function formatHours(hours: number | undefined): string {
    if (!hours || hours === 0) return '0h';
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded}h`;
  }

  /**
   * Badge de status colorido.
   */
  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
    };

    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {t(`status.${status}`)}
      </span>
    );
  }

  /**
   * Abre o modal de visualização (modo impressão).
   * Busca os dados completos do timesheet se necessário.
   */
  const handleView = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setViewLoading(true);
      setViewTimesheet(null);

      try {
        // Tenta usar dados já cacheados pelo React Query
        const cached = queryClient.getQueryData(['timesheet', id]);
        if (cached) {
          setViewTimesheet(cached as WeeklyTimesheet);
          setViewLoading(false);
          return;
        }

        const res = await getTimesheetById(id);
        setViewTimesheet(res.data);
      } catch {
        toast.error(t('toasts.error'));
      } finally {
        setViewLoading(false);
      }
    },
    [queryClient, t],
  );

  /**
   * Exclui um timesheet (com confirmação).
   */
  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    if (window.confirm(t('toasts.deleteConfirm'))) {
      mutations.deleteTimesheet.mutate(id);
    }
  }

  /**
   * Callback após criação de novo timesheet.
   * Navega para a página de detalhes.
   */
  function handleCreated(timesheetId: string) {
    setShowCreateModal(false);
    navigate(`/timesheets/${timesheetId}`);
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>

          {/* Botão Novo Timesheet */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            {t('newTimesheet')}
          </button>
        </div>

        {/* ── Filtros ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t('filters.allStatuses')}</option>
            <option value="DRAFT">{t('status.DRAFT')}</option>
            <option value="SUBMITTED">{t('status.SUBMITTED')}</option>
            <option value="APPROVED">{t('status.APPROVED')}</option>
          </select>

          {/* Semana */}
          <input
            type="text"
            value={weekFilter}
            onChange={(e) => { setWeekFilter(e.target.value); setPage(1); }}
            placeholder={t('filters.weekPlaceholder')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
          />

          {/* Projeto */}
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t('filters.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Autor */}
          <select
            value={authorFilter}
            onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t('filters.allAuthors')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        {/* ── Tabela ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              {t('table.loading')}
            </div>
          ) : timesheets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('table.empty')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.week')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.project')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.createdBy')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.status')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.hoursSummary')}
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((ts: TimesheetListItem) => (
                  <tr
                    key={ts.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">
                      #{ts.week}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {ts.project.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {ts.creator.firstName} {ts.creator.lastName}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={ts.status} />
                    </td>
                    {/* ── Resumo de Horas (ícones + totais) ─────────── */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                        {/* Trabalho */}
                        <span
                          className="flex items-center gap-1"
                          title={t('sheet.workingHrs')}
                        >
                          <Wrench size={13} className="text-blue-500" />
                          {formatHours(ts._totals?.workingHrs)}
                        </span>
                        {/* Stand-by */}
                        <span
                          className="flex items-center gap-1"
                          title={t('sheet.standbyHrs')}
                        >
                          <Clock size={13} className="text-amber-500" />
                          {formatHours(ts._totals?.standbyHrs)}
                        </span>
                        {/* Deslocamento */}
                        <span
                          className="flex items-center gap-1"
                          title={t('sheet.travelHrs')}
                        >
                          <Plane size={13} className="text-green-500" />
                          {formatHours(ts._totals?.travelHrs)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Visualizar / Baixar (modal modo impressão) */}
                        <button
                          onClick={(e) => handleView(ts.id, e)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title={t('actions.view')}
                        >
                          <Eye size={16} />
                        </button>
                        {/* Editar (modo edição) — apenas para criador ou ADMIN/HR */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'HR' || ts.createdBy === currentUser?.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/timesheets/${ts.id}`);
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                            title={t('actions.edit')}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {/* Excluir (com confirmação) — apenas para criador ou ADMIN/HR */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'HR' || ts.createdBy === currentUser?.id) && (
                          <button
                            onClick={(e) => handleDelete(ts.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title={t('actions.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginação ─────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              {t('table.pagination', {
                page: meta.page,
                totalPages: meta.totalPages,
                total: meta.total,
              })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de criação ────────────────────────────────────────── */}
      {showCreateModal && (
        <TimesheetCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreated}
        />
      )}

      {/* ── Modal de visualização (modo impressão) ──────────────────── */}
      {viewTimesheet && (
        <TimesheetViewModal
          timesheet={viewTimesheet}
          onClose={() => setViewTimesheet(null)}
        />
      )}

      {/* ── Loading overlay ao abrir visualização ───────────────────── */}
      {viewLoading && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </AppLayout>
  );
}
