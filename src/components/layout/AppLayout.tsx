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
import { Sidebar } from './Sidebar';
import { getProfile } from '@/services/auth.service';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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
    <div className="min-h-screen bg-gray-50">
      {/* Menu lateral */}
      <Sidebar userName={userName} />

      {/* Conteúdo principal - offset pela largura do sidebar no desktop */}
      <main className="md:ml-60 min-h-screen">
        {/* Header superior com sino de notificações */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end h-14">
              {/* Sino de notificações */}
              <NotificationBell />

              {/* Nome do usuário (desktop) */}
              {userName && (
                <span className="hidden sm:block ml-3 text-sm text-gray-600">
                  {userName}
                </span>
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
