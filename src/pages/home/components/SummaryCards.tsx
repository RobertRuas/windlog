/**
 * ============================================================================
 * SUMMARY CARDS - Cards de Resumo da Home
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os cards de resumo na home page.
 * Cada card mostra um ícone, label e valor (ou "—").
 *
 * PROPS:
 * ------
 * - cards: array de cards a serem exibidos
 * ============================================================================
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Interface para um card de resumo.
 */
export interface SummaryCard {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

/**
 * Props do componente SummaryCards.
 */
interface SummaryCardsProps {
  cards: SummaryCard[];
}

/**
 * Componente SummaryCards - Grid de cards de resumo.
 */
export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={card.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{card.label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
