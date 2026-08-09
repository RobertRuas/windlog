/**
 * ============================================================================
 * MAIL MANAGEMENT DIALOG - Painel de Gestão do E-mail
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Diálogo com abas para gerenciar os recursos auxiliares do cliente de
 * e-mail: contatos e grupos, pastas, regras automáticas, etiquetas,
 * assinaturas, resposta automática (ausência) e remetentes bloqueados.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  X, Plus, Trash2, Pencil, Users, Workflow, Tag, PenLine,
  Moon, Ban, User, Folder, Lock, Inbox, Send, FileText,
  AlertOctagon, Archive,
} from 'lucide-react';

// Serviço
import * as mailService from '@/services/mail.service';
import type {
  MailContact, MailContactGroup, MailRule, MailLabel,
  MailSignature, MailBlockedSender, MailFolder, MailFolderType,
} from '@/services/mail.service';

/**
 * Abas disponíveis no painel de gestão.
 */
type ManagementTab = 'contacts' | 'folders' | 'rules' | 'labels' | 'signatures' | 'autoreply' | 'blocked';

/**
 * Props do componente MailManagementDialog.
 */
interface MailManagementDialogProps {
  /** Aba inicial */
  initialTab?: ManagementTab;
  /** Callback de fechamento */
  onClose: () => void;
}

/**
 * Classe reutilizável de input compacto.
 */
const inputClass = 'text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500';

/**
 * Componente MailManagementDialog - gestão dos recursos auxiliares.
 * Layout estilo painel de sistema: navegação lateral + área de conteúdo.
 */
export function MailManagementDialog({ initialTab = 'contacts', onClose }: MailManagementDialogProps) {
  const { t } = useTranslation('mail');
  const [tab, setTab] = useState<ManagementTab>(initialTab);

  /**
   * Fechamento pela tecla Esc.
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * Contadores para a navegação lateral (mesmas chaves de cache das abas).
   */
  const { data: contacts = [] } = useQuery({ queryKey: ['mail-contacts'], queryFn: mailService.getMailContacts });
  const { data: folders = [] } = useQuery({ queryKey: ['mail-folders'], queryFn: mailService.getMailFolders });
  const { data: rules = [] } = useQuery({ queryKey: ['mail-rules'], queryFn: mailService.getMailRules });
  const { data: labels = [] } = useQuery({ queryKey: ['mail-labels'], queryFn: mailService.getMailLabels });
  const { data: signatures = [] } = useQuery({ queryKey: ['mail-signatures'], queryFn: mailService.getMailSignatures });
  const { data: blocked = [] } = useQuery({ queryKey: ['mail-blocked'], queryFn: mailService.getBlockedSenders });

  /**
   * Definição das seções (ícone + label + contador).
   */
  const tabs: { id: ManagementTab; icon: typeof Users; label: string; count?: number }[] = [
    { id: 'contacts', icon: Users, label: t('manage.tabs.contacts'), count: contacts.length },
    { id: 'folders', icon: Folder, label: t('manage.tabs.folders'), count: folders.length },
    { id: 'rules', icon: Workflow, label: t('manage.tabs.rules'), count: rules.length },
    { id: 'labels', icon: Tag, label: t('manage.tabs.labels'), count: labels.length },
    { id: 'signatures', icon: PenLine, label: t('manage.tabs.signatures'), count: signatures.length },
    { id: 'autoreply', icon: Moon, label: t('manage.tabs.autoreply') },
    { id: 'blocked', icon: Ban, label: t('manage.tabs.blocked'), count: blocked.length },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] shadow-xl w-full max-w-4xl h-[80vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Navegação lateral ─────────────────────────────── */}
        <div className="w-52 flex-shrink-0 bg-gray-50 dark:bg-[#161618] border-r border-gray-200 dark:border-[#38383a] flex flex-col">
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5f7]">{t('manage.title')}</h2>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {tabs.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                  ${tab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-200/60 dark:hover:bg-[#2c2c2e]'}
                `}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`text-[11px] tabular-nums rounded-full px-1.5 py-px min-w-[18px] text-center ${
                    tab === id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-[#38383a] text-gray-500 dark:text-[#8e8e93]'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Área de conteúdo ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#38383a]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#f5f5f7]">
              {tabs.find(({ id }) => id === tab)?.label}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {tab === 'contacts' && <ContactsTab />}
            {tab === 'folders' && <FoldersTab />}
            {tab === 'rules' && <RulesTab />}
            {tab === 'labels' && <LabelsTab />}
            {tab === 'signatures' && <SignaturesTab />}
            {tab === 'autoreply' && <AutoReplyTab />}
            {tab === 'blocked' && <BlockedTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ABA: CONTATOS E GRUPOS
// =========================================================================

function ContactsTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery({ queryKey: ['mail-contacts'], queryFn: mailService.getMailContacts });
  const { data: groups = [] } = useQuery({ queryKey: ['mail-contact-groups'], queryFn: mailService.getMailContactGroups });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-contacts'] });
    queryClient.invalidateQueries({ queryKey: ['mail-contact-groups'] });
  }

  const createContact = useMutation({
    mutationFn: () => mailService.createMailContact({ name: name || undefined, email }),
    onSuccess: () => { invalidate(); setName(''); setEmail(''); toast.success(t('manage.contacts.created')); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeContact = useMutation({
    mutationFn: (id: string) => mailService.deleteMailContact(id),
    onSuccess: invalidate,
  });
  const createGroup = useMutation({
    mutationFn: () => mailService.createMailContactGroup({ name: groupName }),
    onSuccess: () => { invalidate(); setGroupName(''); toast.success(t('manage.contacts.group_created')); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeGroup = useMutation({
    mutationFn: (id: string) => mailService.deleteMailContactGroup(id),
    onSuccess: () => { invalidate(); setSelectedGroupId(null); },
  });
  const addMember = useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: string; contactId: string }) =>
      mailService.addGroupMember(groupId, contactId),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMember = useMutation({
    mutationFn: ({ groupId, contactId }: { groupId: string; contactId: string }) =>
      mailService.removeGroupMember(groupId, contactId),
    onSuccess: invalidate,
  });

  const selectedGroup: MailContactGroup | undefined = groups.find((g) => g.id === selectedGroupId);
  const memberIds = new Set(selectedGroup?.members.map((m) => m.contactId) || []);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Contatos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-[#f5f5f7] mb-2">{t('manage.tabs.contacts')}</h3>

        {/* Novo contato */}
        <div className="flex gap-1.5 mb-3">
          <input className={`${inputClass} flex-1`} placeholder={t('manage.contacts.name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
          <input className={`${inputClass} flex-1`} placeholder="email@..." type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={() => email && createContact.mutate()} className="form-button form-button-primary h-9 w-9 p-0 flex items-center justify-center" title={t('manage.contacts.add')}>
            <Plus size={15} />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-2">{t('manage.contacts.auto_hint')}</p>

        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {contacts.map((contact: MailContact) => (
            <li key={contact.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-sm text-gray-700 dark:text-[#e5e5ea]">
                {contact.name || contact.email}
              </span>
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{contact.email}</span>
              {contact.isAuto && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#38383a] text-gray-500">{t('manage.contacts.auto')}</span>}
              <button onClick={() => removeContact.mutate(contact.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Grupos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-[#f5f5f7] mb-2">{t('manage.contacts.groups')}</h3>

        <div className="flex gap-1.5 mb-3">
          <input className={`${inputClass} flex-1`} placeholder={t('manage.contacts.group_ph')} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <button onClick={() => groupName && createGroup.mutate()} className="form-button form-button-primary h-9 w-9 p-0 flex items-center justify-center" title={t('manage.contacts.add_group')}>
            <Plus size={15} />
          </button>
        </div>

        <div className="flex gap-4">
          {/* Lista de grupos */}
          <ul className="w-32 space-y-1 max-h-72 overflow-y-auto">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => setSelectedGroupId(group.id === selectedGroupId ? null : group.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm ${
                    selectedGroupId === group.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'
                  }`}
                >
                  <span className="truncate">{group.name}</span>
                  <span onClick={(e) => { e.stopPropagation(); removeGroup.mutate(group.id); }} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={12} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Membros do grupo selecionado */}
          {selectedGroup && (
            <div className="flex-1 max-h-72 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">{t('manage.contacts.members_hint')}</p>
              <ul className="space-y-1">
                {contacts.map((contact) => {
                  const isMember = memberIds.has(contact.id);
                  return (
                    <li key={contact.id}>
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-[#a1a1a6] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMember}
                          onChange={(e) => {
                            if (e.target.checked) addMember.mutate({ groupId: selectedGroup.id, contactId: contact.id });
                            else removeMember.mutate({ groupId: selectedGroup.id, contactId: contact.id });
                          }}
                        />
                        <span className="truncate">{contact.name || contact.email}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ABA: REGRAS AUTOMÁTICAS
// =========================================================================

function RulesTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ['mail-rules'], queryFn: mailService.getMailRules });
  const { data: folders = [] } = useQuery({ queryKey: ['mail-folders'], queryFn: mailService.getMailFolders });
  const { data: labels = [] } = useQuery({ queryKey: ['mail-labels'], queryFn: mailService.getMailLabels });

  const [form, setForm] = useState({
    name: '', conditionType: 'FROM', conditionValue: '', actionType: 'MOVE_TO_FOLDER', actionValue: '',
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-rules'] });
  }

  const createRule = useMutation({
    mutationFn: () => mailService.createMailRule({
      name: form.name,
      conditionType: form.conditionType as MailRule['conditionType'],
      conditionValue: form.conditionValue,
      actionType: form.actionType as MailRule['actionType'],
      actionValue: form.actionValue || undefined,
    }),
    onSuccess: () => {
      invalidate();
      setForm({ name: '', conditionType: 'FROM', conditionValue: '', actionType: 'MOVE_TO_FOLDER', actionValue: '' });
      toast.success(t('manage.rules.created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleRule = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => mailService.updateMailRule(id, { isActive }),
    onSuccess: invalidate,
  });
  const removeRule = useMutation({
    mutationFn: (id: string) => mailService.deleteMailRule(id),
    onSuccess: invalidate,
  });

  /**
   * Opções de valor da ação conforme o tipo.
   */
  function renderActionValue() {
    if (form.actionType === 'MOVE_TO_FOLDER') {
      return (
        <select className={inputClass} value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })}>
          <option value="">{t('manage.rules.select_folder')}</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{t(`folders.types.${f.type}`, f.name)}</option>
          ))}
        </select>
      );
    }
    if (form.actionType === 'LABEL') {
      return (
        <select className={inputClass} value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })}>
          <option value="">{t('manage.rules.select_label')}</option>
          {labels.map((l: MailLabel) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      );
    }
    if (form.actionType === 'FORWARD') {
      return (
        <input className={inputClass} placeholder="email@..." value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} />
      );
    }
    if (form.actionType === 'AUTO_REPLY') {
      return (
        <input className={inputClass} placeholder={t('manage.rules.auto_reply_text')} value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} />
      );
    }
    return null;
  }

  return (
    <div>
      {/* Formulário de nova regra */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-lg">
        <input className={inputClass} placeholder={t('manage.rules.name_ph')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={inputClass} value={form.conditionType} onChange={(e) => setForm({ ...form, conditionType: e.target.value })}>
          <option value="FROM">{t('manage.rules.cond_FROM')}</option>
          <option value="TO">{t('manage.rules.cond_TO')}</option>
          <option value="SUBJECT">{t('manage.rules.cond_SUBJECT')}</option>
          <option value="CONTAINS">{t('manage.rules.cond_CONTAINS')}</option>
          <option value="HAS_ATTACHMENT">{t('manage.rules.cond_HAS_ATTACHMENT')}</option>
        </select>
        {form.conditionType !== 'HAS_ATTACHMENT' && (
          <input className={inputClass} placeholder={t('manage.rules.condition_value')} value={form.conditionValue} onChange={(e) => setForm({ ...form, conditionValue: e.target.value })} />
        )}
        <select className={inputClass} value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value, actionValue: '' })}>
          <option value="MOVE_TO_FOLDER">{t('manage.rules.act_MOVE_TO_FOLDER')}</option>
          <option value="FLAG">{t('manage.rules.act_FLAG')}</option>
          <option value="MARK_IMPORTANT">{t('manage.rules.act_MARK_IMPORTANT')}</option>
          <option value="MARK_READ">{t('manage.rules.act_MARK_READ')}</option>
          <option value="LABEL">{t('manage.rules.act_LABEL')}</option>
          <option value="FORWARD">{t('manage.rules.act_FORWARD')}</option>
          <option value="AUTO_REPLY">{t('manage.rules.act_AUTO_REPLY')}</option>
          <option value="MOVE_TO_SPAM">{t('manage.rules.act_MOVE_TO_SPAM')}</option>
          <option value="DELETE">{t('manage.rules.act_DELETE')}</option>
        </select>
        {renderActionValue()}
        <button
          onClick={() => form.name && createRule.mutate()}
          className="form-button form-button-primary inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={15} />
          {t('manage.rules.add')}
        </button>
      </div>

      {/* Lista de regras */}
      {rules.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t('manage.rules.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule: MailRule) => (
            <li key={rule.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#38383a] rounded-lg">
              <label className="flex items-center cursor-pointer" title={t('manage.rules.active')}>
                <input
                  type="checkbox"
                  checked={rule.isActive}
                  onChange={(e) => toggleRule.mutate({ id: rule.id, isActive: e.target.checked })}
                />
              </label>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-[#f5f5f7] truncate">{rule.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {t(`manage.rules.cond_${rule.conditionType}`, rule.conditionType)}
                  {rule.conditionValue ? `: ${rule.conditionValue}` : ''} → {t(`manage.rules.act_${rule.actionType}`, rule.actionType)}
                </p>
              </div>
              <button onClick={() => removeRule.mutate(rule.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =========================================================================
// ABA: ETIQUETAS
// =========================================================================

function LabelsTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: labels = [] } = useQuery({ queryKey: ['mail-labels'], queryFn: mailService.getMailLabels });
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [editing, setEditing] = useState<MailLabel | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-labels'] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? mailService.updateMailLabel(editing.id, { name, color })
        : mailService.createMailLabel({ name, color }),
    onSuccess: () => { invalidate(); setName(''); setEditing(null); toast.success(t('manage.labels.saved')); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => mailService.deleteMailLabel(id),
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-300 dark:border-[#38383a] cursor-pointer" />
        <input className={`${inputClass} flex-1`} placeholder={t('manage.labels.name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={() => name && saveMutation.mutate()} className="form-button form-button-primary">
          {editing ? <Pencil size={15} /> : <Plus size={15} />}
        </button>
        {editing && (
          <button onClick={() => { setEditing(null); setName(''); }} className="form-button form-button-secondary">
            {t('common:buttons.cancel')}
          </button>
        )}
      </div>

      {labels.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t('labels.empty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {labels.map((label: MailLabel) => (
            <li key={label.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color || '#6b7280' }} />
              <span className="flex-1 text-sm text-gray-700 dark:text-[#e5e5ea]">{label.name}</span>
              <button onClick={() => { setEditing(label); setName(label.name); setColor(label.color || '#3b82f6'); }} className="text-gray-300 hover:text-blue-500">
                <Pencil size={13} />
              </button>
              <button onClick={() => removeMutation.mutate(label.id)} className="text-gray-300 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =========================================================================
// ABA: PASTAS
// =========================================================================

/**
 * Ícone de cada tipo de pasta na aba de gestão.
 */
const FOLDER_TAB_ICONS: Record<MailFolderType, typeof Folder> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileText,
  SPAM: AlertOctagon,
  TRASH: Trash2,
  ARCHIVE: Archive,
  CUSTOM: Folder,
};

/**
 * Aba de gestão de pastas: criar/renomear/remover pastas personalizadas.
 * As pastas padrão são protegidas (apenas cadeado, sem ações).
 */
function FoldersTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: folders = [] } = useQuery({ queryKey: ['mail-folders'], queryFn: mailService.getMailFolders });
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<MailFolder | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
  }

  /**
   * Cria uma nova pasta ou renomeia a pasta em edição.
   */
  const saveMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string | null; newName: string }) =>
      id ? mailService.renameMailFolder(id, newName) : mailService.createMailFolder(newName),
    onSuccess: (_data, { id }) => {
      invalidate();
      setName('');
      setEditing(null);
      toast.success(t(id ? 'folders.renamed' : 'folders.created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Remove uma pasta personalizada.
   */
  const removeMutation = useMutation({
    mutationFn: (id: string) => mailService.deleteMailFolder(id),
    onSuccess: () => { invalidate(); toast.success(t('folders.removed')); },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Confirma a criação/renomeação (Enter ou botão).
   */
  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveMutation.mutate({ id: editing ? editing.id : null, newName: trimmed });
  }

  return (
    <div>
      {/* Criar nova pasta / renomear */}
      <div className="flex gap-1.5 mb-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder={t('folders.name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} className="form-button form-button-primary">
          {editing ? <Pencil size={15} /> : <Plus size={15} />}
        </button>
        {editing && (
          <button onClick={() => { setEditing(null); setName(''); }} className="form-button form-button-secondary">
            {t('common:buttons.cancel')}
          </button>
        )}
      </div>

      {/* Aviso de proteção das pastas padrão */}
      <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#636366] mb-4">
        <Lock size={11} /> {t('manage.folders.protected_hint')}
      </p>

      <ul className="space-y-1.5">
        {folders.map((folder: MailFolder) => {
          const Icon = FOLDER_TAB_ICONS[folder.type] || Folder;
          const isCustom = folder.type === 'CUSTOM';
          return (
            <li key={folder.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
              <Icon size={15} className="text-gray-400 dark:text-[#636366] flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-700 dark:text-[#e5e5ea]">
                {t(`folders.types.${folder.type}`, folder.name)}
              </span>
              {/* Quantidade total de e-mails na pasta */}
              {folder.totalCount > 0 && (
                <span className="text-xs text-gray-400 dark:text-[#636366] tabular-nums">
                  {folder.totalCount}
                </span>
              )}
              {/* Contador de não lidas */}
              {folder.unreadCount > 0 && (
                <span className="text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {folder.unreadCount}
                </span>
              )}
              {isCustom ? (
                <>
                  <button
                    onClick={() => { setEditing(folder); setName(folder.name); }}
                    className="text-gray-300 hover:text-blue-500"
                    title={t('common:buttons.edit')}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(folder.id)}
                    className="text-gray-300 hover:text-red-500"
                    title={t('common:buttons.delete')}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              ) : (
                <span title={t('manage.folders.protected_hint')}>
                  <Lock size={12} className="text-gray-300 dark:text-[#636366]" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// =========================================================================
// ABA: ASSINATURAS
// =========================================================================

function SignaturesTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: signatures = [] } = useQuery({ queryKey: ['mail-signatures'], queryFn: mailService.getMailSignatures });
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [editing, setEditing] = useState<MailSignature | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-signatures'] });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? mailService.updateMailSignature(editing.id, { name, content, isDefault })
        : mailService.createMailSignature({ name, content, isDefault }),
    onSuccess: () => {
      invalidate();
      setName(''); setContent(''); setIsDefault(false); setEditing(null);
      toast.success(t('manage.signatures.saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => mailService.deleteMailSignature(id),
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="space-y-2 mb-4">
        <input className={`${inputClass} w-full`} placeholder={t('manage.signatures.name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className={`${inputClass} w-full resize-y`} rows={4} placeholder={t('manage.signatures.content_ph')} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a1a1a6] cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            {t('manage.signatures.default')}
          </label>
          <div className="flex gap-2">
            {editing && (
              <button onClick={() => { setEditing(null); setName(''); setContent(''); setIsDefault(false); }} className="form-button form-button-secondary">
                {t('common:buttons.cancel')}
              </button>
            )}
            <button onClick={() => name && content && saveMutation.mutate()} className="form-button form-button-primary inline-flex items-center gap-1.5">
              {editing ? <Pencil size={14} /> : <Plus size={14} />}
              {t('common:buttons.save')}
            </button>
          </div>
        </div>
      </div>

      {signatures.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t('manage.signatures.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {signatures.map((sig: MailSignature) => (
            <li key={sig.id} className="p-3 border border-gray-200 dark:border-[#38383a] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-[#f5f5f7]">{sig.name}</span>
                {sig.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                    {t('manage.signatures.default')}
                  </span>
                )}
                <span className="ml-auto flex gap-1.5">
                  <button onClick={() => { setEditing(sig); setName(sig.name); setContent(sig.content); setIsDefault(sig.isDefault); }} className="text-gray-300 hover:text-blue-500">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => removeMutation.mutate(sig.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-[#a1a1a6] whitespace-pre-wrap line-clamp-3">{sig.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =========================================================================
// ABA: RESPOSTA AUTOMÁTICA / AUSÊNCIA
// =========================================================================

function AutoReplyTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: autoReply } = useQuery({
    queryKey: ['mail-auto-reply'],
    queryFn: mailService.getAutoReply,
  });

  const [form, setForm] = useState({
    enabled: false, subject: '', message: '', startDate: '', endDate: '',
  });
  const [loaded, setLoaded] = useState(false);

  /**
   * Popula o formulário quando os dados chegam da API.
   */
  if (autoReply && !loaded) {
    setForm({
      enabled: autoReply.enabled,
      subject: autoReply.subject || '',
      message: autoReply.message || '',
      startDate: autoReply.startDate ? autoReply.startDate.slice(0, 10) : '',
      endDate: autoReply.endDate ? autoReply.endDate.slice(0, 10) : '',
    });
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => mailService.updateAutoReply({
      enabled: form.enabled,
      subject: form.subject,
      message: form.message,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-auto-reply'] });
      toast.success(t('manage.autoreply.saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-[#e5e5ea] cursor-pointer">
        <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        {t('manage.autoreply.enabled')}
      </label>
      <input className={`${inputClass} w-full`} placeholder={t('manage.autoreply.subject_ph')} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <textarea className={`${inputClass} w-full resize-y`} rows={5} placeholder={t('manage.autoreply.message_ph')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('manage.autoreply.start')}</label>
          <input type="date" className={`${inputClass} w-full`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('manage.autoreply.end')}</label>
          <input type="date" className={`${inputClass} w-full`} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      {autoReply && (
        <p className="text-xs text-gray-400">{t('manage.autoreply.once_hint')}</p>
      )}
      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="form-button form-button-primary disabled:opacity-50">
        {t('common:buttons.save')}
      </button>
    </div>
  );
}

// =========================================================================
// ABA: REMETENTES BLOQUEADOS
// =========================================================================

function BlockedTab() {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const { data: blocked = [] } = useQuery({ queryKey: ['mail-blocked'], queryFn: mailService.getBlockedSenders });
  const [email, setEmail] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-blocked'] });
  }

  const blockMutation = useMutation({
    mutationFn: () => mailService.blockSender(email),
    onSuccess: () => { invalidate(); setEmail(''); toast.success(t('manage.blocked.added')); },
    onError: (e: Error) => toast.error(e.message),
  });
  const unblockMutation = useMutation({
    mutationFn: (id: string) => mailService.unblockSender(id),
    onSuccess: invalidate,
  });

  return (
    <div className="max-w-lg">
      <div className="flex gap-1.5 mb-2">
        <input className={`${inputClass} flex-1`} placeholder="spam@dominio.com ou @dominio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button onClick={() => email && blockMutation.mutate()} className="form-button form-button-primary inline-flex items-center gap-1.5">
          <Ban size={14} />
          {t('manage.blocked.add')}
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">{t('manage.blocked.hint')}</p>

      {blocked.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t('manage.blocked.empty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {blocked.map((item: MailBlockedSender) => (
            <li key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
              <Ban size={13} className="text-red-400" />
              <span className="flex-1 text-sm text-gray-700 dark:text-[#e5e5ea]">{item.email}</span>
              <button onClick={() => unblockMutation.mutate(item.id)} className="text-xs text-gray-400 hover:text-blue-600">
                {t('manage.blocked.unblock')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
