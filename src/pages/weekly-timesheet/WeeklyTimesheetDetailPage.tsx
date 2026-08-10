/**
 * ============================================================================
 * WEEKLY TIMESHEET DETAIL PAGE - Página de Edição
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página principal do módulo de Weekly Timesheets para um timesheet específico.
 * Abre SEMPRE no modo Editor (formulário de edição).
 *
 * MODOS:
 * ------
 * 1. EDITOR (padrão): formulário organizado no padrão da aplicação.
 *    - Inputs reais do React com estado controlado
 *    - Seções colapsáveis por dia
 *    - Tabela de entradas editáveis por dia
 *    - Botão "Salvar" envia tudo de uma vez
 *
 * 2. VISUALIZAÇÃO (modal): o botão "Visualização" abre um modal com a
 *    planilha preenchida em modo de impressão (fiel ao Excel), com
 *    zoom, exportar Excel e imprimir/gerar PDF.
 *
 * ESTRUTURA:
 * ----------
 * 1. AppLayout (sidebar + header)
 * 2. Header com botão voltar + título + botão Visualização
 * 3. Editor (conteúdo principal) + modal de visualização opcional
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Lock } from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';
import { TimesheetFormEditor } from './components/TimesheetFormEditor';
import { TimesheetViewModal } from './components/TimesheetViewModal';
import { useTimesheetMutations } from './hooks/useTimesheetMutations';
import { getProfile } from '@/services/auth.service';
import {
  getTimesheetById,
  type UpdateTimesheetPayload,
} from '@/services/weekly-timesheet.service';

// Importa os estilos da planilha
import './styles/timesheet.css';

/**
 * Página WeeklyTimesheetDetailPage - edição do timesheet.
 *
 * Sempre no modo Editor; o botão Visualização abre um modal com a
 * planilha preenchida em modo de impressão.
 */
export function WeeklyTimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('timesheet');

  // ── Estado local ────────────────────────────────────────────────────
  // Controla a abertura do modal de visualização (planilha em modo de impressão)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Hook de mutations ──────────────────────────────────────────────
  const mutations = useTimesheetMutations(id);

  // ── Busca o timesheet pelo ID ───────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: ['timesheet', id],
    queryFn: () => getTimesheetById(id!),
    enabled: !!id,
    refetchOnMount: 'always', // Sempre busca dados frescos ao (re)montar o componente
  });

  // ── Busca o perfil do usuário atual ─────────────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: getProfile,
  });

  // Extrai o timesheet da resposta da API
  const timesheet = response?.data;

  // Verifica se o usuário atual pode editar (criador ou ADMIN/HR/TeamLeader)
  const canEdit = timesheet && currentUser
    ? currentUser.role !== 'STANDARD' || currentUser.isTeamLeader || timesheet.createdBy === currentUser.id
    : false;

  /**
   * Salva as alterações do formulário no backend.
   */
  const handleFormSave = useCallback(
    (payload: UpdateTimesheetPayload) => {
      if (!id) return;
      // Toast é exibido pelo hook useTimesheetMutations (evita duplicação)
      mutations.updateTimesheet.mutate({ id, data: payload });
    },
    [id, mutations],
  );

  // ── Loading state ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">{t('detail.loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Timesheet não encontrado ────────────────────────────────────────
  if (!timesheet) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 mb-4">{t('notFound')}</p>
          <button
            onClick={() => navigate('/timesheets')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            {t('detail.back')}
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── Renderização principal ──────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-6 ts-no-print">
          {/* Botão voltar */}
          <button
            onClick={() => navigate('/timesheets')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} />
            {t('detail.back')}
          </button>

          {/* Título + Info */}
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                {timesheet.project.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('sheet.week')} {timesheet.week}
                {timesheet.days.length > 0 && (() => {
                  // Extrai range de datas (Seg-Dom) diretamente dos dias do timesheet
                  const fmt = (d: string) => {
                    const pure = d.split('T')[0];
                    const [, m, day] = pure.split('-');
                    return `${day}/${m}`;
                  };
                  const first = fmt(timesheet.days[0].date);
                  const last = fmt(timesheet.days[timesheet.days.length - 1].date);
                  return ` — ${first} a ${last}`;
                })()}
                {' • '}
                {t('status.' + timesheet.status)} •{' '}
                {timesheet.creator.firstName} {timesheet.creator.lastName}
              </p>
            </div>

            {/* Status badge + botão Visualização (apenas ícone, à direita do status) */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  timesheet.status === 'DRAFT'
                    ? 'bg-yellow-100 text-yellow-800'
                    : timesheet.status === 'SUBMITTED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {t('status.' + timesheet.status)}
              </span>
              <button
                onClick={() => setIsViewModalOpen(true)}
                title={t('detail.viewButton')}
                aria-label={t('detail.viewButton')}
                className="flex items-center justify-center w-8 h-8 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Editor (modo padrão) — apenas para quem pode editar ──── */}
        {canEdit ? (
          <TimesheetFormEditor
            timesheet={timesheet}
            onSave={handleFormSave}
            isSaving={mutations.updateTimesheet.isPending}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex items-center gap-3">
              <Lock size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {t('detail.readOnlyTitle')}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {t('detail.readOnlyHint')}
                </p>
              </div>
            </div>
            <div className="p-6">
              <button
                onClick={() => setIsViewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye size={16} />
                {t('detail.viewButton')}
              </button>
            </div>
          </div>
        )}

        {/* ── Modal de Visualização (planilha em modo de impressão) ── */}
        {isViewModalOpen && (
          <TimesheetViewModal
            timesheet={timesheet}
            onClose={() => setIsViewModalOpen(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}
