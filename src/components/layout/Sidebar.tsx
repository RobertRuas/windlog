/**
 * ============================================================================
 * SIDEBAR - Menu Lateral Esquerdo (Responsivo)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Menu lateral fixo à esquerda, presente em todas as páginas autenticadas.
 *
 * COMPORTAMENTO:
 * --------------
 * - DESKTOP (≥768px): sidebar fixa à esquerda, largura 240px
 * - MOBILE (<768px): sidebar escondida; botão hamburger no topo abre drawer
 *
 * NAVEGAÇÃO:
 * ----------
 * - Início (Home)
 * - Configurações (Settings)
 * - Sair (Logout)
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wind,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  FolderOpen,
  Calendar,
  MessageSquare,
  Mail,
} from 'lucide-react';

import { logout } from '@/services/auth.service';

/**
 * Props do componente Sidebar.
 */
interface SidebarProps {
  /** Nome do usuário exibido no rodapé do menu */
  userName?: string;
}

/**
 * Itens de navegação do menu.
 * Cada item tem: ícone, label de tradução, rota, padrão de match e roles permitidos.
 */
const NAV_ITEMS = [
  { icon: Home, labelKey: 'nav.home', path: '/', end: true, roles: [] },
  { icon: Users, labelKey: 'nav.users', path: '/users', end: false, roles: ['ADMIN', 'HR'] },
  { icon: FolderOpen, labelKey: 'nav.projects', path: '/projects', end: false, roles: ['ADMIN', 'HR'] },
  { icon: Calendar, labelKey: 'nav.timesheets', path: '/timesheets', end: false, roles: [] },
  { icon: Mail, labelKey: 'nav.mail', path: '/mail', end: false, roles: [] },
  { icon: MessageSquare, labelKey: 'nav.feedbacks', path: '/feedbacks', end: false, roles: ['ADMIN'] },
  { icon: Settings, labelKey: 'nav.settings', path: '/settings', end: false, roles: [] },
] as const;

/**
 * Verifica se o usuário atual tem um dos roles permitidos.
 * Se roles estiver vazio, permite acesso para qualquer role.
 */
function hasRoleAccess(roles: readonly string[]): boolean {
  // Se não há restrição de roles, permite acesso
  if (roles.length === 0) return true;

  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return roles.includes(payload.role);
  } catch {
    return false;
  }
}

/**
 * Componente Sidebar - menu lateral esquerdo responsivo.
 *
 * Desktop: fixo à esquerda (w-60).
 * Mobile: drawer que desliza da esquerda com overlay escuro.
 */
export function Sidebar({ userName }: SidebarProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * Fecha o drawer mobile.
   */
  function closeMobile() {
    setMobileOpen(false);
  }

  /**
   * Navega para uma rota e fecha o drawer mobile.
   */
  function handleNavigate(path: string) {
    navigate(path);
    closeMobile();
  }

  /**
   * Faz logout e redireciona para /login.
   * O logout é assíncrono: primeiro invalida o refresh token na API,
   * depois remove o token local e redireciona.
   */
  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  /**
   * Verifica se um item de navegação está ativo.
   * - end=true: match exato (apenas /)
   * - end=false: match por prefixo (/profile, /profile/...)
   */
  function isActive(path: string, end: boolean) {
    return end
      ? location.pathname === path
      : location.pathname.startsWith(path);
  }

  /**
   * Conteúdo interno do menu (reutilizado no desktop e no drawer mobile).
   */
  function MenuContent() {
    return (
      /* Container interno do menu - ocupa toda a altura */
      <div className="flex flex-col h-full">
        {/* ── Logo ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200 dark:border-[#38383a]">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wind className="text-white" size={18} />
          </div>
          <span className="text-base font-semibold text-gray-900 dark:text-[#f5f5f7]">
            {t('app_name')}
          </span>
        </div>

        {/* ── Navegação ────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.filter(({ roles }) => hasRoleAccess(roles)).map(({ icon: Icon, labelKey, path, end }) => {
            const active = isActive(path, end);
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-[#f5f5f7]'
                  }
                `.trim()}
              >
                <Icon size={18} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-[#636366]'} />
                {t(labelKey)}
              </button>
            );
          })}
        </nav>

        {/* ── Rodapé: usuário + logout ─────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-[#38383a] px-3 py-4 space-y-2">
          {/* Nome do usuário (se disponível) */}
          {userName && (
            <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-[#636366] truncate" title={userName}>
              {userName}
            </div>
          )}
          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-[#a1a1a6] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
          >
            <LogOut size={18} className="text-gray-400 dark:text-[#636366]" />
            {t('buttons.logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Botão Hamburger (apenas mobile) ─────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white dark:bg-[#1c1c1e] rounded-lg shadow-md flex items-center justify-center text-gray-600 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-[#f5f5f7] transition-colors"
        aria-label={t('ariaLabels.openMenu')}
      >
        <Menu size={20} />
      </button>

      {/* ── Overlay escuro (mobile, quando aberto) ──────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={closeMobile}
        />
      )}

      {/* ── Drawer mobile (desliza da esquerda) ─────────────────── */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 z-50 h-full w-60 bg-white dark:bg-[#1c1c1e] shadow-xl
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Botão fechar dentro do drawer */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
          aria-label={t('ariaLabels.closeMenu')}
        >
          <X size={18} />
        </button>
        <MenuContent />
      </aside>

      {/* ── Sidebar fixo desktop ────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:bottom-0 md:w-60 bg-white dark:bg-[#1c1c1e] border-r border-gray-200 dark:border-[#38383a] z-30">
        <MenuContent />
      </aside>
    </>
  );
}
