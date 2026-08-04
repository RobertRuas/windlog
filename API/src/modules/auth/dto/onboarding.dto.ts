/**
 * ============================================================================
 * ONBOARDING DTO - Validação de Dados para Onboarding Obrigatório
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend durante o onboarding
 * obrigatório do usuário (primeiro login com senha temporária).
 *
 * TODOS OS CAMPOS SÃO OBRIGATÓRIOS para completar o onboarding:
 *
 * DADOS PESSOAIS:
 * - firstName, lastName, nationality, dateOfBirth
 * - passportNumber, passportIssueDate, passportExpiryDate, passportIssuingCountry
 *
 * CONTATO:
 * - email, phone
 *
 * LOCALIZAÇÃO:
 * - address
 *
 * IDIOMAS:
 * - Pelo menos um idioma com nível
 *
 * AEROPORTO PREFERIDO:
 * - preferredAirportCity, preferredAirportCountry
 *
 * DADOS PROFISSIONAIS:
 * - windaId, irataLevel, irataNumber
 * ============================================================================
 */

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para um idioma dentro do onboarding.
 */
export class OnboardingLanguageDto {
  @ApiProperty({ description: 'Nome do idioma', example: 'English' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ description: 'Nível de proficiência (A1, A2, B1, B2, C1, C2, NATIVE)', example: 'NATIVE' })
  @IsString()
  @IsNotEmpty()
  level: string;
}

/**
 * DTO para o endpoint de onboarding.
 * Todos os campos são obrigatórios.
 */
export class OnboardingDto {
  // =========================================================================
  // DADOS PESSOAIS
  // =========================================================================

  @ApiProperty({ description: 'Primeiro nome', example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ description: 'Sobrenome', example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ description: 'Nacionalidade (código ISO do país)', example: 'PT' })
  @IsString()
  @IsNotEmpty({ message: 'Nationality is required' })
  nationality: string;

  @ApiProperty({ description: 'Data de nascimento (ISO 8601)', example: '1990-01-15' })
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  dateOfBirth: string;

  // =========================================================================
  // PASSAPORTE
  // =========================================================================

  @ApiProperty({ description: 'Número do passaporte', example: 'AB123456' })
  @IsString()
  @IsNotEmpty({ message: 'Passport number is required' })
  passportNumber: string;

  @ApiProperty({ description: 'País emissor do passaporte (código ISO)', example: 'PT' })
  @IsString()
  @IsNotEmpty({ message: 'Passport issuing country is required' })
  passportIssuingCountry: string;

  @ApiProperty({ description: 'Data de expedição do passaporte (ISO 8601)', example: '2020-01-15' })
  @IsDateString({}, { message: 'Passport issue date must be a valid date' })
  @IsNotEmpty({ message: 'Passport issue date is required' })
  passportIssueDate: string;

  @ApiProperty({ description: 'Data de validade do passaporte (ISO 8601)', example: '2030-01-15' })
  @IsDateString({}, { message: 'Passport expiry date must be a valid date' })
  @IsNotEmpty({ message: 'Passport expiry date is required' })
  passportExpiryDate: string;

  // =========================================================================
  // CONTATO
  // =========================================================================

  @ApiProperty({ description: 'E-mail de contato', example: 'john@example.com' })
  @IsEmail({}, { message: 'Must be a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ description: 'Telefone de contato', example: '+351912345678' })
  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  phone: string;

  // =========================================================================
  // LOCALIZAÇÃO
  // =========================================================================

  @ApiProperty({ description: 'Endereço completo', example: 'Rua das Flores, 123' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  // =========================================================================
  // IDIOMAS
  // =========================================================================

  @ApiProperty({
    description: 'Idiomas falados (pelo menos um)',
    type: [OnboardingLanguageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingLanguageDto)
  languages: OnboardingLanguageDto[];

  // =========================================================================
  // AEROPORTO PREFERIDO
  // =========================================================================

  @ApiProperty({ description: 'Cidade do aeroporto preferido', example: 'Lisboa' })
  @IsString()
  @IsNotEmpty({ message: 'Preferred airport city is required' })
  preferredAirportCity: string;

  @ApiProperty({ description: 'País do aeroporto preferido (código ISO)', example: 'PT' })
  @IsString()
  @IsNotEmpty({ message: 'Preferred airport country is required' })
  preferredAirportCountry: string;

  // =========================================================================
  // DADOS PROFISSIONAIS
  // =========================================================================

  @ApiProperty({ description: 'WINDA ID', example: 'RR092285BR' })
  @IsString()
  @IsNotEmpty({ message: 'WINDA ID is required' })
  windaId: string;

  @ApiProperty({ description: 'Nível IRATA (L1, L2, L3, NOT_APPLICABLE)', example: 'L2' })
  @IsString()
  @IsNotEmpty({ message: 'IRATA level is required' })
  irataLevel: string;

  @ApiProperty({ description: 'Número IRATA ou NOT_APPLICABLE', example: '134109' })
  @IsString()
  @IsNotEmpty({ message: 'IRATA number is required' })
  irataNumber: string;

  // =========================================================================
  // CAMPO OPCIONAL - Foto/PDF do passaporte (anexar posteriormente)
  // =========================================================================

  @ApiPropertyOptional({ description: 'URL do ficheiro do passaporte (anexar posteriormente)' })
  @IsString()
  @IsOptional()
  passportFilePath?: string;
}
