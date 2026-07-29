/**
 * ============================================================================
 * USER SERVICE - Serviço de Gestão de Usuários (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de gestão de usuários.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * SEPARAÇÃO DE RESPONSABILIDADES:
 * -------------------------------
 * - Componentes (UsersPage): cuidam da UI e interação com o usuário
 * - Serviços (user.service): cuidam da comunicação com a API
 * - Tipos (user.types): definem a estrutura dos dados
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - getUsers(): lista todos os usuários (paginado)
 * - getUserById(): busca um usuário específico
 * - createUser(): cria novo usuário
 * - updateUser(): atualiza um usuário
 * - deleteUser(): remove um usuário (soft delete)
 * ============================================================================
 */

import { api } from './api';

/**
 * Interface para a resposta padrão da API.
 * A API NestJS envolve todos os dados no campo 'data'.
 */
interface ApiResponse<T> {
  /** Dados da resposta (o que realmente interessa) */
  data: T;
  /** Mensagem de status */
  message: string;
  /** Código HTTP de status */
  statusCode: number;
  /** Timestamp da resposta */
  timestamp: string;
}

/**
 * Interface UserListItem - Representa um usuário na listagem.
 * Contém apenas os campos necessários para exibir na tabela.
 */
export interface UserListItem {
  /** ID único do usuário */
  id: string;
  /** Email do usuário */
  email: string;
  /** Primeiro nome */
  firstName: string;
  /** Sobrenome */
  lastName: string;
  /** Role do usuário (ADMIN, HR, STANDARD) */
  role: string;
  /** Se o usuário está ativo */
  isActive: boolean;
  /** Telefone (opcional) */
  phone?: string;
  /** Departamento (opcional) */
  department?: string;
  /** Cargo (opcional) */
  position?: string;
  /** Data de criação */
  createdAt: string;
}

/**
 * Interface UsersResponse - Resposta paginada da API de usuários.
 */
export interface UsersResponse {
  /** Lista de usuários */
  data: UserListItem[];
  /** Total de usuários */
  total: number;
  /** Página atual */
  page: number;
  /** Itens por página */
  limit: number;
  /** Total de páginas */
  totalPages: number;
  /** Se há próxima página */
  hasNextPage: boolean;
  /** Se há página anterior */
  hasPreviousPage: boolean;
}

/**
 * Interface CreateUserPayload - Dados para criar novo usuário.
 */
export interface CreateUserPayload {
  /** Email do usuário */
  email: string;
  /** Senha (mínimo 6 caracteres) */
  password: string;
  /** Primeiro nome */
  firstName: string;
  /** Sobrenome */
  lastName: string;
  /** Role (opcional, padrão: STANDARD) */
  role?: 'ADMIN' | 'HR' | 'STANDARD';
  /** Telefone (opcional) */
  phone?: string;
  /** Código do país (opcional) */
  phoneCountryCode?: string;
  /** Nacionalidade (opcional) */
  nationality?: string;
  /** Departamento (opcional) */
  department?: string;
  /** Cargo (opcional) */
  position?: string;
  /** Número do passaporte (opcional) */
  passportNumber?: string;
  /** Número de identificação fiscal (opcional) */
  taxIdNumber?: string;
  /** Número do cartão de identidade (opcional) */
  idCardNumber?: string;
  /** Número de segurança social (opcional) */
  socialSecurityNumber?: string;
}

/**
 * Interface UpdateUserPayload - Dados para atualizar usuário.
 * Todos os campos são opcionais.
 */
export interface UpdateUserPayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'HR' | 'STANDARD';
  isActive?: boolean;
  phone?: string;
  phoneCountryCode?: string;
  nationality?: string;
  department?: string;
  position?: string;
  passportNumber?: string;
  taxIdNumber?: string;
  idCardNumber?: string;
  socialSecurityNumber?: string;
}

/**
 * Interface UserFilters - Filtros para listagem de usuários.
 */
export interface UserFilters {
  /** Busca por nome ou email */
  search?: string;
  /** Filtrar por role */
  role?: 'ADMIN' | 'HR' | 'STANDARD';
  /** Filtrar por status ativo */
  isActive?: boolean;
  /** Página atual (padrão: 1) */
  page?: number;
  /** Itens por página (padrão: 10) */
  limit?: number;
}

/**
 * Lista todos os usuários com paginação e filtros.
 *
 * @param filters - Filtros de busca (opcional)
 * @returns Promise com usuários paginados
 */
export async function getUsers(filters?: UserFilters): Promise<UsersResponse> {
  // Monta a query string com os filtros
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.role) params.append('role', filters.role);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const url = `/api/v1/users${queryString ? `?${queryString}` : ''}`;

  // Faz a requisição GET para o endpoint de usuários
  const response = await api.get<ApiResponse<UsersResponse>>(url);
  return response.data;
}

/**
 * Busca um usuário específico por ID.
 *
 * @param id - ID do usuário
 * @returns Promise com os dados completos do usuário
 */
export async function getUserById(id: string): Promise<UserListItem> {
  const response = await api.get<ApiResponse<UserListItem>>(`/api/v1/users/${id}`);
  return response.data;
}

/**
 * Cria um novo usuário no sistema.
 *
 * @param payload - Dados do usuário (CreateUserPayload)
 * @returns Promise com o usuário criado
 */
export async function createUser(payload: CreateUserPayload): Promise<UserListItem> {
  const response = await api.post<ApiResponse<UserListItem>>('/api/v1/users', payload);
  return response.data;
}

/**
 * Atualiza os dados de um usuário existente.
 *
 * @param id - ID do usuário
 * @param payload - Dados a atualizar (UpdateUserPayload)
 * @returns Promise com o usuário atualizado
 */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserListItem> {
  const response = await api.put<ApiResponse<UserListItem>>(`/api/v1/users/${id}`, payload);
  return response.data;
}

/**
 * Remove um usuário (soft delete).
 * O usuário é marcado como deletado e desativado.
 *
 * @param id - ID do usuário
 * @returns Promise void
 */
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/v1/users/${id}`);
}
