/**
 * ============================================================================
 * DOCUMENT SERVICE - Serviço de Documentos (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de Documents.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - getDocuments(): lista documentos paginados
 * - getDocumentById(): busca um documento completo
 * - createDocument(): cria novo documento
 * - updateDocument(): atualiza documento (cria nova versão)
 * - deleteDocument(): remove documento (soft delete)
 * - getTemplates(): lista templates disponíveis
 * - signDocument(): assina documento
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

// =========================================================================
// TYPES - Interfaces para tipagem dos dados
// =========================================================================

/**
 * Status possíveis do documento.
 */
export type DocumentStatus = 'DRAFT' | 'SIGNED' | 'FINAL';

/**
 * Template disponível para geração de documentos.
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
}

/**
 * Documento gerado completo com todas as relações.
 * Retornado pelo endpoint GET /documents/:id
 */
export interface GeneratedDocument {
  id: string;
  templateId: string;
  version: number;
  title: string;
  formData: Record<string, any>;
  status: DocumentStatus;
  signatureData?: string | null;
  signatureDate?: string | null;
  signedBy?: string | null;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Documento resumido para listagem.
 * Retornado pelo endpoint GET /documents
 */
export interface DocumentListItem {
  id: string;
  templateId: string;
  version: number;
  title: string;
  status: DocumentStatus;
  signatureData?: string | null;
  signatureDate?: string | null;
  signedBy?: string | null;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados para criar um novo documento.
 */
export interface CreateDocumentPayload {
  templateId: string;
  title: string;
  formData: Record<string, any>;
  signatureData?: string;
  signedBy?: string;
}

/**
 * Dados para atualizar um documento.
 */
export interface UpdateDocumentPayload {
  title?: string;
  formData?: Record<string, any>;
  signatureData?: string;
  signedBy?: string;
}

/**
 * Resposta paginada da API.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =========================================================================
// FUNÇÕES DA API
// =========================================================================

const BASE_URL = '/api/v1/documents';

/**
 * Lista documentos com paginação e filtros.
 *
 * @param params - Parâmetros de filtro (templateId, status, page, limit)
 * @returns Lista paginada de documentos
 */
export async function getDocuments(
  params: Record<string, string | number | undefined> = {},
): Promise<ApiResponse<PaginatedResponse<DocumentListItem>>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
}

/**
 * Busca um documento completo pelo ID.
 *
 * @param id - ID do documento
 * @returns Documento completo
 */
export async function getDocumentById(
  id: string,
): Promise<ApiResponse<GeneratedDocument>> {
  return api.get(`${BASE_URL}/${id}`);
}

/**
 * Cria um novo documento gerado a partir de template.
 *
 * @param data - Dados para criação
 * @returns Documento criado
 */
export async function createDocument(
  data: CreateDocumentPayload,
): Promise<ApiResponse<GeneratedDocument>> {
  return api.post(BASE_URL, data);
}

/**
 * Atualiza um documento existente criando uma nova versão.
 *
 * @param id - ID do documento
 * @param data - Dados para atualização
 * @returns Nova versão do documento
 */
export async function updateDocument(
  id: string,
  data: UpdateDocumentPayload,
): Promise<ApiResponse<GeneratedDocument>> {
  return api.put(`${BASE_URL}/${id}`, data);
}

/**
 * Remove um documento (soft delete).
 *
 * @param id - ID do documento
 */
export async function deleteDocument(
  id: string,
): Promise<ApiResponse<{ message: string }>> {
  return api.delete(`${BASE_URL}/${id}`);
}

/**
 * Lista templates disponíveis para geração de documentos.
 *
 * @returns Lista de templates
 */
export async function getTemplates(): Promise<ApiResponse<DocumentTemplate[]>> {
  return api.get(`${BASE_URL}/templates`);
}

/**
 * Assina um documento.
 *
 * @param id - ID do documento
 * @param signatureData - Dados da assinatura em base64
 * @param signedBy - Nome de quem assinou
 * @returns Documento assinado
 */
export async function signDocument(
  id: string,
  signatureData: string,
  signedBy: string,
): Promise<ApiResponse<GeneratedDocument>> {
  return api.post(`${BASE_URL}/${id}/sign`, { signatureData, signedBy });
}
