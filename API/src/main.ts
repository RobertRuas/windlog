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

  // Obtém o serviço de configuração para acessar variáveis de ambiente
  const configService = app.get(ConfigService);

  // -------------------------------------------------------------------------
  // 2. SEGURANÇA - HELMET
  // -------------------------------------------------------------------------
  // Helmet adiciona headers de segurança automaticamente:
  // - Content-Security-Policy
  // - X-Content-Type-Options
  // - X-Frame-Options
  // - E outros
  //
  // IMPORTANTE: O Swagger UI usa scripts inline, então precisamos permitir
  // no Content Security Policy (CSP) para a documentação funcionar.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Permite scripts inline (necessário para o Swagger UI)
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          // Permite estilos inline (necessário para o Swagger UI)
          styleSrc: ["'self'", "'unsafe-inline'"],
          // Permite carregar imagens de data URIs (ícones do Swagger)
          imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
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
  // Permite que o frontend (em outro domínio/porta) acesse a API
  // Em produção, restrinja para domínios específicos
  app.enableCors({
    origin: '*', // Em produção, substitua por domínios específicos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // -------------------------------------------------------------------------
  // 4.1. FICHEIROS PRIVADOS (uploads)
  // -------------------------------------------------------------------------
  // Os ficheiros são servidos exclusivamente pelo endpoint NestJS:
  //   GET /api/v1/upload/file/:id
  // Este endpoint valida JWT (header ou query param), verifica propriedade
  // do ficheiro (ou role ADMIN) e retorna via StreamableFile.
  // NÃO existe nenhuma URL pública ou estática para os uploads.
  // -------------------------------------------------------------------------

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
  // 9. DOCUMENTAÇÃO SWAGGER (OpenAPI)
  // -------------------------------------------------------------------------
  // Configura a documentação interativa da API
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
        description: 'Insira o token JWT recebido no login/registro',
      },
      'access-token', // Nome do esquema de segurança
    )
    .addTag('auth', 'Autenticação e autorização - Endpoints para registro, login e gestão de sessão')
    .build();

  // Cria o documento Swagger baseado na configuração
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // -------------------------------------------------------------------------
  // REDIRECT: Força barra final no Swagger UI
  // -------------------------------------------------------------------------
  // Sem a barra final, os caminhos relativos dos assets ficam errados.
  // Este middleware faz redirect de /api/docs para /api/docs/
  // -------------------------------------------------------------------------
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/docs', (req: { url: string }, res: { redirect: (arg0: number, arg1: string) => void }, next: () => void) => {
    // Só faz redirect se não tiver barra final (evita loop infinito)
    if (!req.url.endsWith('/')) {
      res.redirect(301, '/api/docs/');
    } else {
      next();
    }
  });

  // Monta o Swagger UI em /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    // Configurações adicionais do Swagger UI
    swaggerOptions: {
      // Mantém as requisições abertas após enviar (útil para debug)
      persistAuthorization: true,
      // Expande as tags por padrão
      docExpansion: 'list',
      // Mostra exemplos de respostas
      displayRequestDuration: true,
      // URL absoluta do schema OpenAPI (evita problemas com caminhos relativos)
      url: '/api/docs-json',
    },
    // Usa o JSON do schema diretamente (evita problemas com caminhos de assets)
    jsonDocumentUrl: '/api/docs-json',
  });

  // -------------------------------------------------------------------------
  // 10. INICIA O SERVIDOR
  // -------------------------------------------------------------------------
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(
    `Environment: ${configService.get<string>('NODE_ENV', 'development')}`,
  );
}

// Executa o bootstrap
void bootstrap();
