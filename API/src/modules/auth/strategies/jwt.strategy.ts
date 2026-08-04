/**
 * ============================================================================
 * JWT STRATEGY - Estratégia de Validação do Token JWT
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define como o Passport deve validar os tokens JWT recebidos nas requisições.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O cliente envia o token no header: Authorization: Bearer <token>
 * 2. O Passport extrai o token da requisição
 * 3. Esta estratégia valida a assinatura do token (usando JWT_SECRET)
 * 4. Decodifica o payload (dados do usuário)
 * 5. Retorna o payload para ser anexado ao request.user
 *
 * O QUE É O PAYLOAD?
 * ------------------
 * O payload (JwtPayload) contém os dados que foram assinados no login:
 * - sub: ID do usuário
 * - email: e-mail do usuário
 * - role: papel do usuário
 *
 * IMPORTANTE:
 * -----------
 * Esta estratégia NÃO verifica se o usuário existe no banco.
 * Ela apenas valida a assinatura do token. Para verificar o usuário,
 * use o JwtAuthGuard em conjunto.
 * ============================================================================
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service.js';

/**
 * Interface que define o formato do payload do JWT.
 * Usada em toda a aplicação para type-safety.
 */
export interface JwtPayload {
  /** ID do usuário (campo 'sub' é padrão do JWT) */
  sub: string;
  /** E-mail do usuário */
  email: string;
  /** Papel (role) do usuário */
  role: string;
  /** Indica se o usuário completou o onboarding obrigatório */
  profileComplete: boolean;
}

/**
 * Estratégia JWT do Passport.
 *
 * Configura como extrair e validar o token JWT das requisições.
 * O nome 'jwt' é usado para registrar esta estratégia no Passport.
 *
 * SEGURANÇA: O método validate() agora consulta o banco de dados para
 * revalidar o usuário a cada requisição, garantindo que tokens de usuários
 * desativados/deletados sejam rejeitados mesmo antes da expiração.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrai o token do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // NÃO ignora tokens expirados (rejeita automaticamente)
      ignoreExpiration: false,

      // Chave secreta para validar a assinatura do token
      // Deve ser a mesma usada para assinar (no AuthService)
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Método chamado após validar a assinatura do token.
   *
   * SEGURANÇA: Agora revalida o usuário no banco de dados para garantir que:
   * 1. O usuário ainda existe (não foi deletado fisicamente)
   * 2. O usuário está ativo (isActive: true)
   * 3. O usuário não foi soft-deletado (deletedAt: null)
   * 4. O role do usuário é atualizado do banco (não confia no token)
   *
   * Isso evita que tokens válidos continuem funcionando após:
   * - Desativação do usuário pelo admin
   * - Mudança de role (ex: rebaixamento de ADMIN para STANDARD)
   * - Soft-delete do usuário
   *
   * @param payload - Dados decodificados do token JWT
   * @returns Objeto com dados ATUALIZADOS do banco
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Consulta o banco para verificar se o usuário existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        profileComplete: true,
      },
    });

    // Usuário não existe mais no banco
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Usuário foi desativado pelo admin
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Usuário foi soft-deletado
    if (user.deletedAt !== null) {
      throw new UnauthorizedException('Account has been deleted');
    }

    // Retorna dados ATUALIZADOS do banco (não confia no token para role/profileComplete)
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
    };
  }
}
