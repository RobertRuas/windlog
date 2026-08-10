/**
 * ============================================================================
 * LOGIN FORM - Formulário de Login
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente específico da página de login que renderiza o formulário
 * de autenticação (campos de email e senha + botão de submit).
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Autocomplete de utilizadores no campo de e-mail: ao começar a digitar,
 *   aparecem sugestões (nome + e-mail) vindas da API pública de sugestões
 * - Ao submeter, chama o serviço de autenticação
 * - Se sucesso, redireciona conforme o estado do usuário
 * - Se erro, exibe mensagem abaixo do formulário
 * ============================================================================
 */

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LogIn, User } from 'lucide-react';

// Componentes compartilhados reutilizáveis
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Serviço de autenticação
import { login, devLogin, getLoginSuggestions } from '@/services/auth.service';

/** Máximo de sugestões exibidas no autocomplete */
const MAX_SUGGESTIONS = 8;

/**
 * Componente LoginForm - Formulário de autenticação.
 *
 * Gerencia o estado do formulário (email, senha, erro, loading)
 * e faz a chamada à API de login ao submeter.
 */
export function LoginForm() {
  // Hook de tradução - carrega as strings do arquivo 'login.json'
  const { t } = useTranslation('login');

  // Hook de navegação - usado para redirecionar após login
  const navigate = useNavigate();

  // Estados do formulário
  const [email, setEmail] = useState('');       // Valor do campo email
  const [password, setPassword] = useState(''); // Valor do campo senha
  const [error, setError] = useState('');       // Mensagem de erro
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [devLoading, setDevLoading] = useState(false); // Loading do login automático (dev)
  const [showSuggestions, setShowSuggestions] = useState(false); // Dropdown aberto
  const passwordRef = useRef<HTMLInputElement>(null);

  /**
   * Sugestões de utilizadores (endpoint público, sem token).
   */
  const { data: suggestions = [] } = useQuery({
    queryKey: ['login-suggestions'],
    queryFn: getLoginSuggestions,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Filtra as sugestões conforme o texto digitado (nome ou e-mail).
   * Só há lista a partir do primeiro caractere digitado.
   */
  const filtered = useMemo(() => {
    const query = email.trim().toLowerCase();
    if (!query) return [];
    return suggestions
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [email, suggestions]);

  /**
   * Seleciona uma sugestão: preenche o e-mail e foca na senha.
   */
  function handleSelect(selectedEmail: string) {
    setEmail(selectedEmail);
    setShowSuggestions(false);
    passwordRef.current?.focus();
  }

  /**
   * Redireciona o usuário conforme o estado retornado pelo login.
   * Reutilizado pelo login normal e pelo login automático (dev).
   */
  function redirectAfterLogin(response: { mustChangePassword: boolean; profileComplete: boolean }) {
    // Se o usuário precisa trocar a senha temporária, redireciona para a página de troca
    if (response.mustChangePassword) {
      navigate('/change-password');
    } else if (!response.profileComplete) {
      // Se o perfil não está completo, redireciona para o onboarding
      navigate('/onboarding');
    } else {
      // Login bem-sucedido: redireciona para a página inicial
      navigate('/');
    }
  }

  /**
   * Função executada ao submeter o formulário.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // Previne reload da página
    setError('');           // Limpa erro anterior
    setShowSuggestions(false);
    setIsLoading(true);     // Ativa loading

    try {
      // Chama o serviço de login com email e senha
      const response = await login({ email, password });
      redirectAfterLogin(response);
    } catch {
      // Exibe mensagem de erro genérica (não revela se o e-mail existe)
      setError(t('errors.invalid_credentials'));
    } finally {
      // Sempre desativa o loading, independente do resultado
      setIsLoading(false);
    }
  }

  /**
   * Login automático — funcionalidade de desenvolvimento.
   *
   * Recebe o e-mail selecionado no dropdown, pede a sessão ao endpoint
   * /auth/dev-login e redireciona exatamente como o login normal.
   * O dropdown é sempre exibido, mas o endpoint só funciona quando o
   * backend roda com NODE_ENV=development; em produção retorna 404.
   */
  async function handleDevLogin(selectedEmail: string) {
    if (!selectedEmail || devLoading) return;
    setError('');
    setDevLoading(true);

    try {
      const response = await devLogin(selectedEmail);
      redirectAfterLogin(response);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Dropdown de login automático — sempre visível; o endpoint backend
          é quem controla a disponibilidade (apenas NODE_ENV=development) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            {t('dev.badge')}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#8e8e93]">{t('dev.label')}</span>
        </div>

        {/* Lista todos os usuários cadastrados; selecionar dispara o auto-login */}
        <select
          defaultValue=""
          disabled={devLoading || isLoading}
          onChange={(e) => handleDevLogin(e.target.value)}
          className="
            w-full px-3 py-2 border border-gray-200 dark:border-[#38383a]
            rounded-lg text-sm bg-white dark:bg-[#2c2c2e]
            text-gray-800 dark:text-[#f5f5f7]
            focus:outline-none focus:ring-2 focus:ring-amber-500
            disabled:opacity-50
          "
        >
          <option value="" disabled>
            {devLoading ? t('common:status.loading') : t('dev.placeholder')}
          </option>
          {suggestions.map((s) => (
            <option key={s.email} value={s.email}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>

      {/* Campo de e-mail com autocomplete */}
      <div className="relative">
        <Input
          label={t('email.label')}
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          placeholder={t('email.placeholder')}
          required
          autoComplete="email"
        />

        {/* Dropdown de sugestões */}
        {showSuggestions && filtered.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-[#38383a] rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s.email}>
                <button
                  type="button"
                  // onMouseDown ocorre antes do blur fechar o dropdown
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s.email);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#3a3a3c] transition-colors"
                >
                  <User size={14} className="text-gray-400 dark:text-[#636366] flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-800 dark:text-[#f5f5f7] truncate">{s.name}</span>
                    <span className="block text-xs text-gray-400 dark:text-[#8e8e93] truncate">{s.email}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Campo de senha */}
      <Input
        label={t('password.label')}
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        placeholder={t('password.placeholder')}
        required
        autoComplete="current-password"
        ref={passwordRef}
      />

      {/* Mensagem de erro (exibida apenas quando há erro) */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Botão de submit com ícone e estado de loading */}
      <Button type="submit" disabled={isLoading}>
        <span className="flex items-center gap-2">
          <LogIn size={16} />
          {isLoading ? t('common:status.loading') : t('submit')}
        </span>
      </Button>
    </form>
  );
}
