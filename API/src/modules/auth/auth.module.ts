/**
 * ============================================================================
 * AUTH MODULE - Módulo de Autenticação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este é o módulo NestJS que organiza e registra todos os componentes
 * do sistema de autenticação (controller, service, strategies, guards).
 *
 * POR QUE MÓDULOS?
 * ----------------
 * O NestJS usa módulos para organizar o código em unidades coesas.
 * Cada módulo tem uma responsabilidade clara e pode ser importado
 * por outros módulos.
 *
 * O QUE ESTE MÓDULO EXPORTA?
 * --------------------------
 * - AuthService: pode ser injetado em outros módulos que precisem
 *   verificar credenciais ou gerar tokens
 *
 * COMO USAR EM OUTROS MÓDULOS?
 * ----------------------------
 * @Module({
 *   imports: [AuthModule],
 *   // ...
 * })
 * export class SomeModule {}
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [
    // PassportModule: base para estratégias de autenticação
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // UploadModule: disponibiliza UploadService para upload de avatar
    UploadModule,

    // JwtModule: configura a geração e validação de tokens JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Access token com expiração curta (2h). A renovação acontece
          // via refresh token (cookie httpOnly) no endpoint POST /auth/refresh.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '2h') as any,
        },
      }),
    }),
  ],

  // Controllers deste módulo
  controllers: [AuthController],

  // Serviços deste módulo
  providers: [AuthService, JwtStrategy, PrismaService],

  // Exporta o serviço para que outros módulos possam usá-lo
  exports: [AuthService],
})
export class AuthModule {}
