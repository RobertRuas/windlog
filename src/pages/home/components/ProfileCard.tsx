/**
 * ============================================================================
 * PROFILE CARD - Card de Atalho para o Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe o card de atalho para a página de perfil.
 *
 * PROPS:
 * ------
 * - title: título do card
 * - description: descrição do card
 * - action: texto do botão de ação
 * - onAction: função chamada ao clicar no botão
 * ============================================================================
 */

/**
 * Props do componente ProfileCard.
 */
interface ProfileCardProps {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}

/**
 * Componente ProfileCard - Card de atalho para o perfil.
 */
export function ProfileCard({ title, description, action, onAction }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
