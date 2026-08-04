/**
 * ============================================================================
 * CREATE FEEDBACK DTO - Validação para Criação de Feedback
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos obrigatórios e opcionais para criar um novo Feedback.
 * Usa class-validator para validar automaticamente os dados recebidos na API.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Qualquer usuário autenticado pode criar um feedback
 * 2. O usuário descreve o problema/sugestão e opcionalmente anexa screenshot
 * 3. O contexto técnico (URL, user-agent, resolução) é capturado automaticamente
 * 4. O feedback entra com status NEW e prioridade MEDIUM por padrão
 *
 * CAMPOS OBRIGATÓRIOS:
 * --------------------
 * - title:       Título/resumo do feedback
 * - description: Descrição detalhada do problema
 *
 * CAMPOS OPCIONAIS:
 * -----------------
 * - category:          Categoria do feedback (BUG, UI_ISSUE, FEATURE, etc.)
 * - screenshotPath:    Caminho do screenshot (upload prévio)
 * - pageUrl:           URL da página onde o feedback foi criado
 * - userAgent:         User-Agent do browser
 * - screenResolution:  Resolução do ecrã
 * ============================================================================
 */

import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar novo Feedback.
 *
 * Qualquer usuário autenticado pode reportar um feedback.
 * O contexto técnico é capturado automaticamente pelo frontend.
 */
export class CreateFeedbackDto {
  /**
   * Título/resumo do feedback.
   * Deve ser curto e descritivo (ex: "Botão de salvar não funciona").
   */
  @ApiProperty({
    description: 'Título/resumo do feedback',
    example: 'Botão de salvar não funciona na página de projetos',
  })
  @IsString()
  title: string;

  /**
   * Descrição detalhada do problema ou sugestão.
   * Deve conter passos para reproduzir (se for bug) ou detalhes da sugestão.
   */
  @ApiProperty({
    description: 'Descrição detalhada do problema ou sugestão',
    example: 'Ao clicar no botão "Salvar" na página de projetos, nada acontece. O console mostra erro 500.',
  })
  @IsString()
  description: string;

  /**
   * Categoria do feedback (classificação do tipo de problema).
   * Opcional — padrão: OTHER.
   */
  @ApiPropertyOptional({
    description: 'Categoria do feedback',
    enum: ['BUG', 'UI_ISSUE', 'FEATURE', 'INCONSISTENCY', 'PERFORMANCE', 'OTHER'],
    default: 'OTHER',
  })
  @IsOptional()
  @IsEnum(['BUG', 'UI_ISSUE', 'FEATURE', 'INCONSISTENCY', 'PERFORMANCE', 'OTHER'])
  category?: string;

  /**
   * Caminho do screenshot anexado (upload prévio via /upload/feedbacks).
   * Opcional — o usuário pode reportar sem screenshot.
   */
  @ApiPropertyOptional({
    description: 'Caminho do screenshot (upload prévio via /upload/feedbacks)',
    example: 'userId/feedbacks/uuid.png',
  })
  @IsOptional()
  @IsString()
  screenshotPath?: string;

  /**
   * URL da página onde o feedback foi criado.
   * Capturado automaticamente pelo frontend.
   */
  @ApiPropertyOptional({
    description: 'URL da página onde o feedback foi criado',
    example: '/projects/abc123',
  })
  @IsOptional()
  @IsString()
  pageUrl?: string;

  /**
   * User-Agent do browser (capturado automaticamente).
   * Útil para identificar browser, OS e versão.
   */
  @ApiPropertyOptional({
    description: 'User-Agent do browser',
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  /**
   * Resolução do ecrã no momento do report.
   * Capturado automaticamente pelo frontend.
   */
  @ApiPropertyOptional({
    description: 'Resolução do ecrã',
    example: '1920x1080',
  })
  @IsOptional()
  @IsString()
  screenResolution?: string;

  /**
   * Contexto técnico completo (JSON com browser, OS, conexão, performance, etc.).
   * Capturado automaticamente pelo frontend.
   */
  @ApiPropertyOptional({
    description: 'Contexto técnico completo (JSON)',
    example: { browser: { name: 'Chrome', version: '120' }, system: { os: 'macOS' } },
  })
  @IsOptional()
  @IsObject()
  technicalContext?: Record<string, any>;

  /**
   * Logs do console capturados (erros, warnings).
   * Capturado automaticamente pelo frontend.
   */
  @ApiPropertyOptional({
    description: 'Logs do console capturados (array de erros/warnings)',
    example: [{ level: 'error', message: 'Failed to fetch', timestamp: '2024-01-01T12:00:00Z' }],
  })
  @IsOptional()
  @IsArray()
  consoleLogs?: any[];
}
