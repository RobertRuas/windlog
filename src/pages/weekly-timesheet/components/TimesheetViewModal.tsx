/**
 * ============================================================================
 * TIMESHEET VIEW MODAL - Modal de Visualização (Modo de Impressão)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Modal em tela cheia que exibe a planilha preenchida em modo de impressão
 * (visualização fiel ao Excel, pronta para imprimir/exportar PDF).
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Renderiza a planilha read-only dentro de um modal (portal no body)
 * - Zoom in/out para visualizar no ecrã
 * - Exportar para Excel
 * - Imprimir / gerar PDF (apenas a planilha é impressa, via classe no body)
 * - Fecha com botão X ou tecla Escape
 *
 * LAYOUT (padrão de modais da aplicação):
 * ---------------------------------------
 * Header fixo + toolbar fixa + corpo com scroll.
 * ============================================================================
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, FileSpreadsheet, Printer } from 'lucide-react';

import { TimesheetSheet } from './TimesheetSheet';
import { useTimesheetZoom } from '../hooks/useTimesheetZoom';
import type { WeeklyTimesheet } from '@/services/weekly-timesheet.service';

/**
 * Props do componente.
 */
interface TimesheetViewModalProps {
  /** Dados completos do timesheet */
  timesheet: WeeklyTimesheet;
  /** Callback para fechar o modal */
  onClose: () => void;
}

/**
 * Modal de visualização da planilha em modo de impressão.
 */
export function TimesheetViewModal({ timesheet, onClose }: TimesheetViewModalProps) {
  const { t } = useTranslation('timesheet');

  // ── Zoom da planilha ────────────────────────────────────────────────
  const { zoom, zoomIn, zoomOut, zoomPercent } = useTimesheetZoom();

  /**
   * Ao montar: adiciona classe no body (isola a impressão da planilha)
   * e registra a tecla Escape para fechar o modal.
   */
  useEffect(() => {
    document.body.classList.add('ts-print-view-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('ts-print-view-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  /**
   * Exporta o timesheet para Excel.
   */
  const handleExportExcel = useCallback(() => {
    import('./TimesheetExportExcel').then(({ exportToExcel }) => {
      exportToExcel(timesheet);
    });
  }, [timesheet]);

  /**
   * Imprime apenas a planilha (regras @media print isolam o modal).
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Renderização via portal (filho direto do body) ─────────────────
  return createPortal(
    <div className="ts-view-modal-root fixed inset-0 z-50 bg-gray-900/80 flex flex-col">
      {/* ── Header fixo ─────────────────────────────────────────────── */}
      <div className="ts-no-print flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {t('detail.viewTitle')}
          </h2>
          <p className="text-xs text-gray-500">
            {timesheet.project.name} • {t('sheet.week')} {timesheet.week}
          </p>
        </div>

        {/* Toolbar: zoom + exportar + imprimir */}
        <div className="flex items-center gap-3">
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

          {/* Exportar Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('detail.exportExcel')}
          >
            <FileSpreadsheet size={16} />
            {t('detail.exportExcel')}
          </button>

          {/* Imprimir / PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Printer size={16} />
            {t('detail.print')}
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('detail.close', { defaultValue: 'Fechar' })}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Corpo com scroll (fundo cinza simula pré-visualização) ──── */}
      <div className="ts-view-modal-body flex-1 overflow-auto bg-gray-500/40 p-8">
        <div className="ts-dashboard-container">
          {/* Planilha read-only em modo de impressão */}
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
      </div>
    </div>,
    document.body,
  );
}
