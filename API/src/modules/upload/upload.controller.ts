/**
 * ============================================================================
 * UPLOAD CONTROLLER - Endpoints de Upload de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE CONTROLLER?
 * -------------------------
 * Define os endpoints HTTP para upload e gestão de ficheiros.
 * Todos os endpoints são PROTEGIDOS (requerem token JWT válido).
 *
 * ENDPOINTS:
 * ----------
 * POST   /api/v1/upload              - Upload de ficheiro (multipart/form-data)
 * GET    /api/v1/upload              - Listar ficheiros do usuário
 * GET    /api/v1/uploads/*           - Servir ficheiro estático (público)
 *
 * COMO FUNCIONA O UPLOAD:
 * -----------------------
 * 1. Cliente envia ficheiro via multipart/form-data (campo "file")
 * 2. Multer intercepta e valida (tamanho máx. 3 MB, tipos permitidos)
 * 3. UploadService guarda o ficheiro em API/uploads/<categoria>/
 * 4. Regista no banco de dados (modelo UploadedFile)
 * 5. Retorna URL para acesso ao ficheiro
 *
 * QUERY PARAMS (GET /upload):
 * ---------------------------
 * ?category=avatar|document|certification|bank|other
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
  Res,
  HttpStatus,
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
import * as path from 'path';
import * as fs from 'fs';

import { UploadService, type FileCategory } from './upload.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Controller do módulo de upload.
 *
 * @ApiTags('upload') - Agrupa os endpoints na documentação Swagger
 * @Controller('upload') - Prefixo da rota: /api/v1/upload/*
 */
@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/v1/upload
   *
   * Faz upload de um ficheiro para o servidor.
   * O ficheiro deve ser enviado via multipart/form-data com o campo "file".
   *
   * QUERY PARAMS:
   * - category: categoria do ficheiro (avatar, document, certification, bank, other)
   *
   * VALIDAÇÕES:
   * - Tamanho máximo: 3 MB
   * - Tipos aceitos: JPEG, PNG, WebP, PDF
   */
  @ApiOperation({
    summary: 'Upload de ficheiro',
    description:
      'Faz upload de um ficheiro para o servidor. Tamanho máximo: 3 MB. Tipos aceitos: JPEG, PNG, WebP, PDF. O parâmetro "category" define a pasta de destino.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ficheiro uploadado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ficheiro inválido (tamanho ou tipo)',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['avatar', 'document', 'certification', 'bank', 'other'],
    description: 'Categoria do ficheiro (define a pasta de destino)',
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
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
   *
   * Lista todos os ficheiros do usuário autenticado.
   * Pode filtrar por categoria via query param.
   */
  @ApiOperation({
    summary: 'Listar ficheiros do usuário',
    description: 'Retorna todos os ficheiros uploadados pelo usuário autenticado. Pode filtrar por categoria.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['avatar', 'document', 'certification', 'bank', 'other'],
    description: 'Filtrar por categoria',
  })
  @UseGuards(AuthGuard('jwt'))
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
   * GET /api/v1/upload/:id
   *
   * Busca informações de um ficheiro específico pelo ID.
   */
  @ApiOperation({
    summary: 'Buscar ficheiro por ID',
    description: 'Retorna informações de um ficheiro uploadado.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getFileById(@Param('id') id: string) {
    return this.uploadService.getFileById(id);
  }

  /**
   * DELETE /api/v1/upload/:id
   *
   * Remove um ficheiro do sistema (físico + banco de dados).
   */
  @ApiOperation({
    summary: 'Remover ficheiro',
    description: 'Remove um ficheiro do servidor e do banco de dados.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ficheiro removido com sucesso' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async removeFile(@Param('id') id: string) {
    await this.uploadService.removeFile(id);
    return { message: 'Ficheiro removido com sucesso' };
  }
}

/**
 * Controller para servir ficheiros estáticos.
 * Este endpoint é PÚBLICO (não requer autenticação).
 *
 * GET /api/v1/uploads/* - Serve qualquer ficheiro da pasta uploads/
 */
@ApiTags('uploads-static')
@Controller('uploads')
export class UploadStaticController {
  /**
   * Pasta base dos uploads.
   */
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
  }

  /**
   * GET /api/v1/uploads/*
   *
   * Serve ficheiros estáticos da pasta uploads/.
   * O caminho completo após /uploads/ é usado para localizar o ficheiro.
   *
   * Exemplo: GET /api/v1/uploads/avatars/xxx.jpg
   * → Serve: API/uploads/avatars/xxx.jpg
   */
  @Get('*')
  serveFile(@Param() params: Record<string, string>, @Res() res: Response) {
    // Extrai o caminho do ficheiro da URL
    // O params contém o caminho após /uploads/
    const filePath = Object.values(params).join('/');

    if (!filePath) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Ficheiro não encontrado' });
    }

    // Segurança: previne path traversal attacks
    const absolutePath = path.resolve(this.uploadsDir, filePath);
    if (!absolutePath.startsWith(this.uploadsDir)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Acesso negado' });
    }

    // Verifica se o ficheiro existe
    if (!fs.existsSync(absolutePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Ficheiro não encontrado' });
    }

    // Envia o ficheiro
    return res.sendFile(absolutePath);
  }
}
