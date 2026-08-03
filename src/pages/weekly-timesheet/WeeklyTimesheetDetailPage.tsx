/**
 * ============================================================================
 * WEEKLY TIMESHEET DETAIL PAGE - Página de Visualização/Edição
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página principal do módulo de Weekly Timesheets para um timesheet específico.
 * Possui DUAS abas de visualização:
 *
 * 1. PLANILHA (Sheet): visualização fiel ao design original do Excel.
 *    - Apenas leitura (sem edição inline)
 *    - Zoom in/out, exportar Excel, imprimir/PDF
 *    - Ideal para visualizar o resultado final e imprimir
 *
 * 2. EDITOR (Form): formulário organizado no padrão da aplicação.
 *    - Inputs reais do React com estado controlado
 *    - Seções colapsáveis por dia
 *    - Tabela de entradas editáveis por dia
 *    - Botão "Salvar" envia tudo de uma vez
 *    - Ideal para editar dados de forma clara e organizada
 *
 * ESTRUTURA:
 * ----------
 * 1. AppLayout (sidebar + header)
 * 2. Header com botão voltar + tabs (Planilha / Editor)
 * 3. Conteúdo da tab selecionada
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Minus, Plus, TableProperties, PenLine, FileSpreadsheet, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/layout/AppLayout';
import { TimesheetSheet } from './components/TimesheetSheet';
import { TimesheetFormEditor } from './components/TimesheetFormEditor';
import { useTimesheetZoom } from './hooks/useTimesheetZoom';
import { useTimesheetMutations } from './hooks/useTimesheetMutations';
import {
  getTimesheetById,
  type UpdateTimesheetPayload,
} from '@/services/weekly-timesheet.service';

// Importa os estilos da planilha
import './styles/timesheet.css';

/**
 * Página WeeklyTimesheetDetailPage - Visualização e edição do timesheet.
 *
 * Duas abas:
 * - Planilha: visualização fiel ao Excel (read-only)
 * - Editor: formulário organizado para edição
 */
export function WeeklyTimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('timesheet');

  // ── Estado local ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'sheet' | 'editor'>('sheet');

  // ── Hook de zoom ────────────────────────────────────────────────────
  const { zoom, zoomIn, zoomOut, zoomPercent } = useTimesheetZoom();

  // ── Hook de mutations ──────────────────────────────────────────────
  const mutations = useTimesheetMutations(id);

  // ── Busca o timesheet pelo ID ───────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: ['timesheet', id],
    queryFn: () => getTimesheetById(id!),
    enabled: !!id,
    refetchOnMount: 'always', // Sempre busca dados frescos ao (re)montar o componente
  });

  // Extrai o timesheet da resposta da API
  const timesheet = response?.data;

  /**
   * Salva as alterações do formulário no backend.
   */
  const handleFormSave = useCallback(
    (payload: UpdateTimesheetPayload) => {
      if (!id) return;
      mutations.updateTimesheet.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success(t('form.changesSaved'));
          },
        },
      );
    },
    [id, mutations, t],
  );

  /**
   * Exporta o timesheet para Excel.
   */
  const handleExportExcel = useCallback(() => {
    if (timesheet) {
      import('./components/TimesheetExportExcel').then(({ exportToExcel }) => {
        exportToExcel(timesheet);
      });
    }
  }, [timesheet]);

  /**
   * Imprime o timesheet.
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
          <p className="text-gray-500 mb-4">Timesheet não encontrado</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {timesheet.project.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('sheet.week')} {timesheet.week} •{' '}
                {t('status.' + timesheet.status)} •{' '}
                {timesheet.creator.firstName} {timesheet.creator.lastName}
              </p>
            </div>

            {/* Status badge */}
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
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────── */}
          <div className="border-b border-gray-200 mt-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('sheet')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sheet'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TableProperties size={16} />
                {t('detail.tabSheet')}
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'editor'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <PenLine size={16} />
                {t('detail.tabEditor')}
              </button>
            </nav>
          </div>
        </div>

        {/* ── Conteúdo da Tab ───────────────────────────────────────── */}

        {/* Tab: Planilha (read-only) */}
        {activeTab === 'sheet' && (
          <div className="ts-dashboard-container">
            {/* Barra de ferramentas minimalista */}
            <div className="flex items-center justify-between mb-4 ts-no-print">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={zoomOut}
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"
                  title={t('detail.zoomOut')}
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs font-semibold text-gray-700 w-10 text-center">
                  {zoomPercent}
                </span>
                <button
                  onClick={zoomIn}
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"
                  title={t('detail.zoomIn')}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Ações discretas */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportExcel}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('detail.exportExcel')}
                >
                  <FileSpreadsheet size={16} />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('detail.print')}
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>

            {/* Planilha read-only */}
            <TimesheetSheet
              timesheet={timesheet}
              isEditMode={false}
              zoom={zoom}
              onMetadataChange={() => {}}
              onEntryChange={() => {}}
              onProgressChange={() => {}}
              onDateChange={() => {}}
              onSignatureChange={() => {}}
            />
          </div>
        )}

        {/* Tab: Editor (formulário) */}
        {activeTab === 'editor' && (
          <TimesheetFormEditor
            timesheet={timesheet}
            onSave={handleFormSave}
            isSaving={mutations.updateTimesheet.isPending}
          />
        )}
      </div>
    </AppLayout>
  );
}
