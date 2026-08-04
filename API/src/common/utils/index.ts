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
 * Verifica se um usuário pode realizar ações de Team Leader.
 *
 * Regra: Usuários com role diferente de STANDARD (ADMIN, HR) SEMPRE podem.
 *        Usuários com isTeamLeader === true TAMBÉM podem.
 *        Usuários STANDARD + isTeamLeader === false NÃO podem.
 *
 * @param role - Role do usuário (ADMIN, HR, STANDARD)
 * @param isTeamLeader - Flag de Team Leader do usuário
 * @returns true se o usuário pode realizar ações de Team Leader
 *
 * @example
 * canPerformTeamLeaderAction('STANDARD', true)  // true
 * canPerformTeamLeaderAction('ADMIN', false)    // true
 * canPerformTeamLeaderAction('STANDARD', false) // false
 */
export function canPerformTeamLeaderAction(
  role: string,
  isTeamLeader: boolean,
): boolean {
  return role !== 'STANDARD' || isTeamLeader;
}
