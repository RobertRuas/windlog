/**
 * ============================================================================
 * CURRENT USER DECORATOR - Decorador para Obter Usuário Autenticado
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define um decorador customizado @CurrentUser() que injeta automaticamente
 * o usuário autenticado como parâmetro do controller.
 *
 * COMO USAR?
 * ----------
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user; // Dados do usuário extraídos do JWT
 * }
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * - Evita repetir código para extrair o usuário da requisição
 * - Type-safety: o tipo JwtPayload é aplicado automaticamente
 * - Limpeza: o controller fica mais legível
 * ============================================================================
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador que extrai o usuário autenticado da requisição.
 *
 * O usuário é adicionado ao request pelo JwtAuthGuard após validar o token.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: JwtPayload) {
 *   return this.authService.getProfile(user.sub);
 * }
 *
 * // Também pode extrair um campo específico:
 * @Get('my-id')
 * getMyId(@CurrentUser('sub') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    // Obtém o objeto request da requisição HTTP
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();

    // O usuário foi adicionado pelo JwtAuthGuard
    const user = request.user;

    // Se 'data' foi fornecido, retorna apenas aquele campo
    // Ex: @CurrentUser('sub') retorna apenas o ID do usuário
    if (data && user && typeof user === 'object' && data in user) {
      return (user as Record<string, unknown>)[data];
    }
    return user;
  },
);
