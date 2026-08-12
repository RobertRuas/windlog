/**
 * ============================================================================
 * DOCUMENT PREVIEW MODAL - Modal de Visualização do Documento (Modo Impressão)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Modal em tela cheia que exibe o documento preenchido com o layout exato
 * do template HTML/SVG, pronto para imprimir/gerar PDF.
 *
 * PADRÃO (igual ao TimesheetViewModal):
 * -------------------------------------
 * - Renderiza o template SVG com dados injetados via portal no body
 * - Zoom in/out para visualizar no ecrã
 * - Botão Imprimir/PDF (chama window.print())
 * - Classe CSS no body isola a impressão (doc-print-view-open)
 * - Fecha com botão X ou tecla Escape
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Busca o HTML do template via API do backend
 * 2. Injeta os dados do formulário nas posições corretas (template-renderer)
 * 3. Renderiza o HTML preenchido num iframe para isolamento de estilos
 * 4. Print/PDF via window.print() com @media print
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Minus, Plus, Printer, Download } from 'lucide-react';

import { renderTemplate, loadTemplateHtml } from './template-renderer';
import type { GeneratedDocument } from '@/services/document.service';

/**
 * Props do componente.
 */
interface DocumentPreviewModalProps {
  /** Documento com dados do formulário */
  document: GeneratedDocument;
  /** Callback para fechar o modal */
  onClose: () => void;
}

/**
 * Modal de visualização do documento em modo de impressão.
 */
export function DocumentPreviewModal({ document: doc, onClose }: DocumentPreviewModalProps) {
  const { t } = useTranslation('documents');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(1);

  // ── Busca o HTML do template ─────────────────────────────────────────
  const { data: templateHtml, isLoading } = useQuery({
    queryKey: ['document-template-html', doc.templateId],
    queryFn: () => loadTemplateHtml(doc.templateId),
    enabled: !!doc.templateId,
  });

  // ── Renderiza o template com os dados do formulário ──────────────────
  const renderedHtml = templateHtml
    ? renderTemplate(doc.templateId, templateHtml, doc.formData || {})
    : '';

  // ── Ao montar: adiciona classe no body para isolar impressão ─────────
  useEffect(() => {
    window.document.body.classList.add('doc-print-view-open');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.document.body.classList.remove('doc-print-view-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // ── Imprime apenas o documento ───────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  }, []);

  // ── Download do HTML preenchido ──────────────────────────────────────
  const handleDownloadHtml = useCallback(() => {
    if (!renderedHtml) return;
    const blob = new Blob([renderedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${doc.version}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [renderedHtml, doc.title, doc.version]);

  // ── Zoom controls ────────────────────────────────────────────────────
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const zoomPercent = `${Math.round(zoom * 100)}%`;

  // ── Injeta o HTML renderizado no iframe ──────────────────────────────
  useEffect(() => {
    if (iframeRef.current && renderedHtml) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(renderedHtml);
        iframeDoc.close();
      }
    }
  }, [renderedHtml]);

  // ── Cálculo do zoom inverso (compensa o zoom da aplicação) ───────────
  const appZoom = parseFloat(window.document.documentElement.style.zoom) || 1;
  const inverseZoom = 1 / appZoom;

  // ── Renderização via portal (filho direto do body) ───────────────────
  return createPortal(
    <div
      className="doc-view-modal-root"
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
      {/* ── Header: zoom + ações à esquerda, fechar à direita ────────── */}
      <div className="doc-no-print flex items-center justify-between px-2 py-1.5 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Esquerda: zoom + PDF + download */}
        <div className="flex items-center">
          {/* Zoom controls */}
          <div className="flex items-center border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={zoomOut}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title={t('view.zoomOut', { defaultValue: 'Diminuir zoom' })}
            >
              <Minus size={15} />
            </button>
            <span className="text-xs font-medium text-gray-600 w-10 text-center tabular-nums select-none">
              {zoomPercent}
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title={t('view.zoomIn', { defaultValue: 'Aumentar zoom' })}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Imprimir / Gerar PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title={t('view.download', { defaultValue: 'Gerar PDF' })}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{t('view.download')}</span>
          </button>

          {/* Download HTML */}
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title={t('view.downloadHtml', { defaultValue: 'Descarregar HTML' })}
          >
            <Download size={15} />
            <span className="hidden sm:inline">{t('view.downloadHtml')}</span>
          </button>
        </div>

        {/* Direita: apenas fechar */}
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={t('view.close', { defaultValue: 'Fechar' })}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Corpo: documento renderizado em iframe ────────────────────── */}
      <div
        className="doc-view-modal-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          background: '#e5e5e5',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Document Preview"
            style={{
              width: '794px',
              height: '1123px',
              border: 'none',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          />
        )}
      </div>
    </div>,
    window.document.body,
  );
}
