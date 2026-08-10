/**
 * ============================================================================
 * FEEDBACK BUTTON - Botão de Feedback
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Botão no header superior, ao lado do avatar do usuário, presente em TODAS
 * as páginas autenticadas. Permite ao usuário abrir o modal de feedback
 * rapidamente para reportar bugs, sugestões, etc.
 *
 * COMPORTAMENTO:
 * --------------
 * - Botão circular discreto, do mesmo tamanho do avatar (visual apagado)
 * - Ao clicar, abre o FeedbackModal
 * - Visível em todas as páginas (dentro do header do AppLayout)
 * ============================================================================
 */

import { useState } from 'react';
import { Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FeedbackModal } from './FeedbackModal';

/**
 * Componente FeedbackButton - botão discreto no header + modal de feedback.
 *
 * Deve ser renderizado no header do AppLayout para aparecer em todas as páginas.
 */
export function FeedbackButton() {
  const { t } = useTranslation('feedback');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão circular discreto, mesmo tamanho do avatar */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-[#6e6e73] hover:text-gray-600 dark:hover:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
        title={t('button')}
        aria-label={t('button')}
      >
        <Bug size={18} />
      </button>

      {/* Modal de feedback */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
