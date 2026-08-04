/**
 * ============================================================================
 * FEEDBACK BUTTON - Botão Flutuante de Feedback
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Botão flutuante fixo no canto inferior direito, presente em TODAS
 * as páginas autenticadas. Permite ao usuário abrir o modal de feedback
 * rapidamente para reportar bugs, sugestões, etc.
 *
 * COMPORTAMENTO:
 * --------------
 * - Botão circular flutuante no canto inferior direito
 * - Ao clicar, abre o FeedbackModal
 * - Visível em todas as páginas (dentro do AppLayout)
 * - Não intrusivo mas sempre acessível
 * ============================================================================
 */

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FeedbackModal } from './FeedbackModal';

/**
 * Componente FeedbackButton - botão flutuante + modal de feedback.
 *
 * Deve ser renderizado dentro do AppLayout para aparecer em todas as páginas.
 */
export function FeedbackButton() {
  const { t } = useTranslation('feedback');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante no canto inferior direito */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-6 right-6 z-30
          w-12 h-12 bg-blue-600 text-white
          rounded-full shadow-lg
          flex items-center justify-center
          hover:bg-blue-700 hover:shadow-xl
          active:scale-95
          transition-all duration-200
          group
        "
        title={t('button')}
        aria-label={t('button')}
      >
        <MessageSquare size={20} />

        {/* Tooltip ao hover */}
        <span className="
          absolute right-full mr-3 px-3 py-1.5
          bg-gray-900 text-white text-xs font-medium
          rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-opacity duration-200
        ">
          {t('button')}
        </span>
      </button>

      {/* Modal de feedback */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
