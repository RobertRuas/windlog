/**
 * ============================================================================
 * SIGNATURE PAD - Componente de Captura de Assinatura (Apenas Desenho)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que permite ao usuário criar sua assinatura
 * desenhando no canvas com rato ou dedo (touch).
 *
 * PERSISTÊNCIA:
 * ------------
 * - O backend guarda a assinatura como ficheiro e devolve o caminho.
 * - O prop `signatureFilePath` recebe esse caminho e usa o hook `useFileUrl`
 *   para obter uma URL temporária que permite carregar a imagem no canvas.
 * - Assim, ao reabrir a página, a assinatura já está visível.
 *
 * ONDE É USADO?
 * -------------
 * - Página de Perfil: o usuário configura a sua assinatura pessoal
 * - TimesheetFormEditor: o usuário aplica a sua assinatura no documento
 * ============================================================================
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pen, Trash2, Check, X } from 'lucide-react';
import { useFileUrl } from '@/hooks/useFileUrl';

/**
 * Props do componente SignaturePad.
 */
interface SignaturePadProps {
  /** Valor inicial (base64 PNG) para exibição imediata */
  initialValue?: string | null;
  /** Caminho do ficheiro da assinatura no servidor (para carregar via URL temporária) */
  signatureFilePath?: string | null;
  /** Callback ao salvar a assinatura */
  onSave?: (dataUrl: string) => void;
  /** Callback ao limpar a assinatura */
  onClear?: () => void;
  /** Callback ao cancelar */
  onCancel?: () => void;
  /** Se está em modo de visualização (sem edição) */
  readOnly?: boolean;
  /** Altura do canvas em pixels */
  height?: number;
  /** Se está salvando (desabilita botões) */
  isSaving?: boolean;
  /** Label exibido acima do pad */
  label?: string;
}

/**
 * Componente SignaturePad - Captura de assinatura por desenho.
 */
export function SignaturePad({
  initialValue,
  signatureFilePath,
  onSave,
  onClear,
  onCancel,
  readOnly = false,
  height = 150,
  isSaving = false,
  label,
}: SignaturePadProps) {
  const { t } = useTranslation('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(initialValue || null);

  // URL temporária do ficheiro da assinatura (para carregar imagem guardada)
  const { url: signatureUrl } = useFileUrl(signatureFilePath);

  // Estado para mostrar preview após salvar
  const [justSaved, setJustSaved] = useState(false);
  const [savedImage, setSavedImage] = useState<string | null>(null);

  /**
   * Inicializa o estado quando initialValue muda (ex: base64 direto).
   */
  useEffect(() => {
    if (initialValue) {
      setCurrentImage(initialValue);
    }
  }, [initialValue]);

  /**
   * Quando o backend devolve o caminho do ficheiro, a URL temporária
   * é resolvida pelo hook useFileUrl. Usamos essa URL para exibir a
   * assinatura guardada no canvas.
   */
  useEffect(() => {
    if (signatureUrl) {
      setCurrentImage(signatureUrl);
      setJustSaved(false);
      setSavedImage(null);
    }
  }, [signatureUrl]);

  /**
   * Desenha a imagem existente no canvas quando currentImage muda.
   * A imagem é escalada para caber no canvas mantendo a proporção.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentImage) {
      const img = new Image();
      img.onload = () => {
        // Escala a imagem para caber no canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      };
      img.src = currentImage;
    }
  }, [currentImage]);

  // ── Funções de desenho no canvas ────────────────────────────────────

  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (readOnly || isSaving) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoords(e);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1a1a1a';

      setIsDrawing(true);
      setHasDrawn(true);
      // Limpa currentImage para que handleSave() leia do canvas
      setCurrentImage(null);
    },
    [readOnly, isSaving, getCoords],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || readOnly || isSaving) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, readOnly, isSaving, getCoords],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // ── Funções gerais ──────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setCurrentImage(null);
    setJustSaved(false);
    setSavedImage(null);
    onClear?.();
  }, [onClear]);

  /**
   * Guarda a assinatura: lê do canvas (desenho) ou da imagem atual.
   * Chama onSave com o data URL em base64 PNG.
   */
  const handleSave = useCallback(() => {
    let dataUrl: string;

    if (currentImage && currentImage.startsWith('data:image/')) {
      // Já é um data URL (ex: resultado de desenho anterior)
      dataUrl = currentImage;
    } else {
      // Lê diretamente do canvas de desenho
      const canvas = canvasRef.current;
      if (!canvas) return;
      dataUrl = canvas.toDataURL('image/png');
    }

    // Mostra o preview da assinatura salva
    setSavedImage(dataUrl);
    setJustSaved(true);
    onSave?.(dataUrl);
  }, [onSave, currentImage]);

  const handleCancel = useCallback(() => {
    if (initialValue) {
      setCurrentImage(initialValue);
    } else {
      handleClear();
    }
    setJustSaved(false);
    setSavedImage(null);
    onCancel?.();
  }, [initialValue, handleClear, onCancel]);

  // ── Modo de visualização (somente leitura) ──────────────────────────
  if (readOnly) {
    if (!currentImage) {
      return (
        <div
          className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm"
          style={{ height }}
        >
          {t('signature.noSignature')}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <img
          src={currentImage}
          alt="Signature"
          className="w-auto object-contain"
          style={{ maxHeight: '120px', mixBlendMode: 'multiply' }}
        />
      </div>
    );
  }

  // ── Modo: Preview após salvar ─────────────────────────────────────
  if (justSaved && savedImage) {
    return (
      <div className="space-y-3">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

        {/* Preview da assinatura salva */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Check size={14} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">{t('signature.savedSuccessfully')}</span>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <img
              src={savedImage}
              alt="Saved signature"
              className="w-auto object-contain"
              style={{ maxHeight: '100px', mixBlendMode: 'multiply' }}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setJustSaved(false);
              setSavedImage(null);
              setHasDrawn(false);
              setCurrentImage(null);
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Pen size={12} />
            {t('signature.redoSignature')}
          </button>
        </div>
      </div>
    );
  }

  // ── Modo de edição (desenho) ────────────────────────────────────────
  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Canvas de desenho */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className="w-full cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Linha guia */}
        <div
          className="absolute left-4 right-4 border-b border-dashed border-gray-200 pointer-events-none"
          style={{ bottom: `${height * 0.25}px` }}
        />

        {/* Ícone decorativo */}
        {!hasDrawn && !currentImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300">
            <Pen size={24} />
          </div>
        )}
      </div>

      {/* ── Preview da assinatura guardada ──────────────────────────── */}
      {currentImage && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-400 mb-1">{t('signature.currentPreview')}</p>
          <img
            src={currentImage}
            alt="Current signature"
            className="w-auto object-contain"
            style={{ maxHeight: '80px' }}
          />
        </div>
      )}

      {/* ── Botões de ação ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={isSaving || (!hasDrawn && !currentImage)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} />
          {t('signature.clear')}
        </button>

        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!hasDrawn && !currentImage)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={12} />
            {t('signature.apply')}
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            <X size={12} />
            {t('signature.cancelEdit')}
          </button>
        )}
      </div>
    </div>
  );
}
