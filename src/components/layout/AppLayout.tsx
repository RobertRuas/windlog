/**
 * ============================================================================
 * APP LAYOUT - Layout Principal com Sidebar
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Wrapper de layout usado em todas as páginas autenticadas.
 * Renderiza o Sidebar à esquerda e o conteúdo principal à direita.
 *
 * ESTRUTURA:
 * ----------
 * ┌──────────┬─────────────────────────┐
 * │ Sidebar  │  <main> conteúdo </main>│
 * │ (fixo)   │  (scrollável)           │
 * └──────────┴─────────────────────────┘
 *
 * No mobile, o sidebar vira um drawer que abre por cima do conteúdo.
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { getProfile } from '@/services/auth.service';
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
        {/* Área interna com padding e largura máxima */}
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
