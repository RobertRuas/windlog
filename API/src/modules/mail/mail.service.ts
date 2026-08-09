/**
 * ============================================================================
 * MAIL SERVICE - Lógica de Negócio do Módulo de E-mail
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Service central do módulo de e-mail com toda a lógica de negócio:
 *
 * - Conta:     conectar (validando credenciais), atualizar, desconectar
 * - Pastas:    listagem, criação/renomear/remover pastas personalizadas
 * - Mensagens: listagem com busca avançada, leitura, rascunhos, envio,
 *              flags (lida/sinalizada/importante), mover, remover
 * - Etiquetas: CRUD + associação a mensagens
 * - Regras:    CRUD de regras automáticas
 * - Contatos:  CRUD + grupos + adição automática ao enviar
 * - Assinaturas, remetentes bloqueados e resposta automática
 *
 * SEGURANÇA:
 * ----------
 * - Senha da conta cifrada com AES-256-GCM (mail-crypto.util)
 * - Toda operação valida a posse da conta (account.userId === userId)
 * - Envio sempre via TLS (send.one.com:465)
 * ============================================================================
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { PrismaService } from '../../database/prisma.service.js';
import { MailSyncService, buildConversationId } from './mail-sync.service.js';
import { encryptSecret, decryptSecret } from './mail-crypto.util.js';
import { sendMail as smtpSend, formatAddresses } from './mail-transport.util.js';
import { Pop3Client } from './pop3.client.js';
import { MAIL_SERVERS } from './mail.config.js';
import type {
  ConnectMailAccountDto,
  UpdateMailAccountDto,
  MailFolderDto,
  SendMailDto,
  SaveDraftDto,
  UpdateMessageFlagsDto,
  MoveMessageDto,
  MessageFilterDto,
  MailLabelDto,
  MessageLabelDto,
  CreateMailRuleDto,
  UpdateMailRuleDto,
  MailContactDto,
  MailContactGroupDto,
  GroupMemberDto,
  MailSignatureDto,
  BlockSenderDto,
  AutoReplyDto,
} from './dto/mail.dto.js';

/**
 * Serviço MailService - operações do módulo de e-mail.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: MailSyncService,
  ) {}

  // =========================================================================
  // CONTA DE E-MAIL
  // =========================================================================

  /**
   * Configurações fixas dos servidores (somente leitura para o frontend).
   */
  getServerConfig() {
    return MAIL_SERVERS;
  }

  /**
   * Conecta a conta de e-mail do usuário (e-mail + senha apenas).
   * Valida as credenciais no servidor antes de salvar.
   */
  async connectAccount(userId: string, dto: ConnectMailAccountDto) {
    const protocol = dto.protocol || 'IMAP';

    // Valida as credenciais no servidor real (IMAP ou POP3)
    await this.validateCredentials(dto.email, dto.password, protocol);

    const passwordEnc = encryptSecret(dto.password);

    // Upsert: se o usuário já tinha conta (mesmo desconectada), atualiza
    const existing = await this.prisma.mailAccount.findUnique({ where: { userId } });
    const account = existing
      ? await this.prisma.mailAccount.update({
          where: { userId },
          data: {
            email: dto.email,
            passwordEnc,
            protocol,
            isActive: true,
            deletedAt: null,
            lastSyncError: null,
          },
        })
      : await this.prisma.mailAccount.create({
          data: { userId, email: dto.email, passwordEnc, protocol },
        });

    // Dispara a primeira sincronização em segundo plano (não bloqueia)
    this.syncService.syncAccount(account.id).catch((e) =>
      this.logger.warn(`Sincronização inicial falhou: ${e.message}`),
    );

    return this.sanitizeAccount(account);
  }

  /**
   * Retorna a conta de e-mail do usuário (sem senha) + estado da sincronização.
   */
  async getAccount(userId: string) {
    const account = await this.prisma.mailAccount.findUnique({ where: { userId } });
    if (!account || account.deletedAt) return null;
    return this.sanitizeAccount(account);
  }

  /**
   * Atualiza a conta (nova senha, protocolo ou preferências de notificação).
   */
  async updateAccount(userId: string, dto: UpdateMailAccountDto) {
    const account = await this.requireAccount(userId);

    // Se mudou a senha, valida antes de salvar
    if (dto.password) {
      const protocol = dto.protocol || account.protocol;
      await this.validateCredentials(account.email, dto.password, protocol);
    }

    const updated = await this.prisma.mailAccount.update({
      where: { id: account.id },
      data: {
        passwordEnc: dto.password ? encryptSecret(dto.password) : undefined,
        protocol: dto.protocol,
        notifyOnNew: dto.notifyOnNew,
      },
    });
    return this.sanitizeAccount(updated);
  }

  /**
   * Desconecta a conta de e-mail (soft delete).
   * As mensagens permanecem no banco mas a sincronização para.
   */
  async disconnectAccount(userId: string) {
    const account = await this.requireAccount(userId);
    await this.prisma.mailAccount.update({
      where: { id: account.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    return { message: 'Mail account disconnected' };
  }

  /**
   * Sincronização manual imediata da conta.
   */
  async manualSync(userId: string) {
    const account = await this.requireAccount(userId);
    const newMessages = await this.syncService.syncAccount(account.id);
    return { newMessages, syncedAt: new Date().toISOString() };
  }

  /**
   * Valida credenciais conectando ao servidor (IMAP ou POP3).
   */
  private async validateCredentials(email: string, password: string, protocol: string): Promise<void> {
    try {
      if (protocol === 'POP3') {
        const client = new Pop3Client(MAIL_SERVERS.pop3.host, MAIL_SERVERS.pop3.port);
        await client.connect();
        try {
          await client.login(email, password);
        } finally {
          await client.quit().catch(() => undefined);
        }
        return;
      }
      const client = new ImapFlow({
        host: MAIL_SERVERS.imap.host,
        port: MAIL_SERVERS.imap.port,
        secure: MAIL_SERVERS.imap.secure,
        auth: { user: email, pass: password },
        logger: false,
      });
      await client.connect();
      await client.logout().catch(() => undefined);
    } catch (error) {
      if (error.responseCode === 401 || /auth|login|credential/i.test(error.message || '')) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw new BadRequestException(`Cannot connect to mail server: ${error.message}`);
    }
  }

  /**
   * Busca a conta do usuário ou lança 404.
   */
  private async requireAccount(userId: string) {
    const account = await this.prisma.mailAccount.findUnique({ where: { userId } });
    if (!account || account.deletedAt) {
      throw new NotFoundException('Mail account not found. Connect your account first.');
    }
    return account;
  }

  /**
   * Remove campos sensíveis da conta antes de retornar ao frontend.
   */
  private sanitizeAccount(account: {
    id: string; email: string; protocol: unknown; isActive: boolean;
    lastSyncAt: Date | null; lastSyncError: string | null; notifyOnNew: boolean;
    createdAt: Date; updatedAt: Date;
  }) {
    const { ...safe } = account;
    return { ...safe, serverConfig: MAIL_SERVERS };
  }

  // =========================================================================
  // PASTAS
  // =========================================================================

  /**
   * Lista as pastas da conta (padrão + personalizadas) com contadores.
   */
  async listFolders(userId: string) {
    const account = await this.requireAccount(userId);
    return this.prisma.mailFolder.findMany({
      where: { accountId: account.id, deletedAt: null },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Cria uma pasta personalizada (no banco e no servidor IMAP).
   */
  async createFolder(userId: string, dto: MailFolderDto) {
    const account = await this.requireAccount(userId);

    // Cria a pasta no servidor IMAP (best-effort para contas IMAP)
    if (account.protocol === 'IMAP') {
      await this.withImapClient(account, async (client) => {
        await client.mailboxCreate(dto.name);
      });
    }

    return this.prisma.mailFolder.create({
      data: { accountId: account.id, name: dto.name, imapPath: dto.name, type: 'CUSTOM' },
    });
  }

  /**
   * Renomeia uma pasta personalizada.
   */
  async renameFolder(userId: string, folderId: string, dto: MailFolderDto) {
    const { folder } = await this.requireFolder(userId, folderId);
    if (folder.type !== 'CUSTOM') {
      throw new BadRequestException('Default folders cannot be renamed');
    }
    return this.prisma.mailFolder.update({
      where: { id: folder.id },
      data: { name: dto.name, imapPath: dto.name },
    });
  }

  /**
   * Remove uma pasta personalizada (soft delete).
   */
  async removeFolder(userId: string, folderId: string) {
    const { account, folder } = await this.requireFolder(userId, folderId);
    if (folder.type !== 'CUSTOM') {
      throw new BadRequestException('Default folders cannot be removed');
    }

    // Move mensagens da pasta para a lixeira antes de remover
    const trash = await this.prisma.mailFolder.findFirst({
      where: { accountId: account.id, type: 'TRASH', deletedAt: null },
    });
    if (trash) {
      await this.prisma.mailMessage.updateMany({
        where: { folderId: folder.id },
        data: { folderId: trash.id },
      });
    }

    // Remove a pasta no servidor IMAP (best-effort)
    if (account.protocol === 'IMAP') {
      await this.withImapClient(account, async (client) => {
        await client.mailboxDelete(folder.imapPath);
      }).catch(() => undefined);
    }

    await this.prisma.mailFolder.update({
      where: { id: folder.id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Folder removed' };
  }

  /**
   * Busca pasta validando posse (lança 404 se não pertencer ao usuário).
   */
  private async requireFolder(userId: string, folderId: string) {
    const account = await this.requireAccount(userId);
    const folder = await this.prisma.mailFolder.findFirst({
      where: { id: folderId, accountId: account.id, deletedAt: null },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return { account, folder };
  }

  // =========================================================================
  // MENSAGENS - LISTAGEM E BUSCA
  // =========================================================================

  /**
   * Lista mensagens com paginação e busca avançada.
   * Filtros: pasta, texto livre, remetente, destinatário, assunto, conteúdo,
   * flags (não lida, sinalizada, importante, anexos), etiqueta e período.
   */
  async listMessages(userId: string, filter: MessageFilterDto) {
    const account = await this.requireAccount(userId);
    const { page = 1, limit = 20 } = filter;

    // Constrói o where dinamicamente
    const where: Record<string, unknown> = {
      accountId: account.id,
      deletedAt: null,
    };

    if (filter.folderId) where.folderId = filter.folderId;
    if (filter.unread !== undefined) where.isRead = !filter.unread;
    if (filter.flagged !== undefined) where.isFlagged = filter.flagged;
    if (filter.important !== undefined) where.isImportant = filter.important;
    if (filter.hasAttachments !== undefined) where.hasAttachments = filter.hasAttachments;
    if (filter.labelId) where.labels = { some: { labelId: filter.labelId } };

    // Busca textual livre (assunto, preview, corpo)
    if (filter.q) {
      where.OR = [
        { subject: { contains: filter.q, mode: 'insensitive' } },
        { preview: { contains: filter.q, mode: 'insensitive' } },
        { textBody: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos por campo de cabeçalho/corpo
    if (filter.subject) where.subject = { contains: filter.subject, mode: 'insensitive' };
    if (filter.content) where.textBody = { contains: filter.content, mode: 'insensitive' };
    if (filter.from) {
      where.from = { path: [], string_contains: filter.from };
    }
    if (filter.to) {
      where.to = { path: [], string_contains: filter.to };
    }

    // Filtro por período
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) (where.date as Record<string, unknown>).gte = new Date(filter.startDate);
      if (filter.endDate) (where.date as Record<string, unknown>).lte = new Date(filter.endDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.mailMessage.findMany({
        where: where as never,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          labels: { include: { label: true } },
          _count: { select: { attachments: true } },
        },
      }),
      this.prisma.mailMessage.count({ where: where as never }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Busca uma mensagem completa (corpo + anexos + etiquetas).
   * Marca automaticamente como lida.
   */
  async getMessage(userId: string, messageId: string) {
    const account = await this.requireAccount(userId);
    const message = await this.prisma.mailMessage.findFirst({
      where: { id: messageId, accountId: account.id, deletedAt: null },
      include: {
        attachments: true,
        labels: { include: { label: true } },
        folder: { select: { id: true, name: true, type: true } },
      },
    });
    if (!message) throw new NotFoundException('Message not found');

    // Marca como lida automaticamente ao abrir
    if (!message.isRead) {
      await this.prisma.mailMessage.update({ where: { id: message.id }, data: { isRead: true } });
      message.isRead = true;
    }
    return message;
  }

  /**
   * Lista todas as mensagens de uma conversa (agrupamento por thread).
   */
  async getConversation(userId: string, conversationId: string) {
    const account = await this.requireAccount(userId);
    return this.prisma.mailMessage.findMany({
      where: { accountId: account.id, conversationId, deletedAt: null },
      orderBy: { date: 'asc' },
      include: { labels: { include: { label: true } } },
    });
  }

  // =========================================================================
  // MENSAGENS - RASCUNHOS E ENVIO
  // =========================================================================

  /**
   * Salva um rascunho localmente (na pasta DRAFTS).
   * Se draftId for informado, atualiza o rascunho existente.
   */
  async saveDraft(userId: string, dto: SaveDraftDto, draftId?: string) {
    const account = await this.requireAccount(userId);

    // Garante a pasta de rascunhos
    const drafts = await this.ensureFolder(account.id, 'DRAFTS', 'Rascunhos');

    const data = {
      to: (dto.to || []) as never,
      cc: (dto.cc || []) as never,
      bcc: (dto.bcc || []) as never,
      subject: dto.subject || '',
      textBody: dto.isHtml ? undefined : dto.body || '',
      htmlBody: dto.isHtml ? dto.body || '' : undefined,
      preview: (dto.body || '').slice(0, 200),
      isDraft: true,
      conversationId: buildConversationId(dto.subject || ''),
    };

    if (draftId) {
      const existing = await this.prisma.mailMessage.findFirst({
        where: { id: draftId, accountId: account.id, isDraft: true, deletedAt: null },
      });
      if (!existing) throw new NotFoundException('Draft not found');
      return this.prisma.mailMessage.update({ where: { id: draftId }, data });
    }

    return this.prisma.mailMessage.create({
      data: { ...data, accountId: account.id, folderId: drafts.id, date: new Date() },
    });
  }

  /**
   * Envia um e-mail via SMTP (servidor fixo send.one.com, TLS).
   * Salva cópia na pasta SENT e adiciona destinatários aos contatos.
   *
   * @param attachments - ficheiros enviados via multipart (opcional)
   */
  async send(userId: string, dto: SendMailDto, attachments?: Express.Multer.File[]) {
    const account = await this.requireAccount(userId);
    if (!dto.to?.length) throw new BadRequestException('At least one recipient is required');

    const password = decryptSecret(account.passwordEnc);

    // Monta os anexos (ficheiros multipart salvos temporariamente)
    const smtpAttachments = (attachments || []).map((f) => ({
      filename: f.originalname,
      path: f.path,
      contentType: f.mimetype,
    }));

    // Envia via SMTP com TLS
    await smtpSend(account.email, password, {
      from: account.email,
      to: formatAddresses(dto.to),
      cc: dto.cc?.length ? formatAddresses(dto.cc) : undefined,
      bcc: dto.bcc?.length ? formatAddresses(dto.bcc) : undefined,
      subject: dto.subject || '',
      text: dto.isHtml ? undefined : dto.body || '',
      html: dto.isHtml ? dto.body || '' : undefined,
      inReplyTo: dto.inReplyTo,
      references: dto.references,
      attachments: smtpAttachments.length ? smtpAttachments : undefined,
    });

    // Salva cópia na pasta de enviados
    const sentFolder = await this.ensureFolder(account.id, 'SENT', 'Enviados');
    const message = await this.prisma.mailMessage.create({
      data: {
        accountId: account.id,
        folderId: sentFolder.id,
        from: [{ name: '', address: account.email }] as never,
        to: dto.to as never,
        cc: (dto.cc || []) as never,
        bcc: (dto.bcc || []) as never,
        subject: dto.subject || '',
        textBody: dto.isHtml ? undefined : dto.body || '',
        htmlBody: dto.isHtml ? dto.body || '' : undefined,
        preview: (dto.body || '').slice(0, 200),
        date: new Date(),
        isRead: true,
        isDraft: false,
        conversationId: buildConversationId(dto.subject || '', dto.inReplyTo),
        inReplyTo: dto.inReplyTo || null,
        hasAttachments: smtpAttachments.length > 0,
      },
    });

    // Registra os anexos enviados no banco (move para uploads/{userId}/mail/)
    for (const file of attachments || []) {
      const filePath = await this.moveToMailUploads(account.userId, file);
      await this.prisma.mailAttachment.create({
        data: {
          messageId: message.id,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          filePath,
        },
      });
    }

    // Remove o rascunho se o envio partiu de um rascunho
    if (dto.draftId) {
      await this.prisma.mailMessage
        .update({ where: { id: dto.draftId }, data: { deletedAt: new Date() } })
        .catch(() => undefined);
    }

    // Adiciona todos os destinatários à lista de contatos automaticamente
    await this.autoAddContacts(account.userId, [...dto.to, ...(dto.cc || []), ...(dto.bcc || [])]);

    return message;
  }

  // =========================================================================
  // MENSAGENS - FLAGS, MOVER E REMOVER
  // =========================================================================

  /**
   * Atualiza flags da mensagem (lida/não lida, sinalizada, importante).
   * Também sincroniza as flags no servidor IMAP (best-effort).
   */
  async updateFlags(userId: string, messageId: string, dto: UpdateMessageFlagsDto) {
    const { account, message } = await this.requireMessage(userId, messageId);

    const updated = await this.prisma.mailMessage.update({
      where: { id: messageId },
      data: {
        isRead: dto.isRead,
        isFlagged: dto.isFlagged,
        isImportant: dto.isImportant,
      },
    });

    // Sincroniza a flag \Seen no servidor (best-effort)
    const seenUid = message.uid;
    if (dto.isRead !== undefined && account.protocol === 'IMAP' && seenUid) {
      await this.withImapClient(account, async (client) => {
        const lock = await client.getMailboxLock(message.folder.imapPath);
        try {
          if (dto.isRead) {
            await client.messageFlagsAdd({ uid: seenUid }, ['\\Seen'], { uid: true });
          } else {
            await client.messageFlagsRemove({ uid: seenUid }, ['\\Seen'], { uid: true });
          }
        } finally {
          await lock.release();
        }
      }).catch(() => undefined);
    }

    return updated;
  }

  /**
   * Move a mensagem para outra pasta (arquivar, spam, personalizadas).
   */
  async moveMessage(userId: string, messageId: string, dto: MoveMessageDto) {
    const { account, message } = await this.requireMessage(userId, messageId);
    const target = await this.prisma.mailFolder.findFirst({
      where: { id: dto.folderId, accountId: account.id, deletedAt: null },
    });
    if (!target) throw new NotFoundException('Target folder not found');

    const updated = await this.prisma.mailMessage.update({
      where: { id: messageId },
      data: { folderId: target.id, isSpam: target.type === 'SPAM' },
    });

    // Move no servidor IMAP (best-effort)
    const moveUid = message.uid;
    if (account.protocol === 'IMAP' && moveUid) {
      await this.withImapClient(account, async (client) => {
        const lock = await client.getMailboxLock(message.folder.imapPath);
        try {
          await client.messageMove({ uid: moveUid }, target.imapPath, { uid: true });
        } finally {
          await lock.release();
        }
      }).catch(() => undefined);
    }

    return updated;
  }

  /**
   * Remove a mensagem. Primeiro envio → lixeira; se já estiver na lixeira
   * → remoção definitiva (ficheiros de anexo incluídos).
   */
  async removeMessage(userId: string, messageId: string) {
    const { account, message } = await this.requireMessage(userId, messageId);

    // Se já está na lixeira, remove definitivamente
    if (message.folder.type === 'TRASH') {
      // Remove ficheiros de anexos do disco
      for (const att of message.attachments) {
        if (att.filePath) this.safeDeleteFile(att.filePath);
      }
      await this.prisma.mailMessage.delete({ where: { id: messageId } });

      // Remove também no servidor IMAP (best-effort)
      const delUid = message.uid;
      if (account.protocol === 'IMAP' && delUid) {
        await this.withImapClient(account, async (client) => {
          const lock = await client.getMailboxLock(message.folder.imapPath);
          try {
            await client.messageFlagsAdd({ uid: delUid }, ['\\Deleted'], { uid: true });
            await client.messageDelete({ uid: delUid }, { uid: true }).catch(() => undefined);
          } finally {
            await lock.release();
          }
        }).catch(() => undefined);
      }
      return { message: 'Message permanently deleted' };
    }

    // Caso contrário, move para a lixeira
    const trash = await this.ensureFolder(account.id, 'TRASH', 'Lixeira');
    await this.prisma.mailMessage.update({
      where: { id: messageId },
      data: { folderId: trash.id },
    });
    return { message: 'Message moved to trash' };
  }

  // =========================================================================
  // ETIQUETAS
  // =========================================================================

  /**
   * Lista as etiquetas da conta.
   */
  async listLabels(userId: string) {
    const account = await this.requireAccount(userId);
    return this.prisma.mailLabel.findMany({
      where: { accountId: account.id },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Cria uma etiqueta.
   */
  async createLabel(userId: string, dto: MailLabelDto) {
    const account = await this.requireAccount(userId);
    const existing = await this.prisma.mailLabel.findFirst({
      where: { accountId: account.id, name: dto.name },
    });
    if (existing) throw new ConflictException('Label already exists');
    return this.prisma.mailLabel.create({
      data: { accountId: account.id, name: dto.name, color: dto.color || '#3b82f6' },
    });
  }

  /**
   * Atualiza uma etiqueta.
   */
  async updateLabel(userId: string, labelId: string, dto: MailLabelDto) {
    const account = await this.requireAccount(userId);
    const label = await this.prisma.mailLabel.findFirst({
      where: { id: labelId, accountId: account.id },
    });
    if (!label) throw new NotFoundException('Label not found');
    return this.prisma.mailLabel.update({
      where: { id: labelId },
      data: { name: dto.name, color: dto.color || label.color },
    });
  }

  /**
   * Remove uma etiqueta (as associações são removidas em cascata).
   */
  async removeLabel(userId: string, labelId: string) {
    const account = await this.requireAccount(userId);
    const label = await this.prisma.mailLabel.findFirst({
      where: { id: labelId, accountId: account.id },
    });
    if (!label) throw new NotFoundException('Label not found');
    await this.prisma.mailMessageLabel.deleteMany({ where: { labelId } });
    await this.prisma.mailLabel.delete({ where: { id: labelId } });
    return { message: 'Label removed' };
  }

  /**
   * Aplica uma etiqueta a uma mensagem.
   */
  async applyLabel(userId: string, messageId: string, dto: MessageLabelDto) {
    const { message } = await this.requireMessage(userId, messageId);
    await this.prisma.mailMessageLabel.upsert({
      where: { messageId_labelId: { messageId: message.id, labelId: dto.labelId } },
      create: { messageId: message.id, labelId: dto.labelId },
      update: {},
    });
    return { message: 'Label applied' };
  }

  /**
   * Remove uma etiqueta de uma mensagem.
   */
  async removeMessageLabel(userId: string, messageId: string, dto: MessageLabelDto) {
    const { message } = await this.requireMessage(userId, messageId);
    await this.prisma.mailMessageLabel.deleteMany({
      where: { messageId: message.id, labelId: dto.labelId },
    });
    return { message: 'Label removed' };
  }

  // =========================================================================
  // REGRAS AUTOMÁTICAS
  // =========================================================================

  /**
   * Lista as regras automáticas da conta.
   */
  async listRules(userId: string) {
    const account = await this.requireAccount(userId);
    return this.prisma.mailRule.findMany({
      where: { accountId: account.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Cria uma regra automática.
   */
  async createRule(userId: string, dto: CreateMailRuleDto) {
    const account = await this.requireAccount(userId);
    return this.prisma.mailRule.create({
      data: {
        accountId: account.id,
        name: dto.name,
        isActive: dto.isActive ?? true,
        conditionType: dto.conditionType,
        conditionValue: dto.conditionValue,
        actionType: dto.actionType,
        actionValue: dto.actionValue,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Atualiza uma regra automática.
   */
  async updateRule(userId: string, ruleId: string, dto: UpdateMailRuleDto) {
    const account = await this.requireAccount(userId);
    const rule = await this.prisma.mailRule.findFirst({
      where: { id: ruleId, accountId: account.id, deletedAt: null },
    });
    if (!rule) throw new NotFoundException('Rule not found');
    return this.prisma.mailRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        conditionType: dto.conditionType,
        conditionValue: dto.conditionValue,
        actionType: dto.actionType,
        actionValue: dto.actionValue,
        sortOrder: dto.sortOrder,
      },
    });
  }

  /**
   * Remove uma regra automática (soft delete).
   */
  async removeRule(userId: string, ruleId: string) {
    const account = await this.requireAccount(userId);
    const rule = await this.prisma.mailRule.findFirst({
      where: { id: ruleId, accountId: account.id, deletedAt: null },
    });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.prisma.mailRule.update({ where: { id: ruleId }, data: { deletedAt: new Date() } });
    return { message: 'Rule removed' };
  }

  // =========================================================================
  // CONTATOS E GRUPOS
  // =========================================================================

  /**
   * Lista os contatos do usuário (manuais + automáticos).
   */
  async listContacts(userId: string) {
    return this.prisma.mailContact.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  }

  /**
   * Cria um contato manualmente.
   */
  async createContact(userId: string, dto: MailContactDto) {
    const existing = await this.prisma.mailContact.findUnique({
      where: { userId_email: { userId, email: dto.email } },
    });
    if (existing && !existing.deletedAt) throw new ConflictException('Contact already exists');

    // Se existe contato removido (soft delete), reativa
    if (existing) {
      return this.prisma.mailContact.update({
        where: { id: existing.id },
        data: { name: dto.name, company: dto.company, isAuto: false, deletedAt: null },
      });
    }
    return this.prisma.mailContact.create({
      data: { userId, email: dto.email, name: dto.name, company: dto.company },
    });
  }

  /**
   * Atualiza um contato.
   */
  async updateContact(userId: string, contactId: string, dto: MailContactDto) {
    const contact = await this.prisma.mailContact.findFirst({
      where: { id: contactId, userId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.mailContact.update({
      where: { id: contactId },
      data: { email: dto.email, name: dto.name, company: dto.company },
    });
  }

  /**
   * Remove um contato (soft delete) e suas associações a grupos.
   */
  async removeContact(userId: string, contactId: string) {
    const contact = await this.prisma.mailContact.findFirst({
      where: { id: contactId, userId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    await this.prisma.mailContactGroupMember.deleteMany({ where: { contactId } });
    await this.prisma.mailContact.update({ where: { id: contactId }, data: { deletedAt: new Date() } });
    return { message: 'Contact removed' };
  }

  /**
   * Lista os grupos de contatos com seus membros.
   */
  async listGroups(userId: string) {
    return this.prisma.mailContactGroup.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: { members: { include: { contact: true } } },
    });
  }

  /**
   * Cria um grupo de contatos.
   */
  async createGroup(userId: string, dto: MailContactGroupDto) {
    const existing = await this.prisma.mailContactGroup.findFirst({
      where: { userId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Group already exists');
    return this.prisma.mailContactGroup.create({ data: { userId, name: dto.name } });
  }

  /**
   * Renomeia um grupo.
   */
  async updateGroup(userId: string, groupId: string, dto: MailContactGroupDto) {
    const group = await this.prisma.mailContactGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Group not found');
    return this.prisma.mailContactGroup.update({ where: { id: groupId }, data: { name: dto.name } });
  }

  /**
   * Remove um grupo (contatos permanecem na lista).
   */
  async removeGroup(userId: string, groupId: string) {
    const group = await this.prisma.mailContactGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Group not found');
    await this.prisma.mailContactGroupMember.deleteMany({ where: { groupId } });
    await this.prisma.mailContactGroup.update({ where: { id: groupId }, data: { deletedAt: new Date() } });
    return { message: 'Group removed' };
  }

  /**
   * Adiciona um contato a um grupo.
   */
  async addGroupMember(userId: string, groupId: string, dto: GroupMemberDto) {
    const group = await this.prisma.mailContactGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Group not found');
    await this.prisma.mailContactGroupMember.upsert({
      where: { groupId_contactId: { groupId, contactId: dto.contactId } },
      create: { groupId, contactId: dto.contactId },
      update: {},
    });
    return { message: 'Member added' };
  }

  /**
   * Remove um contato de um grupo.
   */
  async removeGroupMember(userId: string, groupId: string, dto: GroupMemberDto) {
    const group = await this.prisma.mailContactGroup.findFirst({
      where: { id: groupId, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException('Group not found');
    await this.prisma.mailContactGroupMember.deleteMany({
      where: { groupId, contactId: dto.contactId },
    });
    return { message: 'Member removed' };
  }

  /**
   * Adiciona automaticamente destinatários à lista de contatos.
   * Chamado sempre que um e-mail é enviado.
   */
  private async autoAddContacts(
    userId: string,
    addresses: { name?: string; address: string }[],
  ): Promise<void> {
    for (const addr of addresses) {
      const email = addr.address.toLowerCase();
      const existing = await this.prisma.mailContact.findUnique({
        where: { userId_email: { userId, email } },
      });
      if (existing) {
        // Reativa se removido; atualiza nome se ainda não tem
        await this.prisma.mailContact.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            name: existing.name || addr.name || undefined,
          },
        });
      } else {
        await this.prisma.mailContact.create({
          data: { userId, email, name: addr.name || undefined, isAuto: true },
        });
      }
    }
  }

  // =========================================================================
  // ASSINATURAS
  // =========================================================================

  /**
   * Lista as assinaturas do usuário.
   */
  async listSignatures(userId: string) {
    return this.prisma.mailSignature.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Cria uma assinatura. Se marcada como padrão, desmarca as demais.
   */
  async createSignature(userId: string, dto: MailSignatureDto) {
    if (dto.isDefault) {
      await this.prisma.mailSignature.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      });
    }
    return this.prisma.mailSignature.create({
      data: { userId, name: dto.name, content: dto.content, isDefault: dto.isDefault ?? false },
    });
  }

  /**
   * Atualiza uma assinatura.
   */
  async updateSignature(userId: string, signatureId: string, dto: MailSignatureDto) {
    const signature = await this.prisma.mailSignature.findFirst({
      where: { id: signatureId, userId, deletedAt: null },
    });
    if (!signature) throw new NotFoundException('Signature not found');

    if (dto.isDefault) {
      await this.prisma.mailSignature.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      });
    }
    return this.prisma.mailSignature.update({
      where: { id: signatureId },
      data: { name: dto.name, content: dto.content, isDefault: dto.isDefault },
    });
  }

  /**
   * Remove uma assinatura (soft delete).
   */
  async removeSignature(userId: string, signatureId: string) {
    const signature = await this.prisma.mailSignature.findFirst({
      where: { id: signatureId, userId, deletedAt: null },
    });
    if (!signature) throw new NotFoundException('Signature not found');
    await this.prisma.mailSignature.update({
      where: { id: signatureId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Signature removed' };
  }

  // =========================================================================
  // REMETENTES BLOQUEADOS
  // =========================================================================

  /**
   * Lista os remetentes bloqueados.
   */
  async listBlockedSenders(userId: string) {
    return this.prisma.mailBlockedSender.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bloqueia um remetente (endereço completo ou domínio "@dominio.com").
   */
  async blockSender(userId: string, dto: BlockSenderDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.mailBlockedSender.findUnique({
      where: { userId_email: { userId, email } },
    });
    if (existing) throw new ConflictException('Sender already blocked');
    return this.prisma.mailBlockedSender.create({ data: { userId, email } });
  }

  /**
   * Desbloqueia um remetente.
   */
  async unblockSender(userId: string, blockedId: string) {
    const blocked = await this.prisma.mailBlockedSender.findFirst({
      where: { id: blockedId, userId },
    });
    if (!blocked) throw new NotFoundException('Blocked sender not found');
    await this.prisma.mailBlockedSender.delete({ where: { id: blockedId } });
    return { message: 'Sender unblocked' };
  }

  // =========================================================================
  // RESPOSTA AUTOMÁTICA / AUSÊNCIA
  // =========================================================================

  /**
   * Retorna a configuração de resposta automática do usuário.
   */
  async getAutoReply(userId: string) {
    const autoReply = await this.prisma.mailAutoReply.findUnique({ where: { userId } });
    return (
      autoReply || {
        enabled: false,
        subject: '',
        message: '',
        startDate: null,
        endDate: null,
        oncePerSender: true,
      }
    );
  }

  /**
   * Atualiza a configuração de resposta automática / mensagem de ausência.
   */
  async updateAutoReply(userId: string, dto: AutoReplyDto) {
    return this.prisma.mailAutoReply.upsert({
      where: { userId },
      create: {
        userId,
        enabled: dto.enabled ?? false,
        subject: dto.subject || '',
        message: dto.message || '',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      update: {
        enabled: dto.enabled,
        subject: dto.subject,
        message: dto.message,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        // Ao reativar, limpa a lista de remetentes já respondidos
        sentTo: dto.enabled ? {} : undefined,
      },
    });
  }

  // =========================================================================
  // ANEXOS
  // =========================================================================

  /**
   * Valida o acesso a um anexo e retorna o caminho absoluto no disco.
   * Usado pelo controller para streaming do download.
   */
  async getAttachmentForDownload(userId: string, attachmentId: string) {
    const attachment = await this.prisma.mailAttachment.findUnique({
      where: { id: attachmentId },
      include: { message: { include: { account: { select: { userId: true } } } } },
    });
    if (!attachment || attachment.message.account.userId !== userId) {
      throw new NotFoundException('Attachment not found');
    }
    if (!attachment.filePath) {
      throw new NotFoundException('Attachment content not available');
    }

    const uploadDir = process.env['UPLOAD_DIR'] || './uploads';
    const fullPath = path.resolve(uploadDir, '..', uploadDir, attachment.filePath);

    // Segurança: previne path traversal
    const resolved = path.resolve(uploadDir, attachment.filePath);
    if (!resolved.startsWith(path.resolve(uploadDir)) || !fs.existsSync(resolved)) {
      throw new NotFoundException('Attachment file not found on disk');
    }
    void fullPath;
    return { path: resolved, filename: attachment.filename };
  }

  // =========================================================================
  // HELPERS INTERNOS
  // =========================================================================

  /**
   * Busca mensagem validando posse + inclui pasta e anexos.
   */
  private async requireMessage(userId: string, messageId: string) {
    const account = await this.requireAccount(userId);
    const message = await this.prisma.mailMessage.findFirst({
      where: { id: messageId, accountId: account.id, deletedAt: null },
      include: { attachments: true, folder: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    return { account, message };
  }

  /**
   * Garante que uma pasta padrão existe para a conta (cria se necessário).
   */
  private async ensureFolder(accountId: string, type: string, displayName: string) {
    const existing = await this.prisma.mailFolder.findFirst({
      where: { accountId, type: type as never, deletedAt: null },
    });
    if (existing) return existing;
    return this.prisma.mailFolder.create({
      data: { accountId, name: displayName, imapPath: displayName, type: type as never },
    });
  }

  /**
   * Executa uma operação com um cliente IMAP autenticado.
   * A conexão é sempre fechada no final.
   */
  private async withImapClient<T>(
    account: { email: string; passwordEnc: string },
    fn: (client: ImapFlow) => Promise<T>,
  ): Promise<T> {
    const client = new ImapFlow({
      host: MAIL_SERVERS.imap.host,
      port: MAIL_SERVERS.imap.port,
      secure: MAIL_SERVERS.imap.secure,
      auth: { user: account.email, pass: decryptSecret(account.passwordEnc) },
      logger: false,
    });
    await client.connect();
    try {
      return await fn(client);
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  /**
   * Move um ficheiro multipart temporário para uploads/{userId}/mail/.
   * @returns caminho relativo ao diretório uploads/
   */
  private async moveToMailUploads(userId: string, file: Express.Multer.File): Promise<string | null> {
    try {
      const uploadDir = process.env['UPLOAD_DIR'] || './uploads';
      const dir = path.join(uploadDir, userId, 'mail');
      await fs.promises.mkdir(dir, { recursive: true });
      const target = path.join(dir, path.basename(file.path));
      await fs.promises.rename(file.path, target);
      return `${userId}/mail/${path.basename(file.path)}`;
    } catch {
      return null;
    }
  }

  /**
   * Remove um ficheiro do disco com segurança (ignora erros).
   */
  private safeDeleteFile(filePath: string): void {
    try {
      const uploadDir = process.env['UPLOAD_DIR'] || './uploads';
      const resolved = path.resolve(uploadDir, filePath);
      if (resolved.startsWith(path.resolve(uploadDir)) && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }
    } catch {
      // Ignora: o soft delete do DB já foi realizado
    }
  }
}
