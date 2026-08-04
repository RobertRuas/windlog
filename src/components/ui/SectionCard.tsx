/**
 * ============================================================================
 * SECTION CARD - Card de Seção com Ícone e Título
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente auxiliar reutilizável que renderiza um card branco com bordas
 * arredondadas, contendo um ícone + título e conteúdo children.
 *
 * ONDE É USADO?
 * -------------
 * - OnboardingPage: separa as seções do formulário (dados pessoais, passaporte, etc.)
 * - Pode ser reutilizado em outros formulários com seções visuais
 * ============================================================================
 */

import type { ReactNode } from 'react';

/**
 * Props do SectionCard.
 */
interface SectionCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

/**
 * Card de seção com ícone e título.
 */
export function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
