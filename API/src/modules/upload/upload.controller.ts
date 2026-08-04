/**
 * ============================================================================
 * UPLOAD CONTROLLER - Endpoints de Upload e Acesso a Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para:
 * 1. Upload de ficheiros (multipart/form-data via Multer)
 * 2. Geração de URLs temporárias para acesso seguro
 * 3. Servir ficheiros via token (público, sem JWT)
 * 4. Remoção de ficheiros
 *
 * ENDPOINTS:
 * ----------
 * POST   /api/v1/upload/:category   - Upload de ficheiro (JWT)
 * POST   /api/v1/upload/temp-url    - Gerar URL temporária (JWT)
 * GET    /api/v1/files/:token       - Servir ficheiro via token (público)
 * DELETE /api/v1/upload              - Remover ficheiro (JWT)
 *
 * SEGURANÇA:
 * ----------
 * - Upload e temp-url requerem JWT válido
 * - /files/:token NÃO requer JWT (o token é o segredo)
 * - /files/:token usa @Res() para bypass do TransformInterceptor
 *   (necessário para respostas binárias/streaming)
 * - Token inválido redireciona para página de erro
 *
 * NOTA IMPORTANTE SOBRE ORDEM DE ROTAS:
 * -------------------------------------
 * O endpoint POST /upload/temp-url DEVE vir ANTES de /upload/:category
 * porque "temp-url" poderia ser interpretado como um :category param.
 * O NestJS processa rotas na ordem em que são definidas.
 * ============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { UploadService } from './upload.service.js';
import {
  createMulterConfig,
  isValidCategory,
  VALID_CATEGORIES,
  UploadCategory,
} from './multer.config.js';
import {
  GenerateTempUrlDto,
  UploadResponseDto,
  TempUrlResponseDto,
} from './dto/upload.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ConfigService } from '@nestjs/config';

/**
 * Controller do módulo de upload.
 *
 * @ApiTags('upload') - Agrupa os endpoints na documentação Swagger
 * @Controller() - Sem prefixo (rotas são definidas em cada método)
 */
@ApiTags('upload')
@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  // =========================================================================
  // POST /api/v1/upload/temp-url — Gerar URL temporária (JWT)
  // =========================================================================
  // NOTA: Esta rota DEVE vir antes de /upload/:category para evitar
  // que "temp-url" seja interpretado como um valor de :category.

  @ApiOperation({
    summary: 'Generate temporary file access URL',
    description:
      'Gera um token temporário para aceder a um ficheiro sem expor o caminho real. ' +
      'O token expira após o TTL configurado (default 5 min).',
  })
  @ApiResponse({
    status: 200,
    description: 'URL temporária gerada com sucesso',
    type: TempUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'filePath inválido ou ficheiro não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Tentativa de aceder a ficheiro de outro usuário',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload/temp-url')
  generateTempUrl(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateTempUrlDto,
  ): TempUrlResponseDto {
    return this.uploadService.generateToken(
      user.sub,
      user.role,
      dto.filePath,
    );
  }

  // =========================================================================
  // POST /api/v1/upload/:category — Upload de ficheiro (JWT + Multer)
  // =========================================================================

  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Faz upload de um ficheiro para o diretório do usuário. ' +
      'O ficheiro é armazenado em uploads/{userId}/{category}/{uuid}.{ext}.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ficheiro enviado com sucesso',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ficheiro inválido (tipo MIME não permitido, tamanho excedido)',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiParam({
    name: 'category',
    description: 'Categoria do upload',
    enum: VALID_CATEGORIES,
  })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterConfig(
        // NOTA: Em decorators, `this` não está disponível (avaliados em tempo de classe).
        // As variáveis UPLOAD_DIR e MAX_FILE_SIZE são validadas pelo ConfigModule no startup.
        process.env['UPLOAD_DIR'] || './uploads',
        Number(process.env['MAX_FILE_SIZE']) || 10485760,
      ),
    ),
  )
  @Post('upload/:category')
  uploadFile(
    @CurrentUser() user: JwtPayload,
    @Param('category') category: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    // Valida categoria
    if (!isValidCategory(category)) {
      throw new BadRequestException(
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      );
    }

    // Valida que o ficheiro foi recebido
    if (!file) {
      throw new BadRequestException('No file provided. Use "file" field in multipart form.');
    }

    return this.uploadService.processUpload(
      user.sub,
      file,
      category as UploadCategory,
    );
  }

  // =========================================================================
  // GET /api/v1/files/:token — Servir ficheiro via token (PÚBLICO)
  // =========================================================================
  // Este endpoint NÃO requer JWT. O token UUID é o segredo.
  // Usa @Res() para bypass do TransformInterceptor (resposta binária).

  @ApiOperation({
    summary: 'Serve a file via temporary token',
    description:
      'Serve um ficheiro usando um token temporário. ' +
      'Não requer autenticação JWT — o token é o segredo. ' +
      'Se o token for inválido ou expirado, redireciona para a página de erro.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token temporário gerado pelo endpoint POST /upload/temp-url',
  })
  @ApiResponse({
    status: 200,
    description: 'Ficheiro servido com sucesso (binário)',
  })
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // Máximo 30 acessos a ficheiros por minuto por IP
  @Get('files/:token')
  serveFile(@Param('token') token: string, @Res() res: Response): void {
    const fileData = this.uploadService.resolveToken(token);

    if (!fileData) {
      // Token inválido ou expirado → redireciona para página de erro
      this.logger.warn(`Invalid/expired token requested: ${token}`);
      res.redirect(
        302,
        '/error?msg=Link+expirado+ou+inv%C3%A1lido',
      );
      return;
    }

    // Define headers para streaming correto do ficheiro
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Length', fileData.size);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileData.originalName)}"`,
    );
    // Cache-Control: private + no-store previne caching do browser/proxy
    res.setHeader('Cache-Control', 'private, no-store');

    // Stream do ficheiro → response
    fileData.stream.on('error', (err) => {
      this.logger.error(`Error streaming file: ${err.message}`);
      if (!res.headersSent) {
        res.redirect(302, '/error?msg=Erro+ao+carregar+ficheiro');
      }
    });

    fileData.stream.pipe(res);
  }

  // =========================================================================
  // DELETE /api/v1/upload — Remover ficheiro (JWT)
  // =========================================================================

  @ApiOperation({
    summary: 'Delete a file',
    description: 'Remove um ficheiro do disco. Requer JWT e ownership do ficheiro.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ficheiro removido com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Tentativa de apagar ficheiro de outro usuário',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('upload')
  deleteFile(
    @CurrentUser() user: JwtPayload,
    @Body('filePath') filePath: string,
  ): Promise<{ message: string }> {
    if (!filePath) {
      throw new BadRequestException('filePath is required');
    }

    return this.uploadService
      .deleteFile(user.sub, user.role, filePath)
      .then(() => ({ message: 'File deleted successfully' }));
  }
}
