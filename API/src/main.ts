/**
 * ============================================================================
 * MAIN.TS - Ponto de Entrada da Aplicação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este é o arquivo que inicializa toda a aplicação NestJS.
 * É o PRIMEIRO arquivo executado quando o servidor inicia.
 *
 * O QUE FAZ?
 * ----------
 * 1. Cria a aplicação NestJS
 * 2. Configura middlewares globais (Helmet, CORS, Compression)
 * 3. Configura validação global de DTOs
 * 4. Configura filtro global de exceções
 * 5. Configura interceptor global de resposta
 * 6. Configura prefixo global das rotas
 * 7. Configura documentação Swagger (OpenAPI)
 * 8. Inicia o servidor HTTP
 *
 * ORDEM DE EXECUÇÃO:
 * ------------------
 * main.ts → AppModule → AuthModule → PrismaService → Servidor Online
 * ============================================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { SystemLogService } from './modules/system-log/system-log.service.js';

/**
 * Função principal que bootstrapa a aplicação.
 *
 * É chamada automaticamente quando o arquivo é executado.
 * Configura TODOS os aspectos da aplicação antes de iniciar o servidor.
 */
async function bootstrap() {
  // Logger para registrar o processo de inicialização
  const logger = new Logger('Bootstrap');

  // -------------------------------------------------------------------------
  // 1. CRIA A APLICAÇÃO NESTJS
  // -------------------------------------------------------------------------
  const app = await NestFactory.create(AppModule, {
    // Buffer de logs: mostra quando a aplicação iniciou
    bufferLogs: true,
  });

  // -------------------------------------------------------------------------
  // 1.1. COOKIE PARSER
  // -------------------------------------------------------------------------
  // Necessário para ler cookies httpOnly do refresh token nas requisições.
  // O cookie-parser faz o parsing automático dos cookies recebidos.
  app.use(cookieParser());

  // Limite do body parser JSON reduzido para 2MB.
  // Anteriormente era 10MB, o que permitia payloads excessivos (vetor DoS).
  // O upload de ficheiros usa Multer separadamente e tem seu próprio limite.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Obtém o serviço de configuração para acessar variáveis de ambiente
  const configService = app.get(ConfigService);

  // -------------------------------------------------------------------------
  // 2. SEGURANÇA - HELMET
  // -------------------------------------------------------------------------
  // Helmet adiciona headers de segurança automaticamente:
  // - Content-Security-Policy (CSP)
  // - X-Content-Type-Options: nosniff
  // - X-Frame-Options: DENY
  // - E outros headers de proteção
  //
  // SEGURANÇA: O CSP foi endurecido para NÃO permitir unsafe-inline em scripts.
  // Apenas estilos inline são permitidos (necessário para frameworks CSS-in-JS).
  // O Swagger UI só está disponível em desenvolvimento, então não precisa
  // de exceções no CSP para produção.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Apenas scripts do próprio domínio — sem unsafe-inline nem unsafe-eval
          scriptSrc: ["'self'"],
          // Estilos inline permitidos para compatibilidade com frameworks CSS
          styleSrc: ["'self'", "'unsafe-inline'"],
          // Imagens do próprio domínio e data URIs (ícones, avatares base64)
          imgSrc: ["'self'", 'data:'],
          // Bloqueia iframes por padrão (proteção contra clickjacking)
          frameSrc: ["'none'"],
          // Bloqueia object/embed (proteção contra plugins maliciosos)
          objectSrc: ["'none'"],
        },
      },
    }),
  );

  // -------------------------------------------------------------------------
  // 3. PERFORMANCE - COMPRESSION
  // -------------------------------------------------------------------------
  // Comprime respostas HTTP com gzip para reduzir tamanho da transferência
  app.use(compression());

  // -------------------------------------------------------------------------
  // 4. CORS - Cross-Origin Resource Sharing
  // -------------------------------------------------------------------------
  // Controla quais origens (domínios) podem fazer requisições à API.
  //
  // SEGURANÇA: Em vez de aceitar todas as origens (origin: true), usamos
  // a variável CORS_ORIGIN do .env para definir explicitamente quem pode acessar.
  // Exemplo: CORS_ORIGIN=http://localhost:5173,https://windlog.pt
  //
  // Se CORS_ORIGIN não estiver definida, permite todas as origens (fallback dev).
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((o) => o.trim()) // Lista de domínios permitidos
      : true, // Fallback: permite todos (apenas desenvolvimento)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permite envio de cookies httpOnly (refresh token)
  });

  // -------------------------------------------------------------------------
  // 4.1. TRUST PROXY - Confiança em Proxy Reverso
  // -------------------------------------------------------------------------
  // Em produção, a API fica atrás de um reverse proxy (Nginx, Caddy, etc.).
  // Precisamos confiar no header X-Forwarded-For para obter o IP real.
  // Em desenvolvimento, confiamos apenas no primeiro proxy para evitar
  // que atacantes forjem IPs nos logs do sistema.
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', nodeEnv === 'production' ? 1 : false);

  // -------------------------------------------------------------------------
  // 5. PREFIXO GLOBAL DAS ROTAS
  // -------------------------------------------------------------------------
  // Todas as rotas terão o prefixo /api/v1
  // Ex: /auth/login → /api/v1/auth/login
  app.setGlobalPrefix('api/v1');

  // -------------------------------------------------------------------------
  // 6. VALIDAÇÃO GLOBAL DE DTOs
  // -------------------------------------------------------------------------
  // ValidationPipe valida automaticamente todos os DTOs recebidos
  // Se um DTO for inválido, retorna 400 Bad Request automaticamente
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: remove campos não declarados no DTO (segurança)
      whitelist: true,

      // forbidNonWhitelisted: retorna erro se enviar campos extras
      forbidNonWhitelisted: true,

      // transform: converte tipos automaticamente (ex: string → number)
      transform: true,
    }),
  );

  // -------------------------------------------------------------------------
  // 7. FILTRO GLOBAL DE EXCEÇÕES
  // -------------------------------------------------------------------------
  // Padroniza TODAS as respostas de erro no formato definido
  app.useGlobalFilters(new HttpExceptionFilter());

  // -------------------------------------------------------------------------
  // 8. INTERCEPTOR GLOBAL DE RESPOSTA
  // -------------------------------------------------------------------------
  // Padroniza TODAS as respostas de sucesso no formato definido
  app.useGlobalInterceptors(new TransformInterceptor());

  // -------------------------------------------------------------------------
  // 8.1. INTERCEPTOR DE LOGS
  // -------------------------------------------------------------------------
  // Registra automaticamente todas as requisições HTTP
  const systemLogService = app.get(SystemLogService);
  app.useGlobalInterceptors(new LoggingInterceptor(systemLogService));

  // -------------------------------------------------------------------------
  // 9. DOCUMENTAÇÃO SWAGGER (OpenAPI) — APENAS EM DESENVOLVIMENTO
  // -------------------------------------------------------------------------
  // SEGURANÇA: O Swagger expõe toda a estrutura da API (endpoints, DTOs,
  // parâmetros, responses). Em produção, isso é um risco de informação.
  // Por isso, o Swagger só é montado quando NODE_ENV === 'development'.
  const port = configService.get<number>('PORT', 3000);
  if (nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Windlog API')
      .setDescription(
        'API do sistema Windlog para gestão de projetos eólicos.\n\n' +
          '**Autenticação:** Use o botão "Authorize" e insira o token JWT ' +
          'no formato: Bearer <token>\n\n' +
          '**Prefixo:** Todos os endpoints usam o prefixo `/api/v1`\n\n' +
          '**Respostas:** Todas seguem o formato padronizado:\n' +
          '- Sucesso: `{ data, message, statusCode, timestamp }`\n' +
          '- Erro: `{ error, message, statusCode, timestamp, path }`',
      )
      .setVersion('1.0')
      .addBearerAuth(
        // Configura o esquema de autenticação Bearer JWT
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT recebido no login',
        },
        'access-token', // Nome do esquema de segurança
      )
      .addTag('auth', 'Autenticação e autorização - Endpoints para login e gestão de sessão')
      .build();

    // Cria o documento Swagger baseado na configuração
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Redirect: força barra final no Swagger UI (evita caminhos relativos quebrados)
    expressApp.get('/api/docs', (req: { url: string }, res: { redirect: (arg0: number, arg1: string) => void }, next: () => void) => {
      if (!req.url.endsWith('/')) {
        res.redirect(301, '/api/docs/');
      } else {
        next();
      }
    });

    // Monta o Swagger UI em /api/docs
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        displayRequestDuration: true,
        url: '/api/docs-json',
      },
      jsonDocumentUrl: '/api/docs-json',
    });

    logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  } else {
    // Em produção, o Swagger não é montado — nenhum endpoint de documentação existe
    logger.log('Swagger disabled in production environment');
  }

  // -------------------------------------------------------------------------
  // 10. INICIA O SERVIDOR
  // -------------------------------------------------------------------------
  // Host configurável via LISTEN_HOST no .env.
  // Em produção: 127.0.0.1 (apenas acesso local, atrás de reverse proxy).
  // Em desenvolvimento: 0.0.0.0 (acesso pela rede LAN para testes).
  const listenHost = configService.get<string>(
    'LISTEN_HOST',
    nodeEnv === 'production' ? '127.0.0.1' : '0.0.0.0',
  );
  await app.listen(port, listenHost);

  logger.log(`Application running on: http://${listenHost}:${port}`);
  logger.log(
    `Environment: ${nodeEnv}`,
  );
}

// Executa o bootstrap
void bootstrap();
