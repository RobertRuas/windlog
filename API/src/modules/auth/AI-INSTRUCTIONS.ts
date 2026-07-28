/**
 * ============================================================================
 * AI INSTRUCTION FILE — AUTH MODULE (WINDLOG API)
 * ============================================================================
 *
 * PROPÓSITO DESTE ARQUIVO
 * -----------------------
 * Este arquivo é uma referência exclusiva para modelos de inteligência
 * artificial. Ele contém instruções detalhadas sobre como o módulo de
 * autenticação funciona, como é estruturado, e como deve ser utilizado
 * como base para criar novos módulos, controllers, services e guards
 * em toda a aplicação Windlog.
 *
 * Ao criar qualquer novo recurso na aplicação, o agente de IA deve
 * consultar este arquivo para garantir consistência arquitetural,
 * padrões de código corretos e integração adequada com o sistema de
 * autenticação e autorização.
 *
 * ============================================================================
 *
 * EXPLICAÇÃO GERAL — COMO FUNCIONA O SISTEMA DE AUTENTICAÇÃO
 * ----------------------------------------------------------
 *
 * O Windlog utiliza um sistema de autenticação baseado em JWT
 * (JSON Web Token) com controle de acesso por papéis (RBAC —
 * Role-Based Access Control). Funciona assim:
 *
 * 1. REGISTRO: O frontend envia dados do usuário (email, senha,
 *    nome, sobrenome) para o endpoint POST /api/v1/auth/register.
 *    O backend valida, criptografa a senha com bcrypt, salva no
 *    banco PostgreSQL e retorna um token JWT + dados do usuário.
 *
 * 2. LOGIN: O frontend envia email e senha para POST /api/v1/auth/login.
 *    O backend busca o usuário, verifica se está ativo, compara a
 *    senha com bcrypt, e se tudo estiver correto, gera um token JWT.
 *
 * 3. TOKEN JWT: O token contém três informações (payload):
 *    - sub: ID do usuário (UUID)
 *    - email: e-mail do usuário
 *    - role: papel do usuário (TECHNICIAN, TEAM_LEADER, SUPERVISOR, ADMIN)
 *    O token é assinado com uma chave secreta (JWT_SECRET) e expira
 *    conforme configurado (JWT_EXPIRES_IN, padrão: 1 dia).
 *
 * 4. REQUISIÇÕES PROTEGIDAS: Após login, o frontend envia o token
 *    no header Authorization: Bearer <token> em todas as requisições.
 *    O backend valida o token via JwtStrategy (Passport) e injeta
 *    os dados do usuário no request.
 *
 * 5. CONTROLE DE ACESSO (RBAC): Existem 4 papéis hierárquicos:
 *    - TECHNICIAN:   Acesso básico (registro de atividades)
 *    - TEAM_LEADER:  Aprovações e gestão de equipe
 *    - SUPERVISOR:   Criar/editar projetos e gerenciar usuários
 *    - ADMIN:        Acesso completo ao sistema
 *    O decorator @Roles() combinado com o RolesGuard controla
 *    quais papéis podem acessar cada endpoint.
 *
 * 6. PERFIL: O endpoint GET /api/v1/auth/profile retorna os dados
 *    do usuário autenticado usando o token JWT.
 *
 * ============================================================================
 */

// ============================================================================
// SEÇÃO 1: ESTRUTURA DE PASTAS DO MÓDULO
// ============================================================================
//
// src/modules/auth/
// ├── dto/
// │   ├── login.dto.ts          → Validação dos dados de login
// │   └── register.dto.ts       → Validação dos dados de registro
// ├── strategies/
// │   └── jwt.strategy.ts       → Estratégia de validação do JWT (Passport)
// ├── auth.controller.ts        → Endpoints HTTP (register, login, profile)
// ├── auth.service.ts           → Lógica de negócio (hash, token, validação)
// ├── auth.module.ts            → Registro do módulo NestJS
// └── AI-INSTRUCTIONS.ts       → Este arquivo (instruções para IA)
//
// Arquivos auxiliares usados pelo auth (em src/common/):
// ├── common/decorators/
// │   ├── current-user.decorator.ts  → @CurrentUser() extrai user do request
// │   └── roles.decorator.ts         → @Roles() define papéis permitidos
// └── common/guards/
//     └── roles.guard.ts             → RolesGuard verifica permissão do role
//
// ============================================================================

// ============================================================================
// SEÇÃO 2: COMO PROTEGER UM ENDPOINT (REQUERER AUTENTICAÇÃO)
// ============================================================================
//
// Para proteger qualquer endpoint, use o AuthGuard('jwt'):
//
// ```typescript
// import { UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
//
// @UseGuards(AuthGuard('jwt'))
// @Get('alguma-rota')
// findSomething(@CurrentUser() user: JwtPayload) {
//   // user.sub   → ID do usuário
//   // user.email → e-mail do usuário
//   // user.role  → papel do usuário
//   return this.service.findAll(user.sub);
// }
// ```
//
// O fluxo interno é:
// 1. O AuthGuard('jwt') intercepta a requisição
// 2. Extrai o token do header Authorization: Bearer <token>
// 3. A JwtStrategy valida a assinatura e expiração
// 4. O payload (sub, email, role) é injetado em request.user
// 5. O @CurrentUser() extrai request.user para uso no controller
//
// SE O TOKEN FOR INVÁLIDO OU EXPIRADO:
// → Retorna 401 Unauthorized automaticamente
// → A mensagem é: "Unauthorized"
//
// ============================================================================

// ============================================================================
// SEÇÃO 3: COMO ADICIONAR CONTROLE DE ACESSO POR ROLE (RBAC)
// ============================================================================
//
// Combine @Roles() + RolesGuard + AuthGuard('jwt'):
//
// ```typescript
// import { Roles } from '../../common/decorators/roles.decorator';
// import { Role } from '../../common/decorators/roles.decorator';
// import { RolesGuard } from '../../common/guards/roles.guard';
//
// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles(Role.ADMIN, Role.SUPERVISOR)
// @Delete(':id')
// remove(@Param('id') id: string) {
//   return this.service.remove(id);
// }
// ```
//
// ORDEM DOS GUARDS (IMPORTANTE!):
// 1. AuthGuard('jwt') — valida o token (sempre primeiro)
// 2. RolesGuard       — verifica o papel (requer usuário autenticado)
//
// SE O ROLE NÃO TIVER PERMISSÃO:
// → Retorna 403 Forbidden
//
// PAPÉIS DISPONÍVEIS (enum Role):
// - Role.TECHNICIAN   → 'TECHNICIAN'
// - Role.TEAM_LEADER  → 'TEAM_LEADER'
// - Role.SUPERVISOR   → 'SUPERVISOR'
// - Role.ADMIN        → 'ADMIN'
//
// ============================================================================

// ============================================================================
// SEÇÃO 4: COMO USAR O @CurrentUser()
// ============================================================================
//
// O decorador @CurrentUser() extrai dados do usuário autenticado
// a partir do token JWT validado pelo AuthGuard.
//
// USO 1 — Obter o objeto completo do usuário:
// ```typescript
// @Get('profile')
// @UseGuards(AuthGuard('jwt'))
// getProfile(@CurrentUser() user: JwtPayload) {
//   // user = { sub: 'uuid', email: '...', role: 'ADMIN' }
//   return user;
// }
// ```
//
// USO 2 — Obter um campo específico:
// ```typescript
// @Get('my-data')
// @UseGuards(AuthGuard('jwt'))
// getMyData(@CurrentUser('sub') userId: string) {
//   // userId = 'uuid' (apenas o ID)
//   return this.service.findByUser(userId);
// }
// ```
//
// TIPO JwtPayload (definido em strategies/jwt.strategy.ts):
// ```typescript
// interface JwtPayload {
//   sub: string;    // ID do usuário
//   email: string;  // E-mail do usuário
//   role: string;   // Papel do usuário
// }
// ```
//
// IMPORTANTE:
// → @CurrentUser() SÓ funciona dentro de rotas protegidas com AuthGuard('jwt')
// → Sem o guard, request.user é undefined e @CurrentUser() retorna undefined
//
// ============================================================================

// ============================================================================
// SEÇÃO 5: COMO CRIAR UM NOVO MÓDULO QUE USA AUTENTICAÇÃO
// ============================================================================
//
// Ao criar um novo módulo (ex: ProjectsModule), siga este padrão:
//
// 1. IMPORTAR O AuthModule SE PRECISAR DO AuthService:
// ```typescript
// // projects.module.ts
// import { Module } from '@nestjs/common';
// import { AuthModule } from '../auth/auth.module';
//
// @Module({
//   imports: [AuthModule],  // Para usar AuthService
//   controllers: [ProjectsController],
//   providers: [ProjectsService, PrismaService],
// })
// export class ProjectsModule {}
// ```
//
// 2. NO CONTROLLER, USE OS GUARDS NECESSÁRIOS:
// ```typescript
// // projects.controller.ts
// @Controller('projects')
// @ApiTags('projects')
// export class ProjectsController {
//   constructor(private readonly service: ProjectsService) {}
//
//   // Endpoint PÚBLICO (sem autenticação) — raro, apenas se necessário
//   @Get('public')
//   findPublic() {
//     return this.service.findPublic();
//   }
//
//   // Endpoint PROTEGIDO (qualquer usuário autenticado)
//   @UseGuards(AuthGuard('jwt'))
//   @Get()
//   findAll(@CurrentUser() user: JwtPayload) {
//     return this.service.findAll(user.sub);
//   }
//
//   // Endpoint RESTRITO POR ROLE (apenas ADMIN e SUPERVISOR)
//   @UseGuards(AuthGuard('jwt'), RolesGuard)
//   @Roles(Role.ADMIN, Role.SUPERVISOR)
//   @Post()
//   create(@Body() dto: CreateProjectDto, @CurrentUser('sub') userId: string) {
//     return this.service.create(dto, userId);
//   }
// }
// ```
//
// 3. NO SERVICE, USE O userId PARA FILTRAR DADOS:
// ```typescript
// // projects.service.ts
// async findAll(userId: string) {
//   return this.prisma.project.findMany({
//     where: { deletedAt: null },
//   });
// }
// ```
//
// ============================================================================

// ============================================================================
// SEÇÃO 6: PADRÕES OBRIGATÓRIOS AO TRABALHAR COM AUTENTICAÇÃO
// ============================================================================
//
// 6.1. NUNCA salvar senha em texto puro
//     → Sempre usar bcrypt.hash() antes de salvar
//     → Sempre usar bcrypt.compare() para verificar
//     → SALT_ROUNDS = 10 (definido no AuthService)
//
// 6.2. NUNCA retornar a senha nas respostas da API
//     → Sempre excluir o campo 'password' do retorno
//     → O AuthService já faz isso nos métodos register, login e getProfile
//
// 6.3. MENSAGENS DE ERRO GENÉRICAS no login
//     → Usar "Invalid credentials" (não revelar se o email existe)
//     → Isso previne enumeração de usuários
//
// 6.4. SEMPRE validar dados de entrada com DTOs
//     → Usar class-validator (@IsEmail, @IsNotEmpty, @MinLength, etc.)
//     → Usar @ApiProperty para documentação Swagger
//
// 6.5. SEMPRE documentar endpoints com Swagger
//     → @ApiOperation: resumo do endpoint
//     → @ApiResponse: todas as respostas possíveis (sucesso e erro)
//     → @ApiBearerAuth: indicar que requer token JWT (em rotas protegidas)
//
// 6.6. USAR o HttpExceptionFilter global
//     → O filtro já formata todas as respostas de erro
//     → Não crie formatação customizada de erro nos controllers
//
// 6.7. USAR o TransformInterceptor global
//     → As respostas são automaticamente envelopadas em { data, message, statusCode, timestamp }
//     → Não envelopar manualmente nos controllers
//
// ============================================================================

// ============================================================================
// SEÇÃO 7: ENDPOINTS DO MÓDULO AUTH (REFERÊNCIA)
// ============================================================================
//
// POST /api/v1/auth/register
//   → PÚBLICO
//   → Body: { email, password, firstName, lastName, role? }
//   → Sucesso: 201 { data: { accessToken, user }, message: 'Success', statusCode: 201, timestamp: '...' }
//   → Erro: 409 (email já existe), 400 (dados inválidos)
//
// POST /api/v1/auth/login
//   → PÚBLICO
//   → Body: { email, password }
//   → Sucesso: 200 { data: { accessToken, user }, message: 'Success', statusCode: 200, timestamp: '...' }
//   → Erro: 401 (credenciais inválidas), 400 (dados inválidos)
//
// GET /api/v1/auth/profile
//   → PROTEGIDO (requer token JWT)
//   → Header: Authorization: Bearer <token>
//   → Sucesso: 200 { data: { id, email, firstName, lastName, role, createdAt }, ... }
//   → Erro: 401 (token inválido/expirado)
//
// ============================================================================

// ============================================================================
// SEÇÃO 8: VARIÁVEIS DE AMBIENTE USADAS PELO AUTH
// ============================================================================
//
// JWT_SECRET     → Chave secreta para assinar/validar tokens JWT
//                → Deve ser uma string longa e aleatória
//                → Definida no .env
//
// JWT_EXPIRES_IN → Tempo de expiração dos tokens
//                → Formato: número + unidade (ex: '1d', '2h', '30m')
//                → Padrão: '1d' (1 dia) se não configurado
//
// DATABASE_URL   → URL de conexão com PostgreSQL (usada pelo Prisma)
//                → Definida em prisma.config.ts
//
// ============================================================================

// ============================================================================
// SEÇÃO 9: MODEL USER NO BANCO DE DADOS (PRISMA)
// ============================================================================
//
// model User {
//   id        String    @id @default(uuid())   // UUID gerado automaticamente
//   email     String    @unique                // E-mail único (usado para login)
//   password  String                           // Senha hasheada com bcrypt
//   firstName String                           // Primeiro nome
//   lastName  String                           // Sobrenome
//   role      Role      @default(TECHNICIAN)   // Papel no sistema (enum)
//   isActive  Boolean   @default(true)         // Usuário ativo/desativado
//   createdAt DateTime  @default(now())        // Data de criação
//   updatedAt DateTime  @updatedAt             // Data de última alteração
//   deletedAt DateTime?                        // Soft delete (null = ativo)
// }
//
// ENUM Role (no Prisma e no código):
//   TECHNICIAN | TEAM_LEADER | SUPERVISOR | ADMIN
//
// IMPORTANTE:
// → Soft delete: nunca apagar usuários, usar deletedAt
// → isActive: pode desativar um usuário sem apagá-lo
// → email: campo @unique, gera erro se tentar duplicar
//
// ============================================================================

// ============================================================================
// SEÇÃO 10: EXEMPLO COMPLETO — CRIAR UM MÓDULO COM AUTENTICAÇÃO
// ============================================================================
//
// Abaixo está o template completo para criar um novo módulo que
// utiliza autenticação JWT e controle de acesso por roles.
//
// --- example.module.ts ---
// ```typescript
// import { Module } from '@nestjs/common';
// import { ExampleController } from './example.controller';
// import { ExampleService } from './example.service';
// import { PrismaService } from '../../database/prisma.service';
//
// @Module({
//   controllers: [ExampleController],
//   providers: [ExampleService, PrismaService],
// })
// export class ExampleModule {}
// ```
//
// --- example.controller.ts ---
// ```typescript
// import {
//   Controller, Get, Post, Put, Delete,
//   Body, Param, UseGuards, HttpCode, HttpStatus,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import {
//   ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
// } from '@nestjs/swagger';
//
// import { ExampleService } from './example.service';
// import { CreateExampleDto } from './dto/create-example.dto';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { Role } from '../../common/decorators/roles.decorator';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import type { JwtPayload } from '../auth/strategies/jwt.strategy';
//
// @ApiTags('examples')
// @Controller('examples')
// export class ExampleController {
//   constructor(private readonly service: ExampleService) {}
//
//   // Listar — qualquer usuário autenticado
//   @UseGuards(AuthGuard('jwt'))
//   @Get()
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'List all examples' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'Lista retornada' })
//   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token inválido' })
//   findAll(@CurrentUser() user: JwtPayload) {
//     return this.service.findAll();
//   }
//
//   // Criar — apenas ADMIN e SUPERVISOR
//   @UseGuards(AuthGuard('jwt'), RolesGuard)
//   @Roles(Role.ADMIN, Role.SUPERVISOR)
//   @Post()
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Create a new example' })
//   @ApiResponse({ status: HttpStatus.CREATED, description: 'Criado com sucesso' })
//   @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sem permissão' })
//   create(@Body() dto: CreateExampleDto, @CurrentUser('sub') userId: string) {
//     return this.service.create(dto, userId);
//   }
//
//   // Deletar — apenas ADMIN
//   @UseGuards(AuthGuard('jwt'), RolesGuard)
//   @Roles(Role.ADMIN)
//   @Delete(':id')
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Delete an example' })
//   @HttpCode(HttpStatus.NO_CONTENT)
//   remove(@Param('id') id: string) {
//     return this.service.remove(id);
//   }
// }
// ```
//
// --- example.service.ts ---
// ```typescript
// import { Injectable, NotFoundException, Logger } from '@nestjs/common';
// import { PrismaService } from '../../database/prisma.service';
// import { CreateExampleDto } from './dto/create-example.dto';
//
// @Injectable()
// export class ExampleService {
//   private readonly logger = new Logger(ExampleService.name);
//
//   constructor(private readonly prisma: PrismaService) {}
//
//   async findAll() {
//     return this.prisma.example.findMany({
//       where: { deletedAt: null },
//     });
//   }
//
//   async create(dto: CreateExampleDto, userId: string) {
//     const record = await this.prisma.example.create({
//       data: { ...dto, createdById: userId },
//     });
//     this.logger.log(`Record created: ${record.id} by user ${userId}`);
//     return record;
//   }
//
//   async remove(id: string) {
//     // Soft delete — nunca apagar, apenas marcar como deletado
//     await this.prisma.example.update({
//       where: { id },
//       data: { deletedAt: new Date() },
//     });
//   }
// }
// ```
//
// ============================================================================

// ============================================================================
// SEÇÃO 11: ERROS COMUNS QUE A IA DEVE EVITAR
// ============================================================================
//
// ❌ ESQUECER o AuthGuard('jwt') em rotas protegidas
//    → Sem o guard, @CurrentUser() retorna undefined
//    → Sempre adicionar @UseGuards(AuthGuard('jwt')) antes de usar @CurrentUser()
//
// ❌ USAR RolesGuard SEM AuthGuard('jwt')
//    → O RolesGuard precisa do usuário autenticado
//    → Ordem correta: @UseGuards(AuthGuard('jwt'), RolesGuard)
//
// ❌ RETORNAR a senha do usuário em qualquer resposta
//    → Sempre omitir o campo password
//    → Usar select ou exclusão explícita
//
// ❌ CRIAR endpoints de login/registro com autenticação
//    → Os endpoints /register e /login são PÚBLICOS
//    → Não adicionar AuthGuard nesses endpoints (causaria loop)
//
// ❌ HARDCODAR o JWT_SECRET ou DATABASE_URL
//    → Sempre usar ConfigService para ler variáveis de ambiente
//    → Ex: configService.getOrThrow<string>('JWT_SECRET')
//
// ❌ FORNECER mensagens detalhadas de erro no login
//    → NÃO usar "User not found" ou "Wrong password"
//    → SEMPRE usar "Invalid credentials" para ambos os casos
//
// ❌ IMPORTAR tipos de caminhos errados
//    → JwtPayload: import type { JwtPayload } from '../auth/strategies/jwt.strategy'
//    → Role: import { Role } from '../../common/decorators/roles.decorator'
//    → CurrentUser: import { CurrentUser } from '../../common/decorators/current-user.decorator'
//    → RolesGuard: import { RolesGuard } from '../../common/guards/roles.guard'
//
// ❌ USAR delete real ao invés de soft delete
//    → Sempre usar: update({ data: { deletedAt: new Date() } })
//    → Nunca usar: delete() ou remove() do Prisma
//
// ============================================================================

// ============================================================================
// SEÇÃO 12: CHECKLIST — AO CRIAR UM NOVO ENDPOINT PROTEGIDO
// ============================================================================
//
// [ ] 1. O controller tem @ApiTags('nome-do-modulo')?
// [ ] 2. Cada endpoint tem @ApiOperation com summary?
// [ ] 3. Cada endpoint tem @ApiResponse para sucesso E erro?
// [ ] 4. Endpoints protegidos têm @UseGuards(AuthGuard('jwt'))?
// [ ] 5. Endpoints restritos têm @UseGuards(AuthGuard('jwt'), RolesGuard)?
// [ ] 6. Endpoints restritos têm @Roles(Role.XXX)?
// [ ] 7. Endpoints protegidos têm @ApiBearerAuth() no Swagger?
// [ ] 8. Está usando @CurrentUser() para obter dados do usuário?
// [ ] 9. O DTO de entrada tem validações class-validator?
// [ ] 10. O DTO tem @ApiProperty para documentação Swagger?
// [ ] 11. O service usa Logger para registrar operações?
// [ ] 12. Soft delete é usado ao invés de delete real?
// [ ] 13. A senha NUNCA é retornada nas respostas?
//
// ============================================================================
