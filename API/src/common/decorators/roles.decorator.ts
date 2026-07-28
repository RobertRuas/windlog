/**
 * ============================================================================
 * ROLES DECORATOR - Decorador para Controle de Acesso (RBAC)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define um decorador customizado @Roles() que especifica quais papéis
 * (roles) podem acessar um endpoint.
 *
 * COMO USAR?
 * ----------
 * @Roles('ADMIN', 'SUPERVISOR')
 * @Get()
 * findAll() {
 *   return this.service.findAll();
 * }
 *
 * O exemplo acima permite apenas ADMIN e SUPERVISOR acessarem o endpoint.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O decorador @Roles() anexa os roles permitidos como metadados
 * 2. O RolesGuard lê esses metadados
 * 3. Compara com o role do usuário autenticado
 * 4. Permite ou nega o acesso
 * ============================================================================
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Enum dos papéis disponíveis no sistema.
 * Deve ser igual ao enum definido no schema.prisma.
 */
export enum Role {
  TECHNICIAN = 'TECHNICIAN',
  TEAM_LEADER = 'TEAM_LEADER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
}

/**
 * Chave usada para armazenar os roles nos metadados do NestJS.
 * Exportada para que o RolesGuard possa lê-la.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador que define quais roles podem acessar um endpoint.
 *
 * @param roles - Lista de roles permitidos
 *
 * @example
 * @Roles(Role.ADMIN) // Apenas admin
 * @Roles(Role.ADMIN, Role.SUPERVISOR) // Admin ou supervisor
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
