/**
 * ============================================================================
 * MY FEEDBACKS SECTION - Seção de Meus Feedbacks nas Configurações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a seção com os feedbacks enviados pelo usuário.
 * Mostra status, prioridade e notas do administrador.
 *
 * PROPS:
 * ------
 * - t: função de tradução
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Bug, Lightbulb, Palette, Zap, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getMyFeedbacks, type MyFeedback, type FeedbackStatus, type FeedbackCategory } from '@/services/feedback.service';

/**
 * Props do componente MyFeedbacksSection.
 */
interface MyFeedbacksSectionProps {
  t: (key: string) => string;
}

/**
 * Cores para cada status.
 */
const STATUS_COLORS: Record<FeedbackStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  TRIAGED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

/**
 * Ícones para cada categoria.
 */
const CATEGORY_ICONS: Record<FeedbackCategory, typeof Bug> = {
  BUG: Bug,
  UI_ISSUE: Palette,
  FEATURE: Lightbulb,
  INCONSISTENCY: AlertCircle,
  PERFORMANCE: Zap,
  OTHER: FileText,
};

/**
 * Componente MyFeedbacksSection - Seção de feedbacks nas configurações.
 */
export function MyFeedbacksSection({ t }: MyFeedbacksSectionProps) {
  // Query: busca os feedbacks do usuário
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['my-feedbacks'],
    queryFn: getMyFeedbacks,
    staleTime: 60000,
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">{t('sections.my_feedbacks')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Loading */}
        {isLoading && (
          <div className="px-5 py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto" />
            <p className="text-sm text-gray-500 mt-3">{t('loading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!feedbacks || feedbacks.length === 0) && (
          <div className="px-5 py-8 text-center">
            <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('my_feedbacks.empty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('my_feedbacks.empty_description')}</p>
          </div>
        )}

        {/* Lista de feedbacks */}
        {!isLoading && feedbacks && feedbacks.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {feedbacks.map((feedback) => (
              <FeedbackItem key={feedback.id} feedback={feedback} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de item de feedback individual.
 */
function FeedbackItem({ feedback, t }: { feedback: MyFeedback; t: (key: string) => string }) {
  const CategoryIcon = CATEGORY_ICONS[feedback.category];
  const isResolved = feedback.status === 'RESOLVED' || feedback.status === 'CLOSED';

  return (
    <div className="px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Ícone da categoria */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isResolved ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <CategoryIcon size={18} className={isResolved ? 'text-green-600' : 'text-gray-500'} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {feedback.title}
            </h3>
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[feedback.status]}`}>
              {t(`statuses.${feedback.status}`)}
            </span>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2">
            {feedback.description}
          </p>

          <div className="flex items-center gap-3 mt-2">
            {/* Data */}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {new Date(feedback.createdAt).toLocaleDateString('pt-BR')}
            </span>

            {/* Categoria */}
            <span className="text-xs text-gray-400">
              {t(`categories.${feedback.category}`)}
            </span>
          </div>

          {/* Notas do admin */}
          {feedback.adminNotes && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle size={10} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {t('my_feedbacks.admin_response')}
                </span>
              </div>
              <p className="text-xs text-blue-600">{feedback.adminNotes}</p>
            </div>
          )}

          {/* Resolvido em */}
          {feedback.resolvedAt && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={10} />
              <span>{t('my_feedbacks.resolved_at')} {new Date(feedback.resolvedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
