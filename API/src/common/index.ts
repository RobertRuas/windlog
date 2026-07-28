/**
 * ============================================================================
 * COMMON INDEX - Barrel Export do Módulo Common
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Ponto central de exportação de todos os componentes comuns.
 * Permite importar de forma limpa e organizada:
 *
 * import { HttpExceptionFilter, PaginationDto } from '@common/index.js';
 *
 * EM VEZ DE:
 * import { HttpExceptionFilter } from '@common/filters/http-exception.filter.js';
 * import { PaginationDto } from '@common/dto/pagination.dto.js';
 * ============================================================================
 */

// Filtros
export { HttpExceptionFilter } from './filters/http-exception.filter.js';

// Interceptors
export {
  TransformInterceptor,
  type StandardResponse,
} from './interceptors/transform.interceptor.js';

// Guards
export { RolesGuard } from './guards/roles.guard.js';

// Decorators
export { Roles, Role, ROLES_KEY } from './decorators/roles.decorator.js';
export { CurrentUser } from './decorators/current-user.decorator.js';

// DTOs
export { PaginationDto } from './dto/pagination.dto.js';
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from './dto/api-response.dto.js';
export {
  SuccessResponseDto,
  ErrorResponseDto,
  AuthResponseDataDto,
} from './dto/swagger-response.dto.js';

// Utils
export {
  formatDate,
  sanitizeUser,
  buildPaginationMeta,
  generateSlug,
  isValidUUID,
} from './utils/index.js';
