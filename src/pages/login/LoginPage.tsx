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
 *   - Dropdown DEV (apenas em desenvolvimento) para login rápido
 *   - Corpo: formulário (LoginForm)
 *
 * SEPARAÇÃO DE RESPONSABILIDADES:
 * -------------------------------
 * Esta página (LoginPage) cuida do LAYOUT geral.
 * O formulário em si está em ./components/LoginForm.tsx.
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wind, Users } from 'lucide-react';

// Componente do formulário de login (específico desta página)
import { LoginForm } from './components/LoginForm';

// Serviço de autenticação
import { login } from '@/services/auth.service';

/**
 * Lista de usuários de desenvolvimento para login rápido.
 * TEMPORÁRIO — remover em produção.
 */
const DEV_USERS = [
  { email: 'admin@windlog.com', label: 'Admin (ADMIN)', role: 'ADMIN' },
  { email: 'joao.silva@windlog.com', label: 'João Silva (L1)', role: 'STANDARD' },
  { email: 'maria.santos@windlog.com', label: 'Maria Santos (L2)', role: 'STANDARD' },
  { email: 'pierre.dubois@windlog.com', label: 'Pierre Dubois (L2)', role: 'STANDARD' },
  { email: 'anna.mueller@windlog.com', label: 'Anna Müller (L1)', role: 'STANDARD' },
  { email: 'carlos.garcia@windlog.com', label: 'Carlos García (L1)', role: 'STANDARD' },
  { email: 'lars.eriksson@windlog.com', label: 'Lars Eriksson (L2)', role: 'STANDARD' },
  { email: 'lucas.jansen@windlog.com', label: 'Lucas Jansen (L1)', role: 'STANDARD' },
  { email: 'sofia.rossi@windlog.com', label: 'Sofia Rossi (L2)', role: 'STANDARD' },
  { email: 'jakub.nowak@windlog.com', label: 'Jakub Nowak (L1)', role: 'STANDARD' },
  { email: 'emilie.larsen@windlog.com', label: 'Emilie Larsen (L2)', role: 'STANDARD' },
];

/**
 * Componente LoginPage - Página completa de autenticação.
 */
export function LoginPage() {
  const { t } = useTranslation('login');
  const navigate = useNavigate();
  const [devLoading, setDevLoading] = useState(false);

  /**
   * Login rápido para desenvolvimento.
   * Seleciona o usuário do dropdown e faz login automático.
   */
  async function handleDevLogin(email: string) {
    if (!email) return;
    setDevLoading(true);
    try {
      const response = await login({ email, password: '123456' });
      if (response.mustChangePassword) {
        navigate('/change-password');
      } else if (!response.profileComplete) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch {
      // Falha silenciosa — o usuário pode usar o formulário normal
    } finally {
      setDevLoading(false);
    }
  }

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

        {/* ═══ DEV USER SWITCHER (TEMPORÁRIO) ═══ */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-600">
              {t('devSwitcher.label')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold uppercase">
              DEV
            </span>
          </div>
          <select
            className="w-full h-[38px] px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-sm bg-amber-50 dark:bg-amber-900/20 text-gray-700 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-amber-400"
            defaultValue=""
            onChange={(e) => handleDevLogin(e.target.value)}
            disabled={devLoading}
          >
            <option value="" disabled>
              {devLoading ? t('devSwitcher.logging') : t('devSwitcher.placeholder')}
            </option>
            {DEV_USERS.map((u) => (
              <option key={u.email} value={u.email}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {/* Separador */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#1c1c1e] px-3 text-gray-400 dark:text-[#636366]">{t('devSwitcher.or')}</span>
          </div>
        </div>

        {/* Formulário de login */}
        <LoginForm />
      </div>
    </div>
  );
}
