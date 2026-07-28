/**
 * ============================================================================
 * ROLES GUARD - Guard de Controle de Acesso por Papel (RBAC)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este guard verifica se o usuário autenticado tem permissão para
 * acessar um endpoint específico, baseado no seu papel (role).
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O decorador @Roles() define quais roles são permitidos
 * 2. Este guard lê os roles do metadado
 * 3. Compara com o role do usuário (extraído do JWT)
 * 4. Permite (true) ou nega (false/exception) o acesso
 *
 * ORDEM DE EXECUÇÃO:
 * ------------------
 * 1. JwtAuthGuard (verifica se o token é válido)
 * 2. RolesGuard (verifica se o role tem permissão)
 * 3. Controller (executa a lógica)
 *
 * IMPORTANTE:
 * -----------
 * Este guard SÓ funciona se o JwtAuthGuard já tiver sido executado.
 * Sem o usuário autenticado, não há role para verificar.
 * ============================================================================
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Guard que controla acesso baseado nos papéis (roles) do usuário.
 *
 * Deve ser usado em conjunto com o decorador @Roles():
 * @Roles(Role.ADMIN)
 * @UseGuards(RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Reflector é um utilitário do NestJS para ler metadados.
   * Usado para acessar os roles definidos pelo @Roles().
   */
  constructor(private reflector: Reflector) {}

  /**
   * Método principal que verifica a permissão.
   *
   * @param context - Contexto da requisição (contém o usuário)
   * @returns true se o usuário tem permissão, false caso contrário
   */
  canActivate(context: ExecutionContext): boolean {
    // Lê os roles permitidos do metadado (definidos pelo @Roles())
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Decorador no método do controller
      context.getClass(), // Decorador na classe do controller
    ]);

    // Se nenhum role foi definido, permite acesso (endpoint público)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtém o usuário da requisição (adicionado pelo JwtAuthGuard)
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const user = request.user;

    // Se não há usuário autenticado, nega acesso
    if (!user) {
      return false;
    }

    // Verifica se o role do usuário está na lista de roles permitidos
    return requiredRoles.some((role) => user.role === role);
  }
}
