/**
 * ============================================================================
 * PRISMA SERVICE - Serviço de Acesso ao Banco de Dados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este é o serviço central que conecta a aplicação ao banco de dados.
 * Ele encapsula o client do Prisma e garante que a conexão seja
 * estabelecida corretamente durante o ciclo de vida da aplicação.
 *
 * COMO FUNCIONA (Prisma v7)?
 * --------------------------
 * No Prisma v7, o PrismaClient precisa de um "driver adapter" para
 * conectar ao banco. Usamos o @prisma/adapter-pg para PostgreSQL.
 *
 * O fluxo é:
 * 1. Criamos um adapter (PrismaPg) com a URL do banco
 * 2. Passamos o adapter para o PrismaClient
 * 3. O client usa o adapter para se comunicar com o PostgreSQL
 *
 * COMO USAR EM OUTROS SERVIÇOS?
 * -----------------------------
 * @Injectable()
 * export class SomeService {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async findAll() {
 *     return this.prisma.user.findMany();
 *   }
 * }
 *
 * POR QUE UM SERVIÇO DEDICADO?
 * ----------------------------
 * - Centraliza a conexão (evita múltiplas conexões ao banco)
 * - Garante que a conexão é aberta/fechada corretamente
 * - Facilita testes (podemos mockar este serviço)
 * - Segue o padrão de Injeção de Dependência do NestJS
 * ============================================================================
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Importa o client gerado pelo Prisma (caminho definido no schema.prisma)
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

// Adapter PostgreSQL para Prisma v7 (substitui a conexão embutida)
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService - Gerencia a conexão com o banco de dados PostgreSQL.
 *
 * Herda de PrismaClient para ter acesso direto a todos os models
 * (user, project, etc.) e também de Injectable para ser injetado
 * como dependência em outros serviços do NestJS.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Construtor do serviço.
   *
   * Configura o adapter PostgreSQL e inicializa o PrismaClient.
   * A URL do banco é lida das variáveis de ambiente via ConfigService.
   *
   * @param configService - Serviço do NestJS para acessar variáveis de ambiente
   */
  constructor(configService: ConfigService) {
    // Lê a URL do banco de dados das variáveis de ambiente
    const databaseUrl = configService.get<string>('DATABASE_URL');

    // Cria o adapter PostgreSQL com a URL do banco
    // O adapter é o "ponte" entre o Prisma e o driver do PostgreSQL
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    // Inicializa o PrismaClient com o adapter
    // Sem o adapter, o Prisma v7 não consegue conectar ao banco
    super({ adapter });
  }

  /**
   * Hook executado quando o módulo NestJS é inicializado.
   * Conecta explicitamente ao banco de dados para garantir
   * que a conexão está ativa antes de qualquer requisição.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Hook executado quando a aplicação está sendo encerrada.
   * Fecha a conexão com o banco de dados de forma limpa,
   * evitando conexões órfãs ou dados corrompidos.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
