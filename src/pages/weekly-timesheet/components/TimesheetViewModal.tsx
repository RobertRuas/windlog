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

  // ── Cálculo do zoom inverso (compensa o zoom da aplicação) ─────────
  const appZoom = parseFloat(document.documentElement.style.zoom) || 1;
  const inverseZoom = 1 / appZoom;

  // ── Renderização via portal (filho direto do body) ─────────────────
  return createPortal(
    <div
      className="ts-view-modal-root"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fff',
        zoom: inverseZoom,
      }}
    >
      {/* ── Header: ícones à esquerda, fechar à direita ────────────── */}
      <div className="ts-no-print flex items-center justify-between px-2 py-1.5 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Esquerda: zoom + PDF */}
        <div className="flex items-center">
          {/* Zoom controls (sem cantos arredondados) */}
          <div className="flex items-center border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={zoomOut}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title={t('detail.zoomOut')}
            >
              <Minus size={15} />
            </button>
            <span className="text-xs font-medium text-gray-600 w-10 text-center tabular-nums select-none">
              {zoomPercent}
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title={t('detail.zoomIn')}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title={t('detail.print')}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{t('detail.print')}</span>
          </button>
        </div>

        {/* Direita: apenas fechar */}
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={t('detail.close', { defaultValue: 'Fechar' })}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Corpo: planilha 100% horizontal + vertical ─────────────── */}
      <div
        className="ts-view-modal-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          background: '#fff',
          width: '100%',
        }}
      >
        <div className="ts-dashboard-container" style={{ maxWidth: 'none', margin: 0 }}>
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
