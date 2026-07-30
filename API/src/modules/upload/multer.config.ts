/**
 * ============================================================================
 * MULTER CONFIG - Configuração de Upload de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Configura o Multer (middleware de multipart/form-data) para receber
 * ficheiros do cliente. Define:
 * - Onde os ficheiros são armazenados (disk storage)
 * - Como os ficheiros são nomeados (UUID + extensão original)
 * - Quais tipos MIME são permitidos (allowlist de segurança)
 * - Tamanho máximo do ficheiro
 *
 * POR QUE DISK STORAGE?
 * ---------------------
 * Disk storage faz stream direto para o disco, sem carregar o ficheiro
 * inteiro na memória. Essencial para suportar ficheiros grandes sem
 * esgotar a RAM do servidor.
 *
 * SEGURANÇA:
 * ----------
 * - Filename é UUID (nunca input do user) → previne path traversal
 * - Categoria é validada contra allowlist → previne escrita em dirs inesperados
 * - MIME types são filtrados → previne upload de ficheiros maliciosos
 * - Tamanho é limitado → previne ataques de exaustão de disco
 * ============================================================================
 */

import { diskStorage, Options as MulterOptions } from 'multer';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

/**
 * Categorias válidas para upload.
 * Cada categoria corresponde a um subdiretório dentro de uploads/{userId}/.
 */
export const VALID_CATEGORIES = [
  'avatars',
  'documents',
  'certifications',
  'projects',
  'other',
] as const;

export type UploadCategory = (typeof VALID_CATEGORIES)[number];

/**
 * MIME types permitidos para upload.
 * Organizados por categoria para facilitar validação contextual.
 */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  certifications: [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
  projects: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ],
  other: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

/**
 * Todos os MIME types permitidos (união de todas as categorias).
 */
const ALL_ALLOWED_MIMES = [
  ...new Set(Object.values(ALLOWED_MIME_TYPES).flat()),
];

/**
 * Valida se a categoria é válida.
 *
 * @param category - string a validar
 * @returns true se for uma UploadCategory válido
 */
export function isValidCategory(category: string): category is UploadCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Cria a configuração do Multer para uma categoria específica.
 *
 * @param uploadDir - diretório base de uploads (do env UPLOAD_DIR)
 * @param maxFileSize - tamanho máximo em bytes (do env MAX_FILE_SIZE)
 * @returns MulterOptions pronto para usar no FileInterceptor
 */
export function createMulterConfig(
  uploadDir: string,
  maxFileSize: number,
): MulterOptions {
  return {
    // Disk storage: stream direto para disco (não carrega na memória)
    storage: diskStorage({
      /**
       * Define o diretório de destino do ficheiro.
       * Estrutura: {uploadDir}/{userId}/{category}/
       */
      destination: (
        req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void,
      ) => {
        // Extrai o userId do JWT (adicionado pelo JwtAuthGuard)
        const userId = (req as Request & { user?: { sub?: string } }).user?.sub;
        if (!userId) {
          return cb(new BadRequestException('User not authenticated'), '');
        }

        // Extrai e valida a categoria do parâmetro da rota
        const category = (req.params as Record<string, string>)?.['category'];
        if (!category || !isValidCategory(category)) {
          return cb(
            new BadRequestException(
              `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
            ),
            '',
          );
        }

        // Monta o caminho: uploads/{userId}/{category}/
        const dest = join(uploadDir, userId, category);
        cb(null, dest);
      },

      /**
       * Define o nome do ficheiro.
       * Formato: {uuid}{extensão_original}
       *
       * Usar UUID previne:
       * - Colisões de nomes
       * - Path traversal (nunca usa input do user)
       * - Sobrescrita acidental de ficheiros
       */
      filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
      ) => {
        const ext = extname(file.originalname).toLowerCase();
        const filename = `${randomUUID()}${ext}`;
        cb(null, filename);
      },
    }),

    /**
     * Filtro de MIME types.
     * Rejeita ficheiros com tipos não permitidos ANTES de escrever no disco.
     */
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (ALL_ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            `File type "${file.mimetype}" is not allowed. Accepted types: ${ALL_ALLOWED_MIMES.join(', ')}`,
          ),
          false,
        );
      }
    },

    /**
     * Limites de tamanho do ficheiro.
     * Previne ataques de exaustão de disco.
     */
    limits: {
      fileSize: maxFileSize,
    },
  };
}
