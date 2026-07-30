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
 * - /          -> HomePage (protegida, requer login)
 * - /profile   -> ProfilePage (protegida, requer login)
 * - /login     -> LoginPage (pública)
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
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { LogsPage } from '@/pages/logs/LogsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/detail/ProjectDetailPage';
import { ChangeTempPasswordPage } from '@/pages/change-password/ChangeTempPasswordPage';
import { ErrorPage } from '@/pages/error/ErrorPage';

// Serviço de autenticação
import { isAuthenticated } from '@/services/auth.service';
import { isTokenExpired } from '@/utils/jwt';

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
 * Se não estiver autenticado OU o token estiver expirado, redireciona para /login.
 * Se o token estiver expirado, remove o token automaticamente (logout).
 *
 * @param children - componente a ser exibido se autenticado
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Verifica se existe um token JWT no localStorage
  const authenticated = isAuthenticated();

  // Verifica se o token está expirado
  const expired = isTokenExpired();

  // Se o token existe mas está expirado, faz logout automático
  if (authenticated && expired) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" replace />;
  }

  // Se não autenticado, redireciona para /login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado e token válido, exibe o conteúdo da rota
  return <>{children}</>;
}

/**
 * Componente AdminRoute - Rota protegida para administradores.
 *
 * Verifica se o usuário está autenticado E tem role ADMIN.
 * Se não for ADMIN, redireciona para a página inicial.
 *
 * @param children - componente a ser exibido se for ADMIN
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  // Verifica se existe um token JWT no localStorage
  const authenticated = isAuthenticated();
  const expired = isTokenExpired();

  // Se o token existe mas está expirado, faz logout automático
  if (authenticated && expired) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" replace />;
  }

  // Se não autenticado, redireciona para /login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Busca o perfil do usuário para verificar o role
  // Nota: Isso é uma verificação simples baseada no token JWT
  // Em produção, você pode querer buscar o perfil completo da API
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
      }
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Componente AdminOrHRRoute - Rota protegida para ADMIN ou HR.
 *
 * Verifica se o usuário está autenticado E tem role ADMIN ou HR.
 * Se não tiver nenhum desses roles, redireciona para a página inicial.
 *
 * @param children - componente a ser exibido se for ADMIN ou HR
 */
function AdminOrHRRoute({ children }: { children: React.ReactNode }) {
  // Verifica se existe um token JWT no localStorage
  const authenticated = isAuthenticated();
  const expired = isTokenExpired();

  // Se o token existe mas está expirado, faz logout automático
  if (authenticated && expired) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" replace />;
  }

  // Se não autenticado, redireciona para /login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Busca o perfil do usuário para verificar o role
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Permite acesso apenas para ADMIN ou HR
      if (payload.role !== 'ADMIN' && payload.role !== 'HR') {
        return <Navigate to="/" replace />;
      }
    }
  } catch {
    return <Navigate to="/" replace />;
  }

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

          {/* Rota protegida - troca de senha temporária (requer autenticação) */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangeTempPasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - página inicial (requer autenticação) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - perfil do usuário (requer autenticação) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - configurações (requer autenticação) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Rota protegida - logs do sistema (apenas ADMIN) */}
          <Route
            path="/logs"
            element={
              <AdminRoute>
                <LogsPage />
              </AdminRoute>
            }
          />

          {/* Rota protegida - gestão de usuários (ADMIN ou HR) */}
          <Route
            path="/users"
            element={
              <AdminOrHRRoute>
                <UsersPage />
              </AdminOrHRRoute>
            }
          />

          {/* Rota protegida - gestão de projetos (ADMIN ou HR) */}
          <Route
            path="/projects"
            element={
              <AdminOrHRRoute>
                <ProjectsPage />
              </AdminOrHRRoute>
            }
          />

          {/* Rota protegida - detalhes do projeto (ADMIN ou HR) */}
          <Route
            path="/projects/:id"
            element={
              <AdminOrHRRoute>
                <ProjectDetailPage />
              </AdminOrHRRoute>
            }
          />

          {/* Rota pública - página de erro (estilo vintage terminal) */}
          <Route path="/error" element={<ErrorPage />} />

          {/* Qualquer outra rota redireciona para a página inicial ou login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
