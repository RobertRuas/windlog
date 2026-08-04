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
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/layout/AppLayout';
import { TimesheetCreateModal } from './components/TimesheetCreateModal';
import { TimesheetViewModal } from './components/TimesheetViewModal';
import { TimesheetTable } from './components/TimesheetTable';
import { useTimesheetMutations } from './hooks/useTimesheetMutations';
import {
  getTimesheets,
  getTimesheetById,
  type TimesheetListItem,
  type WeeklyTimesheet,
} from '@/services/weekly-timesheet.service';
import { getProfile } from '@/services/auth.service';

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

  // ── Busca todos os timesheets para popular filtros ───────────────
  const { data: allResponse } = useQuery({
    queryKey: ['timesheets-all'],
    queryFn: () => getTimesheets({ limit: 500 }),
  });
  const allTimesheets: TimesheetListItem[] = allResponse?.data?.data || [];

  // Extrai projetos e autores únicos dos timesheets existentes
  const filterProjects = Array.from(
    new Map(
      allTimesheets.map((ts) => [ts.project.id, { id: ts.project.id, name: ts.project.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filterAuthors = Array.from(
    new Map(
      allTimesheets.map((ts) => [ts.createdBy, { id: ts.createdBy, name: `${ts.creator.firstName} ${ts.creator.lastName}` }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Extrai semanas únicas dos timesheets existentes
  const filterWeeks = Array.from(
    new Set(allTimesheets.map((ts) => ts.week))
  ).sort((a, b) => parseInt(b) - parseInt(a));

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
   * Abre o modal de visualização (modo impressão).
   * Busca os dados completos do timesheet se necessário.
   */
  const handleView = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setViewLoading(true);
      setViewTimesheet(null);

      try {
        // Sempre busca dados completos da API (evita tela em branco na primeira vez)
        const res = await getTimesheetById(id);
        setViewTimesheet(res.data);
      } catch {
        toast.error(t('toasts.error'));
      } finally {
        setViewLoading(false);
      }
    },
    [t],
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
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>

          {/* Botão Novo Timesheet */}
          {(currentUser?.role !== 'STANDARD' || currentUser?.isTeamLeader) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="form-button form-button-primary flex-shrink-0"
            >
              <Plus size={16} />
              {t('newTimesheet')}
            </button>
          )}
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="form-select !w-auto shrink"
          >
            <option value="">{t('filters.allStatuses')}</option>
            <option value="DRAFT">{t('status.DRAFT')}</option>
            <option value="SUBMITTED">{t('status.SUBMITTED')}</option>
            <option value="APPROVED">{t('status.APPROVED')}</option>
          </select>

          <select
            value={weekFilter}
            onChange={(e) => { setWeekFilter(e.target.value); setPage(1); }}
            className="form-select !w-auto shrink"
          >
            <option value="">{t('filters.allWeeks')}</option>
            {filterWeeks.map((w) => (
              <option key={w} value={w}>{t('filters.weekLabel')} {w}</option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
            className="form-select !w-auto shrink"
          >
            <option value="">{t('filters.allProjects')}</option>
            {filterProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={authorFilter}
            onChange={(e) => { setAuthorFilter(e.target.value); setPage(1); }}
            className="form-select !w-auto shrink"
          >
            <option value="">{t('filters.allAuthors')}</option>
            {filterAuthors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* ── Tabela ────────────────────────────────────────────────── */}
        <TimesheetTable
          timesheets={timesheets}
          isLoading={isLoading}
          currentUser={currentUser}
          onView={handleView}
          onEdit={(id) => navigate(`/timesheets/${id}`)}
          onDelete={handleDelete}
          meta={meta}
          onPageChange={setPage}
          t={t}
        />
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
