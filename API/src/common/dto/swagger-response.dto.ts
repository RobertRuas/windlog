/**
 * ============================================================================
 * SWAGGER DTOs - Tipos de Resposta para Documentação OpenAPI
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os schemas de resposta que aparecem na documentação Swagger.
 * O Swagger usa essas classes para gerar o schema JSON automaticamente,
 * mostrando ao desenvolvedor frontend exatamente o que a API retorna.
 *
 * POR QUE CLASSES SEPARADAS?
 * --------------------------
 * O Swagger do NestJS precisa de classes com decoradores @ApiProperty()
 * para gerar a documentação. Interfaces não funcionam porque são removidas
 * na compilação (não existem em runtime).
 *
 * COMO USAR?
 * ----------
 * Nos controllers:
 * @ApiResponse({ status: 200, type: SuccessResponseDto })
 * @ApiResponse({ status: 400, type: ErrorResponseDto })
 * ============================================================================
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Schema de resposta de SUCESSO da API.
 * Aparece na documentação Swagger para TODOS os endpoints de sucesso.
 *
 * EXEMPLO VISUAL (Swagger UI):
 * {
 *   "data": { ... },
 *   "message": "Success",
 *   "statusCode": 200,
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Dados retornados pelo serviço (tipo varia por endpoint)',
    example: { id: 'uuid', email: 'user@example.com' },
  })
  data: Record<string, unknown>;

  @ApiProperty({
    description: 'Mensagem descritiva da operação',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: 'Código HTTP da resposta',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Data/hora da resposta em formato ISO 8601 (UTC)',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}

/**
 * Schema de resposta de ERRO da API.
 * Aparece na documentação Swagger para TODOS os endpoints de erro.
 *
 * EXEMPLO VISUAL (Swagger UI):
 * {
 *   "error": "BadRequest",
 *   "message": "Email must be a valid email address",
 *   "statusCode": 400,
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "path": "/api/v1/auth/login"
 * }
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Nome do erro (ex: BadRequest, NotFound, Unauthorized)',
    example: 'BadRequest',
  })
  error: string;

  @ApiProperty({
    description: 'Mensagem descritiva do erro',
    example: 'Email must be a valid email address',
  })
  message: string;

  @ApiProperty({
    description: 'Código HTTP do erro',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Data/hora do erro em formato ISO 8601 (UTC)',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'URL do endpoint que causou o erro',
    example: '/api/v1/auth/login',
  })
  path: string;
}

/**
 * Schema da resposta de login/registro (dados do token).
 * Usado para documentar o que os endpoints de auth retornam.
 */
export class AuthResponseDataDto {
  @ApiProperty({
    description: 'Token JWT de acesso (enviar como Bearer token)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'TECHNICIAN',
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
