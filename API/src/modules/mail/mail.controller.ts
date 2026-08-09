/**
 * ============================================================================
 * MAIL CONTROLLER - Endpoints do Módulo de E-mail
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP do cliente de e-mail integrado.
 * Todos os endpoints requerem autenticação (JWT) e operam apenas sobre
 * a conta do usuário autenticado (isolamento por usuário).
 *
 * ENDPOINTS PRINCIPAIS:
 * ---------------------
 * Configuração:  GET /mail/config, POST|GET|PUT|DELETE /mail/account
 * Sincronização: POST /mail/sync
 * Pastas:        GET|POST /mail/folders, PUT|DELETE /mail/folders/:id
 * Mensagens:     GET /mail/messages, POST /mail/messages/send,
 *                rascunhos, flags, mover, remover, conversas
 * Etiquetas:     CRUD /mail/labels + aplicação em mensagens
 * Regras:        CRUD /mail/rules
 * Contatos:      CRUD /mail/contacts + grupos /mail/contact-groups
 * Assinaturas:   CRUD /mail/signatures
 * Bloqueados:    GET|POST /mail/blocked-senders, DELETE /mail/blocked-senders/:id
 * Ausência:      GET|PUT /mail/auto-reply
 * Anexos:        GET /mail/attachments/:id/download
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

import { MailService } from './mail.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { createMulterConfig } from '../upload/multer.config.js';
import {
  ConnectMailAccountDto,
  UpdateMailAccountDto,
  MailFolderDto,
  SendMailDto,
  SaveDraftDto,
  UpdateMessageFlagsDto,
  MoveMessageDto,
  MessageFilterDto,
  MailLabelDto,
  MessageLabelDto,
  CreateMailRuleDto,
  UpdateMailRuleDto,
  MailContactDto,
  MailContactGroupDto,
  GroupMemberDto,
  MailSignatureDto,
  BlockSenderDto,
  AutoReplyDto,
} from './dto/mail.dto.js';

/**
 * Controller MailController - endpoints do módulo de e-mail.
 * Acesso para qualquer usuário autenticado (a conta é individual).
 */
@ApiTags('mail')
@ApiBearerAuth()
@Controller('mail')
@UseGuards(AuthGuard('jwt'))
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // =========================================================================
  // CONFIGURAÇÃO E CONTA
  // =========================================================================

  /**
   * GET /api/v1/mail/config
   * Configurações fixas dos servidores (somente leitura).
   */
  @Get('config')
  @ApiOperation({ summary: 'Configurações dos servidores', description: 'Retorna as configurações fixas (imap.one.com / send.one.com) em modo somente leitura.' })
  @ApiResponse({ status: 200, description: 'Configurações retornadas' })
  getConfig() {
    return this.mailService.getServerConfig();
  }

  /**
   * POST /api/v1/mail/account
   * Conecta a conta de e-mail (apenas e-mail + senha).
   */
  @Post('account')
  @ApiOperation({ summary: 'Conectar conta de e-mail', description: 'Conecta a conta informando apenas e-mail e senha. As configurações de servidor são pré-definidas.' })
  @ApiResponse({ status: 201, description: 'Conta conectada com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  connectAccount(@CurrentUser() user: JwtPayload, @Body() dto: ConnectMailAccountDto) {
    return this.mailService.connectAccount(user.sub, dto);
  }

  /**
   * GET /api/v1/mail/account
   * Retorna a conta conectada (sem senha).
   */
  @Get('account')
  @ApiOperation({ summary: 'Buscar conta conectada', description: 'Retorna a conta de e-mail do usuário (sem expor a senha).' })
  @ApiResponse({ status: 200, description: 'Conta retornada (ou null se não conectada)' })
  getAccount(@CurrentUser() user: JwtPayload) {
    return this.mailService.getAccount(user.sub);
  }

  /**
   * PUT /api/v1/mail/account
   * Atualiza senha/protocolo/preferências da conta.
   */
  @Put('account')
  @ApiOperation({ summary: 'Atualizar conta', description: 'Atualiza senha, protocolo ou preferências de notificação.' })
  @ApiResponse({ status: 200, description: 'Conta atualizada' })
  updateAccount(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMailAccountDto) {
    return this.mailService.updateAccount(user.sub, dto);
  }

  /**
   * DELETE /api/v1/mail/account
   * Desconecta a conta (soft delete).
   */
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desconectar conta', description: 'Desconecta a conta de e-mail (soft delete). A sincronização é interrompida.' })
  @ApiResponse({ status: 200, description: 'Conta desconectada' })
  disconnectAccount(@CurrentUser() user: JwtPayload) {
    return this.mailService.disconnectAccount(user.sub);
  }

  /**
   * POST /api/v1/mail/sync
   * Sincronização manual imediata.
   */
  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar agora', description: 'Força uma sincronização imediata da caixa de correio.' })
  @ApiResponse({ status: 201, description: 'Sincronização concluída' })
  sync(@CurrentUser() user: JwtPayload) {
    return this.mailService.manualSync(user.sub);
  }

  // =========================================================================
  // PASTAS
  // =========================================================================

  @Get('folders')
  @ApiOperation({ summary: 'Listar pastas', description: 'Lista pastas padrão e personalizadas com contadores.' })
  @ApiResponse({ status: 200, description: 'Pastas retornadas' })
  listFolders(@CurrentUser() user: JwtPayload) {
    return this.mailService.listFolders(user.sub);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Criar pasta personalizada', description: 'Cria uma pasta personalizada no banco e no servidor IMAP.' })
  @ApiResponse({ status: 201, description: 'Pasta criada' })
  createFolder(@CurrentUser() user: JwtPayload, @Body() dto: MailFolderDto) {
    return this.mailService.createFolder(user.sub, dto);
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Renomear pasta', description: 'Renomeia uma pasta personalizada.' })
  @ApiResponse({ status: 200, description: 'Pasta renomeada' })
  renameFolder(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MailFolderDto) {
    return this.mailService.renameFolder(user.sub, id, dto);
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover pasta', description: 'Remove uma pasta personalizada (mensagens vão para a lixeira).' })
  @ApiResponse({ status: 200, description: 'Pasta removida' })
  removeFolder(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeFolder(user.sub, id);
  }

  // =========================================================================
  // MENSAGENS
  // =========================================================================
  // NOTA: rotas específicas ANTES das rotas com :id (ordem de matching)
  // =========================================================================

  /**
   * GET /api/v1/mail/messages
   * Lista mensagens com busca avançada e paginação.
   */
  @Get('messages')
  @ApiOperation({ summary: 'Listar mensagens', description: 'Lista mensagens com filtros avançados (remetente, destinatário, assunto, conteúdo, data, etiquetas, flags).' })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Busca livre' })
  @ApiResponse({ status: 200, description: 'Mensagens retornadas' })
  listMessages(@CurrentUser() user: JwtPayload, @Query() filter: MessageFilterDto) {
    return this.mailService.listMessages(user.sub, filter);
  }

  /**
   * POST /api/v1/mail/messages/draft
   * Salva um novo rascunho.
   */
  @Post('messages/draft')
  @ApiOperation({ summary: 'Salvar rascunho', description: 'Cria um rascunho local na pasta Rascunhos.' })
  @ApiResponse({ status: 201, description: 'Rascunho salvo' })
  saveDraft(@CurrentUser() user: JwtPayload, @Body() dto: SaveDraftDto) {
    return this.mailService.saveDraft(user.sub, dto);
  }

  /**
   * PUT /api/v1/mail/messages/draft/:id
   * Atualiza um rascunho existente.
   */
  @Put('messages/draft/:id')
  @ApiOperation({ summary: 'Atualizar rascunho', description: 'Atualiza os dados de um rascunho existente.' })
  @ApiResponse({ status: 200, description: 'Rascunho atualizado' })
  updateDraft(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SaveDraftDto) {
    return this.mailService.saveDraft(user.sub, dto, id);
  }

  /**
   * POST /api/v1/mail/messages/send
   * Envia um e-mail (multipart: campos + anexos opcionais).
   */
  @Post('messages/send')
  @ApiOperation({ summary: 'Enviar e-mail', description: 'Envia um e-mail via SMTP (TLS). Aceita anexos via multipart (campo "files"). Os demais campos são JSON em strings.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'E-mail enviado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      createMulterConfig(
        process.env['UPLOAD_DIR'] || './uploads',
        Number(process.env['MAX_FILE_SIZE']) || 10485760,
        'mail',
      ),
    ),
  )
  async send(
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() body: Record<string, string>,
  ) {
    // No multipart os campos chegam como strings — converte para o DTO
    const parseJson = <T,>(value: string | undefined): T | undefined => {
      if (!value) return undefined;
      try {
        return JSON.parse(value) as T;
      } catch {
        throw new BadRequestException(`Invalid JSON field: ${value.slice(0, 50)}`);
      }
    };

    const dto: SendMailDto = Object.assign(new SendMailDto(), {
      to: parseJson<{ name?: string; address: string }[]>(body['to']) || [],
      cc: parseJson<{ name?: string; address: string }[]>(body['cc']),
      bcc: parseJson<{ name?: string; address: string }[]>(body['bcc']),
      subject: body['subject'],
      body: body['body'],
      isHtml: body['isHtml'] === 'true',
      draftId: body['draftId'],
      inReplyTo: body['inReplyTo'],
      references: body['references'],
    });

    if (!dto.to.length) {
      throw new BadRequestException('At least one recipient is required');
    }

    return this.mailService.send(user.sub, dto, files);
  }

  /**
   * GET /api/v1/mail/messages/conversations/:conversationId
   * Lista todas as mensagens de uma conversa (agrupamento por thread).
   */
  @Get('messages/conversations/:conversationId')
  @ApiOperation({ summary: 'Listar conversa', description: 'Retorna todas as mensagens agrupadas na mesma conversa.' })
  @ApiResponse({ status: 200, description: 'Conversa retornada' })
  getConversation(@CurrentUser() user: JwtPayload, @Param('conversationId') conversationId: string) {
    return this.mailService.getConversation(user.sub, conversationId);
  }

  /**
   * GET /api/v1/mail/messages/:id
   * Busca mensagem completa (marca como lida).
   */
  @Get('messages/:id')
  @ApiOperation({ summary: 'Buscar mensagem', description: 'Retorna a mensagem completa com corpo, anexos e etiquetas. Marca como lida.' })
  @ApiResponse({ status: 200, description: 'Mensagem retornada' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  getMessage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.getMessage(user.sub, id);
  }

  /**
   * PATCH /api/v1/mail/messages/:id/flags
   * Atualiza flags (lida, sinalizada, importante).
   */
  @Patch('messages/:id/flags')
  @ApiOperation({ summary: 'Atualizar flags', description: 'Marca como lida/não lida, sinalizada ou importante.' })
  @ApiResponse({ status: 200, description: 'Flags atualizadas' })
  updateFlags(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateMessageFlagsDto) {
    return this.mailService.updateFlags(user.sub, id, dto);
  }

  /**
   * POST /api/v1/mail/messages/:id/move
   * Move mensagem para outra pasta (arquivar, spam, personalizadas).
   */
  @Post('messages/:id/move')
  @ApiOperation({ summary: 'Mover mensagem', description: 'Move a mensagem para outra pasta (arquivar, spam, lixeira ou personalizada).' })
  @ApiResponse({ status: 200, description: 'Mensagem movida' })
  moveMessage(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MoveMessageDto) {
    return this.mailService.moveMessage(user.sub, id, dto);
  }

  /**
   * DELETE /api/v1/mail/messages/:id
   * Remove mensagem (lixeira → definitiva).
   */
  @Delete('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover mensagem', description: 'Move para a lixeira; se já estiver na lixeira, remove definitivamente.' })
  @ApiResponse({ status: 200, description: 'Mensagem removida' })
  removeMessage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeMessage(user.sub, id);
  }

  /**
   * POST /api/v1/mail/messages/:id/labels
   * Aplica etiqueta à mensagem.
   */
  @Post('messages/:id/labels')
  @ApiOperation({ summary: 'Aplicar etiqueta', description: 'Aplica uma etiqueta à mensagem.' })
  @ApiResponse({ status: 201, description: 'Etiqueta aplicada' })
  applyLabel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MessageLabelDto) {
    return this.mailService.applyLabel(user.sub, id, dto);
  }

  /**
   * DELETE /api/v1/mail/messages/:id/labels
   * Remove etiqueta da mensagem.
   */
  @Delete('messages/:id/labels')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover etiqueta', description: 'Remove uma etiqueta da mensagem.' })
  @ApiResponse({ status: 200, description: 'Etiqueta removida' })
  removeMessageLabel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MessageLabelDto) {
    return this.mailService.removeMessageLabel(user.sub, id, dto);
  }

  // =========================================================================
  // ETIQUETAS
  // =========================================================================

  @Get('labels')
  @ApiOperation({ summary: 'Listar etiquetas' })
  @ApiResponse({ status: 200, description: 'Etiquetas retornadas' })
  listLabels(@CurrentUser() user: JwtPayload) {
    return this.mailService.listLabels(user.sub);
  }

  @Post('labels')
  @ApiOperation({ summary: 'Criar etiqueta' })
  @ApiResponse({ status: 201, description: 'Etiqueta criada' })
  createLabel(@CurrentUser() user: JwtPayload, @Body() dto: MailLabelDto) {
    return this.mailService.createLabel(user.sub, dto);
  }

  @Put('labels/:id')
  @ApiOperation({ summary: 'Atualizar etiqueta' })
  @ApiResponse({ status: 200, description: 'Etiqueta atualizada' })
  updateLabel(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MailLabelDto) {
    return this.mailService.updateLabel(user.sub, id, dto);
  }

  @Delete('labels/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover etiqueta' })
  @ApiResponse({ status: 200, description: 'Etiqueta removida' })
  removeLabel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeLabel(user.sub, id);
  }

  // =========================================================================
  // REGRAS AUTOMÁTICAS
  // =========================================================================

  @Get('rules')
  @ApiOperation({ summary: 'Listar regras automáticas' })
  @ApiResponse({ status: 200, description: 'Regras retornadas' })
  listRules(@CurrentUser() user: JwtPayload) {
    return this.mailService.listRules(user.sub);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Criar regra automática' })
  @ApiResponse({ status: 201, description: 'Regra criada' })
  createRule(@CurrentUser() user: JwtPayload, @Body() dto: CreateMailRuleDto) {
    return this.mailService.createRule(user.sub, dto);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Atualizar regra' })
  @ApiResponse({ status: 200, description: 'Regra atualizada' })
  updateRule(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateMailRuleDto) {
    return this.mailService.updateRule(user.sub, id, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover regra' })
  @ApiResponse({ status: 200, description: 'Regra removida' })
  removeRule(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeRule(user.sub, id);
  }

  // =========================================================================
  // CONTATOS E GRUPOS
  // =========================================================================

  @Get('contacts')
  @ApiOperation({ summary: 'Listar contatos', description: 'Lista contatos manuais e adicionados automaticamente via envios.' })
  @ApiResponse({ status: 200, description: 'Contatos retornados' })
  listContacts(@CurrentUser() user: JwtPayload) {
    return this.mailService.listContacts(user.sub);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Criar contato' })
  @ApiResponse({ status: 201, description: 'Contato criado' })
  createContact(@CurrentUser() user: JwtPayload, @Body() dto: MailContactDto) {
    return this.mailService.createContact(user.sub, dto);
  }

  @Put('contacts/:id')
  @ApiOperation({ summary: 'Atualizar contato' })
  @ApiResponse({ status: 200, description: 'Contato atualizado' })
  updateContact(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MailContactDto) {
    return this.mailService.updateContact(user.sub, id, dto);
  }

  @Delete('contacts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover contato' })
  @ApiResponse({ status: 200, description: 'Contato removido' })
  removeContact(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeContact(user.sub, id);
  }

  @Get('contact-groups')
  @ApiOperation({ summary: 'Listar grupos de contatos', description: 'Lista grupos com seus membros (para envio a múltiplos destinos).' })
  @ApiResponse({ status: 200, description: 'Grupos retornados' })
  listGroups(@CurrentUser() user: JwtPayload) {
    return this.mailService.listGroups(user.sub);
  }

  @Post('contact-groups')
  @ApiOperation({ summary: 'Criar grupo de contatos' })
  @ApiResponse({ status: 201, description: 'Grupo criado' })
  createGroup(@CurrentUser() user: JwtPayload, @Body() dto: MailContactGroupDto) {
    return this.mailService.createGroup(user.sub, dto);
  }

  @Put('contact-groups/:id')
  @ApiOperation({ summary: 'Renomear grupo' })
  @ApiResponse({ status: 200, description: 'Grupo renomeado' })
  updateGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MailContactGroupDto) {
    return this.mailService.updateGroup(user.sub, id, dto);
  }

  @Delete('contact-groups/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover grupo' })
  @ApiResponse({ status: 200, description: 'Grupo removido' })
  removeGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeGroup(user.sub, id);
  }

  @Post('contact-groups/:id/members')
  @ApiOperation({ summary: 'Adicionar membro ao grupo' })
  @ApiResponse({ status: 201, description: 'Membro adicionado' })
  addGroupMember(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: GroupMemberDto) {
    return this.mailService.addGroupMember(user.sub, id, dto);
  }

  @Delete('contact-groups/:id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover membro do grupo' })
  @ApiResponse({ status: 200, description: 'Membro removido' })
  removeGroupMember(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: GroupMemberDto) {
    return this.mailService.removeGroupMember(user.sub, id, dto);
  }

  // =========================================================================
  // ASSINATURAS
  // =========================================================================

  @Get('signatures')
  @ApiOperation({ summary: 'Listar assinaturas' })
  @ApiResponse({ status: 200, description: 'Assinaturas retornadas' })
  listSignatures(@CurrentUser() user: JwtPayload) {
    return this.mailService.listSignatures(user.sub);
  }

  @Post('signatures')
  @ApiOperation({ summary: 'Criar assinatura' })
  @ApiResponse({ status: 201, description: 'Assinatura criada' })
  createSignature(@CurrentUser() user: JwtPayload, @Body() dto: MailSignatureDto) {
    return this.mailService.createSignature(user.sub, dto);
  }

  @Put('signatures/:id')
  @ApiOperation({ summary: 'Atualizar assinatura' })
  @ApiResponse({ status: 200, description: 'Assinatura atualizada' })
  updateSignature(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: MailSignatureDto) {
    return this.mailService.updateSignature(user.sub, id, dto);
  }

  @Delete('signatures/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover assinatura' })
  @ApiResponse({ status: 200, description: 'Assinatura removida' })
  removeSignature(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.removeSignature(user.sub, id);
  }

  // =========================================================================
  // REMETENTES BLOQUEADOS
  // =========================================================================

  @Get('blocked-senders')
  @ApiOperation({ summary: 'Listar remetentes bloqueados' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listBlockedSenders(@CurrentUser() user: JwtPayload) {
    return this.mailService.listBlockedSenders(user.sub);
  }

  @Post('blocked-senders')
  @ApiOperation({ summary: 'Bloquear remetente', description: 'Bloqueia um endereço ou domínio ("@dominio.com"). Mensagens vão para o spam.' })
  @ApiResponse({ status: 201, description: 'Remetente bloqueado' })
  blockSender(@CurrentUser() user: JwtPayload, @Body() dto: BlockSenderDto) {
    return this.mailService.blockSender(user.sub, dto);
  }

  @Delete('blocked-senders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desbloquear remetente' })
  @ApiResponse({ status: 200, description: 'Remetente desbloqueado' })
  unblockSender(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.mailService.unblockSender(user.sub, id);
  }

  // =========================================================================
  // RESPOSTA AUTOMÁTICA / AUSÊNCIA
  // =========================================================================

  @Get('auto-reply')
  @ApiOperation({ summary: 'Configuração de resposta automática', description: 'Retorna a configuração de resposta automática / mensagem de ausência.' })
  @ApiResponse({ status: 200, description: 'Configuração retornada' })
  getAutoReply(@CurrentUser() user: JwtPayload) {
    return this.mailService.getAutoReply(user.sub);
  }

  @Put('auto-reply')
  @ApiOperation({ summary: 'Atualizar resposta automática', description: 'Configura resposta automática / mensagem de ausência com período opcional.' })
  @ApiResponse({ status: 200, description: 'Configuração atualizada' })
  updateAutoReply(@CurrentUser() user: JwtPayload, @Body() dto: AutoReplyDto) {
    return this.mailService.updateAutoReply(user.sub, dto);
  }

  // =========================================================================
  // ANEXOS
  // =========================================================================

  /**
   * GET /api/v1/mail/attachments/:id/download
   * Download de anexo (stream direto do disco).
   */
  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Download de anexo', description: 'Baixa o conteúdo do anexo. Anexos suspeitos são bloqueados por segurança.' })
  @ApiResponse({ status: 200, description: 'Ficheiro retornado' })
  @ApiResponse({ status: 404, description: 'Anexo não encontrado' })
  async downloadAttachment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const attachment = await this.mailService.getAttachmentForDownload(user.sub, id);
    res.download(attachment.path, attachment.filename);
  }
}
