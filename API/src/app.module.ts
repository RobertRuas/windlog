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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { EnvironmentVariables } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SystemLogModule } from './modules/system-log/system-log.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { NotificationsModule } from './modules/notifications/notification.module.js';
import { WeeklyTimesheetModule } from './modules/weekly-timesheet/weekly-timesheet.module.js';
import { FeedbackModule } from './modules/feedback/feedback.module.js';

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
    // THROTTLER MODULE - Rate Limiting Global
    // -------------------------------------------------------------------------
    // Protege TODOS os endpoints contra ataques de força bruta e DoS.
    // Limite padrão: 100 requisições por minuto por IP.
    // Endpoints específicos (login, /files) podem ter limites mais restritivos
    // usando o decorador @Throttle() nos controllers.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // Janela de tempo: 60 segundos (1 minuto)
        limit: 100, // Máximo de 100 requisições por minuto por IP
      },
    ]),

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
    // PROJECTS MODULE - Gestão de Projetos
    // -------------------------------------------------------------------------
    ProjectsModule,

    // -------------------------------------------------------------------------
    // UPLOAD MODULE - Upload e Gestão de Ficheiros
    // -------------------------------------------------------------------------
    UploadModule,

    // -------------------------------------------------------------------------
    // NOTIFICATIONS MODULE - Sistema de Notificações
    // -------------------------------------------------------------------------
    NotificationsModule,

    // -------------------------------------------------------------------------
    // WEEKLY TIMESHEET MODULE - Gestão de Timesheets Semanais
    // -------------------------------------------------------------------------
    WeeklyTimesheetModule,

    // -------------------------------------------------------------------------
    // FEEDBACK MODULE - Gestão de Feedbacks do Sistema
    // -------------------------------------------------------------------------
    FeedbackModule,

    // -------------------------------------------------------------------------
    // PRÓXIMOS MÓDULOS SERÃO ADICIONADOS AQUI
    // -------------------------------------------------------------------------
    // Exemplo:
    // DailyReportsModule,
  ],
  // -------------------------------------------------------------------------
  // PROVIDERS GLOBAIS
  // -------------------------------------------------------------------------
  // ThrottlerGuard: aplica rate limiting em TODOS os endpoints automaticamente.
  // Endpoints individuais podem usar @Throttle() para limites mais restritivos.
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
