/**
 * ============================================================================
 * LOGIN PAGE - Página de Login
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página completa de login do sistema.
 * Exibe um card centralizado com o formulário de autenticação.
 *
 * ESTRUTURA DA PÁGINA:
 * --------------------
 * - Container centralizado (flexbox)
 * - Card branco com sombra
 *   - Cabeçalho: logo + título
 *   - Corpo: formulário (LoginForm)
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
 *
 * Renderiza um card centralizado com o formulário de login.
 * Usa o hook useTranslation para exibir textos no idioma configurado.
 */
export function LoginPage() {
  // Hook do i18next - carrega traduções do namespace 'login'
  const { t } = useTranslation('login');

  return (
    /* Container principal - ocupa toda a tela.
     * - min-h-screen: altura mínima = 100% da viewport
     * - flex items-center justify-center: centraliza o conteúdo
     * - bg-gray-50: fundo cinza claro */
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Card de login - container branco com bordas arredondadas.
       * - max-w-sm: largura máxima para não ficar muito grande
       * - w-full: ocupa toda a largura disponível em telas pequenas */}
      <div className="max-w-sm w-full bg-white rounded-xl shadow-sm p-8">
        {/* Cabeçalho do card - logo e título */}
        <div className="text-center mb-8">
          {/* Ícone do Windlog (vento) */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wind className="text-white" size={24} />
            </div>
          </div>

          {/* Título e subtítulo */}
          <h1 className="text-2xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Formulário de login */}
        <LoginForm />
      </div>
    </div>
  );
}
