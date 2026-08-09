/**
 * ============================================================================
 * MAIL SYNC SERVICE - Sincronização Contínua de E-mails (IMAP/POP3)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Motor de sincronização contínua das contas de e-mail conectadas.
 * A cada ciclo (60s) sincroniza todas as contas ativas:
 *
 * - IMAP: lista pastas, baixa mensagens novas de cada pasta, sincroniza
 *   contadores e flags.
 * - POP3: baixa mensagens novas da caixa de entrada (via UIDL).
 *
 * PROCESSAMENTO DE MENSAGENS RECEBIDAS:
 * -------------------------------------
 * 1. Parse do conteúdo (mailparser): HTML, texto e anexos
 * 2. Anexos salvos em uploads/{userId}/mail/ com detecção de suspeitos
 * 3. Remetentes bloqueados → spam
 * 4. Regras automáticas aplicadas em ordem (mover, etiquetar, encaminhar...)
 * 5. Resposta automática / mensagem de ausência (se configurada)
 * 6. Notificação interna de nova mensagem (se habilitada)
 * ============================================================================
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
} from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { decryptSecret } from './mail-crypto.util.js';
import { Pop3Client } from './pop3.client.js';
import { sendMail } from './mail-transport.util.js';
import {
  MAIL_SERVERS,
  SUSPICIOUS_EXTENSIONS,
  MAX_ATTACHMENT_DOWNLOAD_SIZE,
  SYNC_BATCH_SIZE,
  SYNC_INTERVAL_MS,
} from './mail.config.js';

/** Mapeamento specialUse IMAP → tipo de pasta do sistema */
const SPECIAL_USE_MAP: Record<string, string> = {
  '\\Inbox': 'INBOX',
  '\\Sent': 'SENT',
  '\\Drafts': 'DRAFTS',
  '\\Junk': 'SPAM',
  '\\Trash': 'TRASH',
  '\\Archive': 'ARCHIVE',
};

/** Nomes comuns de pastas como fallback de classificação */
const FOLDER_NAME_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'SENT',
  'sent items': 'SENT',
  'sent messages': 'SENT',
  drafts: 'DRAFTS',
  spam: 'SPAM',
  junk: 'SPAM',
  trash: 'TRASH',
  deleted: 'TRASH',
  'deleted items': 'TRASH',
  archive: 'ARCHIVE',
  archives: 'ARCHIVE',
};

/**
 * Serviço MailSyncService - sincronização contínua em segundo plano.
 */
@Injectable()
export class MailSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailSyncService.name);

  /** Timer da sincronização periódica */
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Contas atualmente em sincronização (evita sobreposição) */
  private syncing = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Inicia o ciclo de sincronização contínua ao arrancar a aplicação.
   */
  onModuleInit(): void {
    // Primeira sincronização 5 segundos após o startup
    setTimeout(() => this.syncAll().catch((e) => this.logger.error(`Sync error: ${e.message}`)), 5_000);
    // Sincronização periódica
    this.timer = setInterval(() => {
      this.syncAll().catch((e) => this.logger.error(`Sync error: ${e.message}`));
    }, SYNC_INTERVAL_MS);
  }

  /**
   * Para o timer ao encerrar a aplicação.
   */
  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Sincroniza todas as contas ativas.
   */
  async syncAll(): Promise<void> {
    const accounts = await this.prisma.mailAccount.findMany({
      where: { isActive: true, deletedAt: null },
    });
    for (const account of accounts) {
      await this.syncAccount(account.id).catch((e) =>
        this.logger.warn(`Falha na sincronização da conta ${account.email}: ${e.message}`),
      );
    }
  }

  /**
   * Sincroniza uma conta específica (usado também pelo endpoint manual).
   * @returns número de mensagens novas baixadas
   */
  async syncAccount(accountId: string): Promise<number> {
    // Evita sincronizações simultâneas da mesma conta
    if (this.syncing.has(accountId)) return 0;
    this.syncing.add(accountId);

    try {
      const account = await this.prisma.mailAccount.findUnique({ where: { id: accountId } });
      if (!account || account.deletedAt) throw new NotFoundException('Mail account not found');

      const password = decryptSecret(account.passwordEnc);
      let newMessages = 0;

      if (account.protocol === 'POP3') {
        newMessages = await this.syncPop3(account.id, account.email, password);
      } else {
        newMessages = await this.syncImap(account.id, account.email, password);
      }

      // Registra sucesso da sincronização
      await this.prisma.mailAccount.update({
        where: { id: accountId },
        data: { lastSyncAt: new Date(), lastSyncError: null },
      });
      return newMessages;
    } catch (error) {
      // Registra o erro para diagnóstico (visível na página de configurações)
      await this.prisma.mailAccount
        .update({
          where: { id: accountId },
          data: { lastSyncError: error.message?.slice(0, 500) || 'Unknown error' },
        })
        .catch(() => undefined);
      throw error;
    } finally {
      this.syncing.delete(accountId);
    }
  }

  // =========================================================================
  // SINCRONIZAÇÃO IMAP
  // =========================================================================

  /**
   * Sincroniza conta via IMAP: pastas + mensagens novas de cada pasta.
   */
  private async syncImap(accountId: string, email: string, password: string): Promise<number> {
    const client = new ImapFlow({
      host: MAIL_SERVERS.imap.host,
      port: MAIL_SERVERS.imap.port,
      secure: MAIL_SERVERS.imap.secure,
      auth: { user: email, pass: password },
      logger: false,
    });

    await client.connect();
    let totalNew = 0;

    try {
      // 1. Lista pastas do servidor e sincroniza com o banco
      const serverFolders = await client.list();
      for (const sf of serverFolders) {
        // Determina o tipo da pasta (specialUse → nome → CUSTOM)
        const specialType = sf.specialUse ? SPECIAL_USE_MAP[sf.specialUse] : undefined;
        const nameType = FOLDER_NAME_MAP[sf.name.toLowerCase()];
        const type = specialType || nameType || 'CUSTOM';

        await this.prisma.mailFolder.upsert({
          where: { accountId_imapPath: { accountId, imapPath: sf.path } },
          create: { accountId, name: sf.name, imapPath: sf.path, type: type as never },
          update: { name: sf.name, type: type as never },
        });
      }

      // 2. Baixa mensagens novas de cada pasta
      const folders = await this.prisma.mailFolder.findMany({
        where: { accountId, deletedAt: null },
      });

      for (const folder of folders) {
        // Pastas SPAM/TRASH não geram notificações nem regras, mas sincronizam
        try {
          const count = await this.syncFolder(client, account_id(accountId), folder.id, folder.imapPath, folder.type);
          totalNew += count;
        } catch (error) {
          this.logger.warn(`Erro ao sincronizar pasta ${folder.imapPath}: ${error.message}`);
        }
      }

      // 3. Atualiza contadores de cada pasta
      await this.refreshFolderCounters(accountId);
    } finally {
      await client.logout().catch(() => undefined);
    }

    return totalNew;
  }

  /**
   * Baixa mensagens novas de uma pasta IMAP específica.
   * Usa o maior UID já sincronizado para buscar apenas o que é novo.
   */
  private async syncFolder(
    client: ImapFlow,
    accountId: string,
    folderId: string,
    imapPath: string,
    folderType: string,
  ): Promise<number> {
    const lock = await client.getMailboxLock(imapPath);
    let newCount = 0;

    try {
      const mailbox = client.mailbox;
      const exists = mailbox ? mailbox.exists : 0;
      if (exists === 0) return 0;

      // Maior UID já sincronizado nesta pasta
      const maxUidResult = await this.prisma.mailMessage.aggregate({
        where: { folderId, uid: { not: null } },
        _max: { uid: true },
      });
      const maxUid = maxUidResult._max.uid;

      // Define o intervalo de UIDs a buscar
      let range: string;
      if (maxUid === null) {
        // Primeira sincronização: apenas as últimas SYNC_BATCH_SIZE mensagens
        range = `${Math.max(1, exists - SYNC_BATCH_SIZE + 1)}:*`;
      } else {
        range = `${maxUid + 1}:*`;
      }

      for await (const msg of client.fetch(range, { uid: true, flags: true, source: true }, { uid: true })) {
        const uid = msg.uid as number;

        // Ignora UIDs já sincronizados (range "* pode repetir")
        const existing = await this.prisma.mailMessage.findFirst({
          where: { folderId, uid },
          select: { id: true },
        });
        if (existing) continue;

        try {
          await this.storeParsedMessage(
            accountId,
            folderId,
            folderType,
            msg.source as Buffer,
            uid,
            (msg.flags as Set<string>)?.has('\\Seen') ?? false,
            (msg.flags as Set<string>)?.has('\\Flagged') ?? false,
          );
          newCount++;
        } catch (error) {
          this.logger.warn(`Erro ao processar mensagem UID ${uid}: ${error.message}`);
        }
      }
    } finally {
      await lock.release();
    }

    return newCount;
  }

  // =========================================================================
  // SINCRONIZAÇÃO POP3
  // =========================================================================

  /**
   * Sincroniza conta via POP3: baixa mensagens novas da caixa de entrada.
   * A deduplicação usa o UIDL do servidor e o Message-ID RFC.
   */
  private async syncPop3(accountId: string, email: string, password: string): Promise<number> {
    const client = new Pop3Client(MAIL_SERVERS.pop3.host, MAIL_SERVERS.pop3.port);
    await client.connect();
    let newCount = 0;

    try {
      await client.login(email, password);
      const messages = await client.list();

      // Garante que a pasta INBOX existe para a conta
      const inbox = await this.prisma.mailFolder.upsert({
        where: { accountId_imapPath: { accountId, imapPath: 'INBOX' } },
        create: { accountId, name: 'INBOX', imapPath: 'INBOX', type: 'INBOX' },
        update: {},
      });

      for (const msg of messages) {
        // Deduplicação: UIDL armazenado como messageId quando sem Message-ID
        const existing = await this.prisma.mailMessage.findFirst({
          where: { accountId, folderId: inbox.id, messageId: msg.uid },
          select: { id: true },
        });
        if (existing) continue;

        try {
          const raw = await client.retrieve(msg.index);
          const parsed = await simpleParser(raw);
          const rfcId = parsed.messageId || msg.uid;

          // Verifica também pelo Message-ID RFC (POP3 não mantém estado)
          const byRfcId = await this.prisma.mailMessage.findFirst({
            where: { accountId, messageId: rfcId },
            select: { id: true },
          });
          if (byRfcId) continue;

          await this.saveMessage(accountId, inbox.id, 'INBOX', parsed, {
            uid: null,
            messageIdOverride: msg.uid,
          });
          newCount++;
        } catch (error) {
          this.logger.warn(`Erro ao baixar mensagem POP3 #${msg.index}: ${error.message}`);
        }
      }

      await this.refreshFolderCounters(accountId);
    } finally {
      await client.quit().catch(() => undefined);
    }

    return newCount;
  }

  // =========================================================================
  // ARMAZENAMENTO E PROCESSAMENTO DE MENSAGENS
  // =========================================================================

  /**
   * Faz o parse de uma mensagem bruta e armazena no banco.
   */
  private async storeParsedMessage(
    accountId: string,
    folderId: string,
    folderType: string,
    raw: Buffer,
    uid: number,
    seen: boolean,
    flagged: boolean,
  ): Promise<void> {
    const parsed = await simpleParser(raw);
    await this.saveMessage(accountId, folderId, folderType, parsed, { uid, seen, flagged });
  }

  /**
   * Salva uma mensagem parseada no banco com anexos, aplica proteção
   * (bloqueios/regras) e dispara notificações.
   */
  private async saveMessage(
    accountId: string,
    folderId: string,
    folderType: string,
    parsed: ParsedMail,
    opts: { uid?: number | null; seen?: boolean; flagged?: boolean; messageIdOverride?: string },
  ): Promise<void> {
    const account = await this.prisma.mailAccount.findUnique({ where: { id: accountId } });
    if (!account) return;

    const subject = parsed.subject || '';
    const textBody = parsed.text || '';
    const htmlBody = parsed.html || '';
    const fromAddress = parsed.from?.value?.[0]?.address?.toLowerCase() || '';

    // Proteção: remetente bloqueado → spam
    const blocked = await this.isSenderBlocked(account.userId, fromAddress);
    const isSpam = blocked || folderType === 'SPAM';

    // Destinatária final: pasta SPAM se bloqueado
    let targetFolderId = folderId;
    if (blocked && folderType === 'INBOX') {
      const spamFolder = await this.prisma.mailFolder.findFirst({
        where: { accountId, type: 'SPAM', deletedAt: null },
      });
      if (spamFolder) targetFolderId = spamFolder.id;
    }

    // Cria a mensagem no banco
    const message = await this.prisma.mailMessage.create({
      data: {
        accountId,
        folderId: targetFolderId,
        uid: opts.uid ?? null,
        messageId: opts.messageIdOverride || parsed.messageId || null,
        inReplyTo: parsed.inReplyTo || null,
        conversationId: buildConversationId(subject, parsed.inReplyTo || undefined),
        from: (parsed.from?.value || []) as never,
        to: (parsed.to ? (parsed.to as never as { value?: unknown[] }).value || parsed.to : []) as never,
        cc: (parsed.cc ? (parsed.cc as never as { value?: unknown[] }).value || parsed.cc : []) as never,
        subject,
        preview: (textBody || stripHtml(htmlBody)).slice(0, 200),
        textBody,
        htmlBody,
        date: parsed.date || new Date(),
        isRead: opts.seen ?? false,
        isFlagged: opts.flagged ?? false,
        isSpam,
        size: 0,
        hasAttachments: (parsed.attachments?.length || 0) > 0,
      },
    });

    // Anexos: salva no disco e detecta suspeitos
    let hasSuspicious = false;
    if (parsed.attachments?.length) {
      for (const att of parsed.attachments) {
        const suspicious = isSuspiciousFilename(att.filename || '');
        hasSuspicious = hasSuspicious || suspicious;

        let filePath: string | null = null;
        if (att.size <= MAX_ATTACHMENT_DOWNLOAD_SIZE && att.content) {
          filePath = await this.saveAttachmentFile(account.userId, att.filename || 'attachment', att.content);
        }

        await this.prisma.mailAttachment.create({
          data: {
            messageId: message.id,
            filename: att.filename || 'attachment',
            mimeType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            filePath,
            contentId: att.contentId || null,
            isSuspicious: suspicious,
          },
        });
      }
      if (hasSuspicious) {
        await this.prisma.mailMessage.update({
          where: { id: message.id },
          data: { hasSuspiciousAttachment: true },
        });
      }
    }

    // Aplica regras automáticas (apenas para mensagens recebidas na entrada)
    if (folderType === 'INBOX' && !blocked) {
      await this.applyRules(account, message.id, { subject, fromAddress, textBody, targetFolderId });
    }

    // Resposta automática / mensagem de ausência (apenas entrada e não-spam)
    if (folderType === 'INBOX' && !isSpam && fromAddress) {
      await this.handleAutoReply(account, fromAddress, subject);
    }

    // Notificação interna de nova mensagem
    if (folderType === 'INBOX' && !isSpam && account.notifyOnNew) {
      const fromName = parsed.from?.value?.[0]?.name || fromAddress;
      await this.notificationService.create({
        type: 'INFO' as never,
        priority: 'MEDIUM' as never,
        title: 'Novo e-mail recebido',
        message: `${fromName}: ${subject || '(sem assunto)'}`,
        userId: account.userId,
        entity: 'MailMessage',
        entityId: message.id,
      });
    }
  }

  /**
   * Verifica se o remetente está na lista de bloqueados do usuário.
   * Suporta bloqueio por endereço completo ou domínio (@dominio.com).
   */
  private async isSenderBlocked(userId: string, fromAddress: string): Promise<boolean> {
    if (!fromAddress) return false;
    const blockedList = await this.prisma.mailBlockedSender.findMany({ where: { userId } });
    const domain = fromAddress.split('@')[1];
    return blockedList.some((b) => {
      const entry = b.email.toLowerCase();
      if (entry.startsWith('@')) return domain === entry.slice(1);
      return entry === fromAddress;
    });
  }

  /**
   * Aplica as regras automáticas ativas do usuário à mensagem recebida.
   * As regras são executadas em ordem (sortOrder).
   */
  private async applyRules(
    account: { id: string; email: string; passwordEnc: string; userId: string },
    messageId: string,
    ctx: { subject: string; fromAddress: string; textBody: string; targetFolderId: string },
  ): Promise<void> {
    const rules = await this.prisma.mailRule.findMany({
      where: { accountId: account.id, isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    if (rules.length === 0) return;

    for (const rule of rules) {
      const value = (rule.conditionValue || '').toLowerCase();

      // Avalia a condição da regra
      const matches =
        rule.conditionType === 'FROM' ? ctx.fromAddress.includes(value)
        : rule.conditionType === 'TO' ? account.email.toLowerCase().includes(value)
        : rule.conditionType === 'SUBJECT' ? ctx.subject.toLowerCase().includes(value)
        : rule.conditionType === 'CONTAINS' ? ctx.textBody.toLowerCase().includes(value)
        : rule.conditionType === 'HAS_ATTACHMENT';

      if (!matches) continue;

      // Executa a ação da regra
      switch (rule.actionType) {
        case 'MOVE_TO_FOLDER': {
          const folder = await this.prisma.mailFolder.findFirst({
            where: { accountId: account.id, name: rule.actionValue || '', deletedAt: null },
          });
          if (folder) {
            await this.prisma.mailMessage.update({ where: { id: messageId }, data: { folderId: folder.id } });
          }
          break;
        }
        case 'FLAG':
          await this.prisma.mailMessage.update({ where: { id: messageId }, data: { isFlagged: true } });
          break;
        case 'MARK_IMPORTANT':
          await this.prisma.mailMessage.update({ where: { id: messageId }, data: { isImportant: true } });
          break;
        case 'MARK_READ':
          await this.prisma.mailMessage.update({ where: { id: messageId }, data: { isRead: true } });
          break;
        case 'LABEL': {
          const label = await this.prisma.mailLabel.findFirst({
            where: { accountId: account.id, name: rule.actionValue || '' },
          });
          if (label) {
            await this.prisma.mailMessageLabel.upsert({
              where: { messageId_labelId: { messageId, labelId: label.id } },
              create: { messageId, labelId: label.id },
              update: {},
            });
          }
          break;
        }
        case 'FORWARD': {
          // Encaminha a mensagem para o endereço configurado
          try {
            const password = decryptSecret(account.passwordEnc);
            const msg = await this.prisma.mailMessage.findUnique({ where: { id: messageId } });
            if (msg && rule.actionValue) {
              await sendMail(account.email, password, {
                from: account.email,
                to: rule.actionValue,
                subject: `Fwd: ${msg.subject || ''}`,
                text: msg.textBody || undefined,
                html: msg.htmlBody || undefined,
              });
            }
          } catch (error) {
            this.logger.warn(`Falha ao encaminhar via regra "${rule.name}": ${error.message}`);
          }
          break;
        }
        case 'AUTO_REPLY': {
          // Responde automaticamente com o texto configurado
          try {
            const password = decryptSecret(account.passwordEnc);
            await sendMail(account.email, password, {
              from: account.email,
              to: ctx.fromAddress,
              subject: `Re: ${ctx.subject || ''}`,
              text: rule.actionValue || '',
            });
          } catch (error) {
            this.logger.warn(`Falha na resposta automática da regra "${rule.name}": ${error.message}`);
          }
          break;
        }
        case 'MOVE_TO_SPAM': {
          const spamFolder = await this.prisma.mailFolder.findFirst({
            where: { accountId: account.id, type: 'SPAM', deletedAt: null },
          });
          if (spamFolder) {
            await this.prisma.mailMessage.update({
              where: { id: messageId },
              data: { folderId: spamFolder.id, isSpam: true },
            });
          }
          break;
        }
        case 'DELETE':
          // Soft delete da mensagem (regra de exclusão automática)
          await this.prisma.mailMessage.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
          break;
      }
    }
  }

  /**
   * Envia a resposta automática / mensagem de ausência se configurada
   * e dentro do período. Responde apenas uma vez por remetente.
   */
  private async handleAutoReply(
    account: { id: string; email: string; passwordEnc: string; userId: string },
    fromAddress: string,
    originalSubject: string,
  ): Promise<void> {
    const autoReply = await this.prisma.mailAutoReply.findUnique({
      where: { userId: account.userId },
    });
    if (!autoReply || !autoReply.enabled) return;

    // Verifica o período de ausência
    const now = new Date();
    if (autoReply.startDate && now < autoReply.startDate) return;
    if (autoReply.endDate && now > autoReply.endDate) return;

    // Responde apenas uma vez por remetente (lista sentTo)
    const sentTo = (autoReply.sentTo as Record<string, string> | null) || {};
    if (autoReply.oncePerSender && sentTo[fromAddress]) return;

    try {
      const password = decryptSecret(account.passwordEnc);
      await sendMail(account.email, password, {
        from: account.email,
        to: fromAddress,
        subject: autoReply.subject || `Re: ${originalSubject}`,
        text: autoReply.message,
      });
      await this.prisma.mailAutoReply.update({
        where: { userId: account.userId },
        data: { sentTo: { ...sentTo, [fromAddress]: now.toISOString() } },
      });
    } catch (error) {
      this.logger.warn(`Falha no envio da resposta automática: ${error.message}`);
    }
  }

  /**
   * Salva o conteúdo de um anexo em uploads/{userId}/mail/.
   * @returns caminho relativo ao diretório uploads/
   */
  private async saveAttachmentFile(userId: string, filename: string, content: Buffer): Promise<string | null> {
    try {
      const uploadDir = process.env['UPLOAD_DIR'] || './uploads';
      const dir = path.join(uploadDir, userId, 'mail');
      await fs.mkdir(dir, { recursive: true });

      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
      const fileName = `${randomUUID()}_${safeName}`;
      await fs.writeFile(path.join(dir, fileName), content);
      return `${userId}/mail/${fileName}`;
    } catch (error) {
      this.logger.warn(`Falha ao salvar anexo: ${error.message}`);
      return null;
    }
  }

  /**
   * Atualiza os contadores (total/não lidas) de todas as pastas da conta.
   */
  private async refreshFolderCounters(accountId: string): Promise<void> {
    const folders = await this.prisma.mailFolder.findMany({ where: { accountId, deletedAt: null } });
    for (const folder of folders) {
      const [total, unread] = await Promise.all([
        this.prisma.mailMessage.count({ where: { folderId: folder.id, deletedAt: null } }),
        this.prisma.mailMessage.count({ where: { folderId: folder.id, deletedAt: null, isRead: false } }),
      ]);
      await this.prisma.mailFolder.update({
        where: { id: folder.id },
        data: { totalCount: total, unreadCount: unread },
      });
    }
  }
}

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

/** Helper para manter o tipo do accountId nas chamadas internas */
function account_id(id: string): string {
  return id;
}

/**
 * Constrói o identificador de conversa para agrupamento (threading).
 * Usa o assunto normalizado (sem Re:/Fwd: e em minúsculas).
 */
export function buildConversationId(subject: string, inReplyTo?: string): string {
  const normalized = (subject || '')
    .replace(/^(re|fwd|fw|enc|res)(\[\d+\])?:\s*/gi, '')
    .trim()
    .toLowerCase();
  return normalized || inReplyTo || 'sem-assunto';
}

/**
 * Remove tags HTML para gerar o preview em texto simples.
 */
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta anexos suspeitos pela extensão do ficheiro.
 */
export function isSuspiciousFilename(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUSPICIOUS_EXTENSIONS.includes(ext);
}
