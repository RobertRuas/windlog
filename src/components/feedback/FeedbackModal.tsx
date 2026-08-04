/**
 * ============================================================================
 * FEEDBACK MODAL - Modal de Submissão de Feedback (Versão Melhorada)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal para o usuário reportar feedback (bugs, sugestões, etc.).
 * Inclui captura REAL de screenshot usando html2canvas e captura de erros
 * do console do navegador para debugging.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Formulário simples: título + descrição + categoria
 * - Captura REAL de screenshot (viewport ou página inteira) via html2canvas
 * - Captura automática de erros/warnings do console
 * - Coleta de contexto técnico completo (browser, OS, conexão, performance)
 * - Upload do screenshot para o servidor
 * - Feedback visual de sucesso/erro
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import {
  X,
  MessageSquare,
  Camera,
  Monitor,
  Trash2,
  Send,
  Loader2,
  Terminal,
  Info,
} from 'lucide-react';

import { createFeedback, type FeedbackCategory } from '@/services/feedback.service';
import { api } from '@/services/api';
import {
  startConsoleCapture,
  stopConsoleCapture,
  getCapturedLogs,
  clearCapturedLogs,
  type CapturedLog,
} from '@/utils/consoleCapture';
import {
  collectTechnicalContext,
  type TechnicalContext,
} from '@/utils/technicalContext';

/**
 * Props do FeedbackModal.
 */
interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Categorias disponíveis.
 */
const CATEGORIES: { value: FeedbackCategory; icon: string }[] = [
  { value: 'BUG', icon: '🐛' },
  { value: 'UI_ISSUE', icon: '🎨' },
  { value: 'FEATURE', icon: '💡' },
  { value: 'INCONSISTENCY', icon: '⚠️' },
  { value: 'PERFORMANCE', icon: '⚡' },
  { value: 'OTHER', icon: '📝' },
];

/**
 * Componente FeedbackModal - Modal de submissão de feedback.
 */
export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation('feedback');

  // Estado do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('BUG');

  // Estado do screenshot
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Estado dos logs do console
  const [consoleLogs, setConsoleLogs] = useState<CapturedLog[]>([]);
  const [showConsoleLogs, setShowConsoleLogs] = useState(false);

  // Estado do contexto técnico
  const [technicalContext, setTechnicalContext] = useState<TechnicalContext | null>(null);

  // Estado de erro
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  /**
   * Inicia captura do console quando o modal abre.
   */
  useEffect(() => {
    if (isOpen) {
      clearCapturedLogs();
      startConsoleCapture();
      setTechnicalContext(collectTechnicalContext());
    } else {
      stopConsoleCapture();
    }

    return () => {
      stopConsoleCapture();
    };
  }, [isOpen]);

  /**
   * Reset do formulário ao fechar.
   */
  function handleClose() {
    setTitle('');
    setDescription('');
    setCategory('BUG');
    setScreenshotDataUrl(null);
    setConsoleLogs([]);
    setShowConsoleLogs(false);
    setErrors({});
    stopConsoleCapture();
    onClose();
  }

  /**
   * Captura screenshot REAL da viewport usando html2canvas.
   */
  async function captureVisibleScreen() {
    setIsCapturing(true);
    try {
      // Fecha o modal temporariamente para capturar a página
      const modal = document.querySelector('[data-feedback-modal]');
      if (modal) (modal as HTMLElement).style.display = 'none';

      // Aguarda um tick para o DOM atualizar
      await new Promise((r) => setTimeout(r, 100));

      // Captura o documento inteiro
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restaura o modal
      if (modal) (modal as HTMLElement).style.display = '';

      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotDataUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao capturar screenshot:', err);
      toast.error('Não foi possível capturar a tela');
    } finally {
      setIsCapturing(false);
    }
  }

  /**
   * Captura screenshot da página inteira (scroll completo).
   */
  async function captureFullPage() {
    setIsCapturing(true);
    try {
      const modal = document.querySelector('[data-feedback-modal]');
      if (modal) (modal as HTMLElement).style.display = 'none';

      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        backgroundColor: '#ffffff',
        height: document.documentElement.scrollHeight,
        windowHeight: document.documentElement.scrollHeight,
      });

      if (modal) (modal as HTMLElement).style.display = '';

      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotDataUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao capturar screenshot:', err);
      toast.error('Não foi possível capturar a tela');
    } finally {
      setIsCapturing(false);
    }
  }

  /**
   * Upload do screenshot para o servidor.
   */
  async function uploadScreenshot(dataUrl: string): Promise<string> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('file', blob, `screenshot-${Date.now()}.png`);

    const result = await api.post<{ filePath: string }>(
      '/api/v1/upload/feedbacks',
      formData,
      { isFormData: true },
    );

    return result.filePath;
  }

  /**
   * Mutation para criar o feedback.
   */
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: FeedbackCategory;
      screenshotPath?: string;
      pageUrl: string;
      userAgent: string;
      screenResolution: string;
      technicalContext?: TechnicalContext;
      consoleLogs?: CapturedLog[];
    }) => {
      return createFeedback(data);
    },
    onSuccess: () => {
      toast.success(t('toast.create_success'));
      handleClose();
    },
    onError: () => {
      toast.error(t('toast.create_error'));
    },
  });

  /**
   * Submete o formulário de feedback.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validação
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) newErrors.title = t('fields.title_required');
    if (!description.trim()) newErrors.description = t('fields.description_required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Para a captura do console e pega os logs
    stopConsoleCapture();
    const logs = getCapturedLogs();
    setConsoleLogs(logs);

    // Upload do screenshot se existir
    let finalScreenshotPath: string | undefined;
    if (screenshotDataUrl) {
      try {
        finalScreenshotPath = await uploadScreenshot(screenshotDataUrl);
      } catch {
        console.warn('Screenshot upload failed, continuing without it');
      }
    }

    // Cria o feedback com contexto técnico completo
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      screenshotPath: finalScreenshotPath || undefined,
      pageUrl: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      technicalContext: technicalContext || undefined,
      consoleLogs: logs.length > 0 ? logs : undefined,
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-feedback-modal
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-blue-600" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('modal_title')}</h2>
                <p className="text-xs text-gray-500">{t('modal_description')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fields.category')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                      border transition-colors
                      ${category === cat.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }
                    `.trim()}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{t(`categories.${cat.value}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fields.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('fields.title_placeholder')}
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `.trim()}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fields.description')} *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('fields.description_placeholder')}
                rows={4}
                className={`
                  w-full px-3 py-2.5 rounded-lg border text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `.trim()}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fields.screenshot')}
              </label>
              <p className="text-xs text-gray-500 mb-3">{t('fields.screenshot_optional')}</p>

              {screenshotDataUrl ? (
                <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                  <img
                    src={screenshotDataUrl}
                    alt={t('screenshot.preview')}
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotDataUrl(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureVisibleScreen}
                    disabled={isCapturing}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Monitor size={16} />
                    {t('screenshot.capture_visible')}
                  </button>
                  <button
                    type="button"
                    onClick={captureFullPage}
                    disabled={isCapturing}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Camera size={16} />
                    {t('screenshot.capture_full')}
                  </button>
                </div>
              )}

              {isCapturing && (
                <p className="mt-2 text-xs text-blue-500 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  {t('screenshot.capturing')}
                </p>
              )}
            </div>

            {/* Console Logs (se houver) */}
            {consoleLogs.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3">
                <button
                  type="button"
                  onClick={() => setShowConsoleLogs(!showConsoleLogs)}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors w-full"
                >
                  <Terminal size={14} />
                  <span>{consoleLogs.length} console log(s) captured</span>
                  <Info size={12} className="ml-auto" />
                </button>
                {showConsoleLogs && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {consoleLogs.map((log, i) => (
                      <div key={i} className="text-xs font-mono text-gray-400 truncate">
                        <span className={
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warn' ? 'text-yellow-400' : 'text-gray-400'
                        }>
                          [{log.level.toUpperCase()}]
                        </span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contexto técnico */}
            {technicalContext && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Info size={12} />
                  {t('list.page_context')}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {technicalContext.browser.name} {technicalContext.browser.version} · {technicalContext.system.os}
                </p>
                <p className="text-xs text-gray-400">
                  {technicalContext.viewport.width}x{technicalContext.viewport.height} · {technicalContext.screen.pixelRatio}x pixel ratio
                </p>
                {technicalContext.connection.effectiveType && (
                  <p className="text-xs text-gray-400">
                    Connection: {technicalContext.connection.effectiveType}
                    {technicalContext.connection.downlink && ` · ${technicalContext.connection.downlink} Mbps`}
                  </p>
                )}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('buttons.cancel', { ns: 'common' })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('actions.submitting')}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t('actions.submit')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
