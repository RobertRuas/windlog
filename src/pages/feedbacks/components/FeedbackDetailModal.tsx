/**
 * ============================================================================
 * FEEDBACK DETAIL MODAL - Modal de Detalhes do Feedback
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal que exibe todos os detalhes de um feedback, incluindo informações
 * técnicas (browser, OS, tela, conexão), console logs e logs do sistema.
 * Permite ao ADMIN alterar status, prioridade e notas administrativas.
 *
 * COMPONENTES INTERNOS:
 * ---------------------
 * - ScreenshotViewer: visualizador de screenshot anexado ao feedback
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  AlertCircle,
  FileText,
  Terminal,
  Cpu,
  Globe,
  Wifi,
  Monitor,
} from 'lucide-react';

import {
  updateFeedback,
  type Feedback,
  type FeedbackStatus,
  type FeedbackPriority,
  type ConsoleLog,
} from '@/services/feedback.service';
import type { SystemLog } from '@/services/system-log.service';
import { useFileUrl } from '@/hooks/useFileUrl';

/**
 * Componente para visualizar o screenshot anexado ao feedback.
 */
function ScreenshotViewer({ screenshotPath }: { screenshotPath: string }) {
  const { url, isLoading } = useFileUrl(screenshotPath);
  const { t } = useTranslation('feedback');

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
        {t('fields.screenshot_unavailable')}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{t('fields.screenshot')}</span>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <FileText size={12} />
          {t('buttons.download', { ns: 'common' })}
        </a>
      </div>
      <div className="p-2 bg-gray-100">
        <img
          src={url}
          alt="Screenshot"
          className="max-w-full max-h-64 mx-auto rounded"
        />
      </div>
    </div>
  );
}

/**
 * Props do modal de detalhes do feedback.
 */
interface FeedbackDetailModalProps {
  feedback: Feedback;
  onClose: () => void;
}

/**
 * Modal de detalhes do feedback com edição de status/prioridade/notas (ADMIN).
 */
export function FeedbackDetailModal({ feedback, onClose }: FeedbackDetailModalProps) {
  const { t } = useTranslation('feedback');
  const queryClient = useQueryClient();

  const [editStatus, setEditStatus] = useState<FeedbackStatus>(feedback.status);
  const [editPriority, setEditPriority] = useState<FeedbackPriority>(feedback.priority);
  const [editNotes, setEditNotes] = useState(feedback.adminNotes || '');

  // Mutation: atualizar feedback
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: FeedbackStatus; priority?: FeedbackPriority; adminNotes?: string } }) =>
      updateFeedback(id, data),
    onSuccess: () => {
      toast.success(t('toast.update_success'));
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      onClose();
    },
    onError: () => {
      toast.error(t('toast.update_error'));
    },
  });

  function handleSaveEdit() {
    updateMutation.mutate({
      id: feedback.id,
      data: {
        status: editStatus,
        priority: editPriority,
        adminNotes: editNotes || undefined,
      },
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('actions.view')}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Info do feedback */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">{feedback.title}</h3>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{feedback.description}</p>
            </div>

            {/* Screenshot */}
            {feedback.screenshotPath && (
              <ScreenshotViewer screenshotPath={feedback.screenshotPath} />
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">{t('fields.category')}</p>
                <p className="text-sm font-medium text-gray-700">{t(`categories.${feedback.category}`)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('list.reported_by')}</p>
                <p className="text-sm font-medium text-gray-700">
                  {feedback.reporter.firstName} {feedback.reporter.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('list.page_context')}</p>
                <p className="text-sm text-gray-700 truncate">{feedback.pageUrl || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('list.reported_at')}</p>
                <p className="text-sm text-gray-700">{new Date(feedback.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              {feedback.screenResolution && (
                <div>
                  <p className="text-xs text-gray-500">{t('list.screen_info')}</p>
                  <p className="text-sm text-gray-700">{feedback.screenResolution}</p>
                </div>
              )}
            </div>

            {/* ── Informações Técnicas Detalhadas ─────────────────────────── */}
            {feedback.technicalContext && (
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Cpu size={14} />
                  {t('detail.technical_title')}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* Browser e OS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe size={10} /> {t('detail.browser')}
                      </p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.browser.name} {feedback.technicalContext.browser.version}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('detail.os')}</p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.system.os}
                        {feedback.technicalContext.system.memory && ` · ${feedback.technicalContext.system.memory}GB RAM`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('detail.language')}</p>
                      <p className="text-sm text-gray-700">{feedback.technicalContext.browser.language}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('detail.cpu_cores')}</p>
                      <p className="text-sm text-gray-700">{feedback.technicalContext.system.cores}</p>
                    </div>
                  </div>

                  {/* Tela e Viewport */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Monitor size={10} /> {t('detail.screen')}
                      </p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.screen.width}x{feedback.technicalContext.screen.height}
                        {' '}({feedback.technicalContext.screen.colorDepth}bit)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('detail.viewport')}</p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.viewport.width}x{feedback.technicalContext.viewport.height}
                        {' '}@ {feedback.technicalContext.screen.pixelRatio}x
                      </p>
                    </div>
                  </div>

                  {/* Conexão */}
                  {feedback.technicalContext.connection.effectiveType && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Wifi size={10} /> {t('detail.connection')}
                      </p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.connection.effectiveType.toUpperCase()}
                        {feedback.technicalContext.connection.downlink && ` · ${feedback.technicalContext.connection.downlink} Mbps`}
                        {feedback.technicalContext.connection.rtt && ` · ${feedback.technicalContext.connection.rtt}ms RTT`}
                      </p>
                    </div>
                  )}

                  {/* Performance */}
                  {feedback.technicalContext.performance.memoryUsed && (
                    <div>
                      <p className="text-xs text-gray-500">{t('detail.memory_usage')}</p>
                      <p className="text-sm text-gray-700">
                        {feedback.technicalContext.performance.memoryUsed}MB / {feedback.technicalContext.performance.memoryLimit}MB
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('detail.browser_features')}</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(feedback.technicalContext.features).map(([key, value]) => (
                        <span
                          key={key}
                          className={`text-xs px-2 py-0.5 rounded ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {key}: {value ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Console Logs ────────────────────────────────────────────── */}
            {feedback.consoleLogs && feedback.consoleLogs.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Terminal size={14} />
                  {t('detail.console_logs')} ({feedback.consoleLogs.length})
                </h4>
                <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {feedback.consoleLogs.map((log: ConsoleLog, i: number) => (
                    <div key={i} className="text-xs font-mono mb-1">
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>{' '}
                      <span className={
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-blue-400' : 'text-gray-400'
                      }>
                        [{log.level.toUpperCase()}]
                      </span>{' '}
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recent System Logs ──────────────────────────────────────────── */}
            {feedback.recentSystemLogs && feedback.recentSystemLogs.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <FileText size={14} />
                  {t('detail.recent_errors')} ({feedback.recentSystemLogs.length})
                </h4>
                <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {feedback.recentSystemLogs.map((log: SystemLog, i: number) => (
                    <div key={i} className="text-xs font-mono mb-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-gray-500">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-red-400">[{log.severity}]</span>
                        {log.entity && (
                          <span className="text-blue-400 text-[10px]">{log.entity}</span>
                        )}
                      </div>
                      <div className="text-gray-300 ml-2">{log.message}</div>
                      {log.details && (
                        <div className="text-gray-500 ml-2 mt-0.5 whitespace-pre-wrap text-[10px]">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edição: Status e Prioridade */}
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('actions.change_status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FeedbackStatus)}
                    className="form-select w-full"
                  >
                    {(['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as FeedbackStatus[]).map((s) => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('actions.change_priority')}</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as FeedbackPriority)}
                    className="form-select w-full"
                  >
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as FeedbackPriority[]).map((p) => (
                      <option key={p} value={p}>{t(`priorities.${p}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas do admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('fields.admin_notes')}</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={t('fields.admin_notes_placeholder')}
                  rows={3}
                  className="form-textarea w-full resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('buttons.cancel', { ns: 'common' })}
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? t('actions.submitting') : t('actions.update')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
