/**
 * ============================================================================
 * DOCUMENTS CONTROLLER - Endpoints de Gestão de Documentos Gerados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para gerenciar documentos gerados a partir
 * de templates HTML/SVG padronizados. Todos os endpoints são protegidos
 * e requerem autenticação JWT.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/documents              - Lista documentos (paginado)
 * GET    /api/v1/documents/templates    - Lista templates disponíveis
 * GET    /api/v1/documents/:id          - Busca documento completo
 * POST   /api/v1/documents              - Cria novo documento
 * PUT    /api/v1/documents/:id          - Atualiza documento (nova versão)
 * DELETE /api/v1/documents/:id          - Remove documento (soft delete)
 * POST   /api/v1/documents/:id/sign     - Assina documento
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem autenticação (JWT)
 * - Criação: qualquer usuário autenticado
 * - Edição/Exclusão: apenas o criador ou ADMIN/HR
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { DocumentsService } from './documents.service.js';
import { CreateGeneratedDocumentDto } from './dto/create-document.dto.js';
import { UpdateGeneratedDocumentDto } from './dto/update-document.dto.js';
import { DocumentFilterDto } from './dto/document-filter.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Controller DocumentsController - Endpoints de Documentos Gerados.
 *
 * Protegido por JWT — o usuário precisa estar autenticado.
 * O controle de permissão (criador ou ADMIN/HR) é feito no service.
 */
@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // =========================================================================
  // TEMPLATES - GET /documents/templates
  // =========================================================================

  /**
   * Lista templates disponíveis para geração de documentos.
   *
   * NOTA: Esta rota deve vir ANTES da rota com :id para evitar conflito.
   * O NestJS processa rotas na ordem em que são definidas.
   */
  @Get('templates')
  @ApiOperation({ summary: 'Listar templates disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  async getTemplates() {
    return this.documentsService.getTemplates();
  }

  /**
   * Retorna o HTML cru do template SVG para renderização no frontend.
   * Usado pelo DocumentPreviewModal para gerar o PDF.
   *
   * NOTA: Esta rota deve vir ANTES da rota com :id para evitar conflito.
   */
  @Get('templates/:templateId/html')
  @ApiOperation({ summary: 'Obter HTML do template' })
  @ApiResponse({ status: 200, description: 'HTML do template' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async getTemplateHtml(
    @Param('templateId') templateId: string,
    @Res() res: any,
  ) {
    const html = await this.documentsService.getTemplateHtml(templateId);
    if (!html) {
      throw new NotFoundException('Template not found');
    }
    res.type('text/html').send(html);
  }

  // =========================================================================
  // LISTAGEM - GET /documents
  // =========================================================================

  /**
   * Lista documentos com paginação e filtros.
   *
   * Qualquer usuário autenticado pode chamar este endpoint.
   * Usuários STANDARD veem apenas seus próprios documentos.
   *
   * @param filter - Filtros de busca (templateId, status, page, limit)
   * @param user - Usuário autenticado (vem do JWT)
   */
  @Get()
  @ApiOperation({ summary: 'Listar documentos com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async findAll(@Query() filter: DocumentFilterDto, @CurrentUser() user: JwtPayload) {
    return this.documentsService.findAll(filter, user.sub, user.role);
  }

  // =========================================================================
  // BUSCA POR ID - GET /documents/:id
  // =========================================================================

  /**
   * Busca um documento completo pelo ID.
   *
   * @param id - ID do documento
   * @param user - Usuário autenticado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento completo por ID' })
  @ApiResponse({ status: 200, description: 'Documento encontrado' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.documentsService.findById(id);
  }

  // =========================================================================
  // CRIAÇÃO - POST /documents
  // =========================================================================

  /**
   * Cria um novo documento gerado a partir de template.
   *
   * @param dto - Dados para criação (templateId, title, formData)
   * @param user - Usuário autenticado
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo documento' })
  @ApiResponse({ status: 201, description: 'Documento criado com sucesso' })
  async create(@Body() dto: CreateGeneratedDocumentDto, @CurrentUser() user: JwtPayload) {
    return this.documentsService.create(dto, user.sub);
  }

  // =========================================================================
  // ATUALIZAÇÃO - PUT /documents/:id
  // =========================================================================

  /**
   * Atualiza um documento existente criando uma nova versão.
   *
   * @param id - ID do documento
   * @param dto - Dados para atualização
   * @param user - Usuário autenticado
   */
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar documento (cria nova versão)' })
  @ApiResponse({ status: 200, description: 'Documento atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGeneratedDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.update(id, dto, user.sub, user.role);
  }

  // =========================================================================
  // ASSINATURA - POST /documents/:id/sign
  // =========================================================================

  /**
   * Assina um documento.
   *
   * @param id - ID do documento
   * @param body - Dados da assinatura (signatureData, signedBy)
   * @param user - Usuário autenticado
   */
  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assinar documento' })
  @ApiResponse({ status: 200, description: 'Documento assinado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para assinar' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async sign(
    @Param('id') id: string,
    @Body() body: { signatureData: string; signedBy: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.sign(
      id,
      body.signatureData,
      body.signedBy,
      user.sub,
      user.role,
    );
  }

  // =========================================================================
  // EXCLUSÃO - DELETE /documents/:id
  // =========================================================================

  /**
   * Remove um documento (soft delete).
   *
   * @param id - ID do documento
   * @param user - Usuário autenticado
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento (soft delete)' })
  @ApiResponse({ status: 200, description: 'Documento removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.documentsService.remove(id, user.sub, user.role);
  }
}
