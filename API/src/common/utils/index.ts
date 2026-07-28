/**
 * ============================================================================
 * UTILS - Funções Utilitárias Gerais
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Coleção de funções auxiliares usadas em toda a aplicação.
 * Cada função resolve um problema específico e reutilizável.
 *
 * REGRAS:
 * -------
 * - Funções puras (sem efeitos colaterais)
 * - Sem dependências externas (só TypeScript/Node.js)
 * - Bem documentadas com JSDoc
 * - Uma responsabilidade por função
 * ============================================================================
 */

/**
 * Formata uma data para o formato ISO 8601 em UTC.
 *
 * @param date - Data a ser formatada (Date ou string)
 * @returns String no formato ISO 8601 (ex: '2024-01-15T10:30:00.000Z')
 *
 * @example
 * formatDate(new Date()) // '2024-01-15T10:30:00.000Z'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Remove campos sensíveis de um objeto (ex: password).
 *
 * @param obj - Objeto a ser limpo
 * @param fields - Lista de campos para remover (padrão: ['password'])
 * @returns Novo objeto sem os campos sensíveis
 *
 * @example
 * sanitizeUser({ id: '1', email: 'a@b.com', password: 'secret' })
 * // { id: '1', email: 'a@b.com' }
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = ['password'],
): Omit<T, string> {
  const sanitized = { ...obj };
  for (const field of fields) {
    delete (sanitized as Record<string, unknown>)[field];
  }
  return sanitized;
}

/**
 * Calcula metadados de paginação.
 *
 * @param total - Total de registros no banco
 * @param page - Página atual
 * @param limit - Itens por página
 * @returns Objeto com metadados de paginação
 *
 * @example
 * buildPaginationMeta(100, 1, 10)
 * // { total: 100, page: 1, limit: 10, totalPages: 10 }
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): { total: number; page: number; limit: number; totalPages: number } {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Gera um slug a partir de uma string.
 *
 * @param text - Texto para converter em slug
 * @returns Slug em lowercase com hífens (ex: 'hello-world')
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-'); // Remove hífens duplicados
}

/**
 * Verifica se uma string é um UUID válido.
 *
 * @param str - String para verificar
 * @returns true se for UUID válido, false caso contrário
 *
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('not-a-uuid') // false
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
