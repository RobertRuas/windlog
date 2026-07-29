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
 * - getAuthFileUrl(): Retorna URL autenticada para acesso ao ficheiro
 *
 * ACESSO A FICHEIROS:
 * --------------------
 * Os ficheiros são completamente privados no servidor.
 * O acesso é feito exclusivamente pela API, que valida JWT e propriedade.
 * O frontend NUNCA acede ficheiros diretamente por URL estática.
 * Use SEMPRE getAuthFileUrl() para construir URLs de acesso.
 *
 * COMO USAR:
 * ----------
 * import { uploadFile, getAuthFileUrl } from '@/services/upload.service';
 *
 * // Upload de um ficheiro
 * const result = await uploadFile(file, 'document');
 *
 * // Aceder ao ficheiro (com autenticação)
 * <img src={getAuthFileUrl(result.url)} />
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
  /** URL da API para download do ficheiro (ex: /api/v1/upload/file/{id}) */
  url: string;
  /** Caminho relativo no servidor (interno, não usar diretamente) */
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
 * Adiciona o token JWT a qualquer URL de ficheiro para autenticação.
 * Use esta função SEMPRE que precisar construir um URL para acessar ficheiros.
 *
 * FUNCIONA COM:
 * - URLs novas (por ID): "/api/v1/upload/file/xxx" → adiciona ?token=
 * - URLs antigas (por path): "/api/v1/uploads/avatars/..." → converte para
 *   "/api/v1/upload/file/by-path?path=avatars/...&token="
 *
 * @param url - URL do ficheiro (nova ou antiga)
 * @returns URL com token JWT incluído
 *
 * @example
 * // Num <img src>, window.open(), <a href>, etc.
 * <img src={getAuthFileUrl(file.url)} />
 * window.open(getAuthFileUrl(file.url));
 */
export function getAuthFileUrl(url: string): string {
  const token = localStorage.getItem('accessToken');
  if (!token || !url) return url;

  // URL nova (por ID): /api/v1/upload/file/:id
  // Basta adicionar o token como query param
  if (url.includes('/api/v1/upload/file/')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  // URL antiga (por path): /api/v1/uploads/<path>
  // Converte para o endpoint seguro /api/v1/upload/file/by-path?path=<path>
  if (url.includes('/api/v1/uploads/')) {
    const relativePath = url.replace('/api/v1/uploads/', '');
    return `/api/v1/upload/file/by-path?path=${encodeURIComponent(relativePath)}&token=${encodeURIComponent(token)}`;
  }

  // Fallback: adiciona token normalmente
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
