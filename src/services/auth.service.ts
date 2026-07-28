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
