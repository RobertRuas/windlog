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
import { Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FeedbackModal } from './FeedbackModal';

/**
 * Props do FeedbackButton.
 */
interface FeedbackButtonProps {
  /** Quando true, renderiza como ícone subtil (usado no header mobile) */
  compact?: boolean;
}

/**
 * Componente FeedbackButton - botão flutuante + modal de feedback.
 *
 * Deve ser renderizado dentro do AppLayout para aparecer em todas as páginas.
 * No desktop: botão circular flutuante no canto inferior direito.
 * No mobile (compact): ícone discreto colocado no header.
 */
export function FeedbackButton({ compact = false }: FeedbackButtonProps) {
  const { t } = useTranslation('feedback');
  const [isOpen, setIsOpen] = useState(false);

  /* ── Variante compacta (header mobile) ─────────────────────────── */
  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-gray-400 dark:text-[#636366] opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all duration-150"
          title={t('button')}
          aria-label={t('button')}
        >
          <Bug size={18} />
        </button>
        <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  /* ── Variante flutuante (desktop) ──────────────────────────────── */
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
        <Bug size={20} />

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
