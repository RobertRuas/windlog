/**
 * ============================================================================
 * ERROR PAGE - Página de Erro Suave e Amigável
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página de erro com visual suave e acolhedor para exibir mensagens
 * de forma amigável ao usuário, sem aparência de algo perigoso.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. A mensagem de erro é passada via URL (search param ?msg=...)
 * 2. Se nenhuma mensagem for fornecida, exibe mensagem padrão
 * 3. Visual clean com gradientes suaves e ícone amigável
 * 4. Botões de navegação claros e intuitivos
 *
 * ROTAS:
 * ------
 * - /error?msg=Token+n%C3%A3o+fornecido -> exibe a mensagem
 * - /error -> exibe mensagem padrão
 * ============================================================================
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Mensagens de erro conhecidas e suas chaves de tradução.
 * Mapeia mensagens da API para chaves do i18n.
 */
const KNOWN_MESSAGES: Record<string, string> = {
  'Token não fornecido': 'error.token_missing',
  'Token expirado. Faça login novamente.': 'error.session_expired',
  'Sessão expirada. Faça login novamente.': 'error.session_ended',
  'Link expirado ou inválido': 'error.link_expired',
  'Erro ao carregar ficheiro': 'error.file_load_error',
};

/**
 * Mapeia mensagens conhecidas para títulos amigáveis.
 */
const FRIENDLY_TITLES: Record<string, string> = {
  'error.token_missing': 'error.auth.title',
  'error.session_expired': 'error.auth.title',
  'error.session_ended': 'error.auth.title',
  'error.link_expired': 'error.not_found.title',
  'error.file_load_error': 'error.not_found.title',
};

/**
 * Componente ErrorPage - Página de erro com visual suave e amigável.
 *
 * Exibe a mensagem de erro com estética clean (fundo claro,
 * cores suaves, ícone amigável, tipografia acolhedora).
 */
export function ErrorPage() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mensagem bruta da URL (decodificada)
  const rawMessage = searchParams.get('msg') || t('error.unknown');

  // Traduz para mensagem amigável se for conhecida
  const messageKey = KNOWN_MESSAGES[rawMessage];
  const message = messageKey ? t(messageKey) : rawMessage;

  // Determina o título amigável baseado no tipo de erro
  const titleKey = messageKey ? FRIENDLY_TITLES[messageKey] : 'error.generic.title';
  const title = t(titleKey);

  // Determina o ícone baseado no tipo de erro
  const isFileError = rawMessage === 'Link expirado ou inválido' || rawMessage === 'Erro ao carregar ficheiro';
  const isAuthError = !isFileError;

  /**
   * Redireciona para a página de login.
   */
  const handleGoToLogin = () => {
    navigate('/login');
  };

  /**
   * Tenta voltar para a página anterior.
   */
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  return (
    /* Container fullscreen com gradiente suave */
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e8f0fe 50%, #f0e6ff 100%)',
      }}
    >
      {/* Card principal */}
      <div
        className="max-w-md w-full rounded-3xl p-10 text-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        {/* Ícone amigável */}
        <div className="mb-6">
          {isAuthError ? (
            /* Ícone de cadeado suave para erros de autenticação */
            <svg
              className="mx-auto"
              width="72"
              height="72"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="36" cy="36" r="36" fill="#EEF2FF" />
              <circle cx="36" cy="36" r="28" fill="#E0E7FF" />
              <path
                d="M36 20C31.582 20 28 23.582 28 28V32H26C24.895 32 24 32.895 24 34V46C24 47.105 24.895 48 26 48H46C47.105 48 48 47.105 48 46V34C48 32.895 47.105 32 46 32H44V28C44 23.582 40.418 20 36 20ZM32 28C32 25.791 33.791 24 36 24C38.209 24 40 25.791 40 28V32H32V28ZM36 38C37.105 38 38 38.895 38 40C38 40.74 37.598 41.384 37 41.732V44H35V41.732C34.402 41.384 34 40.74 34 40C34 38.895 34.895 38 36 38Z"
                fill="#6366F1"
              />
            </svg>
          ) : (
            /* Ícone de nuvem suave para erros de ficheiro */
            <svg
              className="mx-auto"
              width="72"
              height="72"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="36" cy="36" r="36" fill="#FFF7ED" />
              <circle cx="36" cy="36" r="28" fill="#FFEDD5" />
              <path
                d="M48 40C49.105 40 50 39.105 50 38C50 33.582 46.418 30 42 30C41.735 30 41.473 30.013 41.213 30.038C40.352 26.647 37.254 24 33.5 24C29.082 24 25.5 27.582 25.5 32C25.5 32.172 25.505 32.343 25.515 32.513C22.443 33.082 20 35.756 20 39C20 42.866 23.134 46 27 46H46C48.209 46 50 44.209 50 42C50 39.791 48.209 38 46 38"
                fill="#F97316"
                opacity="0.2"
              />
              <path
                d="M33 38L36 35L39 38M36 35V45"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Título amigável */}
        <h1
          className="text-xl font-semibold mb-3"
          style={{ color: '#1E293B' }}
        >
          {title}
        </h1>

        {/* Mensagem descritiva */}
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: '#64748B' }}
        >
          {message}
        </p>

        {/* Separador suave */}
        <div
          className="mb-8"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, #E2E8F0 50%, transparent 100%)',
          }}
        />

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Botão voltar */}
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              color: '#475569',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E2E8F0';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            {t('error.back')}
          </button>

          {/* Botão login */}
          <button
            onClick={handleGoToLogin}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              color: '#FFFFFF',
              backgroundColor: '#6366F1',
              border: '1px solid #6366F1',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.25)';
            }}
          >
            {t('error.login')}
          </button>
        </div>
      </div>

      {/* Rodapé discreto */}
      <div
        className="mt-8 text-xs"
        style={{ color: '#94A3B8' }}
      >
        Windlog · {new Date().getFullYear()}
      </div>
    </div>
  );
}
