/**
 * ============================================================================
 * TRANSFORM INTERCEPTOR - Padronizador de Respostas de Sucesso
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este interceptor transforma TODAS as respostas de sucesso da API
 * para um formato padronizado e consistente.
 *
 * FORMATO PADRONIZADO:
 * --------------------
 * {
 *   "data": { ... },           // Dados retornados pelo serviço
 *   "message": "Success",      // Mensagem descritiva
 *   "statusCode": 200,         // Código HTTP da resposta
 *   "timestamp": "..."         // Data/hora da resposta (UTC)
 * }
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * - Consistência: todas as respostas seguem o mesmo formato
 * - Debugging: timestamp ajuda a rastrear quando a resposta foi gerada
 * - Documentação: o formato é previsível para o frontend
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O controller retorna dados (ex: um usuário)
 * 2. Este interceptor pega os dados
 * 3. Envolve no formato padronizado
 * 4. Retorna ao cliente
 *
 * ONDE ESTÁ REGISTRADO?
 * ---------------------
 * No main.ts como interceptor global:
 * app.useGlobalInterceptors(new TransformInterceptor());
 * ============================================================================
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface que define o formato padronizado de todas as respostas.
 * Usada para type-safety (garantir que todas as respostas seguem o padrão).
 */
export interface StandardResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Interceptor que transforma todas as respostas no formato padronizado.
 *
 * @TypeParam T - Tipo dos dados retornados (genérico para funcionar com qualquer resposta)
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | StreamableFile
> {
  // Logger para registrar requisições bem-sucedidas
  private readonly logger = new Logger('TransformInterceptor');

  /**
   * Método principal que intercepta e transforma as respostas.
   *
   * @param context - Contexto da execução (informações da requisição)
   * @param next - Próximo handler na cadeia (o controller)
   * @returns Observable com a resposta transformada
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | StreamableFile> {
    // Obtém informações da requisição para logging
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<{ method: string; url: string }>();
    const response = ctx.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      // Transforma os dados retornados pelo controller
      map((data: T) => {
        const statusCode = response.statusCode;

        // Registra a requisição bem-sucedida no log
        this.logger.log(`${request.method} ${request.url} ${statusCode}`);

        // NÃO transforma respostas binárias (StreamableFile) em JSON.
        // Ficheiros de download devem ser enviados como stream puro.
        if (data instanceof StreamableFile) {
          return data;
        }

        // Monta a resposta no formato padronizado
        return {
          data,
          message: 'Success',
          statusCode,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
