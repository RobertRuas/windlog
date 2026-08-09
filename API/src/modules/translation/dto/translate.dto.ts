/**
 * ============================================================================
 * TRANSLATION DTOs - Data Transfer Objects do Módulo de Tradução (IA)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os DTOs (Data Transfer Objects) usados pelo módulo de tradução.
 * Aqui validamos a entrada do endpoint de tradução antes que ela chegue
 * ao modelo de inteligência artificial.
 *
 * POR QUE VALIDAMOS?
 * ------------------
 * - Evitamos enviar textos vazios ou gigantes para o modelo (performance).
 * - Garantimos um contrato claro e seguro entre frontend e backend.
 * - A validação usa class-validator (padrão da aplicação) e é aplicada
 *   automaticamente pelo ValidationPipe global.
 * ============================================================================
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para solicitar a tradução de um texto (Português -> Inglês).
 */
export class TranslateDto {
  @ApiProperty({
    description: 'Texto em português a ser traduzido para inglês',
    example: 'Realizei a manutenção das turbinas e troquei as peças danificadas.',
    maxLength: 2000,
  })
  @IsString({ message: 'O texto deve ser uma string' })
  @IsNotEmpty({ message: 'O texto não pode ser vazio' })
  @MaxLength(2000, { message: 'O texto deve ter no máximo 2000 caracteres' })
  text: string;
}
