/**
 * ============================================================================
 * API SERVICE - Cliente HTTP para comunicação com o backend
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Cria uma função helper para fazer requisições HTTP à API.
 * Centraliza a lógica de autenticação (token JWT) e tratamento de erros.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Todas as requisições passam por esta função
 * 2. Se houver um token JWT no localStorage, ele é enviado no header
 * 3. A resposta é convertida para JSON automaticamente
 * 4. Se a API retornar erro 401 (Unauthorized), faz logout automático
 *    e redireciona para a página de login
 *
 * AUTO-LOGOUT:
 * ------------
 * Quando o backend retorna 401, significa que o token JWT expirou ou
 * é inválido. Neste caso, a função:
 * 1. Remove o token do localStorage
 * 2. Redireciona o usuário para /login
 * 3. Evita múltiplas requisições simultâneas de logout (flag isLoggingOut)
 *
 * EXEMPLO DE USO:
 * ---------------
 * const data = await api.get('/api/v1/auth/profile');
 * const result = await api.post('/api/v1/auth/login', { email, password });
 * ============================================================================
 */

import { isTokenExpired } from '@/utils/jwt';

/**
 * Flag para evitar múltiplas requisições de logout simultâneas.
 * Quando um 401 é recebido, esta flag é ativada para evitar que
 * outras requisições pendentes também tentem fazer logout.
 */
let isLoggingOut = false;

/**
 * Executa o logout automático e redireciona para a página de login.
 * Esta função é chamada quando o backend retorna 401 (Unauthorized).
 */
function handleUnauthorized(): void {
  // Evita múltiplas chamadas simultâneas
  if (isLoggingOut) return;
  isLoggingOut = true;

  // Remove o token do localStorage
  localStorage.removeItem('accessToken');

  // Redireciona para a página de erro vintage
  // Usa window.location.href para forçar recarregamento completo
  window.location.href = '/error?msg=Token+n%C3%A3o+fornecido';

  // Reseta a flag após um tempo (caso o redirect falhe)
  setTimeout(() => {
    isLoggingOut = false;
  }, 3000);
}

/**
 * Interface para as opções da requisição.
 * Permite configurar método HTTP, corpo da requisição, headers, etc.
 */
interface ApiOptions {
  /** Método HTTP (GET, POST, PUT, DELETE, etc.) */
  method?: string;
  /** Corpo da requisição (dados enviados no body) */
  body?: unknown;
  /** Headers adicionais (além do Content-Type e Authorization) */
  headers?: Record<string, string>;
  /** Se true, não define Content-Type (usado para FormData/multipart) */
  isFormData?: boolean;
}

/**
 * Função principal para fazer requisições à API.
 *
 * @param url - Endpoint da API (ex: '/api/v1/auth/login')
 * @param options - Opções da requisição (method, body, headers)
 * @returns Promise com os dados da resposta (já convertidos para JSON)
 *
 * @throws Error se a resposta da API indicar erro
 */
async function apiRequest<T>(url: string, options: ApiOptions = {}): Promise<T> {
  // Verifica se o token JWT está expirado ANTES de fazer a requisição
  // Isso evita fazer requisições que já sabemos que vão falhar
  // IMPORTANTE: Pula a verificação se não houver token (ex: login/registro)
  const existingToken = localStorage.getItem('accessToken');
  if (existingToken && isTokenExpired(existingToken)) {
    handleUnauthorized();
    throw new Error('Token expirado. Faça login novamente.');
  }

  // Monta os headers da requisição
  const headers: Record<string, string> = {
    // Só define Content-Type como JSON se NÃO for FormData
    // Para FormData, o browser define automaticamente com o boundary correto
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Se houver um token JWT salvo, adiciona ao header Authorization
  // O token é armazenado no localStorage após o login bem-sucedido
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Faz a requisição HTTP usando a API nativa do navegador (fetch)
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
      ? (options.isFormData ? options.body as FormData : JSON.stringify(options.body))
      : undefined,
  });

  // Se a resposta for 401 (Unauthorized), o token expirou ou é inválido
  // Faz logout automático e redireciona para a página de login
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Se a resposta não for bem-sucedida (status 4xx ou 5xx)
  if (!response.ok) {
    // Tenta extrair a mensagem de erro da resposta
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  // Converte a resposta para JSON e retorna
  return response.json();
}

/**
 * Objeto exportado com métodos HTTP pré-configurados.
 *
 * Uso:
 *   api.get('/endpoint')
 *   api.post('/endpoint', { data })
 */
export const api = {
  /** Requisição GET - usada para buscar dados */
  get: <T>(url: string) => apiRequest<T>(url),

  /** Requisição POST - usada para criar recursos ou enviar dados */
  post: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'POST', body }),

  /** Requisição PUT - usada para atualizar recursos existentes */
  put: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'PUT', body }),

  /** Requisição PATCH - usada para atualizações parciais */
  patch: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'PATCH', body }),

  /** Requisição DELETE - usada para remover recursos */
  delete: <T>(url: string) =>
    apiRequest<T>(url, { method: 'DELETE' }),
};
