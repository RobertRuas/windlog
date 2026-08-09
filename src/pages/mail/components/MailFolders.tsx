/**
 * ============================================================================
 * MAIL FOLDERS - Painel de Pastas e Etiquetas
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Coluna esquerda da caixa de correio: lista as pastas padrão e
 * personalizadas (com contadores de não lidas), etiquetas e ações de
 * gestão de pastas (criar/renomear/remover).
 * ============================================================================
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Inbox, Send, FileText, AlertOctagon, Trash2, Archive,
  Folder as FolderIcon, Plus, Pencil, X, Tag,
} from 'lucide-react';

// Serviço
import {
  getMailFolders, createMailFolder, renameMailFolder, deleteMailFolder,
  getMailLabels,
  type MailFolder, type MailFolderType, type MailLabel,
} from '@/services/mail.service';

/**
 * Ícone correspondente a cada tipo de pasta padrão.
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
 * Props do componente MailFolders.
 */
interface MailFoldersProps {
  /** ID da pasta atualmente selecionada (ou 'all') */
  selectedFolderId: string | null;
  /** Callback de seleção de pasta */
  onSelectFolder: (folderId: string | null) => void;
  /** Callback de seleção de etiqueta (filtro) */
  onSelectLabel: (labelId: string | null) => void;
  /** ID da etiqueta selecionada (filtro) */
  selectedLabelId: string | null;
}

/**
 * Componente MailFolders - lista de pastas, etiquetas e gestão de pastas.
 */
export function MailFolders({
  selectedFolderId,
  onSelectFolder,
  onSelectLabel,
  selectedLabelId,
}: MailFoldersProps) {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();

  // Estado da gestão de pastas
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');

  /**
   * Busca pastas e etiquetas.
   */
  const { data: folders = [] } = useQuery({
    queryKey: ['mail-folders'],
    queryFn: getMailFolders,
  });
  const { data: labels = [] } = useQuery({
    queryKey: ['mail-labels'],
    queryFn: getMailLabels,
  });

  /**
   * Invalida o cache de pastas após mutações.
   */
  function invalidateFolders() {
    queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
  }

  /**
   * Cria uma pasta personalizada.
   */
  const createMutation = useMutation({
    mutationFn: (name: string) => createMailFolder(name),
    onSuccess: () => {
      invalidateFolders();
      setIsAdding(false);
      setFolderName('');
      toast.success(t('folders.created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Renomeia uma pasta personalizada.
   */
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameMailFolder(id, name),
    onSuccess: () => {
      invalidateFolders();
      setEditingId(null);
      setFolderName('');
      toast.success(t('folders.renamed'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Remove uma pasta personalizada.
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMailFolder(id),
    onSuccess: () => {
      invalidateFolders();
      toast.success(t('folders.removed'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Confirma a criação/edição de pasta.
   */
  function handleSubmitFolder() {
    const name = folderName.trim();
    if (!name) return;
    if (editingId) {
      renameMutation.mutate({ id: editingId, name });
    } else {
      createMutation.mutate(name);
    }
  }

  /**
   * Renderiza um item de pasta.
   */
  function renderFolder(folder: MailFolder) {
    const Icon = FOLDER_ICONS[folder.type] || FolderIcon;
    const active = selectedFolderId === folder.id;
    const isCustom = folder.type === 'CUSTOM';

    // Modo edição (renomear pasta personalizada)
    if (editingId === folder.id) {
      return (
        <div key={folder.id} className="flex items-center gap-1 px-2 py-1">
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitFolder()}
            className="flex-1 min-w-0 text-sm px-2 py-1 rounded border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7]"
          />
          <button onClick={handleSubmitFolder} className="p-1 text-blue-600" title={t('common:buttons.save')}>
            <X size={14} className="rotate-45" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={folder.id}
        className={`
          group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
          ${active
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
            : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
        `}
        onClick={() => onSelectFolder(folder.id)}
      >
        <Icon size={16} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-[#636366]'} />
        <span className="flex-1 truncate">{t(`folders.types.${folder.type}`, folder.name)}</span>

        {/* Contador de não lidas */}
        {folder.unreadCount > 0 && (
          <span className="text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {folder.unreadCount}
          </span>
        )}

        {/* Ações para pastas personalizadas */}
        {isCustom && (
          <span className="hidden group-hover:flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); setEditingId(folder.id); setFolderName(folder.name); }}
              className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-[#f5f5f7]"
              title={t('common:buttons.edit')}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(folder.id); }}
              className="p-0.5 text-gray-400 hover:text-red-600"
              title={t('common:buttons.delete')}
            >
              <Trash2 size={13} />
            </button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-[#38383a] pr-3 space-y-4">
      {/* ── Pastas ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366]">
            {t('folders.title')}
          </span>
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFolderName(''); }}
            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
            title={t('folders.new')}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-0.5">
          {folders.map(renderFolder)}
        </div>

        {/* Formulário de nova pasta */}
        {isAdding && (
          <div className="flex items-center gap-1 px-2 py-1">
            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitFolder();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder={t('folders.name_placeholder')}
              className="flex-1 min-w-0 text-sm px-2 py-1 rounded border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7]"
            />
            <button onClick={handleSubmitFolder} className="p-1 text-blue-600" title={t('common:buttons.save')}>
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Etiquetas ──────────────────────────────────────── */}
      <div>
        <span className="block px-2 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366]">
          {t('labels.title')}
        </span>
        {labels.length === 0 ? (
          <p className="px-2 text-xs text-gray-400 dark:text-[#636366]">{t('labels.empty')}</p>
        ) : (
          <div className="space-y-0.5">
            {labels.map((label: MailLabel) => (
              <button
                key={label.id}
                onClick={() => onSelectLabel(selectedLabelId === label.id ? null : label.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${selectedLabelId === label.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
                `}
              >
                <Tag size={14} style={{ color: label.color || '#6b7280' }} />
                <span className="truncate">{label.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
