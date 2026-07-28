/**
 * ============================================================================
 * API RESPONSE DTO - Tipagem Genérica para Respostas da API
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define interfaces TypeScript para as respostas da API.
 * Usado para type-safety em toda a aplicação.
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * - Garante que todas as respostas sigam o formato definido
 * - Facilita o autocomplete no IDE
 * - Detecta erros de tipo em tempo de compilação
 * - Documenta a estrutura das respostas
 * ============================================================================
 */

/**
 * Formato padrão de resposta de SUCESSO da API.
 *
 * @TypeParam T - Tipo dos dados retornados (ex: User[], Project, etc.)
 *
 * EXEMPLO:
 * {
 *   data: [{ id: '1', name: 'John' }],
 *   message: 'Success',
 *   statusCode: 200,
 *   timestamp: '2024-01-15T10:30:00.000Z'
 * }
 */
export interface ApiResponse<T> {
  /** Dados retornados pelo serviço */
  data: T;
  /** Mensagem descritiva da operação */
  message: string;
  /** Código HTTP da resposta (200, 201, etc.) */
  statusCode: number;
  /** Data/hora da resposta em formato ISO 8601 (UTC) */
  timestamp: string;
}

/**
 * Formato padrão de resposta de ERRO da API.
 *
 * EXEMPLO:
 * {
 *   error: 'BadRequest',
 *   message: 'Email is required',
 *   statusCode: 400,
 *   timestamp: '2024-01-15T10:30:00.000Z',
 *   path: '/api/v1/users'
 * }
 */
export interface ApiError {
  /** Nome do erro (ex: 'BadRequest', 'NotFound') */
  error: string;
  /** Mensagem descritiva do erro */
  message: string;
  /** Código HTTP do erro (400, 404, 500, etc.) */
  statusCode: number;
  /** Data/hora do erro em formato ISO 8601 (UTC) */
  timestamp: string;
  /** URL do endpoint que causou o erro */
  path: string;
}

/**
 * Formato de resposta paginada (usado em listagens).
 *
 * @TypeParam T - Tipo dos itens da lista
 *
 * EXEMPLO:
 * {
 *   data: [...],
 *   meta: { total: 100, page: 1, limit: 10, totalPages: 10 }
 * }
 */
export interface PaginatedResponse<T> {
  /** Lista de itens da página atual */
  data: T[];
  /** Metadados da paginação */
  meta: {
    /** Total de registros no banco */
    total: number;
    /** Página atual */
    page: number;
    /** Itens por página */
    limit: number;
    /** Total de páginas */
    totalPages: number;
  };
}
