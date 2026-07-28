/**
 * ============================================================================
 * APP COMPONENT - Componente Raiz da Aplicação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente principal que configura e envolve toda a aplicação.
 * Aqui definimos:
 * - Providers (contextos globais)
 * - Rotas da aplicação
 *
 * O QUE SÃO PROVIDERS?
 * --------------------
 * Providers são componentes que disponibilizam dados/funcionalidades
 * para TODA a árvore de componentes. Exemplos:
 * - QueryClientProvider: disponibiliza o TanStack Query para todos
 * - BrowserRouter: disponibiliza o React Router para todos
 *
 * ROTAS DA APLICAÇÃO:
 * -------------------
 * - /       -> HomePage (protegida, requer login)
 * - /login  -> LoginPage (pública)
 * - Qualquer outra rota -> redireciona para / ou /login
 * ============================================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Importa a configuração do i18next (deve ser importado antes de usar traduções)
import '@/i18n';

// Páginas da aplicação
import { LoginPage } from '@/pages/login/LoginPage';
import { HomePage } from '@/pages/home/HomePage';

// Serviço de autenticação
import { isAuthenticated } from '@/services/auth.service';

/**
 * Instância do QueryClient - gerenciador de cache do TanStack Query.
 *
 * Configurações:
 * - staleTime: tempo que os dados ficam "frescos" (30 segundos)
 *   Após esse tempo, os dados são considerados "velhos" e uma nova
 *   requisição é feita automaticamente.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos
    },
  },
});

/**
 * Componente ProtectedRoute - Rota protegida.
 *
 * Verifica se o usuário está autenticado antes de exibir a página.
 * Se não estiver autenticado, redireciona para a página de login.
 *
 * @param children - componente a ser exibido se autenticado
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Verifica se existe um token JWT no localStorage
  const authenticated = isAuthenticated();

  // Se não autenticado, redireciona para /login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, exibe o conteúdo da rota
  return <>{children}</>;
}

/**
 * Componente App - raiz da aplicação.
 *
 * Envolve toda a aplicação com os providers necessários
 * e define as rotas disponíveis.
 */
export default function App() {
  return (
    /* QueryClientProvider - disponibiliza o TanStack Query para todos os componentes.
     * Qualquer componente pode usar useQuery() para buscar dados da API. */
    <QueryClientProvider client={queryClient}>
      {/* Toaster - exibe notificações toast (sucesso, erro, etc.) */}
      <Toaster position="top-right" richColors closeButton />
      {/* BrowserRouter - disponibiliza o sistema de rotas.
       * Permite usar useNavigate(), <Link>, <Routes>, etc. */}
      <BrowserRouter>
        <Routes>
          {/* Rota pública - página de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rota protegida - página inicial (requer autenticação) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Qualquer outra rota redireciona para a página inicial ou login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
