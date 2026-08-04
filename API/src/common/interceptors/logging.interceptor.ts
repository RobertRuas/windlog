/**
 * ============================================================================
 * LOGGING INTERCEPTOR - Interceptor para Registro Automático de Logs
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Interceptor NestJS que captura automaticamente todas as requisições HTTP
 * e registra logs detalhados no sistema.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Intercepta todas as requisições HTTP (entrada)
 * 2. Captura dados da requisição (método, URL, IP, user-agent)
 * 3. Mede o tempo de execução da requisição
 * 4. Captura dados da resposta (status code)
 * 5. Registra log no sistema via SystemLogService
 *
 * DADOS CAPTURADOS:
 * -----------------
 * - Método HTTP (GET, POST, PUT, DELETE)
 * - URL completa
 * - Endereço IP do cliente
 * - User-Agent do browser
 * - Tempo de execução (ms)
 * - Status code da resposta
 * - Usuário autenticado (se houver)
 * - Dados sensíveis são removidos (senhas, tokens)
 *
 * IMPORTANTE:
 * -----------
 * - Logs são criados de forma assíncrona (não bloqueia a resposta)
 * - Endpoints de autenticação (login) têm tratamento especial
 * - Dados sensíveis são filtrados antes de registrar
 * ============================================================================
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { SystemLogService } from '../../modules/system-log/system-log.service.js';
import { LogAction, LogSeverity } from '../../modules/system-log/dto/system-log.dto.js';

/**
 * Lista de endpoints que não devem ser logados (privacidade).
 */
const EXCLUDED_ENDPOINTS = [
  '/api/v1/system-logs', // Não logar consultas de logs
];

/**
 * Lista de campos sensíveis que devem ser removidos dos logs.
 * Inclui campos de autenticação, dados pessoais, financeiros e documentos.
 * A sanitização é recursiva (percorre todos os níveis de objetos aninhados).
 */
const SENSITIVE_FIELDS = [
  // Autenticação
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'token',
  'temporaryPassword',
  // Dados pessoais e documentos
  'documentNumber',
  'passportNumber',
  'nationalId',
  'signatureData',
  // Dados financeiros/bancários
  'iban',
  'bicSwift',
  'bankName',
  'accountHolder',
  'accountNumber',
];

/**
 * Interceptor LoggingInterceptor - Registra logs automaticamente.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly systemLogService: SystemLogService) {}

  /**
   * Intercepta a requisição e registra log.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const { method, url, ip, headers, body } = request;

    // Ignora endpoints excluídos
    if (this.isExcludedEndpoint(url)) {
      return next.handle();
    }

    // Remove dados sensíveis do body antes de logar
    const sanitizedBody = this.sanitizeData(body);

    // Extrai informações do usuário (se autenticado)
    const user = (request as any).user;

    return next.handle().pipe(
      tap({
        next: () => {
          // Requisição bem-sucedida
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Determina a ação com base no método e URL
          const action = this.determineAction(method, url, statusCode);
          const severity = this.determineSeverity(statusCode);

          // Registra log de forma assíncrona (não bloqueia)
          this.systemLogService
            .create({
              action,
              severity,
              message: `${method} ${url} - ${statusCode}`,
              userId: user?.id,
              userName: user ? `${user.firstName} ${user.lastName}` : undefined,
              userEmail: user?.email,
              ipAddress: this.getClientIp(request),
              userAgent: headers['user-agent'],
              url,
              method,
              statusCode,
              duration,
              details: sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
            })
            .catch((err: any) => this.logger.error(`Erro ao criar log: ${err.message}`));
        },
        error: (error) => {
          // Requisição com erro
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.systemLogService
            .create({
              action: LogAction.API_ERROR,
              severity: LogSeverity.ERROR,
              message: `${method} ${url} - ERRO: ${error.message}`,
              userId: user?.id,
              userName: user ? `${user.firstName} ${user.lastName}` : undefined,
              userEmail: user?.email,
              ipAddress: this.getClientIp(request),
              userAgent: headers['user-agent'],
              url,
              method,
              statusCode,
              duration,
              details: {
                error: error.message,
                body: sanitizedBody,
              },
            })
            .catch((err: any) => this.logger.error(`Erro ao criar log: ${err.message}`));
        },
      }),
    );
  }

  /**
   * Verifica se o endpoint deve ser excluído dos logs.
   */
  private isExcludedEndpoint(url: string): boolean {
    return EXCLUDED_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));
  }

  /**
   * Remove campos sensíveis dos dados de forma RECURSIVA.
   *
   * SEGURANÇA: A versão anterior só sanitizava o primeiro nível do objeto.
   * Objetos aninhados como `{ data: { password: "123" } }` passavam sem
   * sanitização. Agora percorre TODOS os níveis em busca de campos sensíveis.
   *
   * @param data - Dados a serem sanitizados
   * @returns Cópia dos dados com campos sensíveis substituídos por [REDACTED]
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Se for array, sanitiza cada elemento recursivamente
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        // Campo sensível encontrado em qualquer nível — substitui
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Objeto aninhado — sanitiza recursivamente
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Obtém o IP real do cliente (considerando proxies).
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.ip || request.socket.remoteAddress || '';
  }

  /**
   * Determina a ação com base no método HTTP e URL.
   */
  private determineAction(method: string, url: string, statusCode: number): LogAction {
    // Login
    if (url.includes('/auth/login')) {
      return statusCode === 200 || statusCode === 201 ? LogAction.LOGIN : LogAction.LOGIN_FAILED;
    }

    // Logout
    if (url.includes('/auth/logout')) {
      return LogAction.LOGOUT;
    }

    // Password change
    if (url.includes('/auth/password')) {
      return LogAction.PASSWORD_CHANGE;
    }

    // Profile
    if (url.includes('/auth/profile')) {
      if (method === 'GET') return LogAction.PROFILE_VIEW;
      if (method === 'PUT' || method === 'PATCH') return LogAction.PROFILE_UPDATE;
    }

    // Phones
    if (url.includes('/phones')) {
      if (method === 'POST') return LogAction.PHONE_ADD;
      if (method === 'PUT' || method === 'PATCH') return LogAction.PHONE_UPDATE;
      if (method === 'DELETE') return LogAction.PHONE_DELETE;
    }

    // Certifications
    if (url.includes('/certifications')) {
      if (method === 'POST') return LogAction.CERTIFICATION_ADD;
      if (method === 'PUT' || method === 'PATCH') return LogAction.CERTIFICATION_UPDATE;
      if (method === 'DELETE') return LogAction.CERTIFICATION_DELETE;
    }

    // Languages
    if (url.includes('/languages')) {
      if (method === 'POST') return LogAction.LANGUAGE_ADD;
      if (method === 'PUT' || method === 'PATCH') return LogAction.LANGUAGE_UPDATE;
      if (method === 'DELETE') return LogAction.LANGUAGE_DELETE;
    }

    // User management
    if (url.includes('/users') || url.includes('/auth/register')) {
      if (method === 'POST') return LogAction.USER_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.USER_UPDATE;
      if (method === 'DELETE') return LogAction.USER_DELETE;
    }

    // System logs (admin)
    if (url.includes('/system-logs')) {
      if (method === 'DELETE') return LogAction.DATA_EXPORT;
    }

    // Notifications
    if (url.includes('/notifications')) {
      if (method === 'PATCH') return LogAction.NOTIFICATION_READ;
      if (method === 'DELETE') return LogAction.NOTIFICATION_DELETE;
    }

    // Project files
    if (url.includes('/files')) {
      if (method === 'POST') return LogAction.PROJECT_FILE_CREATE;
      if (method === 'DELETE') return LogAction.PROJECT_FILE_DELETE;
    }

    // Documents
    if (url.includes('/documents')) {
      if (method === 'POST') return LogAction.DOCUMENT_ADD;
      if (method === 'PUT' || method === 'PATCH') return LogAction.DOCUMENT_UPDATE;
      if (method === 'DELETE') return LogAction.DOCUMENT_DELETE;
    }

    // Projects
    if (url.includes('/projects')) {
      if (method === 'POST') return LogAction.PROJECT_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.PROJECT_UPDATE;
      if (method === 'DELETE') return LogAction.PROJECT_DELETE;
    }

    // Turbines
    if (url.includes('/turbines')) {
      if (method === 'POST') return LogAction.TURBINE_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.TURBINE_UPDATE;
      if (method === 'DELETE') return LogAction.TURBINE_DELETE;
    }

    // Members/Technicians
    if (url.includes('/members')) {
      if (method === 'POST') return LogAction.TECHNICIAN_CREATE;
      if (method === 'PUT' || method === 'PATCH') return LogAction.TECHNICIAN_UPDATE;
      if (method === 'DELETE') return LogAction.TECHNICIAN_DELETE;
    }

    // Default
    return LogAction.OTHER;
  }

  /**
   * Determina a severidade com base no status code.
   */
  private determineSeverity(statusCode: number): LogSeverity {
    if (statusCode >= 500) return LogSeverity.CRITICAL;
    if (statusCode >= 400) return LogSeverity.WARNING;
    return LogSeverity.INFO;
  }
}
