/**
 * ============================================================================
 * FEEDBACK MODAL - Modal de Submissão de Feedback (Design Minimalista)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal para o usuário reportar feedback (bugs, sugestões, etc.).
 * Design minimalista e amigável para tornar o processo simples e agradável.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Formulário simples: categoria + título + descrição
 * - Upload de imagem (drag & drop ou clique)
 * - Coleta automática de logs do sistema (erros recentes)
 * - Contexto técnico coletado automaticamente
 * - Design limpo e minimalista
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  Send,
  Loader2,
  Bug,
  Palette,
  Lightbulb,
  AlertTriangle,
  Zap,
  FileText,
  Paperclip,
} from 'lucide-react';

import { createFeedback, type FeedbackCategory } from '@/services/feedback.service';
import { getLogs, type SystemLog } from '@/services/system-log.service';
import { api } from '@/services/api';
import {
  collectTechnicalContext,
  type TechnicalContext,
} from '@/utils/technicalContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Categorias com ícones minimalistas.
 */
const CATEGORIES: { value: FeedbackCategory; icon: typeof Bug; labelKey: string }[] = [
  { value: 'BUG', icon: Bug, labelKey: 'modal_categories.bug' },
  { value: 'UI_ISSUE', icon: Palette, labelKey: 'modal_categories.visual' },
  { value: 'FEATURE', icon: Lightbulb, labelKey: 'modal_categories.idea' },
  { value: 'INCONSISTENCY', icon: AlertTriangle, labelKey: 'modal_categories.error' },
  { value: 'PERFORMANCE', icon: Zap, labelKey: 'modal_categories.slow' },
  { value: 'OTHER', icon: FileText, labelKey: 'modal_categories.other' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation('feedback');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('BUG');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [technicalContext, setTechnicalContext] = useState<TechnicalContext | null>(null);
  const [errors, setErrors] = useState<{ title?: string; description?: string; file?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca logs recentes do sistema automaticamente (não visível para o usuário)
  const { data: recentLogs } = useQuery({
    queryKey: ['recent-system-logs'],
    queryFn: () => getLogs({ limit: 10, severity: 'ERROR' }),
    enabled: isOpen,
    staleTime: 30000, // 30 segundos
  });

  useEffect(() => {
    if (isOpen) {
      setTechnicalContext(collectTechnicalContext());
    }
  }, [isOpen]);

  function handleClose() {
    setTitle('');
    setDescription('');
    setCategory('BUG');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrors({});
    onClose();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, file: t('fields.screenshot_error_type') });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors({ ...errors, file: t('fields.screenshot_error_size') });
      return;
    }

    setErrors({ ...errors, file: undefined });
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadScreenshot(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, `feedback-${Date.now()}.png`);

    const response = await api.post<{
      data: { filePath: string };
      message: string;
      statusCode: number;
      timestamp: string;
    }>(
      '/api/v1/upload/feedbacks',
      formData,
      { isFormData: true },
    );
    // Extrair o filePath do envelope de resposta do backend
    return response.data.filePath;
  }

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
      recentSystemLogs?: SystemLog[];
    }) => createFeedback(data),
    onSuccess: () => {
      toast.success(t('toast.create_success'));
      handleClose();
    },
    onError: () => {
      toast.error(t('toast.create_error'));
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) newErrors.title = t('fields.title_required');
    if (!description.trim()) newErrors.description = t('fields.description_required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsUploading(true);

    let finalScreenshotPath: string | undefined;
    if (screenshotFile) {
      try {
        finalScreenshotPath = await uploadScreenshot(screenshotFile);
      } catch {
        console.warn('Screenshot upload failed');
      }
    }

    setIsUploading(false);

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      screenshotPath: finalScreenshotPath,
      pageUrl: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      technicalContext: technicalContext || undefined,
      recentSystemLogs: recentLogs?.data || undefined,
    });
  }

  if (!isOpen) return null;

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const SelectedIcon = selectedCategory?.icon || Bug;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header minimalista */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Send className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('modal_title')}</h2>
                <p className="text-xs text-gray-500">{t('modal_description')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
            {/* Categoria - Pills minimalistas */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `.trim()}
                  >
                    <Icon size={12} />
                    <span>{t(cat.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Título */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: undefined }); }}
                placeholder={t('fields.title_placeholder')}
                className={`
                  w-full px-0 py-2 text-base font-medium bg-transparent border-0 border-b-2
                  focus:outline-none transition-colors
                  ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'}
                `.trim()}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Descrição */}
            <div>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors({ ...errors, description: undefined }); }}
                placeholder={t('fields.description_placeholder')}
                rows={3}
                className={`
                  w-full px-0 py-2 text-sm bg-transparent border-0 border-b-2 resize-none
                  focus:outline-none transition-colors
                  ${errors.description ? 'border-red-300' : 'border-gray-200 focus:border-gray-900'}
                `.trim()}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Upload de imagem - Minimalista */}
            <div>
              {screenshotPreview ? (
                <div className="relative group rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/50 to-transparent">
                    <p className="text-xs text-white/90 truncate">
                      {screenshotFile?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                >
                  <Paperclip size={16} />
                  <span>{t('fields.screenshot')}</span>
                  <span className="text-xs text-gray-400">({t('fields.screenshot_optional').toLowerCase()})</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createMutation.isPending || isUploading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createMutation.isPending || isUploading) ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isUploading ? t('technical.uploading') : t('actions.submitting')}</span>
                </>
              ) : (
                <>
                  <SelectedIcon size={16} />
                  <span>{t('actions.submit')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
