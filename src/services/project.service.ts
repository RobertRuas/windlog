/**
 * ============================================================================
 * PROJECT SERVICE - Serviço de Gestão de Projetos (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de gestão de projetos.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - getProjects(): lista todos os projetos (paginado)
 * - getProjectById(): busca um projeto específico
 * - createProject(): cria novo projeto
 * - updateProject(): atualiza um projeto
 * - deleteProject(): remove um projeto (soft delete)
 * - getProjectTurbines(): lista turbinas de um projeto
 * - createTurbine(): adiciona turbina a um projeto
 * - updateTurbine(): atualiza turbina
 * - deleteTurbine(): remove turbina
 * - getProjectMembers(): lista membros de um projeto
 * - addMember(): associa usuário ao projeto
 * - removeMember(): remove membro do projeto
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
// TYPES - PROJECT
// =========================================================================

/**
 * Interface ProjectListItem - Representa um projeto na listagem.
 */
export interface ProjectListItem {
  id: string;
  name: string;
  client: string;
  location: string;
  scope?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    turbines: number;
    members: number;
  };
}

/**
 * Interface ProjectDetail - Projeto completo com turbinas e membros.
 */
export interface ProjectDetail extends Omit<ProjectListItem, '_count'> {
  turbines: Turbine[];
  members: ProjectMember[];
}

/**
 * Interface ProjectsResponse - Resposta paginada da API de projetos.
 */
export interface ProjectsResponse {
  data: ProjectListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface ProjectFilters - Filtros para listagem de projetos.
 */
export interface ProjectFilters {
  search?: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  page?: number;
  limit?: number;
}

/**
 * Interface CreateProjectPayload - Dados para criar novo projeto.
 */
export interface CreateProjectPayload {
  name: string;
  client: string;
  location: string;
  scope?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
}

/**
 * Interface UpdateProjectPayload - Dados para atualizar projeto.
 */
export interface UpdateProjectPayload {
  name?: string;
  client?: string;
  location?: string;
  scope?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
}

// =========================================================================
// TYPES - TURBINE
// =========================================================================

/**
 * Interface Turbine - Representa uma turbina de um projeto.
 */
export interface Turbine {
  id: string;
  name: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  nacelleHeight?: number;
  latitude?: number;
  longitude?: number;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface CreateTurbinePayload - Dados para criar turbina.
 */
export interface CreateTurbinePayload {
  name: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  nacelleHeight?: number;
  latitude?: number;
  longitude?: number;
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED';
}

/**
 * Interface UpdateTurbinePayload - Dados para atualizar turbina.
 */
export interface UpdateTurbinePayload {
  name?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  nacelleHeight?: number;
  latitude?: number;
  longitude?: number;
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED';
}

// =========================================================================
// TYPES - MEMBER
// =========================================================================

/**
 * Interface ProjectMember - Representa um membro de um projeto.
 */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

/**
 * Interface AddMemberPayload - Dados para associar usuário ao projeto.
 */
export interface AddMemberPayload {
  userId: string;
  role?: string;
}

/**
 * Interface UpdateMemberPayload - Dados para atualizar função do membro.
 */
export interface UpdateMemberPayload {
  role?: string;
}

// =========================================================================
// API CALLS - PROJECT
// =========================================================================

/**
 * Lista todos os projetos com paginação e filtros.
 */
export async function getProjects(filters?: ProjectFilters): Promise<ProjectsResponse> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const url = `/api/v1/projects${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<ApiResponse<ProjectsResponse>>(url);
  return response.data;
}

/**
 * Busca um projeto específico por ID.
 */
export async function getProjectById(id: string): Promise<ProjectDetail> {
  const response = await api.get<ApiResponse<ProjectDetail>>(`/api/v1/projects/${id}`);
  return response.data;
}

/**
 * Cria um novo projeto no sistema.
 */
export async function createProject(payload: CreateProjectPayload): Promise<ProjectListItem> {
  const response = await api.post<ApiResponse<ProjectListItem>>('/api/v1/projects', payload);
  return response.data;
}

/**
 * Atualiza os dados de um projeto existente.
 */
export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<ProjectListItem> {
  const response = await api.put<ApiResponse<ProjectListItem>>(`/api/v1/projects/${id}`, payload);
  return response.data;
}

/**
 * Remove um projeto (soft delete).
 */
export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/api/v1/projects/${id}`);
}

// =========================================================================
// API CALLS - TURBINE
// =========================================================================

/**
 * Lista todas as turbinas de um projeto.
 */
export async function getProjectTurbines(projectId: string): Promise<Turbine[]> {
  const response = await api.get<ApiResponse<Turbine[]>>(`/api/v1/projects/${projectId}/turbines`);
  return response.data;
}

/**
 * Adiciona uma turbina a um projeto.
 */
export async function createTurbine(projectId: string, payload: CreateTurbinePayload): Promise<Turbine> {
  const response = await api.post<ApiResponse<Turbine>>(`/api/v1/projects/${projectId}/turbines`, payload);
  return response.data;
}

/**
 * Atualiza uma turbina de um projeto.
 */
export async function updateTurbine(projectId: string, turbineId: string, payload: UpdateTurbinePayload): Promise<Turbine> {
  const response = await api.put<ApiResponse<Turbine>>(`/api/v1/projects/${projectId}/turbines/${turbineId}`, payload);
  return response.data;
}

/**
 * Remove uma turbina de um projeto (soft delete).
 */
export async function deleteTurbine(projectId: string, turbineId: string): Promise<void> {
  await api.delete(`/api/v1/projects/${projectId}/turbines/${turbineId}`);
}

// =========================================================================
// API CALLS - MEMBER
// =========================================================================

/**
 * Lista todos os membros de um projeto.
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await api.get<ApiResponse<ProjectMember[]>>(`/api/v1/projects/${projectId}/members`);
  return response.data;
}

/**
 * Adiciona um membro (usuário) a um projeto.
 */
export async function addMember(projectId: string, payload: AddMemberPayload): Promise<ProjectMember> {
  const response = await api.post<ApiResponse<ProjectMember>>(`/api/v1/projects/${projectId}/members`, payload);
  return response.data;
}

/**
 * Atualiza a função de um membro no projeto.
 */
export async function updateMember(projectId: string, memberId: string, payload: UpdateMemberPayload): Promise<ProjectMember> {
  const response = await api.put<ApiResponse<ProjectMember>>(`/api/v1/projects/${projectId}/members/${memberId}`, payload);
  return response.data;
}

/**
 * Remove um membro de um projeto.
 */
export async function removeMember(projectId: string, memberId: string): Promise<void> {
  await api.delete(`/api/v1/projects/${projectId}/members/${memberId}`);
}
