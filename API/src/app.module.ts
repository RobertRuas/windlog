/**
 * ============================================================================
 * APP MODULE - Módulo Raiz da Aplicação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este é o módulo raiz (root module) da aplicação NestJS.
 * Ele importa e registra TODOS os outros módulos do sistema.
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * O NestJS usa uma árvore de módulos. O AppModule é a raiz dessa árvore.
 * Todo módulo que deve estar disponível na aplicação precisa ser
 * importado aqui.
 *
 * COMO ADICIONAR UM NOVO MÓDULO?
 * -------------------------------
 * 1. Crie o módulo em src/modules/<nome>/
 * 2. Importe-o aqui: import { NewModule } from './modules/new/new.module.js';
 * 3. Adicione ao array 'imports'
 * 4. Pronto! O módulo está registrado.
 *
 * MÓDULOS REGISTRADOS:
 * --------------------
 * - ConfigModule:   Variáveis de ambiente e configuração
 * - AuthModule:     Autenticação e autorização (JWT)
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvironmentVariables } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SystemLogModule } from './modules/system-log/system-log.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    // -------------------------------------------------------------------------
    // CONFIG MODULE - Variáveis de Ambiente
    // -------------------------------------------------------------------------
    // Carrega o arquivo .env e valida as variáveis obrigatórias
    // isGlobal: true → disponível em todos os módulos sem re-importar
    // validate: valida as variáveis usando a classe EnvironmentVariables
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        // Validação simples das variáveis obrigatórias
        const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
        for (const varName of requiredVars) {
          if (!config[varName]) {
            throw new Error(
              `Missing required environment variable: ${varName}`,
            );
          }
        }
        return config as EnvironmentVariables;
      },
    }),

    // -------------------------------------------------------------------------
    // AUTH MODULE - Autenticação e Autorização
    // -------------------------------------------------------------------------
    AuthModule,

    // -------------------------------------------------------------------------
    // SYSTEM LOG MODULE - Logs do Sistema
    // -------------------------------------------------------------------------
    SystemLogModule,

    // -------------------------------------------------------------------------
    // USERS MODULE - Gestão de Usuários
    // -------------------------------------------------------------------------
    UsersModule,

    // -------------------------------------------------------------------------
    // PRÓXIMOS MÓDULOS SERÃO ADICIONADOS AQUI
    // -------------------------------------------------------------------------
    // Exemplo:
    // ProjectsModule,
    // TimesheetsModule,
    // DailyReportsModule,
  ],
})
export class AppModule {}
