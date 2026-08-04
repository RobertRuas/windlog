/**
 * ============================================================================
 * CHANGE TEMP PASSWORD PAGE - Página de Troca de Senha Temporária
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Exibida quando o usuário faz login com uma senha temporária (gerada pelo admin).
 * O usuário é obrigado a criar uma nova senha antes de acessar o sistema.
 *
 * FLUXO:
 * ------
 * 1. Admin cria usuário ou reseta senha → gera senha temporária
 * 2. Usuário faz login com a senha temporária
 * 3. Sistema detecta mustChangePassword: true
 * 4. Redireciona para esta página
 * 5. Usuário cria nova senha
 * 6. Sistema remove o flag mustChangePassword
 * 7. Usuário é redirecionado para a home
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

// Componentes compartilhados
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Serviço de autenticação
import { changeTempPassword } from '@/services/auth.service';

/**
 * Componente ChangeTempPasswordPage - Tela de troca de senha temporária.
 */
export function ChangeTempPasswordPage() {
  const { t } = useTranslation('login');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Submete a troca de senha.
   *
   * FLUXO:
   * 1. Valida se as senhas coincidem e têm tamanho mínimo
   * 2. Chama a API para trocar a senha
   * 3. Se sucesso, faz logout e redireciona para login
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    // Validações locais
    if (newPassword.length < 6) {
      setError(t('changeTempPassword.errors.minLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changeTempPassword.errors.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      // Chama a API para trocar a senha temporária
      await changeTempPassword(newPassword);

      // Mostra mensagem de sucesso
      toast.success(t('changeTempPassword.success'));

      // Redireciona para o onboarding (o usuário já está autenticado)
      // O onboarding irá verificar se o perfil precisa ser completado
      navigate('/onboarding');
    } catch {
      setError(t('changeTempPassword.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-sm p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-amber-600" size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('changeTempPassword.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('changeTempPassword.subtitle')}
          </p>
        </div>

        {/* Aviso informativo */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800">
            {t('changeTempPassword.info')}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t('changeTempPassword.newPassword.label')}
            type="password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            placeholder={t('changeTempPassword.newPassword.placeholder')}
            required
            autoComplete="new-password"
          />

          <Input
            label={t('changeTempPassword.confirmPassword.label')}
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder={t('changeTempPassword.confirmPassword.placeholder')}
            required
            autoComplete="new-password"
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common:status.loading') : t('changeTempPassword.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
