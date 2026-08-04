/**
 * ============================================================================
 * PAGE HELP - Componente de Ajuda Contextual por Página
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que exibe informações de ajuda detalhadas
 * para o utilizador final. Pode ser colocado em qualquer página da
 * aplicação para explicar como utilizar determinada funcionalidade.
 *
 * COMO USAR?
 * ----------
 * <PageHelp title="Como funciona?" icon={<HelpCircle />}>
 *   <PageHelp.Section title="Para que serve">
 *     <p>Esta página permite...</p>
 *   </PageHelp.Section>
 *   <PageHelp.Section title="Passos">
 *     <PageHelp.Step>1. Clique em...</PageHelp.Step>
 *     <PageHelp.Step>2. Preencha...</PageHelp.Step>
 *   </PageHelp.Section>
 * </PageHelp>
 *
 * DESIGN:
 * -------
 * - Painel colapsável com borda suave e fundo azul claro
 * - Ícone "?" no header para identificação visual
 * - Tipografia padronizada (títulos, parágrafos, listas)
 * - Animação suave ao abrir/fechar
 * - Totalmente responsivo (desktop-first)
 * ============================================================================
 */

import { useState, type ReactNode } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

/* ==========================================================================
   Sub-componente: PageHelp.Section
   Secção dentro do painel de ajuda com título e conteúdo
   ========================================================================== */

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="not-last:mb-4 not-last:pb-4 not-last:border-b not-last:border-blue-100">
      <h4 className="text-[13px] font-semibold text-blue-900 mb-2">{title}</h4>
      <div className="text-[13px] text-blue-800 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   Sub-componente: PageHelp.Step
   Passo individual dentro de uma secção de ajuda
   ========================================================================== */

interface StepProps {
  children: ReactNode;
}

function Step({ children }: StepProps) {
  return (
    <div className="flex items-start gap-2 mb-1.5 last:mb-0">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-[11px] font-bold flex items-center justify-center mt-0.5">
        •
      </span>
      <span>{children}</span>
    </div>
  );
}

/* ==========================================================================
   Componente principal: PageHelp
   ========================================================================== */

interface PageHelpProps {
  /** Título do painel de ajuda */
  title: string;
  /** Ícone personalizado (padrão: HelpCircle) */
  icon?: ReactNode;
  /** Se true, começa aberto (padrão: false) */
  defaultOpen?: boolean;
  /** Conteúdo do painel (use PageHelp.Section e PageHelp.Step) */
  children: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente PageHelp - Painel de ajuda contextual reutilizável.
 *
 * Deve ser colocado no topo de qualquer página para fornecer
 * informações detalhadas sobre como utilizar a funcionalidade.
 * O design segue o padrão Apple com tons de azul suave.
 */
export function PageHelp({
  title,
  icon,
  defaultOpen = false,
  children,
  className = '',
}: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`
        bg-blue-50/60 border border-blue-200/60 rounded-xl overflow-hidden
        ${className}
      `.trim()}
    >
      {/* Header — clicável para abrir/fechar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          {/* Ícone de ajuda */}
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            {icon || <HelpCircle size={16} />}
          </div>
          {/* Título */}
          <span className="text-[13px] font-semibold text-blue-900">
            {title}
          </span>
        </div>

        {/* Seta de expansão */}
        <ChevronDown
          size={16}
          className={`text-blue-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Conteúdo colapsável */}
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Exportar sub-componentes como propriedades do PageHelp
   Permite usar <PageHelp.Section> e <PageHelp.Step>
   ========================================================================== */

PageHelp.Section = Section;
PageHelp.Step = Step;
