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
 * 4. Se a API retornar erro (401, 403, etc.), o erro é tratado
 *
 * EXEMPLO DE USO:
 * ---------------
 * const data = await api.get('/api/v1/auth/profile');
 * const result = await api.post('/api/v1/auth/login', { email, password });
 * ============================================================================
 */

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
  // Monta os headers da requisição
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

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

  /** Requisição DELETE - usada para remover recursos */
  delete: <T>(url: string) =>
    apiRequest<T>(url, { method: 'DELETE' }),
};
