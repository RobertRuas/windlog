/**
 * ============================================================================
 * UPLOAD CONTROLLER - Endpoints de Upload de Ficheiros
 * ============================================================================
 *
 * ENDPOINTS:
 * ----------
 * POST   /api/v1/upload              - Upload de ficheiro (multipart/form-data)
 * GET    /api/v1/upload              - Listar ficheiros do usuário
 * GET    /api/v1/upload/:id          - Buscar informações do ficheiro
 * GET    /api/v1/upload/:id/file     - Download seguro (StreamableFile)
 * DELETE /api/v1/upload/:id          - Remover ficheiro
 *
 * SEGURANÇA:
 * ----------
 * Todos os endpoints usam AuthGuard('jwt') padrão do NestJS.
 * O download verifica se o usuário é proprietário ou ADMIN.
 * ============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { UploadService, type FileCategory } from './upload.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Controller do módulo de upload.
 */
@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/v1/upload
   * Upload de ficheiro (multipart/form-data). Máx 3 MB.
   */
  @ApiOperation({ summary: 'Upload de ficheiro' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ficheiro uploadado com sucesso' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Ficheiro inválido' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['avatar', 'document', 'certification', 'bank', 'other'],
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
  ) {
    const validCategories: FileCategory[] = ['avatar', 'document', 'certification', 'bank', 'other'];
    const fileCategory: FileCategory = validCategories.includes(category as FileCategory)
      ? (category as FileCategory)
      : 'other';

    return this.uploadService.uploadFile(file, user.sub, fileCategory);
  }

  /**
   * GET /api/v1/upload
   * Lista ficheiros do usuário autenticado.
   */
  @ApiOperation({ summary: 'Listar ficheiros do usuário' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['avatar', 'document', 'certification', 'bank', 'other'],
  })
  @Get()
  async getUserFiles(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
  ) {
    const validCategories: FileCategory[] = ['avatar', 'document', 'certification', 'bank', 'other'];
    const fileCategory: FileCategory | undefined = validCategories.includes(category as FileCategory)
      ? (category as FileCategory)
      : undefined;

    return this.uploadService.getUserFiles(user.sub, fileCategory);
  }

  /**
   * GET /api/v1/upload/:id/file
   *
   * Download seguro de um ficheiro via StreamableFile.
   * O AuthGuard('jwt') valida o token automaticamente.
   * Verifica se o usuário é proprietário ou ADMIN.
   *
   * NOTA: Para <img src>, use blob URL no frontend (fetch via api autenticada).
   */
  @ApiOperation({ summary: 'Download seguro de ficheiro' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ficheiro retornado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sem permissão' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ficheiro não encontrado' })
  @Get(':id/file')
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.uploadService.downloadFile(id, user.sub, user.role);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.originalName)}"`,
      'Content-Length': String(result.size),
    });

    return result.file;
  }

  /**
   * GET /api/v1/upload/:id
   * Busca informações de um ficheiro pelo ID.
   */
  @ApiOperation({ summary: 'Buscar ficheiro por ID' })
  @Get(':id')
  async getFileById(@Param('id') id: string) {
    return this.uploadService.getFileById(id);
  }

  /**
   * DELETE /api/v1/upload/:id
   * Remove um ficheiro (físico + banco de dados).
   */
  @ApiOperation({ summary: 'Remover ficheiro' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ficheiro removido' })
  @Delete(':id')
  async removeFile(@Param('id') id: string) {
    await this.uploadService.removeFile(id);
    return { message: 'Ficheiro removido com sucesso' };
  }

  /**
   * GET /api/v1/upload/* (wildcard)
   *
   * Compatibilidade com URLs antigas que usam o path do ficheiro
   * (ex: /api/v1/upload/avatars/userId/uuid.jpg).
   * O service tenta buscar por path quando o ID não é encontrado.
   * Deve ser o último endpoint (wildcard captura tudo).
   */
  @Get('*filePath')
  async downloadByPath(
    @Param('filePath') filePath: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.uploadService.downloadFile(filePath, user.sub, user.role);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.originalName)}"`,
      'Content-Length': String(result.size),
    });

    return result.file;
  }
}
