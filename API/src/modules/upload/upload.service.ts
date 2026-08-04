/**
 * ============================================================================
 * UPLOAD SERVICE - Serviço de Upload e Gestão de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para:
 * 1. Upload de ficheiros para o disco (disk storage)
 * 2. Geração de tokens temporários para acesso seguro
 * 3. Resolução de tokens (validar e retornar caminho real)
 * 4. Remoção de ficheiros do disco
 *
 * COMO FUNCIONAM OS TOKENS TEMPORÁRIOS?
 * -------------------------------------
 * 1. O cliente faz upload → recebe o filePath real (ex: "userId/avatars/uuid.jpg")
 * 2. O cliente pede uma URL temporária → recebe um token UUID
 * 3. O browser usa /api/v1/files/{token} para aceder ao ficheiro
 * 4. O token expira após TTL (default 5 min) e é removido da memória
 *
 * POR QUE MAP EM MEMÓRIA?
 * -----------------------
 * - Tokens são efémeros (5 min de vida)
 * - Não precisa de tabela no banco (zero overhead de DB)
 * - Lookup O(1) — extremamente rápido
 * - Se o servidor reiniciar, tokens são perdidos (aceitável: user faz refresh)
 *
 * SEGURANÇA:
 * ----------
 * - filePath é validado: deve começar com uploads/{userId}/
 * - ADMIN pode aceder a qualquer ficheiro (para gestão)
 * - Path traversal é prevenido com path.resolve() + startsWith()
 * ============================================================================
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve, join, relative, normalize } from 'path';
import { existsSync, createReadStream, unlinkSync, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

/**
 * Entrada armazenada no Map de tokens temporários.
 * Contém todas as informações necessárias para servir o ficheiro.
 */
interface TokenEntry {
  /** Caminho absoluto do ficheiro no disco */
  absolutePath: string;
  /** Caminho relativo (armazenado no DB, ex: "userId/avatars/uuid.jpg") */
  relativePath: string;
  /** Tipo MIME do ficheiro (para Content-Type header) */
  mimeType: string;
  /** Nome original do ficheiro (para Content-Disposition) */
  originalName: string;
  /** Timestamp de quando o token expira */
  expiresAt: number;
  /** Timer para auto-deletar o token quando expirar */
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Serviço UploadService — Gerencia uploads e tokens temporários.
 *
 * Implementa OnModuleDestroy para limpar timers quando o módulo
 * é destruído (ex: no shutdown do servidor).
 */
@Injectable()
export class UploadService implements OnModuleDestroy {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Map em memória que armazena os tokens temporários.
   * Key: token UUID → Value: TokenEntry com dados do ficheiro.
   */
  private readonly tokenStore = new Map<string, TokenEntry>();

  /**
   * Caminho absoluto do diretório base de uploads.
   * Resolvido a partir do UPLOAD_DIR no .env.
   */
  private readonly uploadDir: string;

  /**
   * Tamanho máximo do ficheiro em bytes.
   */
  private readonly maxFileSize: number;

  /**
   * Tempo de vida dos tokens em segundos.
   */
  private readonly tokenTtl: number;

  /**
   * Limite máximo de entradas no Map (safety net contra memory leak).
   */
  private readonly maxTokenEntries = 10000;

  /**
   * Intervalo de limpeza de tokens expirados (safety net).
   * Roda a cada 10 minutos.
   */
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(private readonly configService: ConfigService) {
    // Resolve o caminho absoluto do diretório de uploads
    const uploadDirConfig = this.configService.get<string>(
      'UPLOAD_DIR',
      './uploads',
    );
    this.uploadDir = resolve(uploadDirConfig);
    this.maxFileSize = this.configService.get<number>(
      'MAX_FILE_SIZE',
      10485760,
    );
    this.tokenTtl = this.configService.get<number>('FILE_TOKEN_TTL', 300);

    // Garante que o diretório de uploads existe
    if (!existsSync(this.uploadDir)) {
      mkdir(this.uploadDir, { recursive: true }).catch((err) => {
        this.logger.error('Failed to create uploads directory', err);
      });
    }

    // Safety net: limpeza periódica de tokens expirados
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);

    this.logger.log(
      `Upload service initialized: dir=${this.uploadDir}, maxSize=${this.maxFileSize}, ttl=${this.tokenTtl}s`,
    );
  }

  /**
   * Limpa todos os timers e o Map quando o módulo é destruído.
   */
  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
    for (const entry of this.tokenStore.values()) {
      clearTimeout(entry.timer);
    }
    this.tokenStore.clear();
    this.logger.log('Upload service destroyed: all tokens cleared');
  }

  // =========================================================================
  // UPLOAD
  // =========================================================================

  /**
   * Processa um ficheiro recebido pelo Multer.
   *
   * O Multer já escreveu o ficheiro no disco (disk storage).
   * Este método valida o caminho e retorna os metadados do ficheiro.
   *
   * @param userId - ID do usuário que fez o upload
   * @param file - Objeto do Multer com os dados do ficheiro
   * @param category - Categoria do upload (avatars, documents, etc.)
   * @returns Metadados do ficheiro (caminho relativo, nome, MIME, tamanho)
   */
  async processUpload(
    userId: string,
    file: Express.Multer.File,
    category: string,
  ): Promise<{
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: string;
  }> {
    // Valida que o ficheiro foi realmente escrito no diretório correto
    const expectedPrefix = join(this.uploadDir, userId, category);
    const resolvedPath = resolve(file.destination, file.filename);

    if (!resolvedPath.startsWith(expectedPrefix)) {
      // Segurança: remove o ficheiro se estiver no lugar errado
      this.safeDelete(resolvedPath);
      throw new BadRequestException('Invalid upload destination');
    }

    // Verifica que o ficheiro existe no disco
    if (!existsSync(resolvedPath)) {
      throw new BadRequestException('File was not saved to disk');
    }

    // Caminho relativo para armazenar no DB (sem o uploadDir)
    const relativePath = relative(this.uploadDir, resolvedPath);

    this.logger.log(
      `File uploaded: ${relativePath} (${file.mimetype}, ${file.size} bytes)`,
    );

    return {
      filePath: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
    };
  }

  // =========================================================================
  // TOKENS TEMPORÁRIOS
  // =========================================================================

  /**
   * Gera um token temporário para aceder a um ficheiro.
   *
   * SEGURANÇA:
   * - Valida que o filePath está dentro do diretório de uploads
   * - Valida que o filePath pertence ao usuário (ou é ADMIN)
   * - Valida que o ficheiro existe no disco
   *
   * @param userId - ID do usuário que solicita o token
   * @param userRole - Role do usuário (ADMIN pode aceder a tudo)
   * @param filePath - Caminho relativo do ficheiro (ex: "userId/avatars/uuid.jpg")
   * @returns Token UUID e URL de acesso
   */
  generateToken(
    userId: string,
    userRole: string,
    filePath: string,
  ): { token: string; url: string; expiresIn: number } {
    // Valida que o filePath não tenta sair do diretório (path traversal)
    const normalizedPath = normalize(filePath);
    const absolutePath = resolve(this.uploadDir, normalizedPath);

    if (!absolutePath.startsWith(this.uploadDir + '/')) {
      throw new BadRequestException('Invalid file path');
    }

    // Valida ownership: o filePath deve começar com {userId}/ (exceto ADMIN)
    if (userRole !== 'ADMIN') {
      const pathParts = normalizedPath.split('/');
      if (pathParts[0] !== userId) {
        throw new ForbiddenException(
          'You can only generate tokens for your own files',
        );
      }
    }

    // Verifica que o ficheiro existe no disco
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Verifica limite do Map (safety net)
    if (this.tokenStore.size >= this.maxTokenEntries) {
      this.cleanupExpired();
      if (this.tokenStore.size >= this.maxTokenEntries) {
        throw new BadRequestException(
          'Too many active tokens. Please try again later.',
        );
      }
    }

    // Gera o token UUID
    const token = randomUUID();
    const expiresIn = this.tokenTtl;
    const expiresAt = Date.now() + expiresIn * 1000;

    // Extrai informações do ficheiro para os headers HTTP
    const ext = normalizedPath.split('.').pop() || '';
    const mimeType = this.getMimeType(ext);
    const originalName = normalizedPath.split('/').pop() || 'file';

    // Timer para auto-deletar o token quando expirar
    const timer = setTimeout(() => {
      this.tokenStore.delete(token);
    }, expiresIn * 1000);

    // Armazena no Map
    this.tokenStore.set(token, {
      absolutePath,
      relativePath: normalizedPath,
      mimeType,
      originalName,
      expiresAt,
      timer,
    });

    this.logger.log(
      `Token generated: ${token} → ${normalizedPath} (expires in ${expiresIn}s)`,
    );

    return {
      token,
      url: `/api/v1/files/${token}`,
      expiresIn,
    };
  }

  /**
   * Resolve um token temporário e retorna os dados do ficheiro.
   *
   * Se o token for válido, retorna um ReadStream do ficheiro
   * com os headers corretos para streaming.
   *
   * @param token - Token UUID a resolver
   * @returns Dados do ficheiro (stream, mimeType, originalName) ou null se inválido
   */
  resolveToken(
    token: string,
  ): {
    stream: Readable;
    mimeType: string;
    originalName: string;
    size: number;
  } | null {
    const entry = this.tokenStore.get(token);

    // Token não existe (expirado ou nunca existiu)
    if (!entry) {
      return null;
    }

    // Verifica se ainda não expirou (double-check)
    if (Date.now() > entry.expiresAt) {
      clearTimeout(entry.timer);
      this.tokenStore.delete(token);
      return null;
    }

    // Verifica que o ficheiro ainda existe no disco
    if (!existsSync(entry.absolutePath)) {
      clearTimeout(entry.timer);
      this.tokenStore.delete(token);
      return null;
    }

    // Cria o ReadStream para streaming do ficheiro
    const stream = createReadStream(entry.absolutePath);

    // Obtém o tamanho do ficheiro para o Content-Length
    const { size } = statSync(entry.absolutePath);

    return {
      stream,
      mimeType: entry.mimeType,
      originalName: entry.originalName,
      size,
    };
  }

  // =========================================================================
  // DELETE
  // =========================================================================

  /**
   * Remove um ficheiro do disco.
   *
   * @param userId - ID do usuário dono do ficheiro
   * @param userRole - Role do usuário (ADMIN pode apagar tudo)
   * @param filePath - Caminho relativo do ficheiro
   */
  async deleteFile(
    userId: string,
    userRole: string,
    filePath: string,
  ): Promise<void> {
    const normalizedPath = normalize(filePath);
    const absolutePath = resolve(this.uploadDir, normalizedPath);

    // Segurança: previne path traversal
    if (!absolutePath.startsWith(this.uploadDir + '/')) {
      throw new BadRequestException('Invalid file path');
    }

    // Valida ownership (exceto ADMIN)
    if (userRole !== 'ADMIN') {
      const pathParts = normalizedPath.split('/');
      if (pathParts[0] !== userId) {
        throw new ForbiddenException(
          'You can only delete your own files',
        );
      }
    }

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    this.safeDelete(absolutePath);
    this.logger.log(`File deleted: ${normalizedPath}`);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Retorna o caminho absoluto do diretório de uploads.
   * Útil para outros módulos que precisam validar caminhos.
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * Retorna o tamanho máximo de ficheiro configurado.
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Remove tokens expirados do Map (safety net).
   * O timer individual já remove a maioria, mas este método
   * garante que nenhum token "órfão" fica na memória.
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [token, entry] of this.tokenStore.entries()) {
      if (now > entry.expiresAt) {
        clearTimeout(entry.timer);
        this.tokenStore.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleanup: removed ${cleaned} expired tokens`);
    }
  }

  /**
   * Remove um ficheiro do disco de forma segura.
   * Ignora erros se o ficheiro já não existir.
   */
  private safeDelete(absolutePath: string): void {
    try {
      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${absolutePath}`, err);
    }
  }

  /**
   * Remove um ficheiro do disco a partir do caminho relativo (sem verificação de ownership).
   * Usado para limpeza automática quando registos DB são apagados/atualizados
   * (ex: avatar antigo, documento removido, feedback eliminado).
   *
   * @param filePath - Caminho relativo do ficheiro (ex: "userId/avatars/uuid.jpg")
   */
  cleanupFile(filePath: string | null | undefined): void {
    if (!filePath) return;

    const normalizedPath = normalize(filePath);
    const absolutePath = resolve(this.uploadDir, normalizedPath);

    // Segurança: previne path traversal (mesmo em limpeza interna)
    if (!absolutePath.startsWith(this.uploadDir + '/')) {
      this.logger.warn(`Cleanup blocked: path traversal attempt: ${filePath}`);
      return;
    }

    this.safeDelete(absolutePath);
    this.logger.log(`Cleanup: file removed: ${normalizedPath}`);
  }

  /**
   * Mapeia extensão de ficheiro para MIME type.
   * Fallback para 'application/octet-stream' se desconhecido.
   */
  private getMimeType(ext: string): string {
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeMap[ext.toLowerCase()] || 'application/octet-stream';
  }
}
