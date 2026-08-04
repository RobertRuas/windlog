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

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Construtor da estratégia JWT.
   *
   * Configura as opções de extração e validação do token:
   * - secretOrKey: chave secreta para validar a assinatura
   * - jwtFromRequest: de onde extrair o token (header Authorization)
   * - ignoreExpiration: se deve ignorar tokens expirados (false = rejeita)
   */
  constructor(configService: ConfigService) {
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
   * Método chamado após validar o token com sucesso.
   *
   * O retorno deste método é anexado ao request.user
   * e pode ser acessado nos controllers via @CurrentUser().
   *
   * @param payload - Dados decodificados do token JWT
   * @returns Objeto que será anexado ao request.user
   */
  validate(payload: JwtPayload): JwtPayload {
    // Retorna o payload que será anexado ao request.user
    // Os dados aqui ficam disponíveis via @CurrentUser()
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      profileComplete: payload.profileComplete,
    };
  }
}
