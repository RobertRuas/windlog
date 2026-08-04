/**
 * ============================================================================
 * SETTINGS SERVICE - Serviço de Preferências do Usuário (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de preferências do usuário.
 * Gerencia idioma, tema e escala da interface.
 *
 * FUNÇÕES:
 * --------
 * - getSettings(): obtém as preferências atuais
 * - updateSettings(): atualiza uma ou mais preferências
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
 * Temas visuais disponíveis.
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Idiomas disponíveis para a interface.
 */
export type Language = 'pt';

/**
 * Interface UserSettings - Preferências do usuário.
 */
export interface UserSettings {
  /** Idioma da interface */
  language: Language;
  /** Tema visual (light, dark, auto) */
  theme: Theme;
  /** Escala da interface em percentagem (60-110) */
  scale: number;
}

/**
 * Payload para atualizar preferências (todos opcionais).
 */
export interface UpdateSettingsPayload {
  language?: Language;
  theme?: Theme;
  scale?: number;
}

/**
 * Obtém as preferências do usuário autenticado.
 */
export async function getSettings(): Promise<UserSettings> {
  const response = await api.get<ApiResponse<UserSettings>>('/api/v1/auth/settings');
  return response.data;
}

/**
 * Atualiza as preferências do usuário.
 *
 * @param payload - Preferências a atualizar (parcial)
 * @returns Preferências atualizadas
 */
export async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  const response = await api.put<ApiResponse<UserSettings>>('/api/v1/auth/settings', payload);
  return response.data;
}
