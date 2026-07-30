/**
 * ============================================================================
 * AUTH SERVICE - Serviço de Autenticação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de autenticação.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * SEPARAÇÃO DE RESPONSABILIDADES:
 * -------------------------------
 * - Componentes (LoginPage, HomePage): cuidam da UI e interação com o usuário
 * - Serviços (auth.service): cuidam da comunicação com a API
 * - Tipos (user.types): definem a estrutura dos dados
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - login(): autentica o usuário e salva o token
 * - getProfile(): busca o perfil do usuário autenticado
 * - logout(): remove o token e faz o logout
 * - isAuthenticated(): verifica se o usuário está logado
 * ============================================================================
 */

import { api } from './api';
import type { LoginPayload, LoginResponse, ProfileResponse } from '@/types/user.types';

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
 * Realiza o login do usuário na API.
 *
 * FLUXO:
 * 1. Envia email e senha para a API
 * 2. Se bem-sucedido, salva o token JWT no localStorage
 * 3. Retorna os dados do usuário e o token
 *
 * @param payload - Dados de login (email e senha)
 * @returns Promise com a resposta do login (token + dados do usuário)
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  // Faz a requisição POST para o endpoint de login
  // A API retorna { data: { accessToken, user }, message, statusCode, timestamp }
  const response = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', payload);

  // Extrai os dados do campo 'data' da resposta
  const { accessToken } = response.data;

  // Salva o token JWT no localStorage para usar nas próximas requisições
  localStorage.setItem('accessToken', accessToken);

  return response.data;
}

/**
 * Busca o perfil completo do usuário autenticado.
 *
 * Esta função requer que o usuário esteja logado (token JWT válido).
 * O token é enviado automaticamente pelo api.ts no header Authorization.
 *
 * @returns Promise com os dados completos do perfil
 */
export async function getProfile(): Promise<ProfileResponse> {
  // A API retorna { data: {...}, message, statusCode, timestamp }
  const response = await api.get<ApiResponse<ProfileResponse>>('/api/v1/auth/profile');
  return response.data;
}

/**
 * Atualiza o perfil do usuário autenticado.
 *
 * Envia apenas os campos que foram modificados (atualização parcial).
 * Requer que o usuário esteja logado (token JWT válido).
 *
 * @param data - Dados a serem atualizados (todos opcionais)
 * @returns Promise com o perfil atualizado
 */
export async function updateProfile(data: Partial<ProfileResponse>): Promise<ProfileResponse> {
  // A API retorna { data: {...}, message, statusCode, timestamp }
  const response = await api.put<ApiResponse<ProfileResponse>>('/api/v1/auth/profile', data);
  return response.data;
}

// ============================================================================
// PHONE NUMBERS - Gerenciamento de Números de Telefone
// ============================================================================

export interface PhoneNumber {
  id: string;
  countryCode: string;
  number: string;
  type: string;
  isPrimary: boolean;
}

export async function addPhone(data: Omit<PhoneNumber, 'id'>): Promise<PhoneNumber> {
  const response = await api.post<ApiResponse<PhoneNumber>>('/api/v1/auth/phones', data);
  return response.data;
}

export async function updatePhone(id: string, data: Partial<PhoneNumber>): Promise<PhoneNumber> {
  const response = await api.put<ApiResponse<PhoneNumber>>(`/api/v1/auth/phones/${id}`, data);
  return response.data;
}

export async function removePhone(id: string): Promise<void> {
  await api.delete(`/api/v1/auth/phones/${id}`);
}

// ============================================================================
// CERTIFICATIONS - Gerenciamento de Certificações
// ============================================================================

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  type: string;
  description?: string;
  certNumber?: string;
  issueDate: string;
  expiryDate?: string;
}

export async function addCertification(data: Omit<Certification, 'id'>): Promise<Certification> {
  const response = await api.post<ApiResponse<Certification>>('/api/v1/auth/certifications', data);
  return response.data;
}

export async function updateCertification(id: string, data: Partial<Certification>): Promise<Certification> {
  const response = await api.put<ApiResponse<Certification>>(`/api/v1/auth/certifications/${id}`, data);
  return response.data;
}

export async function removeCertification(id: string): Promise<void> {
  await api.delete(`/api/v1/auth/certifications/${id}`);
}

// ============================================================================
// LANGUAGES - Gerenciamento de Idiomas
// ============================================================================

export interface Language {
  id: string;
  language: string;
  level: string;
}

export async function addLanguage(data: Omit<Language, 'id'>): Promise<Language> {
  const response = await api.post<ApiResponse<Language>>('/api/v1/auth/languages', data);
  return response.data;
}

export async function updateLanguage(id: string, data: Partial<Language>): Promise<Language> {
  const response = await api.put<ApiResponse<Language>>(`/api/v1/auth/languages/${id}`, data);
  return response.data;
}

export async function removeLanguage(id: string): Promise<void> {
  await api.delete(`/api/v1/auth/languages/${id}`);
}

/**
 * Realiza o logout do usuário.
 *
 * Remove o token JWT do localStorage, invalidando a sessão local.
 * Após chamar esta função, o usuário deve ser redirecionado para a página de login.
 */
export function logout(): void {
  localStorage.removeItem('accessToken');
}

/**
 * Verifica se o usuário está autenticado.
 *
 * Checa se existe um token JWT no localStorage.
 * Nota: esta função não valida se o token está expirado,
 * apenas verifica se ele existe. A validação real é feita pela API.
 *
 * @returns true se existe um token, false caso contrário
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

/**
 * Troca a senha temporária por uma nova senha definitiva.
 * Usado quando o usuário faz login pela primeira vez com senha temporária.
 *
 * @param newPassword - Nova senha escolhida pelo usuário
 * @returns Promise void
 */
export async function changeTempPassword(newPassword: string): Promise<void> {
  await api.post<ApiResponse<unknown>>('/api/v1/auth/change-temp-password', { newPassword });
}

// ============================================================================
// DOCUMENTS - Gerenciamento de Documentos Pessoais
// ============================================================================

export interface UserDocument {
  id: string;
  type: string;
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
}

export async function addDocument(data: Omit<UserDocument, 'id'>): Promise<UserDocument> {
  const response = await api.post<ApiResponse<UserDocument>>('/api/v1/auth/documents', data);
  return response.data;
}

export async function updateDocument(id: string, data: Partial<UserDocument>): Promise<UserDocument> {
  const response = await api.put<ApiResponse<UserDocument>>(`/api/v1/auth/documents/${id}`, data);
  return response.data;
}

export async function removeDocument(id: string): Promise<void> {
  await api.delete(`/api/v1/auth/documents/${id}`);
}

// ============================================================================
// BANK ACCOUNTS - Gerenciamento de Contas Bancárias
// ============================================================================

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  bicSwift?: string;
  accountHolder: string;
  isPrimary: boolean;
  description?: string;
}

export async function addBankAccount(data: Omit<BankAccount, 'id'>): Promise<BankAccount> {
  const response = await api.post<ApiResponse<BankAccount>>('/api/v1/auth/bank-accounts', data);
  return response.data;
}

export async function updateBankAccount(id: string, data: Partial<BankAccount>): Promise<BankAccount> {
  const response = await api.put<ApiResponse<BankAccount>>(`/api/v1/auth/bank-accounts/${id}`, data);
  return response.data;
}

export async function removeBankAccount(id: string): Promise<void> {
  await api.delete(`/api/v1/auth/bank-accounts/${id}`);
}
