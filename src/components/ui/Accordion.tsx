/**
 * ============================================================================
 * ACCORDION - Componente de Acordeão
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Componente reutilizável que exibe conteúdo colapsável.
 * Usado para organizar seções opcionais que podem ficar recolhidas.
 *
 * COMO USAR?
 * ----------
 * <Accordion title="Seção" defaultOpen={false}>
 *   <p>Conteúdo aqui</p>
 * </Accordion>
 *
 * PROPRIEDADES:
 * -------------
 * - title: Título exibido no cabeçalho
 * - icon: Ícone opcional (elemento React)
 * - defaultOpen: Se começa aberto (padrão: false)
 * - children: Conteúdo a ser exibido/ocultado
 * ============================================================================
 */

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Props do componente Accordion.
 */
interface AccordionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Componente Accordion - Seção colapsável.
 */
export function Accordion({ title, icon, defaultOpen = false, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Cabeçalho clicável */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Conteúdo colapsável */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
