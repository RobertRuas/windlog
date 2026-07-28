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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Dados básicos do usuário autenticado',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STANDARD',
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

/**
 * Schema do perfil completo do usuário (endpoint GET /auth/profile).
 * Inclui todos os dados pessoais, profissionais e relacionamentos.
 */
export class UserProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: '+351912345678' })
  phone: string | null;

  @ApiPropertyOptional({ example: '+351' })
  phoneCountryCode: string | null;

  @ApiPropertyOptional({ example: '1990-05-15T00:00:00.000Z' })
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ example: 'PT' })
  nationality: string | null;

  @ApiPropertyOptional({ example: 'Rua das Turbinas, 123' })
  address: string | null;

  @ApiPropertyOptional({ example: 'Lisboa' })
  city: string | null;

  @ApiPropertyOptional({ example: '1000-001' })
  postalCode: string | null;

  @ApiPropertyOptional({ example: 'PT' })
  country: string | null;

  @ApiPropertyOptional({ example: 'Operations' })
  department: string | null;

  @ApiPropertyOptional({ example: 'Wind Turbine Technician' })
  position: string | null;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00.000Z' })
  hireDate: Date | null;

  @ApiPropertyOptional({ example: 'EMP-001' })
  employeeId: string | null;

  @ApiPropertyOptional({ example: 'Experienced wind turbine technician...' })
  bio: string | null;

  @ApiProperty({ example: 'STANDARD', enum: ['ADMIN', 'HR', 'STANDARD'] })
  role: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: 'Números de telefone do usuário',
    example: [
      { id: 'uuid', countryCode: '+351', number: '912345678', type: 'mobile', isPrimary: true },
    ],
  })
  phoneNumbers: Array<{
    id: string;
    countryCode: string;
    number: string;
    type: string;
    isPrimary: boolean;
  }>;

  @ApiProperty({
    description: 'Certificações, diplomas e cursos do usuário',
    example: [
      {
        id: 'uuid',
        name: 'GWO BST',
        issuer: 'GWO',
        type: 'CERTIFICATION',
        issueDate: '2024-01-15',
        expiryDate: '2026-01-15',
      },
    ],
  })
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    type: string;
    issueDate: Date;
    expiryDate: Date | null;
  }>;

  @ApiProperty({
    description: 'Idiomas falados pelo usuário com nível de proficiência',
    example: [
      { id: 'uuid', language: 'Portuguese', level: 'NATIVE' },
      { id: 'uuid', language: 'English', level: 'C1' },
      { id: 'uuid', language: 'French', level: 'B2' },
    ],
  })
  languages: Array<{
    id: string;
    language: string;
    level: string;
  }>;
}
