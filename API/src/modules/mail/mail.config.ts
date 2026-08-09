/**
 * ============================================================================
 * MAIL CONFIG - Configurações Fixas dos Servidores de E-mail
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define as configurações PRÉ-DEFINIDAS dos servidores de e-mail.
 * Estes valores são fixos e NÃO podem ser alterados pelo usuário final.
 * O usuário informa apenas e-mail + senha na página de configurações.
 *
 * SERVIDORES (fixos):
 * -------------------
 * - Entrada (IMAP): imap.one.com:993 (TLS)
 * - Saída (SMTP):   send.one.com:465 (TLS)
 * - Entrada (POP3): pop.one.com:995 (TLS, alternativo)
 *
 * SEGURANÇA:
 * ----------
 * - Todas as conexões usam TLS (secure: true)
 * - A senha do usuário é cifrada no banco (ver mail-crypto.util.ts)
 * ============================================================================
 */

/**
 * Configuração fixa dos servidores de e-mail da organização.
 */
export const MAIL_SERVERS = {
  // Servidor de entrada IMAP (recebimento + sincronização contínua)
  imap: {
    host: 'imap.one.com',
    port: 993,
    secure: true, // TLS obrigatório
  },
  // Servidor de saída SMTP (envio de mensagens)
  smtp: {
    host: 'send.one.com',
    port: 465,
    secure: true, // TLS obrigatório
  },
  // Servidor de entrada POP3 (alternativo ao IMAP)
  pop3: {
    host: 'pop.one.com',
    port: 995,
    secure: true, // TLS obrigatório
  },
} as const;

/**
 * Extensões de ficheiro consideradas perigosas em anexos.
 * Anexos com estas extensões são marcados como suspeitos.
 */
export const SUSPICIOUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.vbe',
  '.js', '.jse', '.jar', '.ps1', '.psm1', '.msi', '.dll', '.hta',
  '.wsf', '.lnk', '.reg',
];

/**
 * Limite de tamanho de anexo baixado na sincronização (bytes).
 * Anexos maiores são registrados no DB mas o conteúdo não é baixado.
 */
export const MAX_ATTACHMENT_DOWNLOAD_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Máximo de mensagens baixadas por pasta em cada ciclo de sincronização.
 * Evita sobrecarga na primeira sincronização de caixas muito grandes.
 */
export const SYNC_BATCH_SIZE = 50;

/**
 * Intervalo da sincronização contínua em milissegundos (60 segundos).
 */
export const SYNC_INTERVAL_MS = 60_000;
