/**
 * ============================================================================
 * UPLOAD SERVICE - Serviço de Upload e Gestão de Ficheiros (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço frontend para comunicar com o backend no módulo de upload.
 * Responsável por:
 * 1. Fazer upload de ficheiros (multipart/form-data)
 * 2. Gerar URLs temporárias para aceder a ficheiros
 * 3. Apagar ficheiros do servidor
 *
 * COMO FUNCIONA?
 * --------------
 * - uploadFile(): cria FormData e envia via POST para /api/v1/upload/:category
 * - getTempUrl(): pede ao backend um token temporário para um filePath
 * - buildFileUrl(): constrói a URL final /api/v1/files/{token}
 *
 * FLUXO TÍPICO:
 * -------------
 * 1. User faz upload → recebe filePath do servidor
 * 2. Frontend chama getTempUrl(filePath) → recebe { token, url }
 * 3. Frontend usa a url em <img src> ou <a href>
 * 4. Ao refrescar página, pede novos tokens (os antigos expiram)
 * ============================================================================
 */

import { api } from './api';

/**
 * Resposta do backend após upload bem-sucedido.
 */
export interface UploadResponse {
  data: {
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: string;
  };
}

/**
 * Resposta do backend ao gerar URL temporária.
 */
export interface TempUrlResponse {
  data: {
    token: string;
    url: string;
    expiresIn: number;
  };
}

/**
 * Categorias válidas para upload (espelha o backend).
 */
export type UploadCategory =
  | 'avatars'
  | 'documents'
  | 'certifications'
  | 'projects'
  | 'other';

/**
 * Faz upload de um ficheiro para o servidor.
 *
 * @param file - Objeto File do browser (de um <input type="file">)
 * @param category - Categoria do upload (avatars, documents, etc.)
 * @returns Resposta com os metadados do ficheiro (filePath, size, etc.)
 */
export async function uploadFile(
  file: File,
  category: UploadCategory,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<UploadResponse>(
    `/api/v1/upload/${category}`,
    formData,
    { isFormData: true },
  );
}

/**
 * Faz upload da foto de perfil e atualiza o photoUrl do usuário.
 * Endpoint específico: POST /api/v1/auth/avatar (upload + update photoUrl).
 *
 * @param file - Objeto File do browser (de um <input type="file">)
 * @returns Resposta com os dados do usuário atualizados
 */
export async function uploadAvatar(
  file: File,
): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<Record<string, unknown>>(
    '/api/v1/auth/avatar',
    formData,
    { isFormData: true },
  );
}

/**
 * Gera uma URL temporária para aceder a um ficheiro.
 *
 * @param filePath - Caminho relativo do ficheiro (ex: "userId/avatars/uuid.jpg")
 * @returns Resposta com o token e a URL completa
 */
export async function getTempUrl(
  filePath: string,
): Promise<TempUrlResponse> {
  return api.post<TempUrlResponse>('/api/v1/upload/temp-url', {
    filePath,
  });
}

/**
 * Constrói a URL final de acesso ao ficheiro a partir de um token.
 *
 * @param token - Token UUID gerado pelo backend
 * @returns URL completa para usar em <img src> ou <a href>
 */
export function buildFileUrl(token: string): string {
  return `/api/v1/files/${token}`;
}

/**
 * Apaga um ficheiro do servidor.
 *
 * @param filePath - Caminho relativo do ficheiro
 */
export async function deleteFile(filePath: string): Promise<void> {
  await api.delete('/api/v1/upload', { filePath });
}
