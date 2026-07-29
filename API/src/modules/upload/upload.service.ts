/**
 * ============================================================================
 * UPLOAD SERVICE - Serviço Centralizado de Upload de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE SERVIÇO?
 * ---------------------
 * Serviço centralizado que gerencia TODOS os uploads de ficheiros do sistema.
 * Os ficheiros são guardados no disco do servidor (pasta API/uploads/).
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Upload de ficheiros com validação de tamanho e tipo
 * - Geração de nomes únicos para evitar conflitos
 * - Organização por categorias (avatars, documents, certifications, etc.)
 * - Busca de ficheiros por ID ou categoria
 * - Remoção de ficheiros (físico + banco de dados)
 * - Listagem de ficheiros do usuário
 *
 * COMO USAR:
 * ----------
 * 1. Injete o UploadService no seu módulo
 * 2. Chame uploadFile() para fazer upload
 * 3. Use getFileById() para buscar informações
 * 4. Use removeFile() para remover
 *
 * ESTRUTURA DE DIRETÓRIOS:
 * ------------------------
 * Os ficheiros são organizados por categoria e por usuário:
 *   uploads/
 *     avatars/<userId>/        - Fotos de perfil
 *     documents/<userId>/      - Documentos pessoais
 *     certifications/<userId>/ - Certificações
 *     banks/<userId>/          - Comprovantes bancários
 *     other/<userId>/          - Outros ficheiros
 *
 * CATEGORIAS DISPONÍVEIS:
 * -----------------------
 * - avatar:       Fotos de perfil do usuário
 * - document:     Documentos pessoais (passaporte, ID, etc.)
 * - certification: Certificações profissionais
 * - other:        Outros ficheiros
 * ============================================================================
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StreamableFile } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';

/**
 * Categorias válidas para upload de ficheiros.
 */
export type FileCategory = 'avatar' | 'document' | 'certification' | 'bank' | 'other';

/**
 * Resultado de um upload bem-sucedido.
 */
export interface UploadResult {
  /** ID do ficheiro no banco de dados */
  id: string;
  /** URL da API para download do ficheiro (ex: /api/v1/upload/file/{id}) */
  url: string;
  /** Caminho relativo no servidor (interno, não exposto ao cliente) */
  path: string;
  /** Nome original do ficheiro */
  originalName: string;
  /** Tipo MIME do ficheiro */
  mimeType: string;
  /** Tamanho em bytes */
  size: number;
}

/**
 * Informações completas de um ficheiro uploadado.
 */
export interface FileInfo {
  id: string;
  path: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  userId: string;
  createdAt: Date;
}

/**
 * Resultado do download: StreamableFile + metadados para headers.
 */
export interface FileDownloadResult {
  file: StreamableFile;
  mimeType: string;
  originalName: string;
  size: number;
}

/**
 * Tamanho máximo de upload: 3 MB (em bytes).
 */
const MAX_FILE_SIZE = 3 * 1024 * 1024;

/**
 * Tipos MIME permitidos para upload.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Pasta base onde os ficheiros são guardados.
   * Resolve para API/uploads/
   */
  private readonly uploadsDir: string;

  constructor(private readonly prisma: PrismaService) {
    // Resolve o caminho absoluto para a pasta uploads/
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  /**
   * Garante que a pasta base de uploads existe.
   * As subpastas por categoria/usuário são criadas dinamicamente no upload.
   */
  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Retorna o nome da subpasta para uma categoria.
   */
  private getCategoryFolder(category: FileCategory): string {
    const folders: Record<FileCategory, string> = {
      avatar: 'avatars',
      document: 'documents',
      certification: 'certifications',
      bank: 'banks',
      other: 'other',
    };
    return folders[category] || 'other';
  }

  /**
   * Faz upload de um ficheiro para o servidor.
   *
   * PASSO A PASSO:
   * 1. Valida o tamanho do ficheiro (máx. 3 MB)
   * 2. Valida o tipo MIME do ficheiro
   * 3. Se avatar, remove o avatar anterior do usuário
   * 4. Gera um nome único (UUID + extensão)
   * 5. Guarda o ficheiro em API/uploads/<categoria>/<userId>/
   * 6. Regista no banco de dados (modelo UploadedFile)
   * 7. Retorna informações do ficheiro (incluindo URL de acesso)
   *
   * @param file - Ficheiro recebido (buffer + metadados do multer)
   * @param userId - ID do usuário que está fazendo o upload
   * @param category - Categoria do ficheiro (avatar, document, etc.)
   * @returns Informações do ficheiro uploadado
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    category: FileCategory = 'other',
  ): Promise<UploadResult> {
    // PASSO 1: Valida o tamanho do ficheiro
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Ficheiro muito grande. Tamanho máximo: 3 MB. Recebido: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
      );
    }

    // PASSO 2: Valida o tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de ficheiro não permitido. Tipos aceitos: JPEG, PNG, WebP, PDF. Recebido: ${file.mimetype}`,
      );
    }

    // PASSO 2.1: Se é um avatar, remove o avatar anterior do usuário.
    // Cada usuário pode ter apenas UM avatar por vez.
    if (category === 'avatar') {
      await this.removeExistingAvatar(userId);
    }

    // PASSO 3: Gera um nome único e monta o caminho por usuário
    // Estrutura: uploads/<categoria>/<userId>/<uuid>.<ext>
    const folder = this.getCategoryFolder(category);
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const relativePath = `${folder}/${userId}/${uniqueName}`;
    const absoluteDir = path.join(this.uploadsDir, folder, userId);
    const absolutePath = path.join(absoluteDir, uniqueName);

    // Garante que o diretório do usuário existe (cria se necessário)
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // PASSO 4: Guarda o ficheiro no disco
    fs.writeFileSync(absolutePath, file.buffer);

    this.logger.log(`File uploaded: ${relativePath} (${file.size} bytes)`);

    // PASSO 5: Regista no banco de dados
    const uploadedFile = await this.prisma.uploadedFile.create({
      data: {
        path: relativePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category,
        userId,
      },
    });

    // PASSO 6: Retorna informações do ficheiro
    // URL aponta para o endpoint de download por ID (nunca expõe o caminho real)
    return {
      id: uploadedFile.id,
      url: `/api/v1/upload/file/${uploadedFile.id}`,
      path: relativePath,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
    };
  }

  /**
   * Busca informações de um ficheiro pelo ID.
   *
   * @param fileId - ID do ficheiro no banco de dados
   * @returns Informações completas do ficheiro
   * @throws NotFoundException se o ficheiro não existir
   */
  async getFileById(fileId: string): Promise<FileInfo> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`Ficheiro não encontrado: ${fileId}`);
    }

    return {
      id: file.id,
      path: file.path,
      url: `/api/v1/upload/file/${file.id}`,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      userId: file.userId,
      createdAt: file.createdAt,
    };
  }

  /**
   * Lista todos os ficheiros de um usuário, opcionalmente filtrados por categoria.
   *
   * @param userId - ID do usuário
   * @param category - Categoria para filtrar (opcional)
   * @returns Lista de ficheiros encontrados
   */
  async getUserFiles(userId: string, category?: FileCategory): Promise<FileInfo[]> {
    const where: Record<string, unknown> = { userId };
    if (category) {
      where.category = category;
    }

    const files = await this.prisma.uploadedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => ({
      id: file.id,
      path: file.path,
      url: `/api/v1/upload/file/${file.id}`,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      userId: file.userId,
      createdAt: file.createdAt,
    }));
  }

  /**
   * Remove um ficheiro do sistema (físico + banco de dados).
   *
   * @param fileId - ID do ficheiro no banco de dados
   * @throws NotFoundException se o ficheiro não existir
   */
  async removeFile(fileId: string): Promise<void> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`Ficheiro não encontrado: ${fileId}`);
    }

    // Remove o ficheiro físico do disco
    const absolutePath = path.join(this.uploadsDir, file.path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      this.logger.log(`File deleted from disk: ${file.path}`);
    }

    // Remove o registo do banco de dados
    await this.prisma.uploadedFile.delete({
      where: { id: fileId },
    });

    this.logger.log(`File record deleted: ${fileId}`);
  }

  /**
   * Remove o avatar existente de um usuário (físico + banco de dados).
   * Chamado automaticamente antes de criar um novo avatar, garantindo
   * que cada usuário tenha apenas UM avatar por vez.
   *
   * @param userId - ID do usuário cujo avatar será removido
   */
  private async removeExistingAvatar(userId: string): Promise<void> {
    const existingAvatars = await this.prisma.uploadedFile.findMany({
      where: { userId, category: 'avatar' },
    });

    for (const avatar of existingAvatars) {
      // Remove o ficheiro físico do disco
      const absolutePath = path.join(this.uploadsDir, avatar.path);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        this.logger.log(`Old avatar deleted from disk: ${avatar.path}`);
      }

      // Remove o registo do banco de dados
      await this.prisma.uploadedFile.delete({
        where: { id: avatar.id },
      });
    }

    if (existingAvatars.length > 0) {
      this.logger.log(
        `Removed ${existingAvatars.length} old avatar(s) for user ${userId}`,
      );
    }
  }

  /**
   * Faz o download seguro de um ficheiro.
   *
   * REGRAS DE ACESSO:
   * - O usuário autenticado deve ser o PROPRIETÁRIO do ficheiro
   * - OU ter role ADMIN (acesso total)
   *
   * O ficheiro é retornado como StreamableFile (stream), nunca expõe
   * o caminho real do diretório.
   *
   * @param fileId - ID do ficheiro no banco de dados
   * @param userId - ID do usuário autenticado
   * @param userRole - Role do usuário autenticado
   * @returns StreamableFile + metadados para headers HTTP
   * @throws NotFoundException se o ficheiro não existir
   * @throws ForbiddenException se o usuário não tiver permissão
   */
  async downloadFile(
    fileId: string,
    userId: string,
    userRole: string,
  ): Promise<FileDownloadResult> {
    // Busca o registo do ficheiro no banco
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`Ficheiro não encontrado: ${fileId}`);
    }

    // Verifica autorização: proprietário ou ADMIN
    const isOwner = file.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Não tem permissão para acessar este ficheiro',
      );
    }

    // Monta o caminho absoluto do ficheiro no disco
    const absolutePath = path.join(this.uploadsDir, file.path);

    // Verifica se o ficheiro físico existe
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(
        `Ficheiro não encontrado no servidor: ${fileId}`,
      );
    }

    // Cria o stream do ficheiro (não expõe o caminho ao cliente)
    const fileStream = fs.createReadStream(absolutePath);

    return {
      file: new StreamableFile(fileStream),
      mimeType: file.mimeType,
      originalName: file.originalName,
      size: file.size,
    };
  }

  /**
   * Download seguro por caminho relativo (compatibilidade com URLs antigas).
   *
   * Usado para ficheiros cuja URL no banco ainda tem o formato antigo
   * (ex: /api/v1/uploads/avatars/userId/uuid.jpg).
   * Mesma segurança do downloadFile: proprietário ou ADMIN.
   *
   * @param filePath - Caminho relativo do ficheiro (ex: avatars/userId/uuid.jpg)
   * @param userId - ID do usuário autenticado
   * @param userRole - Role do usuário autenticado
   * @returns StreamableFile + metadados
   */
  async downloadFileByPath(
    filePath: string,
    userId: string,
    userRole: string,
  ): Promise<FileDownloadResult> {
    // Busca o ficheiro pelo caminho relativo no banco
    const file = await this.prisma.uploadedFile.findFirst({
      where: { path: filePath },
    });

    if (!file) {
      throw new NotFoundException(`Ficheiro não encontrado: ${filePath}`);
    }

    // Verifica autorização: proprietário ou ADMIN
    const isOwner = file.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Não tem permissão para acessar este ficheiro',
      );
    }

    const absolutePath = path.join(this.uploadsDir, file.path);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(
        `Ficheiro não encontrado no servidor: ${filePath}`,
      );
    }

    const fileStream = fs.createReadStream(absolutePath);

    return {
      file: new StreamableFile(fileStream),
      mimeType: file.mimeType,
      originalName: file.originalName,
      size: file.size,
    };
  }

  /**
   * Remove todos os ficheiros de uma lista de IDs.
   * Útil para limpeza em massa (ex: ao remover um documento com múltiplos anexos).
   *
   * @param fileIds - Lista de IDs de ficheiros para remover
   */
  async removeMultipleFiles(fileIds: string[]): Promise<void> {
    for (const fileId of fileIds) {
      try {
        await this.removeFile(fileId);
      } catch (error) {
        // Se o ficheiro não existir, apenas loga e continua
        this.logger.warn(`Could not delete file ${fileId}: ${error}`);
      }
    }
  }
}
