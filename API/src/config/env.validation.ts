/**
 * ============================================================================
 * ENV VALIDATION - Validação de Variáveis de Ambiente
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Valida que TODAS as variáveis de ambiente necessárias estão definidas
 * e têm valores válidos. Se alguma variável estiver faltando, a aplicação
 * NÃO inicia (fail-fast).
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * - Evita erros em runtime por variáveis faltando
 * - Documenta quais variáveis são necessárias
 * - Valida tipos (número, string, URL, etc.)
 * - Fail-fast: melhor falhar no início do que no meio da execução
 *
 * COMO FUNCIONA?
 * --------------
 * O NestJS usa esta classe automaticamente ao carregar o ConfigModule.
 * Se alguma variável estiver inválida, a aplicação mostra um erro claro
 * e não inicia.
 * ============================================================================
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

/**
 * Enum dos ambientes possíveis.
 * Usado para validar a variável NODE_ENV.
 */
enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  STAGING = 'staging',
}

/**
 * Classe de validação das variáveis de ambiente.
 *
 * Cada propriedade corresponde a uma variável no arquivo .env.
 * Os decoradores definem as regras de validação.
 */
export class EnvironmentVariables {
  // -------------------------------------------------------------------------
  // BANCO DE DADOS
  // -------------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // -------------------------------------------------------------------------
  // SERVIDOR
  // -------------------------------------------------------------------------

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.DEVELOPMENT;

  // -------------------------------------------------------------------------
  // JWT (Autenticação)
  // -------------------------------------------------------------------------

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // -------------------------------------------------------------------------
  // UPLOAD DE FICHEIROS
  // -------------------------------------------------------------------------

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  @IsNumber()
  @IsOptional()
  @Min(1)
  MAX_FILE_SIZE: number = 10485760;

  @IsNumber()
  @IsOptional()
  @Min(60)
  FILE_TOKEN_TTL: number = 300;
}
