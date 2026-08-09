/**
 * ============================================================================
 * TRANSLATION SERVICE - Serviço de Tradução com IA (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de tradução (Português -> Inglês).
 * O modelo de IA roda no backend; aqui apenas enviamos/recebemos textos.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - warmUpTranslationModel(): aquece o modelo (chamar ao abrir o formulário)
 * - translateText(text): traduz um texto (PT -> EN)
 * - unloadTranslationModel(): descarrega o modelo (chamar ao sair do formulário)
 *
 * POR QUE ESTAS FUNÇÕES SÃO SEPARADAS?
 * ------------------------------------
 * Permitem que qualquer módulo reutilize o recurso de tradução de forma
 * simples e padronizada, sem repetir a lógica de requisição HTTP.
 * ============================================================================
 */

import { api } from './api';

/**
 * Interface para a resposta padrão da API (envelope).
 */
interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Resultado do aquecimento do modelo.
 */
export interface WarmUpResult {
  /** Se o modelo está pronto para traduzir */
  ready: boolean;
  /** Se já estava carregado antes desta chamada */
  alreadyLoaded: boolean;
}

/**
 * Resultado da tradução.
 */
export interface TranslateResult {
  /** Texto traduzido para inglês */
  translatedText: string;
}

/**
 * Aquece o modelo de tradução no backend.
 *
 * Deve ser chamado quando o usuário abre um formulário com campos traduzíveis,
 * para que a primeira sugestão de tradução apareça sem atraso.
 * Se o modelo já estiver carregado, a chamada é praticamente instantânea.
 */
export async function warmUpTranslationModel(): Promise<WarmUpResult> {
  const response = await api.post<ApiResponse<WarmUpResult>>('/api/v1/translation/warmup', {});
  return response.data;
}

/**
 * Traduz um texto de Português para Inglês.
 *
 * @param text - Texto em português a traduzir.
 * @returns Texto traduzido para inglês.
 */
export async function translateText(text: string): Promise<string> {
  const response = await api.post<ApiResponse<TranslateResult>>(
    '/api/v1/translation/translate',
    { text },
  );
  return response.data.translatedText;
}

/**
 * Descarrega o modelo de tradução da memória do backend.
 *
 * Deve ser chamado quando o usuário sai do formulário traduzível,
 * para liberar os recursos do servidor. É uma chamada "fire-and-forget":
 * o resultado não é crítico para a experiência do usuário.
 */
export async function unloadTranslationModel(): Promise<void> {
  await api.post<ApiResponse<{ unloaded: boolean }>>('/api/v1/translation/unload', {});
}
