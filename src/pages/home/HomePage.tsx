/**
 * ============================================================================
 * HOME PAGE - Página Inicial
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página inicial do sistema, exibida após o login.
 * Mostra os dados do usuário autenticado em um card simples.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Usa TanStack Query para buscar o perfil do usuário na API
 * 2. Exibe um loading enquanto os dados são carregados
 * 3. Exibe uma mensagem de erro se a requisição falhar
 * 4. Quando os dados chegam, renderiza o UserProfileCard
 *
 * O QUE É TANSTACK QUERY?
 * -----------------------
 * Biblioteca que gerencia cache e estados de requisições HTTP.
 * Vantagens:
 * - Cache automático (não faz a mesma requisição várias vezes)
 * - Refetch automático (atualiza dados quando necessário)
 * - Estados prontos (loading, error, success)
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LogOut, Wind } from 'lucide-react';

// Componente específico desta página
import { UserProfileCard } from './components/UserProfileCard';

// Serviço de autenticação
import type { ProfileResponse } from '@/types/user.types';
import { getProfile, logout } from '@/services/auth.service';

/**
 * Componente HomePage - Página inicial após login.
 *
 * Busca o perfil do usuário via TanStack Query e exibe
 * em um card com informações básicas.
 */
export function HomePage() {
  // Hook de tradução
  const { t } = useTranslation('home');

  /**
   * TanStack Query - busca o perfil do usuário automaticamente.
   *
   * - queryKey: identificador único da query (usado para cache)
   * - queryFn: função que faz a requisição à API
   *
   * A query é executada automaticamente quando o componente é montado.
   * O resultado é cacheado e reutilizado em outros componentes.
   */
  const { data, isLoading, isError } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  /**
   * Função de logout - chamada ao clicar no botão "Sair".
   * Remove o token e redireciona para a página de login.
   */
  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  /**
   * Estado de loading - exibido enquanto os dados são carregados.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t('common:status.loading')}</p>
      </div>
    );
  }

  /**
   * Estado de erro - exibido se a requisição falhar.
   */
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('common:status.error')}</p>
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline"
          >
            {t('common:buttons.logout')}
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renderiza a página com os dados do usuário.
   * O '!' após 'data' é uma non-null assertion (TypeScript).
   * Usamos porque já verificamos isLoading e isError acima.
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simples com logo e botão de logout */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo e nome do app */}
          <div className="flex items-center gap-2">
            <Wind className="text-blue-600" size={24} />
            <span className="text-lg font-semibold text-gray-900">
              {t('common:app_name')}
            </span>
          </div>

          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            {t('common:buttons.logout')}
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Título da página */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('title')}, {data!.user.firstName}!
        </h1>

        {/* Card com dados do perfil */}
        <UserProfileCard user={data!.user} />
      </main>
    </div>
  );
}
