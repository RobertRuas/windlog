/**
 * ============================================================================
 * PROJECTS SERVICE - Serviço de Gestão de Projetos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para gestão de projetos do sistema.
 * Implementa CRUD completo com soft delete e validações.
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Apenas ADMIN e HR podem gerenciar projetos
 * - Soft delete: projetos são desativados, nunca removidos
 * - Nome do projeto deve ser único
 * - Logs de auditoria para todas as ações importantes
 * - Turbinas e membros são gerenciados separadamente
 * ============================================================================
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilterDto,
  CreateTurbineDto,
  UpdateTurbineDto,
  AddMemberDto,
} from './dto/projects.dto.js';

/**
 * Serviço ProjectsService - Gerencia operações CRUD de projetos.
 */
@Injectable()
export class ProjectsService {
  // Logger para registrar operações de gestão de projetos
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // PROJECT CRUD
  // =========================================================================

  /**
   * Cria um novo projeto no sistema.
   *
   * PASSO A PASSO:
   * 1. Verifica se já existe projeto com o mesmo nome
   * 2. Cria o projeto no banco
   * 3. Retorna os dados do projeto criado
   *
   * @param dto - Dados do projeto (CreateProjectDto)
   * @returns Promise com o projeto criado
   * @throws ConflictException se o nome já estiver em uso
   */
  async createProject(dto: CreateProjectDto) {
    // PASSO 1: Verifica se já existe projeto com o mesmo nome
    const existing = await this.prisma.project.findFirst({
      where: { name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Project with this name already exists');
    }

    // PASSO 2: Cria o projeto no banco
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        client: dto.client,
        location: dto.location,
        scope: dto.scope,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        status: dto.status || 'PLANNING',
      },
    });

    // Registra a operação no log
    this.logger.log(`Project created: ${project.name} (${project.id})`);

    return project;
  }

  /**
   * Lista todos os projetos com paginação e filtros.
   *
   * @param filter - Filtros de busca (ProjectFilterDto)
   * @returns Promise com projetos paginados e total
   */
  async findAllProjects(filter: ProjectFilterDto) {
    const { search, status, page = 1, limit = 10 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = { deletedAt: null };

    // Busca por nome ou cliente
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por status
    if (status) where.status = status;

    // Calcula offset para paginação
    const skip = (page - 1) * limit;

    // Executa consultas em paralelo
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { turbines: { where: { deletedAt: null } }, members: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Busca um projeto específico por ID.
   * Inclui turbinas e membros associados.
   *
   * @param id - ID do projeto
   * @returns Promise com os dados completos do projeto
   * @throws NotFoundException se o projeto não existir
   */
  async findProjectById(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        turbines: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Atualiza os dados de um projeto.
   *
   * PASSO A PASSO:
   * 1. Verifica se o projeto existe
   * 2. Se nome mudou, verifica se não está em uso
   * 3. Atualiza apenas os campos fornecidos
   *
   * @param id - ID do projeto
   * @param dto - Dados a atualizar (UpdateProjectDto)
   * @returns Promise com o projeto atualizado
   * @throws NotFoundException se o projeto não existir
   * @throws ConflictException se o novo nome já estiver em uso
   */
  async updateProject(id: string, dto: UpdateProjectDto) {
    // PASSO 1: Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // PASSO 2: Se nome mudou, verifica se não está em uso
    if (dto.name && dto.name !== project.name) {
      const existing = await this.prisma.project.findFirst({
        where: { name: dto.name, deletedAt: null },
      });

      if (existing) {
        throw new ConflictException('Project with this name already exists');
      }
    }

    // PASSO 3: Prepara os dados para atualização
    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.client !== undefined) updateData.client = dto.client;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.scope !== undefined) updateData.scope = dto.scope;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.status !== undefined) updateData.status = dto.status;

    // Atualiza o projeto no banco
    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Registra a operação no log
    this.logger.log(`Project updated: ${updatedProject.name} (${updatedProject.id})`);

    return updatedProject;
  }

  /**
   * Remove um projeto (soft delete).
   * Marca o projeto como deletado em vez de remover do banco.
   *
   * @param id - ID do projeto
   * @returns Promise com o projeto desativado
   * @throws NotFoundException se o projeto não existir
   */
  async removeProject(id: string) {
    // Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Soft delete: marca deletedAt
    const deletedProject = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Registra a operação no log
    this.logger.log(`Project deleted: ${deletedProject.name} (${deletedProject.id})`);

    return deletedProject;
  }

  // =========================================================================
  // TURBINE CRUD
  // =========================================================================

  /**
   * Adiciona uma turbina a um projeto.
   *
   * @param projectId - ID do projeto
   * @param dto - Dados da turbina (CreateTurbineDto)
   * @returns Promise com a turbina criada
   * @throws NotFoundException se o projeto não existir
   */
  async createTurbine(projectId: string, dto: CreateTurbineDto) {
    // Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Cria a turbina no banco
    const turbine = await this.prisma.projectTurbine.create({
      data: {
        projectId,
        name: dto.name,
        location: dto.location,
        manufacturer: dto.manufacturer,
        model: dto.model,
        nacelleHeight: dto.nacelleHeight,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status || 'OPERATIONAL',
      },
    });

    this.logger.log(`Turbine created: ${turbine.name} in project ${projectId}`);

    return turbine;
  }

  /**
   * Lista todas as turbinas de um projeto.
   *
   * @param projectId - ID do projeto
   * @returns Promise com lista de turbinas
   */
  async findTurbinesByProject(projectId: string) {
    // Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.projectTurbine.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Atualiza uma turbina de um projeto.
   *
   * @param projectId - ID do projeto
   * @param turbineId - ID da turbina
   * @param dto - Dados a atualizar (UpdateTurbineDto)
   * @returns Promise com a turbina atualizada
   * @throws NotFoundException se a turbina não existir
   */
  async updateTurbine(projectId: string, turbineId: string, dto: UpdateTurbineDto) {
    // Verifica se a turbina existe e pertence ao projeto
    const turbine = await this.prisma.projectTurbine.findFirst({
      where: { id: turbineId, projectId, deletedAt: null },
    });

    if (!turbine) {
      throw new NotFoundException('Turbine not found');
    }

    // Prepara os dados para atualização
    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.manufacturer !== undefined) updateData.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.nacelleHeight !== undefined) updateData.nacelleHeight = dto.nacelleHeight;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.status !== undefined) updateData.status = dto.status;

    const updatedTurbine = await this.prisma.projectTurbine.update({
      where: { id: turbineId },
      data: updateData,
    });

    this.logger.log(`Turbine updated: ${updatedTurbine.name} (${updatedTurbine.id})`);

    return updatedTurbine;
  }

  /**
   * Remove uma turbina (soft delete).
   *
   * @param projectId - ID do projeto
   * @param turbineId - ID da turbina
   * @returns Promise void
   * @throws NotFoundException se a turbina não existir
   */
  async removeTurbine(projectId: string, turbineId: string) {
    // Verifica se a turbina existe e pertence ao projeto
    const turbine = await this.prisma.projectTurbine.findFirst({
      where: { id: turbineId, projectId, deletedAt: null },
    });

    if (!turbine) {
      throw new NotFoundException('Turbine not found');
    }

    // Soft delete
    await this.prisma.projectTurbine.update({
      where: { id: turbineId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Turbine deleted: ${turbine.name} (${turbine.id})`);
  }

  // =========================================================================
  // MEMBER MANAGEMENT
  // =========================================================================

  /**
   * Adiciona um membro (usuário) a um projeto.
   *
   * @param projectId - ID do projeto
   * @param dto - Dados do membro (AddMemberDto)
   * @returns Promise com o membro criado
   * @throws NotFoundException se o projeto ou usuário não existir
   * @throws ConflictException se o usuário já estiver no projeto
   */
  async addMember(projectId: string, dto: AddMemberDto) {
    // Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verifica se o usuário existe
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verifica se o usuário já é membro do projeto
    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    // Cria a associação
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`Member added: user ${dto.userId} to project ${projectId}`);

    return member;
  }

  /**
   * Lista todos os membros de um projeto.
   *
   * @param projectId - ID do projeto
   * @returns Promise com lista de membros (incluindo dados do usuário)
   */
  async findMembersByProject(projectId: string) {
    // Verifica se o projeto existe
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Remove um membro de um projeto.
   *
   * @param projectId - ID do projeto
   * @param memberId - ID da associação membro
   * @returns Promise void
   * @throws NotFoundException se o membro não existir
   */
  async removeMember(projectId: string, memberId: string) {
    // Verifica se o membro existe e pertence ao projeto
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    await this.prisma.projectMember.delete({
      where: { id: memberId },
    });

    this.logger.log(`Member removed: ${memberId} from project ${projectId}`);
  }
}
