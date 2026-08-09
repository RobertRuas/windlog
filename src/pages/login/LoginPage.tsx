/**
 * ============================================================================
 * LOGIN PAGE - Página de Login
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página completa de login do sistema (modo produção).
 * Exibe um card centralizado com o formulário de autenticação.
 *
 * ESTRUTURA DA PÁGINA:
 * --------------------
 * - Container centralizado (flexbox)
 * - Card branco com sombra
 *   - Cabeçalho: logo + título
 *   - Corpo: formulário (LoginForm, com autocomplete de utilizadores)
 *
 * SEPARAÇÃO DE RESPONSABILIDADES:
 * -------------------------------
 * Esta página (LoginPage) cuida do LAYOUT geral.
 * O formulário em si está em ./components/LoginForm.tsx.
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { Wind } from 'lucide-react';

// Componente do formulário de login (específico desta página)
import { LoginForm } from './components/LoginForm';

/**
 * Componente LoginPage - Página completa de autenticação.
 */
export function LoginPage() {
  const { t } = useTranslation('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000] p-4">
      <div className="max-w-sm w-full bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm p-8">
        {/* Cabeçalho do card */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wind className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f7]">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Formulário de login */}
        <LoginForm />
      </div>
    </div>
  );
}
