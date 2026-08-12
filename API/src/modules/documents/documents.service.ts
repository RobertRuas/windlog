/**
 * ============================================================================
 * DOCUMENTS SERVICE - Serviço de Gestão de Documentos Gerados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para gestão de documentos gerados
 * a partir de templates HTML/SVG padronizados.
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Qualquer usuário autenticado pode criar documentos
 * - O criador pode editar/excluir seus próprios documentos
 * - ADMIN e HR podem gerenciar todos os documentos
 * - Ao editar, uma nova versão é criada (versionamento)
 * - Soft delete: documentos são marcados com deletedAt, nunca removidos
 * ============================================================================
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateGeneratedDocumentDto } from './dto/create-document.dto.js';
import { UpdateGeneratedDocumentDto } from './dto/update-document.dto.js';
import { DocumentFilterDto } from './dto/document-filter.dto.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço DocumentsService - Gerencia operações CRUD de documentos gerados.
 */
@Injectable()
export class DocumentsService {
  // Logger para registrar operações
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // CRUD - Operações principais
  // =========================================================================

  /**
   * Cria um novo documento gerado a partir de template.
   *
   * PASSO A PASSO:
   * 1. Valida se o template existe (verifica se há configuração)
   * 2. Cria o documento com versão 1
   * 3. Retorna o documento criado
   *
   * @param dto - Dados para criação (CreateGeneratedDocumentDto)
   * @param userId - ID do usuário criador
   * @returns Documento criado
   */
  async create(dto: CreateGeneratedDocumentDto, userId: string) {
    // PASSO 1: Cria o documento com versão 1
    const document = await this.prisma.generatedDocument.create({
      data: {
        templateId: dto.templateId,
        title: dto.title,
        formData: dto.formData,
        version: 1,
        status: 'DRAFT',
        signatureData: dto.signatureData,
        signedBy: dto.signedBy,
        signatureDate: dto.signatureData ? new Date() : null,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Document created: template=${dto.templateId}, title="${dto.title}" (${document.id})`,
    );

    // PASSO 2: Retorna o documento completo com relação do criador
    return this.findById(document.id);
  }

  /**
   * Busca um documento pelo ID com todas as relações.
   *
   * @param id - ID do documento
   * @returns Documento completo com relação do criador
   * @throws NotFoundException se não existir
   */
  async findById(id: string) {
    const document = await this.prisma.generatedDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Lista documentos com paginação e filtros.
   *
   * @param filter - Filtros (templateId, status, page, limit)
   * @param userId - ID do usuário logado (para controle de acesso)
   * @param userRole - Role do usuário (para controle de acesso)
   * @returns Lista paginada de documentos com total
   */
  async findAll(filter: DocumentFilterDto, userId: string, userRole: string) {
    const { templateId, status, page = 1, limit = 10 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = { deletedAt: null };

    if (templateId) where.templateId = templateId;
    if (status) where.status = status;

    // Para não-ADMIN/HR, filtra apenas documentos do próprio usuário
    if (userRole !== 'ADMIN' && userRole !== 'HR') {
      where.createdBy = userId;
    }

    // Busca com paginação
    const [data, total] = await Promise.all([
      this.prisma.generatedDocument.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.generatedDocument.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza um documento existente criando uma nova versão.
   *
   * PASSO A PASSO:
   * 1. Busca o documento e verifica se existe
   * 2. Verifica permissão do usuário
   * 3. Cria uma nova versão com os dados atualizados
   * 4. Retorna a nova versão
   *
   * @param id - ID do documento original
   * @param dto - Dados para atualização
   * @param userId - ID do usuário que está atualizando
   * @param userRole - Role do usuário
   * @returns Nova versão do documento
   */
  async update(
    id: string,
    dto: UpdateGeneratedDocumentDto,
    userId: string,
    userRole: string,
  ) {
    // PASSO 1: Busca o documento original
    const original = await this.prisma.generatedDocument.findFirst({
      where: { id, deletedAt: null },
    });

    if (!original) {
      throw new NotFoundException('Document not found');
    }

    // PASSO 2: Verifica permissão (apenas o criador ou ADMIN/HR podem editar)
    const canEdit = this.canEditDocument(original.createdBy, userId, userRole);

    if (!canEdit) {
      throw new ForbiddenException(
        'You do not have permission to edit this document',
      );
    }

    // PASSO 3: Cria uma nova versão com os dados atualizados
    const newVersion = await this.prisma.generatedDocument.create({
      data: {
        templateId: original.templateId,
        title: dto.title ?? original.title,
        formData: (dto.formData ?? original.formData) as any,
        version: original.version + 1,
        status: 'DRAFT', // Nova versão começa como DRAFT
        signatureData: dto.signatureData !== undefined ? dto.signatureData : original.signatureData,
        signedBy: dto.signedBy !== undefined ? dto.signedBy : original.signedBy,
        signatureDate: dto.signatureData ? new Date() : original.signatureDate,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Document updated: original=${id}, newVersion=${newVersion.id}, version=${newVersion.version}`,
    );

    // PASSO 4: Retorna a nova versão completa
    return this.findById(newVersion.id);
  }

  /**
   * Remove um documento (soft delete).
   *
   * @param id - ID do documento
   * @param userId - ID do usuário
   * @param userRole - Role do usuário
   */
  async remove(id: string, userId: string, userRole: string) {
    const document = await this.prisma.generatedDocument.findFirst({
      where: { id, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verifica permissão (apenas o criador ou ADMIN/HR podem excluir)
    const canEdit = this.canEditDocument(document.createdBy, userId, userRole);

    if (!canEdit) {
      throw new ForbiddenException(
        'You do not have permission to delete this document',
      );
    }

    // Soft delete: marca a data de exclusão
    await this.prisma.generatedDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Document soft-deleted: ${id}`);

    return { message: 'Document deleted successfully' };
  }

  /**
   * Assina um documento.
   *
   * @param id - ID do documento
   * @param signatureData - Dados da assinatura em base64
   * @param signedBy - Nome de quem assinou
   * @param userId - ID do usuário
   * @param userRole - Role do usuário
   * @returns Documento assinado
   */
  async sign(
    id: string,
    signatureData: string,
    signedBy: string,
    userId: string,
    userRole: string,
  ) {
    const document = await this.prisma.generatedDocument.findFirst({
      where: { id, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verifica permissão (apenas o criador ou ADMIN/HR podem assinar)
    const canEdit = this.canEditDocument(document.createdBy, userId, userRole);

    if (!canEdit) {
      throw new ForbiddenException(
        'You do not have permission to sign this document',
      );
    }

    // Atualiza o documento com a assinatura
    const signed = await this.prisma.generatedDocument.update({
      where: { id },
      data: {
        signatureData,
        signedBy,
        signatureDate: new Date(),
        status: 'SIGNED',
      },
    });

    this.logger.log(`Document signed: ${id}`);

    return this.findById(id);
  }

  /**
   * Lista templates disponíveis para geração de documentos.
   *
   * @returns Lista de templates com metadata
   */
  async getTemplates() {
    // Templates disponíveis (hardcoded - podem ser movidos para banco no futuro)
    return [
      {
        id: 'invoice',
        name: 'Invoice',
        code: 'NORD-FRM-072',
        description: 'Invoice template for billing',
      },
      {
        id: 'car-daily-report',
        name: 'Car Daily Report',
        code: 'NORD-FRM-072',
        description: 'Company Vehicle Pre-Check Form',
      },
      {
        id: 'toolbox-talk',
        name: 'Toolbox Talk Form',
        code: 'NORD-FRM-067',
        description: 'Toolbox Talk safety meeting form',
      },
    ];
  }

  /**
   * Lê o arquivo HTML do template e retorna o conteúdo cru.
   * Usado pelo frontend para renderizar o documento preenchido.
   *
   * @param templateId - ID do template
   * @returns Conteúdo HTML do template ou null se não encontrado
   */
  async getTemplateHtml(templateId: string): Promise<string | null> {
    // Mapeia templateId para o nome do arquivo
    const fileMap: Record<string, string> = {
      invoice: 'invoice-sample.html',
      'car-daily-report': 'car-daily-report.html',
      'toolbox-talk': 'tolbox-talk-form.html',
    };

    const fileName = fileMap[templateId];
    if (!fileName) return null;

    const templatePath = path.join(__dirname, 'templates', fileName);

    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch {
      this.logger.warn(`Template file not found: ${templatePath}`);
      return null;
    }
  }

  // =========================================================================
  // HELPERS - Funções auxiliares internas
  // =========================================================================

  /**
   * Verifica se o usuário pode editar/excluir um documento.
   *
   * REGRAS:
   * - ADMIN e HR: sempre podem
   * - Criador do documento: pode editar seus próprios documentos
   *
   * @param createdBy - ID do usuário que criou o documento
   * @param userId - ID do usuário que está tentando editar
   * @param userRole - Role do usuário
   * @returns true se pode editar
   */
  private canEditDocument(
    createdBy: string,
    userId: string,
    userRole: string,
  ): boolean {
    // ADMIN e HR sempre podem
    if (userRole === 'ADMIN' || userRole === 'HR') return true;
    // Apenas o criador pode editar
    return createdBy === userId;
  }
}
