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
 * GET    /api/v1/upload/:id          - Buscar ficheiro por ID
 * GET    /api/v1/upload/file/:id     - Download seguro do ficheiro (StreamableFile)
 * DELETE /api/v1/upload/:id          - Remover ficheiro
 *
 * DOWNLOAD SEGURO:
 * ----------------
 * O endpoint GET /upload/file/:id serve ficheiros via stream (StreamableFile).
 * Aceita JWT via header (Authorization: Bearer) ou query param (?token=...).
 * Valida autenticação e verifica se o usuário é proprietário ou ADMIN.
 * O caminho real do ficheiro NUNCA é exposto.
 *
 * COMO FUNCIONA O UPLOAD:
 * -----------------------
 * 1. Cliente envia ficheiro via multipart/form-data (campo "file")
 * 2. Multer intercepta e valida (tamanho máx. 3 MB, tipos permitidos)
 * 3. UploadService guarda o ficheiro em API/uploads/<categoria>/
 * 4. Regista no banco de dados (modelo UploadedFile)
 * 5. Retorna URL de download por ID (/api/v1/upload/file/:id)
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
  HttpStatus,
  Res,
  Req,
  StreamableFile,
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
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { Response, Request } from 'express';

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
  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

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
   * GET /api/v1/upload/file/by-path
   *
   * Endpoint de COMPATIBILIDADE para URLs antigas que usam o caminho
   * (ex: /api/v1/uploads/avatars/userId/uuid.jpg).
   * Aceita o caminho relativo via query param ?path=...
   * Mesma segurança do downloadFile (JWT + propriedade/ADMIN).
   *
   * IMPORTANTE: Este endpoint deve vir ANTES de /file/:id
   * porque "by-path" é um segmento fixo que precisa ser
   * resolvido antes do param :id.
   */
  @ApiOperation({
    summary: 'Download por caminho (compatibilidade)',
    description:
      'Endpoint de fallback para URLs antigas. Aceita o caminho relativo do ficheiro via ?path=. Requer JWT.',
  })
  @ApiQuery({ name: 'path', required: true, description: 'Caminho relativo do ficheiro' })
  @Get('file/by-path')
  async downloadByPath(
    @Query('path') filePath: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Mesma lógica de autenticação do downloadFile
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Token não fornecido' };
    }

    const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Token inválido ou expirado' };
    }

    if (!filePath) {
      res.status(HttpStatus.BAD_REQUEST);
      return { message: 'Parâmetro path é obrigatório' };
    }

    const result = await this.uploadService.downloadFileByPath(
      filePath,
      payload.sub,
      payload.role,
    );

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.originalName)}"`,
      'Content-Length': String(result.size),
    });

    return result.file;
  }

  /**
   * GET /api/v1/upload/file/:id
   *
   * Download seguro de um ficheiro via StreamableFile.
   * Aceita JWT via header (Authorization: Bearer) ou query param (?token=...).
   * Valida autenticação e autorização (proprietário ou ADMIN).
   * O caminho real do ficheiro NUNCA é exposto.
   */
  @ApiOperation({
    summary: 'Download seguro de ficheiro',
    description:
      'Retorna o ficheiro via stream. Requer JWT (header ou query param ?token=). Valida propriedade ou role ADMIN.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ficheiro retornado com sucesso' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sem permissão para acessar' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ficheiro não encontrado' })
  @Get('file/:id')
  async downloadFile(
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extrai o token JWT: header Authorization ou query param
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Token não fornecido' };
    }

    // Valida o JWT manualmente (o AuthGuard padrão só aceita header)
    const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Token inválido ou expirado' };
    }

    // Faz o download seguro (valida propriedade/ADMIN)
    const result = await this.uploadService.downloadFile(
      id,
      payload.sub,
      payload.role,
    );

    // Define headers para o browser (tipo e nome do ficheiro)
    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.originalName)}"`,
      'Content-Length': String(result.size),
    });

    return result.file;
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
