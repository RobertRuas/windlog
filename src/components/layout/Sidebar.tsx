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
 * - E-MAIL: o item "E-mail" possui submenu em acordeão (pastas e
 *   etiquetas), exibido apenas quando a página /mail está aberta.
 *   A seleção é feita via query string (?folder= / ?label=).
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  ChevronDown,
  Inbox,
  Send,
  FileText,
  AlertOctagon,
  Trash2,
  Archive,
  Folder as FolderIcon,
  Tag,
  Plus,
  Settings2,
} from 'lucide-react';

import { logout } from '@/services/auth.service';
import {
  getMailFolders, getMailLabels, createMailFolder,
  type MailFolder, type MailFolderType, type MailLabel,
} from '@/services/mail.service';

/**
 * Itens de navegação do menu.
 * Cada item tem: ícone, label de tradução, rota, padrão de match e roles permitidos.
 */
const NAV_ITEMS = [
  { icon: Home, labelKey: 'nav.home', path: '/', end: true, roles: [] },
  { icon: Users, labelKey: 'nav.users', path: '/users', end: false, roles: ['ADMIN', 'HR'] },
  { icon: FolderOpen, labelKey: 'nav.projects', path: '/projects', end: false, roles: [] },
  { icon: Calendar, labelKey: 'nav.timesheets', path: '/timesheets', end: false, roles: [] },
  { icon: Mail, labelKey: 'nav.mail', path: '/mail', end: false, roles: [] },
  { icon: MessageSquare, labelKey: 'nav.feedbacks', path: '/feedbacks', end: false, roles: ['ADMIN'] },
  { icon: Settings, labelKey: 'nav.settings', path: '/settings', end: false, roles: [] },
] as const;

/**
 * Ícone de cada tipo de pasta no submenu de e-mail.
 */
const FOLDER_ICONS: Record<MailFolderType, typeof Inbox> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileText,
  SPAM: AlertOctagon,
  TRASH: Trash2,
  ARCHIVE: Archive,
  CUSTOM: FolderIcon,
};

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
 * Submenu em acordeão do item E-mail.
 * Lista pastas e etiquetas; a seleção atualiza a query string (?folder=/?label=).
 */
function MailAccordion({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useTranslation('mail');
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [folderName, setFolderName] = useState('');

  const selectedFolder = searchParams.get('folder');
  const selectedLabel = searchParams.get('label');

  /**
   * Busca pastas e etiquetas (sem tentativas repetidas caso não haja conta).
   */
  const { data: folders = [] } = useQuery({
    queryKey: ['mail-folders'],
    queryFn: getMailFolders,
    retry: false,
    staleTime: 30_000,
  });
  const { data: labels = [] } = useQuery({
    queryKey: ['mail-labels'],
    queryFn: getMailLabels,
    retry: false,
    staleTime: 30_000,
  });

  /**
   * Aplica a seleção (pasta ou etiqueta) na query string.
   */
  function select(key: 'folder' | 'label', value: string | null) {
    const next = new URLSearchParams(searchParams);
    next.delete('folder');
    next.delete('label');
    if (value) next.set(key, value);
    setSearchParams(next, { replace: true });
    onNavigate();
  }

  /**
   * Abre o diálogo de gestão do e-mail via query string (?manage=1),
   * tratado pela caixa de correio.
   */
  function openManagement() {
    setSearchParams(new URLSearchParams({ manage: '1' }), { replace: true });
    onNavigate();
  }

  /**
   * Cria uma pasta personalizada.
   */
  const createMutation = useMutation({
    mutationFn: (name: string) => createMailFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      setIsAdding(false);
      setFolderName('');
      toast.success(t('folders.created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Confirma a criação da pasta (Enter ou botão).
   */
  function handleSubmitFolder() {
    const name = folderName.trim();
    if (!name) return;
    createMutation.mutate(name);
  }

  return (
    <div className="mb-2">
      {/* ── Pastas ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pl-9 pr-2 pt-2 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366]">
          {t('folders.title')}
        </span>
        <button
          onClick={() => { setIsAdding(true); setFolderName(''); }}
          className="p-0.5 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
          title={t('folders.new')}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Todas as mensagens */}
      <button
        onClick={() => select('folder', null)}
        className={`
          w-full flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-lg text-xs transition-colors
          ${!selectedFolder && !selectedLabel
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
        `}
      >
        <Inbox size={13} className={!selectedFolder && !selectedLabel ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-[#636366]'} />
        <span className="flex-1 truncate text-left">{t('folders.all')}</span>
      </button>

      {/* Lista de pastas */}
      {folders.map((folder: MailFolder) => {
        const Icon = FOLDER_ICONS[folder.type] || FolderIcon;
        const active = selectedFolder === folder.id;
        return (
          <button
            key={folder.id}
            onClick={() => select('folder', folder.id)}
            className={`
              w-full flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-lg text-xs transition-colors
              ${active
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
            `}
          >
            <Icon size={13} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-[#636366]'} />
            <span className="flex-1 truncate text-left">{t(`folders.types.${folder.type}`, folder.name)}</span>
            {/* Quantidade total de e-mails na pasta */}
            {folder.totalCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-[#636366] tabular-nums">{folder.totalCount}</span>
            )}
            {/* Contador de não lidas */}
            {folder.unreadCount > 0 && (
              <span className="text-[10px] font-semibold bg-blue-600 text-white rounded-full px-1.5 py-px min-w-[16px] text-center">
                {folder.unreadCount}
              </span>
            )}
          </button>
        );
      })}

      {/* Formulário de nova pasta */}
      {isAdding && (
        <div className="flex items-center gap-1 pl-9 pr-2 py-1">
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitFolder();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            placeholder={t('folders.name_placeholder')}
            className="flex-1 min-w-0 text-xs px-2 py-1 rounded border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7]"
          />
          <button onClick={handleSubmitFolder} className="p-0.5 text-blue-600" title={t('common:buttons.save')}>
            <Plus size={12} />
          </button>
        </div>
      )}

      {/* ── Etiquetas ───────────────────────────────────────── */}
      {labels.length > 0 && (
        <>
          <span className="block pl-9 pr-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366]">
            {t('labels.title')}
          </span>
          {labels.map((label: MailLabel) => {
            const active = selectedLabel === label.id;
            return (
              <button
                key={label.id}
                onClick={() => select('label', active ? null : label.id)}
                className={`
                  w-full flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-lg text-xs transition-colors
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
                `}
              >
                <Tag size={13} style={{ color: label.color || '#6b7280' }} />
                <span className="flex-1 truncate text-left">{label.name}</span>
              </button>
            );
          })}
        </>
      )}

      {/* ── Configurações do e-mail (gestão) ───────────────── */}
      <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-[#2c2c2e]">
        <button
          onClick={openManagement}
          className="w-full flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-lg text-xs text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
        >
          <Settings2 size={13} className="text-gray-400 dark:text-[#636366]" />
          <span className="flex-1 truncate text-left">{t('manage.menu_item')}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Componente Sidebar - menu lateral esquerdo responsivo.
 *
 * Desktop: fixo à esquerda (w-60).
 * Mobile: drawer que desliza da esquerda com overlay escuro.
 */
export function Sidebar() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * Data/hora da última build do Vite (injetada em tempo de build).
   * Em produção coincide com o horário do deploy no GitHub Actions.
   * Exibida em UTC, de forma discreta, no rodapé do sidebar.
   */
  const buildTime = `${new Date(__BUILD_TIME__).toLocaleString(
    i18n.language === 'pt' ? 'pt-BR' : 'en-GB',
    { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' },
  )} UTC`;

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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter(({ roles }) => hasRoleAccess(roles)).map(({ icon: Icon, labelKey, path, end }) => {
            const active = isActive(path, end);
            const isMail = path === '/mail';
            return (
              <div key={path}>
                <button
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
                  <span className="flex-1 text-left">{t(labelKey)}</span>
                  {/* Indicador de submenu apenas no item E-mail */}
                  {isMail && (
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 dark:text-[#636366] transition-transform duration-200 ${active ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Submenu em acordeão do E-mail (apenas na página /mail) */}
                {isMail && active && <MailAccordion onNavigate={closeMobile} />}
              </div>
            );
          })}
        </nav>

        {/* ── Rodapé: logout ───────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-[#38383a] px-3 py-4">
          {/* Data/hora da última build (discreto) */}
          <p className="text-[10px] text-center text-gray-300 dark:text-[#48484a] select-none mb-1.5" title={buildTime}>
            {t('buttons.build_time', { date: buildTime })}
          </p>
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
