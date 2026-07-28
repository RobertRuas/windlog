/**
 * ============================================================================
 * HTTP EXCEPTION FILTER - Filtro Global de Exceções
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este filtro captura TODAS as exceções não tratadas da aplicação
 * e retorna uma resposta padronizada em formato JSON.
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * Sem este filtro, o NestJS retorna erros em formatos inconsistentes.
 * Com ele, TODAS as respostas de erro seguem o mesmo padrão:
 *
 * {
 *   "error": "Nome do erro",
 *   "message": "Descrição legível do que aconteceu",
 *   "statusCode": 400,
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Qualquer exceção é lançada (HttpException, ValidationError, etc.)
 * 2. Este filtro intercepta a exceção
 * 3. Formata a resposta no padrão definido
 * 4. Registra o erro no log para debug
 * 5. Retorna a resposta formatada ao cliente
 *
 * ONDE ESTÁ REGISTRADO?
 * ---------------------
 * No main.ts como filtro global:
 * app.useGlobalFilters(new HttpExceptionFilter());
 * ============================================================================
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * Filtro global que captura todas as exceções e padroniza a resposta.
 *
 * @Catch() sem argumentos = captura QUALQUER tipo de exceção
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Logger do NestJS para registrar erros com contexto
  private readonly logger = new Logger('HttpExceptionFilter');

  /**
   * Método principal chamado quando uma exceção é capturada.
   *
   * @param exception - A exceção que foi lançada (pode ser qualquer coisa)
   * @param host - Contexto da requisição (request, response, etc.)
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // Obtém o objeto Response do contexto HTTP
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determina o status code e a mensagem da resposta
    let statusCode: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      // Se for uma HttpException (lançada intencionalmente pelo código)
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // A resposta pode ser string ou objeto
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string) || exception.message;
        error = (resp['error'] as string) || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      // Se for um erro inesperado (bug no código, erro de banco, etc.)
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';

      // Registra o erro inesperado no log para debug
      this.logger.error(
        `Unexpected error: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Monta a resposta padronizada
    const responseBody = {
      error,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Registra a requisição que causou o erro
    this.logger.error(
      `${request.method} ${request.url} ${statusCode} - ${message}`,
    );

    // Envia a resposta formatada ao cliente
    response.status(statusCode).json(responseBody);
  }
}
