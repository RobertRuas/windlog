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
import { X, Minus, Plus, Printer } from 'lucide-react';

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
   * Imprime apenas a planilha (regras @media print isolam o modal).
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Renderização via portal (filho direto do body) ─────────────────
  return createPortal(
    <div className="ts-view-modal-root fixed inset-0 z-50 bg-gray-900/80 flex flex-col">
      {/* ── Header minimalista ──────────────────────────────────────── */}
      <div className="ts-no-print flex items-center justify-between px-3 sm:px-5 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={zoomOut}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"
            title={t('detail.zoomOut')}
          >
            <Minus size={14} />
          </button>
          <span className="text-xs font-medium text-gray-600 w-9 text-center tabular-nums">
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

        {/* Ações: PDF + Fechar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title={t('detail.print')}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{t('detail.print')}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('detail.close', { defaultValue: 'Fechar' })}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Corpo: planilha ocupa 100% da tela ─────────────────────── */}
      <div className="ts-view-modal-body flex-1 overflow-auto bg-white">
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
