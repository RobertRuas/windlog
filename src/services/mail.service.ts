/**
 * ============================================================================
 * MAIL SERVICE - Serviço do Cliente de E-mail (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API do módulo de e-mail.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - Conta:      getMailConfig, connectAccount, getMailAccount, updateAccount,
 *               disconnectAccount, syncMail
 * - Pastas:     getFolders, createFolder, renameFolder, deleteFolder
 * - Mensagens:  getMessages, getMessage, getConversation, saveDraft,
 *               updateDraft, sendMail, updateFlags, moveMessage, deleteMessage
 * - Etiquetas:  CRUD + aplicar/remover em mensagens
 * - Regras:     CRUD de regras automáticas
 * - Contatos:   CRUD + grupos de contatos
 * - Assinaturas, remetentes bloqueados e resposta de ausência
 * - Anexos:     getAttachmentUrl (download)
 * ============================================================================
 */

import { api } from './api';

/**
 * Interface para a resposta padrão da API.
 */
interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

// =========================================================================
// TYPES - CONFIGURAÇÃO E CONTA
// =========================================================================

/** Tipo de pasta de e-mail (padrão ou personalizada). */
export type MailFolderType = 'INBOX' | 'SENT' | 'DRAFTS' | 'SPAM' | 'TRASH' | 'ARCHIVE' | 'CUSTOM';

/** Protocolo de recebimento suportado. */
export type MailProtocol = 'IMAP' | 'POP3';

/** Configurações fixas dos servidores (somente leitura). */
export interface MailServerConfig {
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
  pop3: { host: string; port: number; secure: boolean };
}

/** Conta de e-mail conectada (sem senha). */
export interface MailAccount {
  id: string;
  email: string;
  protocol: MailProtocol;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  notifyOnNew: boolean;
  createdAt: string;
  updatedAt: string;
  serverConfig: MailServerConfig;
}

// =========================================================================
// TYPES - PASTAS, MENSAGENS E ANEXOS
// =========================================================================

/** Pasta de e-mail com contadores. */
export interface MailFolder {
  id: string;
  name: string;
  type: MailFolderType;
  imapPath: string;
  unreadCount: number;
  totalCount: number;
  accountId: string;
}

/** Endereço de e-mail (remetente/destinatário). */
export interface MailAddress {
  name?: string;
  address: string;
}

/** Anexo de uma mensagem. */
export interface MailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
  isSuspicious: boolean;
}

/** Etiqueta personalizada. */
export interface MailLabel {
  id: string;
  name: string;
  color: string;
}

/** Mensagem na listagem (resumo). */
export interface MailMessageSummary {
  id: string;
  messageId: string | null;
  conversationId: string | null;
  from: MailAddress[];
  to: MailAddress[];
  subject: string;
  preview: string | null;
  date: string;
  isRead: boolean;
  isFlagged: boolean;
  isImportant: boolean;
  isSpam: boolean;
  hasAttachments: boolean;
  isDraft: boolean;
  hasSuspiciousAttachment: boolean;
  folderId: string;
  labels?: MailLabel[];
}

/** Mensagem completa (leitura). */
export interface MailMessageDetail extends MailMessageSummary {
  cc: MailAddress[];
  bcc: MailAddress[];
  textBody: string | null;
  htmlBody: string | null;
  size: number;
  attachments: MailAttachment[];
}

/** Resposta paginada de mensagens. */
export interface MailMessagesResponse {
  data: MailMessageSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Filtros avançados de busca de mensagens. */
export interface MailMessageFilters {
  folderId?: string;
  q?: string;
  from?: string;
  to?: string;
  subject?: string;
  content?: string;
  unread?: boolean;
  flagged?: boolean;
  important?: boolean;
  hasAttachments?: boolean;
  labelId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// =========================================================================
// TYPES - REGRAS, CONTATOS, ASSINATURAS, BLOQUEADOS, AUSÊNCIA
// =========================================================================

export type MailRuleCondition = 'FROM' | 'TO' | 'SUBJECT' | 'CONTAINS' | 'HAS_ATTACHMENT';
export type MailRuleAction =
  | 'MOVE_TO_FOLDER' | 'FLAG' | 'MARK_IMPORTANT' | 'MARK_READ' | 'LABEL'
  | 'FORWARD' | 'AUTO_REPLY' | 'MOVE_TO_SPAM' | 'DELETE';

/** Regra automática de classificação/encaminhamento/resposta. */
export interface MailRule {
  id: string;
  name: string;
  conditionType: MailRuleCondition;
  conditionValue: string;
  actionType: MailRuleAction;
  actionValue: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MailRulePayload {
  name: string;
  conditionType: MailRuleCondition;
  conditionValue: string;
  actionType: MailRuleAction;
  actionValue?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** Contato de e-mail (manual ou automático via envios). */
export interface MailContact {
  id: string;
  name: string | null;
  email: string;
  isAuto: boolean;
  createdAt: string;
}

/** Grupo de contatos para envios múltiplos. */
export interface MailContactGroup {
  id: string;
  name: string;
  /** Se o grupo é partilhado com todos os usuários (criado por ADMIN/HR) */
  isShared: boolean;
  /** ID do dono do grupo (único que pode editar/excluir) */
  userId: string;
  /** Dados básicos do dono do grupo */
  user?: { id: string; firstName: string; lastName: string };
  members: { id: string; contactId: string; contact: MailContact }[];
}

/** Assinatura personalizada. */
export interface MailSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

/** Remetente bloqueado. */
export interface MailBlockedSender {
  id: string;
  email: string;
  createdAt: string;
}

/** Resposta automática / mensagem de ausência. */
export interface MailAutoReply {
  enabled: boolean;
  subject: string;
  message: string;
  startDate: string | null;
  endDate: string | null;
  oncePerSender: boolean;
}

// =========================================================================
// API CALLS - CONFIGURAÇÃO E CONTA
// =========================================================================

/** Configurações fixas dos servidores (somente leitura). */
export async function getMailConfig(): Promise<MailServerConfig> {
  const response = await api.get<ApiResponse<MailServerConfig>>('/api/v1/mail/config');
  return response.data;
}

/** Conecta a conta informando apenas e-mail e senha. */
export async function connectMailAccount(payload: {
  email: string;
  password: string;
  protocol?: MailProtocol;
}): Promise<MailAccount> {
  const response = await api.post<ApiResponse<MailAccount>>('/api/v1/mail/account', payload);
  return response.data;
}

/** Busca a conta conectada (null se não conectada). */
export async function getMailAccount(): Promise<MailAccount | null> {
  const response = await api.get<ApiResponse<MailAccount | null>>('/api/v1/mail/account');
  return response.data;
}

/** Atualiza senha/protocolo/preferências da conta. */
export async function updateMailAccount(payload: {
  password?: string;
  protocol?: MailProtocol;
  notifyOnNew?: boolean;
}): Promise<MailAccount> {
  const response = await api.put<ApiResponse<MailAccount>>('/api/v1/mail/account', payload);
  return response.data;
}

/** Desconecta a conta (interrompe a sincronização). */
export async function disconnectMailAccount(): Promise<void> {
  await api.delete('/api/v1/mail/account');
}

/** Força sincronização imediata. */
export async function syncMail(): Promise<{ newMessages: number; syncedAt: string }> {
  const response = await api.post<ApiResponse<{ newMessages: number; syncedAt: string }>>(
    '/api/v1/mail/sync',
    {},
  );
  return response.data;
}

// =========================================================================
// API CALLS - PASTAS
// =========================================================================

/** Lista pastas padrão e personalizadas com contadores. */
export async function getMailFolders(): Promise<MailFolder[]> {
  const response = await api.get<ApiResponse<MailFolder[]>>('/api/v1/mail/folders');
  return response.data;
}

/** Cria uma pasta personalizada. */
export async function createMailFolder(name: string): Promise<MailFolder> {
  const response = await api.post<ApiResponse<MailFolder>>('/api/v1/mail/folders', { name });
  return response.data;
}

/** Renomeia uma pasta personalizada. */
export async function renameMailFolder(id: string, name: string): Promise<MailFolder> {
  const response = await api.put<ApiResponse<MailFolder>>(`/api/v1/mail/folders/${id}`, { name });
  return response.data;
}

/** Remove uma pasta personalizada. */
export async function deleteMailFolder(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/folders/${id}`);
}

// =========================================================================
// API CALLS - MENSAGENS
// =========================================================================

/** Lista mensagens com busca avançada e paginação. */
export async function getMailMessages(filters?: MailMessageFilters): Promise<MailMessagesResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  const queryString = params.toString();
  const url = `/api/v1/mail/messages${queryString ? `?${queryString}` : ''}`;
  const response = await api.get<ApiResponse<MailMessagesResponse>>(url);
  return response.data;
}

/** Busca mensagem completa (marca como lida). */
export async function getMailMessage(id: string): Promise<MailMessageDetail> {
  const response = await api.get<ApiResponse<MailMessageDetail>>(`/api/v1/mail/messages/${id}`);
  return response.data;
}

/** Lista todas as mensagens de uma conversa. */
export async function getMailConversation(conversationId: string): Promise<MailMessageDetail[]> {
  const response = await api.get<ApiResponse<MailMessageDetail[]>>(
    `/api/v1/mail/messages/conversations/${encodeURIComponent(conversationId)}`,
  );
  return response.data;
}

/** Salva/atualiza um rascunho. */
export async function saveMailDraft(
  payload: { to: MailAddress[]; cc?: MailAddress[]; subject: string; body: string; isHtml?: boolean },
  draftId?: string,
): Promise<MailMessageDetail> {
  const response = draftId
    ? await api.put<ApiResponse<MailMessageDetail>>(`/api/v1/mail/messages/draft/${draftId}`, payload)
    : await api.post<ApiResponse<MailMessageDetail>>('/api/v1/mail/messages/draft', payload);
  return response.data;
}

/**
 * Envia um e-mail (multipart: campos JSON + anexos opcionais).
 * Os destinatários aceitam contatos/grupos já resolvidos em endereços.
 */
export async function sendMail(payload: {
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  body: string;
  isHtml?: boolean;
  draftId?: string;
  inReplyTo?: string;
  files?: File[];
}): Promise<MailMessageDetail> {
  const formData = new FormData();
  formData.append('to', JSON.stringify(payload.to));
  if (payload.cc?.length) formData.append('cc', JSON.stringify(payload.cc));
  if (payload.bcc?.length) formData.append('bcc', JSON.stringify(payload.bcc));
  formData.append('subject', payload.subject);
  formData.append('body', payload.body);
  formData.append('isHtml', payload.isHtml ? 'true' : 'false');
  if (payload.draftId) formData.append('draftId', payload.draftId);
  if (payload.inReplyTo) formData.append('inReplyTo', payload.inReplyTo);
  payload.files?.forEach((file) => formData.append('files', file));

  const response = await api.post<ApiResponse<MailMessageDetail>>(
    '/api/v1/mail/messages/send',
    formData,
    { isFormData: true },
  );
  return response.data;
}

/** Atualiza flags da mensagem (lida, sinalizada, importante). */
export async function updateMessageFlags(
  id: string,
  flags: { isRead?: boolean; isFlagged?: boolean; isImportant?: boolean },
): Promise<MailMessageSummary> {
  const response = await api.patch<ApiResponse<MailMessageSummary>>(
    `/api/v1/mail/messages/${id}/flags`,
    flags,
  );
  return response.data;
}

/** Move mensagem para outra pasta (arquivar, spam, personalizadas). */
export async function moveMailMessage(id: string, folderId: string): Promise<MailMessageSummary> {
  const response = await api.post<ApiResponse<MailMessageSummary>>(
    `/api/v1/mail/messages/${id}/move`,
    { folderId },
  );
  return response.data;
}

/** Remove mensagem (lixeira → remoção definitiva). */
export async function deleteMailMessage(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/messages/${id}`);
}

/**
 * Download de anexo com autenticação (fetch + blob).
 * Gera o download no browser mantendo o header Authorization.
 */
export async function downloadMailAttachment(attachmentId: string, filename: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`/api/v1/mail/attachments/${attachmentId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// =========================================================================
// API CALLS - ETIQUETAS
// =========================================================================

export async function getMailLabels(): Promise<MailLabel[]> {
  const response = await api.get<ApiResponse<MailLabel[]>>('/api/v1/mail/labels');
  return response.data;
}

export async function createMailLabel(payload: { name: string; color?: string }): Promise<MailLabel> {
  const response = await api.post<ApiResponse<MailLabel>>('/api/v1/mail/labels', payload);
  return response.data;
}

export async function updateMailLabel(id: string, payload: { name?: string; color?: string }): Promise<MailLabel> {
  const response = await api.put<ApiResponse<MailLabel>>(`/api/v1/mail/labels/${id}`, payload);
  return response.data;
}

export async function deleteMailLabel(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/labels/${id}`);
}

export async function applyMessageLabel(messageId: string, labelId: string): Promise<void> {
  await api.post(`/api/v1/mail/messages/${messageId}/labels`, { labelId });
}

export async function removeMessageLabel(messageId: string, labelId: string): Promise<void> {
  await api.delete(`/api/v1/mail/messages/${messageId}/labels`, { labelId });
}

// =========================================================================
// API CALLS - REGRAS AUTOMÁTICAS
// =========================================================================

export async function getMailRules(): Promise<MailRule[]> {
  const response = await api.get<ApiResponse<MailRule[]>>('/api/v1/mail/rules');
  return response.data;
}

export async function createMailRule(payload: MailRulePayload): Promise<MailRule> {
  const response = await api.post<ApiResponse<MailRule>>('/api/v1/mail/rules', payload);
  return response.data;
}

export async function updateMailRule(id: string, payload: Partial<MailRulePayload>): Promise<MailRule> {
  const response = await api.put<ApiResponse<MailRule>>(`/api/v1/mail/rules/${id}`, payload);
  return response.data;
}

export async function deleteMailRule(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/rules/${id}`);
}

// =========================================================================
// API CALLS - CONTATOS E GRUPOS
// =========================================================================

export async function getMailContacts(): Promise<MailContact[]> {
  const response = await api.get<ApiResponse<MailContact[]>>('/api/v1/mail/contacts');
  return response.data;
}

export async function createMailContact(payload: { name?: string; email: string }): Promise<MailContact> {
  const response = await api.post<ApiResponse<MailContact>>('/api/v1/mail/contacts', payload);
  return response.data;
}

export async function updateMailContact(id: string, payload: { name?: string; email?: string }): Promise<MailContact> {
  const response = await api.put<ApiResponse<MailContact>>(`/api/v1/mail/contacts/${id}`, payload);
  return response.data;
}

export async function deleteMailContact(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/contacts/${id}`);
}

export async function getMailContactGroups(): Promise<MailContactGroup[]> {
  const response = await api.get<ApiResponse<MailContactGroup[]>>('/api/v1/mail/contact-groups');
  return response.data;
}

export async function createMailContactGroup(payload: { name: string }): Promise<MailContactGroup> {
  const response = await api.post<ApiResponse<MailContactGroup>>('/api/v1/mail/contact-groups', payload);
  return response.data;
}

export async function updateMailContactGroup(id: string, payload: { name?: string }): Promise<MailContactGroup> {
  const response = await api.put<ApiResponse<MailContactGroup>>(`/api/v1/mail/contact-groups/${id}`, payload);
  return response.data;
}

export async function deleteMailContactGroup(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/contact-groups/${id}`);
}

export async function addGroupMember(groupId: string, contactId: string): Promise<MailContactGroup> {
  const response = await api.post<ApiResponse<MailContactGroup>>(
    `/api/v1/mail/contact-groups/${groupId}/members`,
    { contactId },
  );
  return response.data;
}

export async function removeGroupMember(groupId: string, contactId: string): Promise<MailContactGroup> {
  const response = await api.delete<ApiResponse<MailContactGroup>>(
    `/api/v1/mail/contact-groups/${groupId}/members`,
    { contactId },
  );
  return response.data;
}

// =========================================================================
// API CALLS - ASSINATURAS, BLOQUEADOS E AUSÊNCIA
// =========================================================================

export async function getMailSignatures(): Promise<MailSignature[]> {
  const response = await api.get<ApiResponse<MailSignature[]>>('/api/v1/mail/signatures');
  return response.data;
}

export async function createMailSignature(payload: {
  name: string;
  content: string;
  isDefault?: boolean;
}): Promise<MailSignature> {
  const response = await api.post<ApiResponse<MailSignature>>('/api/v1/mail/signatures', payload);
  return response.data;
}

export async function updateMailSignature(
  id: string,
  payload: { name?: string; content?: string; isDefault?: boolean },
): Promise<MailSignature> {
  const response = await api.put<ApiResponse<MailSignature>>(`/api/v1/mail/signatures/${id}`, payload);
  return response.data;
}

export async function deleteMailSignature(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/signatures/${id}`);
}

export async function getBlockedSenders(): Promise<MailBlockedSender[]> {
  const response = await api.get<ApiResponse<MailBlockedSender[]>>('/api/v1/mail/blocked-senders');
  return response.data;
}

export async function blockSender(email: string): Promise<MailBlockedSender> {
  const response = await api.post<ApiResponse<MailBlockedSender>>('/api/v1/mail/blocked-senders', { email });
  return response.data;
}

export async function unblockSender(id: string): Promise<void> {
  await api.delete(`/api/v1/mail/blocked-senders/${id}`);
}

export async function getAutoReply(): Promise<MailAutoReply | null> {
  const response = await api.get<ApiResponse<MailAutoReply | null>>('/api/v1/mail/auto-reply');
  return response.data;
}

export async function updateAutoReply(payload: {
  enabled: boolean;
  subject?: string;
  message?: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<MailAutoReply> {
  const response = await api.put<ApiResponse<MailAutoReply>>('/api/v1/mail/auto-reply', payload);
  return response.data;
}
