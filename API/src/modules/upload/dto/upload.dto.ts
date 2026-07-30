/**
 * ============================================================================
 * UPLOAD DTOs - Data Transfer Objects do Módulo de Upload
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define as interfaces e classes de validação para os endpoints de upload.
 * Usado pelo class-validator para validar dados recebidos e pelo Swagger
 * para documentar as respostas da API.
 *
 * DTOS INCLUÍDOS:
 * ---------------
 * - GenerateTempUrlDto: corpo da requisição para gerar URL temporária
 * - UploadResponseDto: resposta após upload bem-sucedido
 * - TempUrlResponseDto: resposta com a URL temporária gerada
 * ============================================================================
 */

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para gerar uma URL temporária de acesso a um ficheiro.
 *
 * O cliente envia o filePath (caminho real no servidor) e recebe
 * um token temporário para aceder ao ficheiro sem expor o caminho real.
 */
export class GenerateTempUrlDto {
  @ApiProperty({
    description:
      'Caminho relativo do ficheiro no servidor (ex: "avatars/uuid/uuid.jpg")',
    example: '662eb747-263c-4ca6-9d09-f408c81d652f/avatars/abc-123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}

/**
 * DTO de resposta após upload bem-sucedido.
 * Contém os metadados do ficheiro armazenado.
 */
export class UploadResponseDto {
  @ApiProperty({ description: 'Caminho relativo do ficheiro no servidor' })
  filePath: string;

  @ApiProperty({ description: 'Nome original do ficheiro (como foi enviado)' })
  originalName: string;

  @ApiProperty({ description: 'Tipo MIME do ficheiro' })
  mimeType: string;

  @ApiProperty({ description: 'Tamanho do ficheiro em bytes' })
  size: number;

  @ApiProperty({ description: 'Categoria do upload' })
  category: string;
}

/**
 * DTO de resposta com a URL temporária gerada.
 */
export class TempUrlResponseDto {
  @ApiProperty({ description: 'Token temporário (UUID)' })
  token: string;

  @ApiProperty({
    description: 'URL completa para aceder ao ficheiro',
    example: '/api/v1/files/abc-123-def',
  })
  url: string;

  @ApiProperty({ description: 'Tempo de vida do token em segundos' })
  expiresIn: number;
}
