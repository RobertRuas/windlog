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
 * POR QUE SEPARAR O FORM DA PÁGINA?
 * ---------------------------------
 * Separar o formulário em um componente próprio facilita:
 * - Reutilização (se necessário em outro lugar)
 * - Testes unitários (testamos apenas o formulário)
 * - Manutenção (cada arquivo tem uma responsabilidade clara)
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Usuário preenche email e senha
 * 2. Ao submeter, chama o serviço de autenticação
 * 3. Se sucesso, redireciona para a página inicial
 * 4. Se erro, exibe mensagem abaixo do formulário
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';

// Componentes compartilhados reutilizáveis
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Serviço de autenticação
import { login } from '@/services/auth.service';

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

  /**
   * Função executada ao submeter o formulário.
   *
   * FLUXO:
   * 1. Previne o comportamento padrão do form (recarregar a página)
   * 2. Limpa erros anteriores
   * 3. Ativa o estado de loading
   * 4. Chama o serviço de login
   * 5. Se sucesso: redireciona para a home
   * 6. Se erro: exibe mensagem de erro
   * 7. Desativa o loading
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // Previne reload da página
    setError('');           // Limpa erro anterior
    setIsLoading(true);     // Ativa loading

    try {
      // Chama o serviço de login com email e senha
      const response = await login({ email, password });

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
    } catch {
      // Exibe mensagem de erro genérica
      // Em produção, poderíamos tratar diferentes tipos de erro
      setError(t('errors.invalid_credentials'));
    } finally {
      // Sempre desativa o loading, independente do resultado
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Campo de e-mail */}
      <Input
        label={t('email.label')}
        type="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        placeholder={t('email.placeholder')}
        required
        autoComplete="email"
      />

      {/* Campo de senha */}
      <Input
        label={t('password.label')}
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        placeholder={t('password.placeholder')}
        required
        autoComplete="current-password"
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
