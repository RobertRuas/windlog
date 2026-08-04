/**
 * ============================================================================
 * FEEDBACK SERVICE - Serviço de Feedback (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de Feedbacks.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - createFeedback():       cria novo feedback (qualquer usuário)
 * - getFeedbacks():         lista feedbacks paginados (ADMIN)
 * - getFeedbackById():      busca feedback por ID (ADMIN)
 * - updateFeedback():       atualiza feedback (ADMIN)
 * - deleteFeedback():       remove feedback (ADMIN)
 * - getFeedbackStats():     estatísticas dos feedbacks (ADMIN)
 * ============================================================================
 */

import { api } from './api';

// =========================================================================
// TYPES - Interfaces para tipagem dos dados
// =========================================================================

/**
 * Categorias de feedback disponíveis.
 */
export type FeedbackCategory = 'BUG' | 'UI_ISSUE' | 'FEATURE' | 'INCONSISTENCY' | 'PERFORMANCE' | 'OTHER';

/**
 * Prioridades de feedback disponíveis.
 */
export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Status possíveis do feedback.
 */
export type FeedbackStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Dados do reporter (quem criou o feedback).
 */
export interface FeedbackReporter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string | null;
}

/**
 * Feedback completo retornado pela API.
 */
export interface Feedback {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  pageUrl?: string | null;
  userAgent?: string | null;
  screenResolution?: string | null;
  screenshotPath?: string | null;
  adminNotes?: string | null;
  reportedBy: string;
  reporter: FeedbackReporter;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados para criar um novo feedback.
 */
export interface CreateFeedbackPayload {
  title: string;
  description: string;
  category?: FeedbackCategory;
  screenshotPath?: string;
  pageUrl?: string;
  userAgent?: string;
  screenResolution?: string;
}

/**
 * Dados para atualizar um feedback (apenas ADMIN).
 */
export interface UpdateFeedbackPayload {
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  adminNotes?: string;
}

/**
 * Filtros para listagem de feedbacks.
 */
export interface FeedbackFilters {
  page?: number;
  limit?: number;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  search?: string;
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

/**
 * Estatísticas dos feedbacks.
 */
export interface FeedbackStats {
  total: number;
  newCount: number;
  byStatus: { status: FeedbackStatus; count: number }[];
  byCategory: { category: FeedbackCategory; count: number }[];
  byPriority: { priority: FeedbackPriority; count: number }[];
}

// =========================================================================
// FUNÇÕES DA API
// =========================================================================

const BASE_URL = '/api/v1/feedbacks';

/**
 * Cria um novo feedback.
 * Qualquer usuário autenticado pode criar.
 *
 * @param data - Dados para criação
 * @returns Feedback criado
 */
export async function createFeedback(
  data: CreateFeedbackPayload,
): Promise<Feedback> {
  return api.post(BASE_URL, data);
}

/**
 * Lista feedbacks com paginação e filtros.
 * Apenas ADMIN.
 *
 * @param params - Parâmetros de filtro
 * @returns Lista paginada de feedbacks
 */
export async function getFeedbacks(
  params: FeedbackFilters = {},
): Promise<PaginatedResponse<Feedback>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
}

/**
 * Busca um feedback completo pelo ID.
 * Apenas ADMIN.
 *
 * @param id - ID do feedback
 * @returns Feedback completo
 */
export async function getFeedbackById(id: string): Promise<Feedback> {
  return api.get(`${BASE_URL}/${id}`);
}

/**
 * Atualiza um feedback (prioridade, status, notas).
 * Apenas ADMIN.
 *
 * @param id - ID do feedback
 * @param data - Dados para atualização
 * @returns Feedback atualizado
 */
export async function updateFeedback(
  id: string,
  data: UpdateFeedbackPayload,
): Promise<Feedback> {
  return api.put(`${BASE_URL}/${id}`, data);
}

/**
 * Remove um feedback (soft delete).
 * Apenas ADMIN.
 *
 * @param id - ID do feedback
 */
export async function deleteFeedback(
  id: string,
): Promise<{ message: string }> {
  return api.delete(`${BASE_URL}/${id}`);
}

/**
 * Retorna estatísticas dos feedbacks.
 * Apenas ADMIN.
 *
 * @returns Estatísticas (contagens por status, categoria, prioridade)
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  return api.get(`${BASE_URL}/stats`);
}
