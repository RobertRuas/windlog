/**
 * ============================================================================
 * SIGNATURE PAD - Componente de Captura de Assinatura
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que permite ao usuário desenhar sua assinatura
 * num canvas (rato ou toque) e exportá-la como imagem PNG em base64.
 *
 * ONDE É USADO?
 * -------------
 * - Página de Perfil: o usuário configura a sua assinatura pessoal
 * - TimesheetFormEditor: o usuário aplica a sua assinatura no documento
 * - Qualquer outro documento que necessite de assinatura
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O usuário desenha no canvas com o rato ou dedo (touch)
 * 2. Ao salvar, o canvas é convertido paraDataURL (base64 PNG)
 * 3. O callback onSave é chamado com os dados da imagem
 * 4. Pode receber um valor existente (initialValue) para exibição
 * ============================================================================
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pen, Trash2, Check, X } from 'lucide-react';

/**
 * Props do componente SignaturePad.
 */
interface SignaturePadProps {
  /** Valor inicial (base64 PNG) para exibição */
  initialValue?: string | null;
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
 * Componente SignaturePad - Captura de assinatura com canvas.
 */
export function SignaturePad({
  initialValue,
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

  /**
   * Inicializa o canvas com a imagem existente (se houver).
   */
  useEffect(() => {
    if (initialValue) {
      setCurrentImage(initialValue);
    }
  }, [initialValue]);

  /**
   * Desenha a imagem existente no canvas quando o componente é montado
   * ou quando o initialValue muda.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se há uma imagem existente, desenha no canvas
    if (currentImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = currentImage;
    }
  }, [currentImage]);

  /**
   * Obtém as coordenadas do evento relativo ao canvas.
   * Suporta tanto mouse quanto touch.
   */
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

  /**
   * Inicia o desenho.
   */
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
  }, [readOnly, isSaving, getCoords]);

  /**
   * Desenha enquanto o rato/dedo se move.
   */
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly || isSaving) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, readOnly, isSaving, getCoords]);

  /**
   * Termina o desenho.
   */
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  /**
   * Limpa o canvas e reseta o estado.
   */
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setCurrentImage(null);
    onClear?.();
  }, [onClear]);

  /**
   * Salva a assinatura como base64 PNG.
   */
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setCurrentImage(dataUrl);
    onSave?.(dataUrl);
  }, [onSave]);

  /**
   * Cancela a edição atual.
   */
  const handleCancel = useCallback(() => {
    // Restaura a imagem inicial (se existia)
    if (initialValue) {
      setCurrentImage(initialValue);
    } else {
      handleClear();
    }
    onCancel?.();
  }, [initialValue, handleClear, onCancel]);

  // ── Modo de visualização (somente leitura) ──────────────────────
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
          className="max-h-[150px] w-auto object-contain"
        />
      </div>
    );
  }

  // ── Modo de edição ──────────────────────────────────────────────
  return (
    <div className="space-y-2">
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

        {/* Linha guia para assinatura */}
        <div
          className="absolute left-4 right-4 border-b border-dashed border-gray-200 pointer-events-none"
          style={{ bottom: `${height * 0.25}px` }}
        />

        {/* Ícone de caneta (decorativo) */}
        {!hasDrawn && !currentImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300">
            <Pen size={24} />
          </div>
        )}
      </div>

      {/* Botões de ação */}
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
            disabled={isSaving || !hasDrawn}
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
