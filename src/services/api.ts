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
 * 3. Cookies httpOnly são enviados automaticamente (credentials: include)
 * 4. A resposta é convertida para JSON automaticamente
 * 5. Se a API retornar 401, tenta renovar via refresh token antes de logout
 *
 * REFRESH TOKEN FLOW:
 * -------------------
 * Quando o access token expira (401), o sistema tenta automaticamente:
 * 1. Chamar POST /api/v1/auth/refresh (envia cookie httpOnly)
 * 2. Se renovar com sucesso, atualiza o access token e re-tenta a requisição
 * 3. Se a renovação falhar, faz logout e redireciona para /error
 *
 * Isso permite login persistente: o usuário não precisa logar novamente
 * a cada 2 horas (tempo do access token).
 * ============================================================================
 */

/**
 * Flag para evitar múltiplas requisições de logout simultâneas.
 * Quando um 401 é recebido, esta flag é ativada para evitar que
 * outras requisições pendentes também tentem fazer logout.
 */
let isLoggingOut = false;

/**
 * Flag para evitar múltiplas chamadas de refresh simultâneas.
 * Quando uma requisição 401 é recebida, tentamos o refresh.
 * Se várias requisições falharem ao mesmo tempo, só uma chama o refresh.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Executa o logout automático e redireciona para a página de erro.
 * Chamada quando o refresh token também falhou.
 */
function handleUnauthorized(): void {
  if (isLoggingOut) return;
  isLoggingOut = true;

  localStorage.removeItem('accessToken');
  window.location.href = '/error?msg=Sess%C3%A3o+expirada';

  setTimeout(() => {
    isLoggingOut = false;
  }, 3000);
}

/**
 * Tenta renovar o access token via POST /api/v1/auth/refresh.
 * O refresh token é enviado automaticamente como cookie httpOnly.
 *
 * @returns Novo access token se sucesso, null se falhou
 */
async function tryRefreshToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Envia o cookie httpOnly com o refresh token
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // A resposta pode estar envelopada { data: { accessToken } } ou direta { accessToken }
    const accessToken = data.data?.accessToken ?? data.accessToken;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    }
    return null;
  } catch {
    return null;
  }
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
  // Monta os headers da requisição
  const headers: Record<string, string> = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Se houver um token JWT salvo, adiciona ao header Authorization
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Faz a requisição HTTP.
  // credentials: 'include' envia o cookie httpOnly (refresh token) automaticamente.
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
      ? (options.isFormData ? options.body as FormData : JSON.stringify(options.body))
      : undefined,
    credentials: 'include', // Necessário para enviar cookies httpOnly
  });

  // Se a resposta for 401 (Unauthorized), tenta renovar via refresh token
  if (response.status === 401) {
    // Evita chamadas de refresh em endpoints de auth (login/register/refresh)
    const isAuthEndpoint = url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (!isAuthEndpoint) {
      // Usa o refreshPromise para evitar múltiplas chamadas simultâneas
      if (!refreshPromise) {
        refreshPromise = tryRefreshToken();
      }

      const newToken = await refreshPromise;
      refreshPromise = null; // Reseta para futuras chamadas

      if (newToken) {
        // Refresh teve sucesso! Re-tenta a requisição original com o novo token
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body
            ? (options.isFormData ? options.body as FormData : JSON.stringify(options.body))
            : undefined,
          credentials: 'include',
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
        }

        return retryResponse.json();
      }
    }

    // Refresh falhou ou é endpoint de auth — faz logout
    handleUnauthorized();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Se a resposta não for bem-sucedida (status 4xx ou 5xx)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

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
  post: <T>(url: string, body: unknown, options?: { isFormData?: boolean }) =>
    apiRequest<T>(url, { method: 'POST', body, ...options }),

  /** Requisição PUT - usada para atualizar recursos existentes */
  put: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'PUT', body }),

  /** Requisição PATCH - usada para atualizações parciais */
  patch: <T>(url: string, body: unknown) =>
    apiRequest<T>(url, { method: 'PATCH', body }),

  /** Requisição DELETE - usada para remover recursos (suporta body) */
  delete: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, { method: 'DELETE', body }),
};
