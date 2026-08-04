/**
 * ============================================================================
 * WEEKLY TIMESHEET SERVICE - Serviço de Gestão de Timesheets Semanais
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para gestão de Weekly Timesheets.
 * Implementa CRUD completo com atualização aninhada de dias e entradas.
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Apenas Team Leader do projeto, HR ou ADMIN podem criar/editar
 * - Qualquer usuário associado ao timesheet pode visualizar
 * - Soft delete: timesheets são marcados com deletedAt, nunca removidos
 * - Ao criar, os 7 dias da semana são gerados automaticamente
 * - jobScope, client e siteName são preenchidos do projeto vinculado
 * - Suporta atualização aninhada: metadata + dias + entradas em 1 chamada
 * ============================================================================
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateTimesheetDto } from './dto/create-timesheet.dto.js';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto.js';
import { TimesheetFilterDto } from './dto/timesheet-filter.dto.js';
import { canPerformTeamLeaderAction } from '../../common/utils/index.js';

/**
 * Nomes dos dias da semana em inglês.
 * Usado para gerar automaticamente os dias ao criar um timesheet.
 */
const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * Serviço WeeklyTimesheetService - Gerencia operações CRUD de timesheets.
 */
@Injectable()
export class WeeklyTimesheetService {
  // Logger para registrar operações
  private readonly logger = new Logger(WeeklyTimesheetService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // HELPERS - Funções auxiliares internas
  // =========================================================================

  /**
   * Converte uma string de data (YYYY-MM-DD) em Date com hora 12:00 UTC.
   * Evita drift de timezone quando o frontend está em UTC negativo (ex: BRT = UTC-3).
   * Sem isso, "2026-07-27" vira "2026-07-27 00:00 UTC" = "2026-07-26 21:00 BRT"
   * e o frontend mostra dia 26 em vez de 27.
   */
  private parseDateSafe(dateStr: string): Date {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  }

  /**
   * Calcula a data de início (segunda-feira) de uma semana ISO em um dado ano.
   *
   * COMO FUNCIONA:
   * - Pega o dia 4 de janeiro do ano (sempre está na semana 1 ISO)
   * - Encontra a segunda-feira dessa semana
   * - Avança (week - 1) * 7 dias para chegar na segunda da semana desejada
   *
   * @param week - Número da semana ISO (1-53)
   * @param year - Ano (padrão: ano atual)
   * @returns Data da segunda-feira da semana ISO
   */
  private getMondayOfISOWeek(week: number, year?: number): Date {
    const y = year || new Date().getFullYear();

    // 4 de janeiro está sempre na semana 1 ISO
    const jan4 = new Date(y, 0, 4);
    // Dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
    const dayOfWeek = jan4.getDay();
    // Segunda-feira da semana 1
    const monday1 = new Date(jan4);
    monday1.setDate(jan4.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // Avança para a semana desejada
    const monday = new Date(monday1);
    monday.setDate(monday1.getDate() + (week - 1) * 7);

    return monday;
  }

  /**
   * Verifica se o usuário tem permissão para criar/editar timesheets neste projeto.
   *
   * REGRAS:
   * - ADMIN e HR: sempre podem
   * - Usuário com isTeamLeader === true: também podem
   * - Team Leader do projeto: apenas se for membro do projeto com role "Team Leader"
   *
   * @param projectId - ID do projeto
   * @param userId - ID do usuário
   * @param userRole - Role do usuário no sistema (ADMIN, HR, STANDARD)
   * @param isTeamLeader - Flag de Team Leader do usuário
   * @returns true se tem permissão
   */
  private async canManageTimesheet(
    projectId: string,
    userId: string,
    userRole: string,
    isTeamLeader: boolean,
  ): Promise<boolean> {
    // Usa o helper: ADMIN, HR ou isTeamLeader === true podem
    if (canPerformTeamLeaderAction(userRole, isTeamLeader)) return true;

    // Verifica se é Team Leader no projeto (legado)
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    return member?.role === 'Team Leader';
  }

  /**
   * Verifica se o usuário pode editar/submeter/excluir um timesheet.
   *
   * REGRAS:
   * - ADMIN e HR: sempre podem
   * - Usuário com isTeamLeader === true: também podem
   * - Criador do timesheet: pode editar seus próprios timesheets
   *
   * @param createdBy - ID do usuário que criou o timesheet
   * @param userId - ID do usuário que está tentando editar
   * @param userRole - Role do usuário
   * @param isTeamLeader - Flag de Team Leader do usuário
   * @returns true se pode editar
   */
  private canEditTimesheet(
    createdBy: string,
    userId: string,
    userRole: string,
    isTeamLeader: boolean,
  ): boolean {
    // ADMIN, HR ou isTeamLeader === true sempre podem
    if (canPerformTeamLeaderAction(userRole, isTeamLeader)) return true;
    // Apenas o criador pode editar
    return createdBy === userId;
  }

  /**
   * Busca o nome completo do usuário no banco.
   * Usado para matching por technicianName em entradas antigas (sem userId).
   */
  private async getUserFullName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  /**
   * Verifica se o usuário pode visualizar um timesheet.
   *
   * REGRAS:
   * - ADMIN e HR: sempre podem
   * - Criador do timesheet: sempre pode
   * - Técnico mencionado nas entradas (por userId OU technicianName): pode visualizar
   * - Team Leader: mesma regra do STANDARD (apenas associados ao seu nome)
   *
   * @param timesheetId - ID do timesheet
   * @param userId - ID do usuário
   * @param userRole - Role do usuário
   * @returns true se pode visualizar
   */
  async canViewTimesheet(
    timesheetId: string,
    userId: string,
    userRole: string,
  ): Promise<boolean> {
    // ADMIN e HR sempre podem
    if (userRole === 'ADMIN' || userRole === 'HR') return true;

    // Busca o timesheet para obter o createdBy
    const timesheet = await this.prisma.weeklyTimesheet.findUnique({
      where: { id: timesheetId },
      select: { createdBy: true },
    });

    if (!timesheet) return false;

    // Verifica se é o criador
    if (timesheet.createdBy === userId) return true;

    // Busca o nome completo do usuário para matching por technicianName
    const userFullName = await this.getUserFullName(userId);

    // Verifica se o usuário aparece nas entradas (por userId OU por nome)
    const entry = await this.prisma.weeklyTimesheetEntry.findFirst({
      where: {
        day: { timesheetId },
        OR: [
          { userId },
          ...(userFullName ? [{ technicianName: userFullName }] : []),
        ],
      },
    });

    return !!entry;
  }

  // =========================================================================
  // CRUD - Operações principais
  // =========================================================================

  /**
   * Cria um novo Weekly Timesheet.
   *
   * PASSO A PASSO:
   * 1. Busca o projeto vinculado e valida existência
   * 2. Verifica permissão do usuário (Team Leader, HR ou ADMIN)
   * 3. Verifica se já existe timesheet para o mesmo projeto + semana
   * 4. Cria o timesheet com dados do projeto (client, siteName, jobScope)
   * 5. Gera os 7 dias da semana automaticamente (Segunda a Domingo)
   * 6. Retorna o timesheet completo
   *
   * @param dto - Dados para criação (CreateTimesheetDto)
   * @param userId - ID do usuário criador
   * @param userRole - Role do usuário no sistema
   * @returns Timesheet criado com dias e entradas
   */
  async create(dto: CreateTimesheetDto, userId: string, userRole: string) {
    // PASSO 1: Busca o projeto vinculado
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // PASSO 1.5: Busca o flag isTeamLeader do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTeamLeader: true },
    });
    const isTeamLeader = user?.isTeamLeader ?? false;

    // PASSO 2: Verifica permissão
    const canManage = await this.canManageTimesheet(
      dto.projectId,
      userId,
      userRole,
      isTeamLeader,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'Only Team Leaders, HR, or Admin can create timesheets for this project',
      );
    }

    // PASSO 3: Verifica duplicidade (mesmo projeto + semana)
    const existing = await this.prisma.weeklyTimesheet.findFirst({
      where: {
        projectId: dto.projectId,
        week: dto.week,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `A timesheet for week ${dto.week} already exists in this project`,
      );
    }

    // PASSO 4: Cria o timesheet com dados do projeto
    const weekNum = parseInt(dto.week, 10);

    // Calcula o ano atual e encontra as datas da semana
    const monday = this.getMondayOfISOWeek(weekNum);

    const timesheet = await this.prisma.weeklyTimesheet.create({
      data: {
        projectId: dto.projectId,
        week: dto.week,
        jobNumber: dto.jobNumber,
        teamNo: dto.teamNo,
        // Preenche automaticamente do projeto
        jobScope: project.scope,
        client: project.client,
        siteName: project.name,
        createdBy: userId,
        status: 'DRAFT',
      },
    });

    // PASSO 5: Gera os 7 dias da semana (Segunda a Domingo) com 1 entrada vazia cada
    // Usa 12:00 UTC para evitar drift de timezone quando Prisma converte para UTC
    // (ex: 00:00 BRT = 03:00 UTC do dia anterior → dia errado no frontend)
    const daysData = DAY_NAMES.map((dayName, index) => {
      const date = new Date(
        Date.UTC(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + index,
          12, 0, 0, 0, // 12:00 UTC — seguro contra qualquer timezone
        ),
      );

      return {
        timesheetId: timesheet.id,
        date,
        dayName,
        sortOrder: index,
        progress: '',
      };
    });

    // Cria os 7 dias no banco + 1 entrada vazia por dia
    for (const dayData of daysData) {
      const day = await this.prisma.weeklyTimesheetDay.create({ data: dayData });

      // Cria 1 entrada vazia para o técnico poder começar a preencher
      await this.prisma.weeklyTimesheetEntry.create({
        data: {
          dayId: day.id,
          technicianName: '',
          sortOrder: 0,
        },
      });
    }

    this.logger.log(
      `Timesheet created: week ${dto.week}, project ${dto.projectId} (${timesheet.id})`,
    );

    // PASSO 6: Retorna o timesheet completo
    return this.findById(timesheet.id);
  }

  /**
   * Busca um timesheet pelo ID com todas as relações (dias, entradas, projeto, criador).
   *
   * @param id - ID do timesheet
   * @returns Timesheet completo com relações
   * @throws NotFoundException se não existir
   */
  async findById(id: string) {
    const timesheet = await this.prisma.weeklyTimesheet.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: true,
            location: true,
            scope: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        days: {
          orderBy: { sortOrder: 'asc' },
          include: {
            entries: {
              orderBy: { sortOrder: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet;
  }

  /**
   * Lista timesheets com paginação e filtros.
   *
   * @param filter - Filtros (projeto, semana, status, criador)
   * @param userId - ID do usuário logado (para controle de acesso)
   * @param userRole - Role do usuário (para controle de acesso)
   * @returns Lista paginada de timesheets com total
   */
  async findAll(filter: TimesheetFilterDto, userId: string, userRole: string) {
    const { projectId, week, status, createdBy, page = 1, limit = 10 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = { deletedAt: null };

    if (projectId) where.projectId = projectId;
    if (week) where.week = week;
    if (status) where.status = status;
    if (createdBy) where.createdBy = createdBy;

    // Busca o nome completo do usuário para matching por technicianName
    const userFullName =
      userRole !== 'ADMIN' && userRole !== 'HR'
        ? await this.getUserFullName(userId)
        : '';

    // Para não-ADMIN/HR, filtra apenas timesheets associados ao seu nome
    if (userRole !== 'ADMIN' && userRole !== 'HR') {

      where.OR = [
        { createdBy: userId },
        {
          days: {
            some: {
              entries: {
                some: {
                  OR: [
                    { userId },
                    ...(userFullName ? [{ technicianName: userFullName }] : []),
                  ],
                },
              },
            },
          },
        },
      ];
    }

    // Busca com paginação (inclui dias/entradas para calcular totais de horas)
    const [rawData, total] = await Promise.all([
      this.prisma.weeklyTimesheet.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, client: true, location: true },
          },
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { days: true },
          },
          days: {
            select: {
              entries: {
                select: {
                  userId: true,
                  technicianName: true,
                  workingHrs: true,
                  standbyHrs: true,
                  travelHrs: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.weeklyTimesheet.count({ where }),
    ]);

    // Calcula totais de horas (trabalho, standby, viagem) por timesheet
    // Para não-ADMIN/HR, soma apenas as entradas associadas ao próprio usuário
    const data = rawData.map(({ days, ...rest }) => {
      let workingHrs = 0;
      let standbyHrs = 0;
      let travelHrs = 0;

      for (const day of days) {
        for (const entry of day.entries) {
          // Para ADMIN/HR, soma todas as entradas
          // Para demais, soma apenas entradas onde o usuário aparece
          if (userRole === 'ADMIN' || userRole === 'HR') {
            workingHrs += parseFloat(entry.workingHrs || '0') || 0;
            standbyHrs += parseFloat(entry.standbyHrs || '0') || 0;
            travelHrs += parseFloat(entry.travelHrs || '0') || 0;
          } else {
            const isOwnEntry =
              entry.userId === userId ||
              (userFullName && entry.technicianName === userFullName);
            if (isOwnEntry) {
              workingHrs += parseFloat(entry.workingHrs || '0') || 0;
              standbyHrs += parseFloat(entry.standbyHrs || '0') || 0;
              travelHrs += parseFloat(entry.travelHrs || '0') || 0;
            }
          }
        }
      }

      return {
        ...rest,
        _totals: { workingHrs, standbyHrs, travelHrs },
      };
    });

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
   * Lista todos os timesheets de um projeto específico.
   * ADMIN/HR veem tudo; demais veem apenas timesheets associados ao seu nome.
   *
   * @param projectId - ID do projeto
   * @param userId - ID do usuário logado
   * @param userRole - Role do usuário
   * @returns Lista de timesheets do projeto
   */
  async findByProject(projectId: string, userId: string, userRole: string) {
    const where: any = { projectId, deletedAt: null };

    // Para não-ADMIN/HR, filtra apenas timesheets associados ao seu nome
    if (userRole !== 'ADMIN' && userRole !== 'HR') {
      // Busca o nome completo do usuário para matching por technicianName
      const userFullName = await this.getUserFullName(userId);

      where.OR = [
        { createdBy: userId },
        {
          days: {
            some: {
              entries: {
                some: {
                  OR: [
                    { userId },
                    ...(userFullName ? [{ technicianName: userFullName }] : []),
                  ],
                },
              },
            },
          },
        },
      ];
    }

    return this.prisma.weeklyTimesheet.findMany({
      where,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { days: true } },
      },
      orderBy: { week: 'desc' },
    });
  }

  /**
   * Atualiza um timesheet existente (metadata + dias + entradas).
   *
   * PASSO A PASSO:
   * 1. Busca o timesheet e verifica se existe
   * 2. Verifica permissão do usuário
   * 3. Atualiza a metadata (jobNumber, teamNo, assinaturas, etc.)
   * 4. Processa dias e entradas (cria, atualiza ou remove)
   * 5. Retorna o timesheet atualizado
   *
   * ATUALIZAÇÃO ANINHADA:
   * - Dias com ID: atualiza
   * - Dias sem ID: cria novo
   * - Entradas com ID: atualiza
   * - Entradas sem ID: cria nova
   * - Entradas que existiam mas não vieram: remove
   *
   * @param id - ID do timesheet
   * @param dto - Dados para atualização (UpdateTimesheetDto)
   * @param userId - ID do usuário que está atualizando
   * @param userRole - Role do usuário
   * @returns Timesheet atualizado
   */
  async update(
    id: string,
    dto: UpdateTimesheetDto,
    userId: string,
    userRole: string,
  ) {
    // PASSO 1: Busca o timesheet
    const timesheet = await this.prisma.weeklyTimesheet.findFirst({
      where: { id, deletedAt: null },
      include: { days: { include: { entries: true } } },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Busca o flag isTeamLeader do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTeamLeader: true },
    });
    const isTeamLeader = user?.isTeamLeader ?? false;

    // PASSO 2: Verifica permissão (apenas o criador ou ADMIN/HR/TeamLeader podem editar)
    const canEdit = this.canEditTimesheet(timesheet.createdBy, userId, userRole, isTeamLeader);

    if (!canEdit) {
      throw new ForbiddenException(
        'Only the creator of this timesheet can edit it',
      );
    }

    // PASSO 3: Atualiza a metadata do timesheet
    const metadataUpdate: any = {};

    if (dto.jobNumber !== undefined) metadataUpdate.jobNumber = dto.jobNumber;
    if (dto.week !== undefined) metadataUpdate.week = dto.week;
    if (dto.teamNo !== undefined) metadataUpdate.teamNo = dto.teamNo;
    if (dto.jobScope !== undefined) metadataUpdate.jobScope = dto.jobScope;
    if (dto.client !== undefined) metadataUpdate.client = dto.client;
    if (dto.siteName !== undefined) metadataUpdate.siteName = dto.siteName;

    // Assinaturas
    if (dto.technicianName !== undefined)
      metadataUpdate.technicianName = dto.technicianName;
    if (dto.technicianSignature !== undefined)
      metadataUpdate.technicianSignature = dto.technicianSignature;
    if (dto.technicianDate !== undefined)
      metadataUpdate.technicianDate = new Date(dto.technicianDate);
    if (dto.clientName !== undefined)
      metadataUpdate.clientName = dto.clientName;
    if (dto.clientSignature !== undefined)
      metadataUpdate.clientSignature = dto.clientSignature;
    if (dto.clientDate !== undefined)
      metadataUpdate.clientDate = new Date(dto.clientDate);

    // Aplica atualização da metadata
    if (Object.keys(metadataUpdate).length > 0) {
      await this.prisma.weeklyTimesheet.update({
        where: { id },
        data: metadataUpdate,
      });
    }

    // PASSO 4: Processa dias e entradas (atualização aninhada)
    if (dto.days && dto.days.length > 0) {
      // IDs dos dias existentes no banco
      const existingDayIds = timesheet.days.map((d) => d.id);
      // IDs dos dias que vieram na requisição
      const incomingDayIds = dto.days
        .filter((d) => d.id)
        .map((d) => d.id as string);

      // Remove dias que não vieram na requisição
      const daysToRemove = existingDayIds.filter(
        (id) => !incomingDayIds.includes(id),
      );

      if (daysToRemove.length > 0) {
        await this.prisma.weeklyTimesheetDay.deleteMany({
          where: { id: { in: daysToRemove } },
        });
      }

      // Processa cada dia
      for (const dayDto of dto.days) {
        if (dayDto.id) {
          // Atualiza dia existente
          await this.prisma.weeklyTimesheetDay.update({
            where: { id: dayDto.id },
            data: {
              date: dayDto.date ? this.parseDateSafe(dayDto.date) : undefined,
              dayName: dayDto.dayName,
              progress: dayDto.progress,
              sortOrder: dayDto.sortOrder,
              sharedValues: dayDto.sharedValues ?? undefined,
            },
          });

          // Processa entradas do dia
          if (dayDto.entries) {
            const existingDay = timesheet.days.find((d) => d.id === dayDto.id);
            const existingEntryIds =
              existingDay?.entries.map((e) => e.id) || [];
            const incomingEntryIds = dayDto.entries
              .filter((e) => e.id)
              .map((e) => e.id as string);

            // Remove entradas que não vieram
            const entriesToRemove = existingEntryIds.filter(
              (eid) => !incomingEntryIds.includes(eid),
            );

            if (entriesToRemove.length > 0) {
              await this.prisma.weeklyTimesheetEntry.deleteMany({
                where: { id: { in: entriesToRemove } },
              });
            }

            // Cria ou atualiza entradas
            for (const entryDto of dayDto.entries) {
              if (entryDto.id) {
                // Atualiza entrada existente
                await this.prisma.weeklyTimesheetEntry.update({
                  where: { id: entryDto.id },
                  data: {
                    userId: entryDto.userId || null,
                    technicianName: entryDto.technicianName,
                    role: entryDto.role,
                    localTurbineNo: entryDto.localTurbineNo,
                    turbineIdNo: entryDto.turbineIdNo,
                    towerNo: entryDto.towerNo,
                    bladeNo: entryDto.bladeNo,
                    standbyHrs: entryDto.standbyHrs,
                    workingHrs: entryDto.workingHrs,
                    travelHrs: entryDto.travelHrs,
                    downtimeHrs: entryDto.downtimeHrs,
                    standbyReason: entryDto.standbyReason,
                    sortOrder: entryDto.sortOrder,
                  },
                });
              } else {
                // Cria nova entrada
                await this.prisma.weeklyTimesheetEntry.create({
                  data: {
                    dayId: dayDto.id!,
                    userId: entryDto.userId || null,
                    technicianName: entryDto.technicianName || '',
                    role: entryDto.role,
                    localTurbineNo: entryDto.localTurbineNo,
                    turbineIdNo: entryDto.turbineIdNo,
                    towerNo: entryDto.towerNo,
                    bladeNo: entryDto.bladeNo,
                    standbyHrs: entryDto.standbyHrs,
                    workingHrs: entryDto.workingHrs,
                    travelHrs: entryDto.travelHrs,
                    downtimeHrs: entryDto.downtimeHrs,
                    standbyReason: entryDto.standbyReason,
                    sortOrder: entryDto.sortOrder || 0,
                  },
                });
              }
            }
          }
        } else {
          // Cria novo dia com suas entradas
          const newDay = await this.prisma.weeklyTimesheetDay.create({
            data: {
              timesheetId: id,
              date: this.parseDateSafe(dayDto.date!),
              dayName: dayDto.dayName || '',
              progress: dayDto.progress,
              sortOrder: dayDto.sortOrder || 0,
              sharedValues: dayDto.sharedValues ?? undefined,
            },
          });

          // Cria as entradas do novo dia
          if (dayDto.entries) {
            for (const entryDto of dayDto.entries) {
              await this.prisma.weeklyTimesheetEntry.create({
                data: {
                  dayId: newDay.id,
                  userId: entryDto.userId || null,
                  technicianName: entryDto.technicianName || '',
                  role: entryDto.role,
                  localTurbineNo: entryDto.localTurbineNo,
                  turbineIdNo: entryDto.turbineIdNo,
                  towerNo: entryDto.towerNo,
                  bladeNo: entryDto.bladeNo,
                  standbyHrs: entryDto.standbyHrs,
                  workingHrs: entryDto.workingHrs,
                  travelHrs: entryDto.travelHrs,
                  downtimeHrs: entryDto.downtimeHrs,
                  standbyReason: entryDto.standbyReason,
                  sortOrder: entryDto.sortOrder || 0,
                },
              });
            }
          }
        }
      }
    }

    this.logger.log(`Timesheet updated: ${id}`);

    // PASSO 5: Retorna o timesheet atualizado
    return this.findById(id);
  }

  /**
   * Submete um timesheet (muda status de DRAFT para SUBMITTED).
   *
   * @param id - ID do timesheet
   * @param userId - ID do usuário
   * @param userRole - Role do usuário
   * @returns Timesheet com status atualizado
   */
  async submit(id: string, userId: string, userRole: string) {
    const timesheet = await this.prisma.weeklyTimesheet.findFirst({
      where: { id, deletedAt: null },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Busca o flag isTeamLeader do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTeamLeader: true },
    });
    const isTeamLeader = user?.isTeamLeader ?? false;

    // Apenas o criador ou ADMIN/HR/TeamLeader podem submeter
    const canEdit = this.canEditTimesheet(timesheet.createdBy, userId, userRole, isTeamLeader);

    if (!canEdit) {
      throw new ForbiddenException(
        'Only the creator of this timesheet can submit it',
      );
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only DRAFT timesheets can be submitted',
      );
    }

    await this.prisma.weeklyTimesheet.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    this.logger.log(`Timesheet submitted: ${id}`);

    return this.findById(id);
  }

  /**
   * Remove um timesheet (soft delete).
   *
   * @param id - ID do timesheet
   * @param userId - ID do usuário
   * @param userRole - Role do usuário
   */
  async remove(id: string, userId: string, userRole: string) {
    const timesheet = await this.prisma.weeklyTimesheet.findFirst({
      where: { id, deletedAt: null },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Busca o flag isTeamLeader do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isTeamLeader: true },
    });
    const isTeamLeader = user?.isTeamLeader ?? false;

    // Apenas o criador ou ADMIN/HR/TeamLeader podem excluir
    const canEdit = this.canEditTimesheet(timesheet.createdBy, userId, userRole, isTeamLeader);

    if (!canEdit) {
      throw new ForbiddenException(
        'Only the creator of this timesheet can delete it',
      );
    }

    // Soft delete: marca a data de exclusão
    await this.prisma.weeklyTimesheet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Timesheet soft-deleted: ${id}`);

    return { message: 'Timesheet deleted successfully' };
  }
}
