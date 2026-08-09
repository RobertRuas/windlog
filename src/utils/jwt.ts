/**
 * ============================================================================
 * JWT UTILS - Utilitários para Manipulação de Tokens JWT
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Funções auxiliares para trabalhar com tokens JWT no frontend.
 * Usado para verificar se o token está expirado e fazer logout automático.
 *
 * COMO FUNCIONA O JWT?
 * --------------------
 * Um token JWT tem 3 partes separadas por ponto (.):
 * 1. Header: algoritmo e tipo do token
 * 2. Payload: dados do usuário (sub, email, role) + expiração (exp)
 * 3. Signature: assinatura digital (garante que não foi alterado)
 *
 * O campo 'exp' no payload é um timestamp Unix (segundos desde 1970)
 * que indica quando o token expira.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - isTokenExpired(): verifica se o token JWT está expirado
 * - getTokenExpiration(): retorna a data de expiração do token
 * - getRemainingTime(): retorna tempo restante até expirar
 * ============================================================================
 */

/**
 * Interface para o payload decodificado do JWT.
 */
interface JwtPayload {
  /** ID do usuário */
  sub: string;
  /** E-mail do usuário */
  email: string;
  /** Papel do usuário */
  role: string;
  /** Timestamp de expiração (segundos desde Unix epoch) */
  exp: number;
  /** Timestamp de emissão (segundos desde Unix epoch) */
  iat: number;
}

/**
 * Decodifica o payload do JWT sem validar a assinatura.
 *
 * IMPORTANTE: Esta função apenas decodifica o base64, não valida
 * se o token é legítimo. A validação real é feita pelo backend.
 *
 * @param token - Token JWT completo (header.payload.signature)
 * @returns Payload decodificado ou null se inválido
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    // JWT tem 3 partes separadas por ponto
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // A payload é a segunda parte, codificada em base64url
    const base64Payload = parts[1];

    // Converte base64url para base64 padrão
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');

    // Decodifica o base64 e faz parse do JSON
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica se o token JWT está expirado.
 *
 * Esta função verifica o campo 'exp' do payload do token
 * e compara com o timestamp atual. Se o token expirou,
 * retorna true (indicando que o usuário deve ser deslogado).
 *
 * @param token - Token JWT completo (opcional, se não fornecido, busca do localStorage)
 * @returns true se o token está expirado ou inválido, false caso contrário
 *
 * @example
 * if (isTokenExpired()) {
 *   logout();
 *   window.location.href = '/login';
 * }
 */
export function isTokenExpired(token?: string): boolean {
  // Se não forneceu o token, busca do localStorage
  const jwt = token || localStorage.getItem('accessToken');

  // Se não tem token, considera expirado
  if (!jwt) {
    return true;
  }

  // Decodifica o payload do token
  const payload = decodeJwtPayload(jwt);

  // Se não conseguiu decodificar, considera inválido
  if (!payload || !payload.exp) {
    return true;
  }

  // Compara o timestamp de expiração com o timestamp atual
  // payload.exp está em segundos, Date.now() está em milissegundos
  const now = Math.floor(Date.now() / 1000);

  // Retorna true se o token expirou (exp < now)
  return payload.exp < now;
}

/**
 * Retorna a data de expiração do token JWT.
 *
 * @param token - Token JWT completo (opcional)
 * @returns Data de expiração ou null se não conseguir decodificar
 */
export function getTokenExpiration(token?: string): Date | null {
  const jwt = token || localStorage.getItem('accessToken');
  if (!jwt) return null;

  const payload = decodeJwtPayload(jwt);
  if (!payload || !payload.exp) return null;

  // Converte timestamp de segundos para milissegundos
  return new Date(payload.exp * 1000);
}

/**
 * Retorna o tempo restante até o token expirar.
 *
 * @param token - Token JWT completo (opcional)
 * @returns Objeto com dias, horas, minutos restantes ou null se expirado
 */
export function getRemainingTime(token?: string): {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
} | null {
  const jwt = token || localStorage.getItem('accessToken');
  if (!jwt) return null;

  const payload = decodeJwtPayload(jwt);
  if (!payload || !payload.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;

  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  return { days, hours, minutes, expired: false };
}

/**
 * Verifica se o usuário autenticado possui um dos roles informados.
 *
 * @param roles - Lista de roles permitidos (ex.: ['ADMIN', 'HR'])
 * @returns true se o role do token está na lista
 */
export function hasRole(roles: string[]): boolean {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  return roles.includes(payload.role);
}
