/**
 * ============================================================================
 * APP LAYOUT - Layout Principal com Sidebar e Header
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Wrapper de layout usado em todas as páginas autenticadas.
 * Renderiza o Sidebar à esquerda, um Header no topo e o conteúdo principal.
 *
 * ESTRUTURA:
 * ----------
 * ┌──────────┬─────────────────────────┐
 * │          │  Header (sino, user)    │
 * │ Sidebar  ├─────────────────────────┤
 * │ (fixo)   │  <main> conteúdo </main>│
 * │          │  (scrollável)           │
 * └──────────┴─────────────────────────┘
 *
 * No mobile, o sidebar vira um drawer que abre por cima do conteúdo.
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { getProfile } from '@/services/auth.service';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { SecureImage } from '@/components/ui/SecureImage';
import type { ProfileResponse } from '@/types/user.types';

/**
 * Props do AppLayout.
 */
interface AppLayoutProps {
  /** Conteúdo da página (filho) */
  children: React.ReactNode;
}

/**
 * Componente AppLayout - envolve páginas autenticadas com o menu lateral.
 *
 * Busca o perfil do usuário para exibir o nome no sidebar.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();

  /**
   * Busca o perfil para obter o nome do usuário.
   * Se falhar, o nome simplesmente não é exibido no sidebar.
   */
  const { data } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: false,
  });

  const userName = data
    ? `${data.firstName} ${data.lastName}`.trim()
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#000000]">
      {/* Menu lateral */}
      <Sidebar />

      {/* Conteúdo principal - offset pela largura do sidebar no desktop */}
      <main className="md:ml-60 min-h-screen">
        {/* Header superior com sino de notificações */}
        <header className="sticky top-0 z-20 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-[#38383a]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end h-14">
              {/* Sino de notificações */}
              <NotificationBell />

              {/* Botão de feedback — discreto, ao lado do avatar */}
              <div className="ml-3">
                <FeedbackButton />
              </div>

              {/* Avatar + Nome do usuário — clica para ir ao perfil.
               * No mobile exibe apenas o avatar (nome escondido) para poupar espaço. */}
              {userName && (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex items-center ml-3 gap-2 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
                >
                  {/* Avatar com foto ou iniciais */}
                  {data?.photoUrl ? (
                    <SecureImage
                      filePath={data.photoUrl}
                      alt={userName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-[#38383a]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {data?.firstName?.[0]}{data?.lastName?.[0]}
                    </div>
                  )}
                  {/* Nome visível apenas a partir de sm (tablet/PC) */}
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-[#a1a1a6]">
                    {userName}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Área interna com padding e largura máxima */}
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
