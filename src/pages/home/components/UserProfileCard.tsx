/**
 * ============================================================================
 * USER PROFILE CARD - Card de Perfil do Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os dados básicos do usuário em um card.
 * Usado na página inicial (Home) para mostrar informações do perfil.
 *
 * DADOS EXIBIDOS:
 * ---------------
 * - Nome completo (primeiro nome + sobrenome)
 * - E-mail
 * - Função/papel no sistema (ADMIN, HR, STANDARD)
 * - Status da conta (ativo/inativo)
 *
 * COMO RECEBE OS DADOS?
 * ---------------------
 * Os dados são passados via props (propriedades do componente).
 * O componente pai (HomePage) busca os dados da API e passa para cá.
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { Mail, Shield, CheckCircle, XCircle } from 'lucide-react';

// Tipo TypeScript para os dados do usuário
import type { User as UserType } from '@/types/user.types';

/**
 * Define as propriedades aceitas pelo UserProfileCard.
 * Recebe os dados do usuário via prop 'user'.
 */
interface UserProfileCardProps {
  /** Dados do usuário a serem exibidos no card */
  user: UserType;
}

/**
 * Componente UserProfileCard - Exibe informações do perfil do usuário.
 *
 * Renderiza um card com ícones para cada informação,
 * facilitando a identificação visual dos dados.
 */
export function UserProfileCard({ user }: UserProfileCardProps) {
  // Hook de tradução - carrega strings do arquivo 'home.json'
  const { t } = useTranslation('home');

  /**
   * Formata o nome completo do usuário.
   * Junta primeiro nome e sobrenome com um espaço entre eles.
   */
  const fullName = `${user.firstName} ${user.lastName}`;

  /**
   * Traduz o papel do usuário para exibição amigável.
   * Ex: "ADMIN" -> "Administrador", "HR" -> "Recursos Humanos"
   */
  const roleLabel = t(`roles.${user.role}`);

  return (
    /* Card branco com bordas arredondadas e sombra suave.
     * Contém uma lista de informações com ícones. */
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Título do card */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('profile.name')}: {fullName}
      </h2>

      {/* Lista de informações do usuário */}
      <div className="flex flex-col gap-3">
        {/* E-mail */}
        <div className="flex items-center gap-3 text-sm">
          <Mail size={16} className="text-gray-400" />
          <span className="text-gray-600">{t('profile.email')}:</span>
          <span className="text-gray-900 font-medium">{user.email}</span>
        </div>

        {/* Função/Papel */}
        <div className="flex items-center gap-3 text-sm">
          <Shield size={16} className="text-gray-400" />
          <span className="text-gray-600">{t('profile.role')}:</span>
          <span className="text-gray-900 font-medium">{roleLabel}</span>
        </div>

        {/* Status da conta */}
        <div className="flex items-center gap-3 text-sm">
          {/* Ícone diferente para ativo/inativo */}
          {user.isActive ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
          <span className="text-gray-600">{t('profile.status')}:</span>
          <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {user.isActive ? t('profile.active') : t('profile.inactive')}
          </span>
        </div>
      </div>
    </div>
  );
}
