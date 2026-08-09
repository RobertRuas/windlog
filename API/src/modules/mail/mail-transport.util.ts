/**
 * ============================================================================
 * MAIL TRANSPORT UTIL - Helpers de Envio SMTP
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Funções puras para criação do transporte SMTP (nodemailer) e envio de
 * mensagens usando as configurações FIXAS do servidor de saída
 * (send.one.com:465 TLS).
 *
 * USADO POR:
 * ----------
 * - MailService: envio de e-mails e rascunhos do usuário
 * - MailSyncService: encaminhamentos e respostas automáticas
 * ============================================================================
 */

import * as nodemailer from 'nodemailer';
import { MAIL_SERVERS } from './mail.config.js';

/** Opções simplificadas de envio */
export interface MailSendOptions {
  /** Endereço do remetente (conta do usuário) */
  from: string;
  /** Destinatários (string ou lista separada por vírgula) */
  to?: string | string[];
  /** Cópias */
  cc?: string | string[];
  /** Cópias ocultas */
  bcc?: string | string[];
  /** Assunto */
  subject?: string;
  /** Corpo em texto simples */
  text?: string;
  /** Corpo em HTML */
  html?: string;
  /** Message-ID da mensagem respondida (threading) */
  inReplyTo?: string;
  /** Cabeçalho References (threading) */
  references?: string;
  /** Anexos no formato nodemailer */
  attachments?: { filename: string; path: string; contentType?: string }[];
}

/**
 * Cria um transporte SMTP autenticado com as credenciais da conta.
 * O servidor é sempre o fixo (send.one.com) com TLS.
 *
 * @param user - endereço de e-mail da conta
 * @param pass - senha em claro (decifrada do banco)
 */
export function createSmtpTransport(user: string, pass: string) {
  return nodemailer.createTransport({
    host: MAIL_SERVERS.smtp.host,
    port: MAIL_SERVERS.smtp.port,
    secure: MAIL_SERVERS.smtp.secure, // TLS
    auth: { user, pass },
  });
}

/**
 * Envia um e-mail via SMTP usando o servidor fixo de saída.
 *
 * @returns Promise com o messageId retornado pelo servidor
 */
export async function sendMail(user: string, pass: string, options: MailSendOptions): Promise<string> {
  const transport = createSmtpTransport(user, pass);
  try {
    const info = await transport.sendMail({
      from: options.from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      inReplyTo: options.inReplyTo,
      references: options.references,
      attachments: options.attachments,
    });
    return info.messageId || '';
  } finally {
    transport.close();
  }
}

/**
 * Formata uma lista de endereços { name, address } para o formato
 * de cabeçalho RFC 822: "Nome <email@dominio.com>".
 */
export function formatAddresses(addresses: { name?: string; address: string }[]): string[] {
  return addresses.map((a) =>
    a.name ? `${a.name.replace(/"/g, '')} <${a.address}>` : a.address,
  );
}
