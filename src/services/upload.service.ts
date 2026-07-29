/**
 * ============================================================================
 * UPLOAD SERVICE - Serviço Centralizado de Upload de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço centralizado que faz chamadas à API para upload e gestão de ficheiros.
 * Pode ser utilizado em qualquer parte do sistema que precise fazer upload.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - uploadFile(): Faz upload de um único ficheiro
 * - uploadMultipleFiles(): Faz upload de múltiplos ficheiros
 * - getUserFiles(): Lista ficheiros do usuário por categoria
 * - removeFile(): Remove um ficheiro
 * - getFileUrl(): Retorna a URL completa de um ficheiro
 *
 * COMO USAR:
 * ----------
 * import { uploadFile, getFileUrl } from '@/services/upload.service';
 *
 * // Upload de um ficheiro
 * const result = await uploadFile(file, 'document');
 *
 * // Obter URL do ficheiro
 * const url = getFileUrl(result.path);
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

/**
 * Resultado de um upload bem-sucedido.
 */
export interface UploadResult {
  /** ID do ficheiro no banco de dados */
  id: string;
  /** URL completa para acessar o ficheiro (ex: /api/v1/uploads/documents/xxx.jpg) */
  url: string;
  /** Caminho relativo no servidor */
  path: string;
  /** Nome original do ficheiro */
  originalName: string;
  /** Tipo MIME do ficheiro */
  mimeType: string;
  /** Tamanho em bytes */
  size: number;
}

/**
 * Informações de um ficheiro uploadado.
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
  createdAt: string;
}

/**
 * Categorias válidas para upload de ficheiros.
 */
export type FileCategory = 'avatar' | 'document' | 'certification' | 'bank' | 'other';

/**
 * Tamanho máximo de upload: 3 MB (em bytes).
 */
export const MAX_FILE_SIZE = 3 * 1024 * 1024;

/**
 * Tipos MIME permitidos para upload.
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Valida um ficheiro antes do upload.
 *
 * @param file - Ficheiro a validar
 * @throws Error se o ficheiro for inválido
 */
export function validateFile(file: File): void {
  // Valida o tamanho
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(`Ficheiro muito grande (${sizeMB} MB). Tamanho máximo: 3 MB.`);
  }

  // Valida o tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Tipo de ficheiro não permitido (${file.type}). Tipos aceitos: JPEG, PNG, WebP, PDF.`);
  }
}

/**
 * Faz upload de um único ficheiro para o servidor.
 *
 * @param file - Ficheiro a fazer upload
 * @param category - Categoria do ficheiro (avatar, document, etc.)
 * @returns Resultado do upload com ID, URL e metadados
 */
export async function uploadFile(
  file: File,
  category: FileCategory = 'other',
): Promise<UploadResult> {
  // Valida o ficheiro antes de fazer upload
  validateFile(file);

  // Cria o FormData com o ficheiro
  const formData = new FormData();
  formData.append('file', file);

  // Faz upload via API
  const response = await api.upload<ApiResponse<UploadResult>>(
    `/api/v1/upload?category=${category}`,
    formData,
  );

  return response.data;
}

/**
 * Faz upload de múltiplos ficheiros para o servidor.
 *
 * @param files - Lista de ficheiros a fazer upload
 * @param category - Categoria dos ficheiros
 * @returns Lista de resultados de upload
 */
export async function uploadMultipleFiles(
  files: File[],
  category: FileCategory = 'document',
): Promise<UploadResult[]> {
  // Valida todos os ficheiros antes de fazer upload
  files.forEach(validateFile);

  // Faz upload de cada ficheiro individualmente
  const results = await Promise.all(
    files.map((file) => uploadFile(file, category)),
  );

  return results;
}

/**
 * Lista todos os ficheiros do usuário autenticado.
 *
 * @param category - Filtrar por categoria (opcional)
 * @returns Lista de ficheiros encontrados
 */
export async function getUserFiles(category?: FileCategory): Promise<FileInfo[]> {
  const url = category
    ? `/api/v1/upload?category=${category}`
    : '/api/v1/upload';

  const response = await api.get<ApiResponse<FileInfo[]>>(url);
  return response.data;
}

/**
 * Remove um ficheiro do servidor.
 *
 * @param fileId - ID do ficheiro a remover
 */
export async function removeFile(fileId: string): Promise<void> {
  await api.delete(`/api/v1/upload/${fileId}`);
}

/**
 * Retorna a URL completa para acessar um ficheiro no servidor.
 *
 * @param path - Caminho relativo do ficheiro (ex: "documents/xxx.jpg")
 * @returns URL completa (ex: "/api/v1/uploads/documents/xxx.jpg")
 */
export function getFileUrl(path: string): string {
  return `/api/v1/uploads/${path}`;
}
