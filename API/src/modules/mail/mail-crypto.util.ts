/**
 * ============================================================================
 * MAIL CRYPTO UTIL - Criptografia de Senhas de E-mail
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Utilitário para cifrar/decifrar a senha da conta de e-mail do usuário
 * antes de armazenar no banco de dados.
 *
 * POR QUE EXISTE?
 * ---------------
 * A senha do e-mail é necessária para sincronizar via IMAP/SMTP, mas
 * NUNCA pode ser armazenada em texto simples. Usamos AES-256-GCM
 * (criptografia autenticada) com chave derivada da variável de ambiente
 * MAIL_ENCRYPTION_KEY (ou JWT_SECRET como fallback).
 *
 * FORMATO ARMAZENADO:
 * -------------------
 * "v1.<iv_base64>.<authTag_base64>.<cipher_base64>"
 * ============================================================================
 */

import * as crypto from 'node:crypto';

/** Prefixo da versão do formato de criptografia */
const VERSION = 'v1';

/**
 * Deriva a chave de 32 bytes usada no AES-256-GCM.
 * Usa MAIL_ENCRYPTION_KEY se definida; caso contrário, deriva do JWT_SECRET.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env['MAIL_ENCRYPTION_KEY'] || process.env['JWT_SECRET'] || '';
  // SHA-256 garante uma chave de exatamente 32 bytes
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra um texto (senha) usando AES-256-GCM.
 *
 * @param plainText - texto em claro (ex: senha do e-mail)
 * @returns string cifrada no formato "v1.iv.tag.cipher"
 */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}

/**
 * Decifra um texto cifrado por encryptSecret().
 *
 * @param encryptedText - string no formato "v1.iv.tag.cipher"
 * @returns texto em claro
 * @throws Error se o formato for inválido ou a autenticação falhar
 */
export function decryptSecret(encryptedText: string): string {
  const parts = encryptedText.split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Invalid encrypted secret format');
  }
  const iv = Buffer.from(parts[1]!, 'base64');
  const tag = Buffer.from(parts[2]!, 'base64');
  const data = Buffer.from(parts[3]!, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
