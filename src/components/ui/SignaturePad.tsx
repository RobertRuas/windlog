/**
 * ============================================================================
 * SIGNATURE PAD - Componente de Captura de Assinatura
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que permite ao usuário criar sua assinatura de
 * três formas diferentes:
 *
 * 1. DESENHAR: desenhar no canvas com rato ou dedo (touch)
 * 2. CÂMARA:   tirar foto de uma assinatura em papel branco
 * 3. FICHEIRO: carregar uma imagem do dispositivo
 *
 * Após capturar por imagem (câmara ou ficheiro), o usuário pode RECORTAR
 * a área da assinatura para remover fundos e margens indesejadas.
 *
 * ONDE É USADO?
 * -------------
 * - Página de Perfil: o usuário configura a sua assinatura pessoal
 * - TimesheetFormEditor: o usuário aplica a sua assinatura no documento
 * - Qualquer outro documento que necessite de assinatura
 * ============================================================================
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pen, Trash2, Check, X, Camera, Crop, Lightbulb } from 'lucide-react';

/**
 * Modos de captura disponíveis.
 */
type CaptureMode = 'draw' | 'camera';

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
 * Componente SignaturePad - Captura de assinatura com canvas, câmara e recorte.
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
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(initialValue || null);

  // Estado para modo de captura
  const [captureMode, setCaptureMode] = useState<CaptureMode>('draw');

  // Estado para recorte de imagem
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [, setImgDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [showTips, setShowTips] = useState(false);

  // Estado para mostrar preview após salvar
  const [justSaved, setJustSaved] = useState(false);
  const [savedImage, setSavedImage] = useState<string | null>(null);

  /**
   * Inicializa o estado quando initialValue muda.
   */
  useEffect(() => {
    if (initialValue) {
      setCurrentImage(initialValue);
    }
  }, [initialValue]);

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

  /**
   * Desenha a imagem bruta no canvas de recorte e redesenha o overlay.
   */
  useEffect(() => {
    const cropCanvas = cropCanvasRef.current;
    if (!cropCanvas || !rawImage) return;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Ajusta o canvas para caber a imagem (max 600px largura, max 250px altura)
      const maxW = 600;
      const maxH = 250;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);

      cropCanvas.width = w;
      cropCanvas.height = h;
      setImgDims({ w, h });

      ctx.drawImage(img, 0, 0, w, h);

      // Inicializa o retângulo de recorte com 80% da imagem
      const initialRect = {
        x: Math.round(w * 0.1),
        y: Math.round(h * 0.1),
        w: Math.round(w * 0.8),
        h: Math.round(h * 0.8),
      };
      setCropRect(initialRect);
      drawCropOverlay(ctx, w, h, initialRect);
    };
    img.src = rawImage;
  }, [rawImage]);

  /**
   * Redesenha o overlay de recorte (escurece fora do retângulo).
   * Desenha diretamente no canvas — sem SVG.
   */
  const drawCropOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, rect: { x: number; y: number; w: number; h: number } | null) => {
      const cropCanvas = cropCanvasRef.current;
      if (!cropCanvas || !rawImage) return;

      // Redesenha a imagem original primeiro
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        if (rect && rect.w > 2 && rect.h > 2) {
          // Overlay escuro fora do retângulo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          // Topo
          ctx.fillRect(0, 0, canvasW, rect.y);
          // Esquerda
          ctx.fillRect(0, rect.y, rect.x, rect.h);
          // Direita
          ctx.fillRect(rect.x + rect.w, rect.y, canvasW - rect.x - rect.w, rect.h);
          // Base
          ctx.fillRect(0, rect.y + rect.h, canvasW, canvasH - rect.y - rect.h);

          // Borda do retângulo
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          ctx.setLineDash([]);
        }
      };
      img.src = rawImage;
    },
    [rawImage],
  );

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

  // ── Funções de captura por imagem ───────────────────────────────────

  const handleCameraClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setRawImage(dataUrl);
      setCaptureMode('camera');
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  }, []);

  // ── Funções de recorte ──────────────────────────────────────────────

  /**
   * Obtém coordenadas do rato ou toque relativas ao canvas de recorte.
   */
  const getCropCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const bRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bRect.width;
    const scaleY = canvas.height / bRect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: Math.round((touch.clientX - bRect.left) * scaleX),
        y: Math.round((touch.clientY - bRect.top) * scaleY),
      };
    }

    return {
      x: Math.round((e.clientX - bRect.left) * scaleX),
      y: Math.round((e.clientY - bRect.top) * scaleY),
    };
  }, []);

  const startCropDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const { x, y } = getCropCoords(e);
      setIsDragging(true);
      setDragStart({ x, y });
      setCropRect({ x, y, w: 0, h: 0 });
    },
    [getCropCoords],
  );

  const doCropDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !dragStart) return;
      e.preventDefault();

      const { x, y } = getCropCoords(e);
      const cropCanvas = cropCanvasRef.current;
      if (!cropCanvas) return;

      const newX = Math.max(0, Math.min(dragStart.x, x));
      const newY = Math.max(0, Math.min(dragStart.y, y));
      const newW = Math.min(Math.abs(x - dragStart.x), cropCanvas.width - newX);
      const newH = Math.min(Math.abs(y - dragStart.y), cropCanvas.height - newY);

      const newRect = { x: newX, y: newY, w: newW, h: newH };
      setCropRect(newRect);

      // Redesenha o overlay diretamente no canvas
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        drawCropOverlay(ctx, cropCanvas.width, cropCanvas.height, newRect);
      }
    },
    [isDragging, dragStart, getCropCoords, drawCropOverlay],
  );

  const stopCropDrag = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  /**
   * Aplica o recorte e gera a assinatura final.
   * Lê diretamente da imagem original (rawImage) para evitar incluir a borda azul.
   */
  const applyCrop = useCallback(() => {
    if (!rawImage || !cropRect || cropRect.w < 10 || cropRect.h < 10) return;

    const img = new Image();
    img.onload = () => {
      // Calcula o fator de escala entre a imagem original e o canvas de recorte
      const cropCanvas = cropCanvasRef.current;
      if (!cropCanvas) return;

      const scaleX = img.width / cropCanvas.width;
      const scaleY = img.height / cropCanvas.height;

      // Cria um canvas temporário com a área recortada (tamanho real)
      const realW = Math.round(cropRect.w * scaleX);
      const realH = Math.round(cropRect.h * scaleY);
      const realX = Math.round(cropRect.x * scaleX);
      const realY = Math.round(cropRect.y * scaleY);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = realW;
      tempCanvas.height = realH;

      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Extrai diretamente da imagem original — sem bordas
      tempCtx.drawImage(
        img,
        realX, realY, realW, realH,
        0, 0, realW, realH,
      );

      const dataUrl = tempCanvas.toDataURL('image/png');
      setCurrentImage(dataUrl);
      setRawImage(null);
      setCropRect(null);
    };
    img.src = rawImage;
  }, [cropRect, rawImage]);

  const cancelCrop = useCallback(() => {
    setRawImage(null);
    setCropRect(null);
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
    setRawImage(null);
    setCropRect(null);
    onClear?.();
  }, [onClear]);

  const handleSave = useCallback(() => {
    let dataUrl: string;

    // Se temos uma imagem do fluxo de câmera/recorte, usa diretamente
    if (currentImage) {
      dataUrl = currentImage;
    } else {
      // Caso contrário, lê do canvas de desenho
      const canvas = canvasRef.current;
      if (!canvas) return;
      dataUrl = canvas.toDataURL('image/png');
      setCurrentImage(dataUrl);
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
    setRawImage(null);
    setCropRect(null);
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

  // ── Modo de recorte (após captura por imagem) ───────────────────────
  if (rawImage) {
    return (
      <div className="space-y-3">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

        {/* Instruções de recorte */}
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
          <Crop size={14} />
          <span>{t('signature.cropInstruction')}</span>
        </div>

        {/* Canvas de recorte — o overlay é desenhado diretamente no canvas */}
        <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
          <canvas
            ref={cropCanvasRef}
            className="w-full cursor-crosshair touch-none block"
            onMouseDown={startCropDrag}
            onMouseMove={doCropDrag}
            onMouseUp={stopCropDrag}
            onMouseLeave={stopCropDrag}
            onTouchStart={startCropDrag}
            onTouchMove={doCropDrag}
            onTouchEnd={stopCropDrag}
          />
        </div>

        {/* Dimensões da seleção */}
        {cropRect && cropRect.w > 5 && cropRect.h > 5 && (
          <p className="text-xs text-gray-400 text-center">
            {cropRect.w} × {cropRect.h}px
          </p>
        )}

        {/* Botões de ação do recorte */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cancelCrop}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={12} />
            {t('signature.cancelCrop')}
          </button>
          <button
            type="button"
            onClick={applyCrop}
            disabled={!cropRect || cropRect.w < 10 || cropRect.h < 10}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={12} />
            {t('signature.applyCrop')}
          </button>
        </div>
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

  // ── Modo de edição principal ────────────────────────────────────────
  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Seletor de modo: Desenhar | Câmara */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setCaptureMode('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            captureMode === 'draw'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pen size={12} />
          {t('signature.drawMode')}
        </button>
        <button
          type="button"
          onClick={() => setCaptureMode('camera')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            captureMode === 'camera'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera size={12} />
          {t('signature.cameraMode')}
        </button>
      </div>

      {/* ── Modo: Desenhar ──────────────────────────────────────────── */}
      {captureMode === 'draw' && (
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
      )}

      {/* ── Modo: Câmara / Ficheiro ─────────────────────────────────── */}
      {captureMode === 'camera' && (
        <>
          {/* Dicas */}
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors w-full"
          >
            <Lightbulb size={12} />
            <span className="font-medium">{t('signature.tips')}</span>
          </button>

          {showTips && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 space-y-1.5 border border-gray-200">
              <p>{t('signature.tip1')}</p>
              <p>{t('signature.tip2')}</p>
              <p>{t('signature.tip3')}</p>
              <p>{t('signature.tip4')}</p>
            </div>
          )}

          {/* Área de captura */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={handleCameraClick}
          >
            <Camera size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium">{t('signature.clickToCapture')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('signature.supportsFormats')}</p>
          </div>

          {/* Input de ficheiro oculto (com captura por câmara em mobile) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {/* ── Preview da assinatura guardada ──────────────────────────── */}
      {currentImage && captureMode === 'draw' && (
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
