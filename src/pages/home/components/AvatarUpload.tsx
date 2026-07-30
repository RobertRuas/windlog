/**
 * ============================================================================
 * AVATAR UPLOAD - Upload de Foto de Perfil com Captura de Câmera
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Componente para upload de foto de perfil do usuário (estilo 3x4).
 * Suporta upload de ficheiro ou captura direta pela câmera.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Upload de imagem (JPEG, PNG, WebP) com validação de 3 MB
 * - Captura pela câmera do dispositivo (webcam)
 * - Pré-visualização da imagem selecionada
 * - Recorte/ajuste básico da imagem
 * - Envia para o servidor via upload service
 * - Atualiza o photoUrl do perfil
 * ============================================================================
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, X, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { uploadAvatar } from '@/services/upload.service';
import { SecureImage } from '@/components/ui/SecureImage';

/**
 * Props do componente AvatarUpload.
 */
interface AvatarUploadProps {
  /** URL atual da foto do usuário */
  currentPhotoUrl?: string | null;
  /** Callback chamado após upload bem-sucedido */
  onSuccess?: () => void;
  /** Se true, renderiza como avatar circular compacto (inline no header) */
  compact?: boolean;
}

/**
 * Componente AvatarUpload - Upload de foto de perfil com câmera.
 */
export function AvatarUpload({ currentPhotoUrl, onSuccess, compact = false }: AvatarUploadProps) {
  const { t } = useTranslation('home');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Abre o seletor de ficheiros.
   */
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * Processa o ficheiro selecionado.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida o tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('documents.fileUploadHint'));
      return;
    }

    // Valida o tamanho (3 MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error(t('profile.avatarHint'));
      return;
    }

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /**
   * Inicia a câmera do dispositivo.
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 640 },
        },
      });
      setCameraStream(stream);
      setShowCamera(true);
      setPreviewUrl(null);
      setPreviewFile(null);

      // Aguarda o vídeo estar pronto
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  /**
   * Captura uma foto da câmera.
   */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Define o tamanho do canvas (proporção 3x4)
    canvas.width = 480;
    canvas.height = 640;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Desenha o frame do vídeo no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converte o canvas para blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.9,
    );
  };

  /**
   * Para a câmera.
   */
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  /**
   * Cancela a pré-visualização.
   */
  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // No modo compacto, volta ao estado colapsado
    if (compact) {
      setIsExpanded(false);
      stopCamera();
    }
  };

  /**
   * Faz o upload da foto para o servidor.
   * Usa o novo sistema de upload (POST /api/v1/upload/avatars).
   */
  const handleUpload = async () => {
    if (!previewFile) return;

    setIsUploading(true);
    try {
      // Envia o ficheiro para o servidor (POST /api/v1/auth/avatar)
      // Este endpoint faz upload E atualiza o photoUrl no banco
      await uploadAvatar(previewFile);

      // Sucesso — notifica e chama callback
      toast.success(t('profile.avatarUpload') + ' — OK');
      handleCancelPreview();

      // Chama o callback de sucesso (para refetch do perfil)
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ===========================================================================
  // MODO COMPACTO - Avatar circular pequeno para header
  // ===========================================================================
  if (compact) {
    return (
      <>
        {/* Avatar circular clicável */}
        <button
          onClick={() => setIsExpanded(true)}
          className="relative group flex-shrink-0"
          title={t('profile.avatarUpload')}
        >
          {currentPhotoUrl ? (
            <SecureImage
              filePath={currentPhotoUrl}
              alt="Avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md ring-2 ring-blue-100">
              <Camera size={20} />
            </div>
          )}
          {/* Overlay de edição ao hover */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={16} className="text-white" />
          </div>
        </button>

        {/* Modal de upload */}
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCancelPreview}
            />
            {/* Conteúdo do modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header do modal */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.avatar')}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{t('profile.avatarHint')}</p>
                </div>
                <button
                  onClick={handleCancelPreview}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Corpo do modal */}
              <div className="px-6 py-6 flex justify-center">
                {renderFullUpload()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ===========================================================================
  // MODO NORMAL - Interface completa de upload (padrão)
  // ===========================================================================
  return renderFullUpload();

  // ===========================================================================
  // RENDER - Interface completa de upload
  // ===========================================================================
  function renderFullUpload() {
    return (
    <div className="flex flex-col items-center gap-4">
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Canvas oculto para captura de foto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Área de pré-visualização ou câmera */}
      <div className="relative">
        {showCamera ? (
          /* Câmera ativa */
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-32 h-42 object-cover rounded-xl border-2 border-blue-300"
              style={{ width: '128px', height: '168px' }}
            />
            <div className="flex gap-1 mt-2 justify-center">
              <Button size="sm" onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-1" />
                {t('actions.save')}
              </Button>
              <Button size="sm" variant="secondary" onClick={stopCamera}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : previewUrl ? (
          /* Pré-visualização da imagem selecionada */
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-42 object-cover rounded-xl border-2 border-blue-300"
              style={{ width: '128px', height: '168px' }}
            />
            <div className="flex gap-1 mt-2 justify-center">
              <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                {t('actions.save')}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancelPreview} disabled={isUploading}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Estado inicial - mostra foto atual ou placeholder */
          <div className="relative">
            {currentPhotoUrl ? (
              <SecureImage
                filePath={currentPhotoUrl}
                alt="Avatar"
                className="w-32 h-42 object-cover rounded-xl border-2 border-gray-200"
                width={128}
                height={168}
              />
            ) : (
              <div
                className="w-32 h-42 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400"
                style={{ width: '128px', height: '168px' }}
              >
                <Camera size={24} />
                <span className="text-xs mt-1">{t('profile.avatar')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botões de ação (apenas quando não está na câmera ou preview) */}
      {!showCamera && !previewUrl && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleFileSelect}>
            <Upload className="w-4 h-4 mr-1" />
            {t('profile.avatarUpload')}
          </Button>
          <Button size="sm" variant="secondary" onClick={startCamera}>
            <Camera className="w-4 h-4 mr-1" />
            {t('profile.avatarCamera')}
          </Button>
        </div>
      )}

      {/* Hint */}
      {!showCamera && !previewUrl && (
        <p className="text-xs text-gray-400 text-center">
          {t('profile.avatarHint')}
        </p>
      )}
    </div>
    );
  }
}
