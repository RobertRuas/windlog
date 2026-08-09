/**
 * ============================================================================
 * POP3 CLIENT - Cliente POP3 Minimalista com TLS
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Cliente POP3 leve implementado sobre TLS nativo do Node.js.
 * Usado como alternativa ao IMAP para contas configuradas com protocolo POP3.
 *
 * COMANDOS SUPORTADOS:
 * --------------------
 * USER/PASS (autenticação), STAT, LIST, UIDL, RETR, DELE, QUIT
 *
 * FLUXO POP3:
 * -----------
 * 1. Conecta via TLS (porta 995)
 * 2. Autentica com USER + PASS
 * 3. UIDL lista identificadores únicos (evita baixar duplicados)
 * 4. RETR baixa cada mensagem bruta (parseada depois com mailparser)
 * 5. Opcionalmente DELE remove do servidor após download
 * ============================================================================
 */

import * as tls from 'node:tls';

/** Mensagem retornada pelo POP3 */
export interface Pop3Message {
  /** Índice da mensagem na caixa (1-based) */
  index: number;
  /** Tamanho em bytes */
  size: number;
  /** Identificador único (UIDL) */
  uid: string;
  /** Conteúdo bruto RFC 822 */
  raw: Buffer;
}

/**
 * Cliente POP3 com suporte a TLS.
 * Cada instância representa uma sessão única (conecta, opera, fecha).
 */
export class Pop3Client {
  private socket: tls.TLSSocket | null = null;
  private buffer = '';
  private pending: ((line: string) => void) | null = null;

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  /**
   * Conecta ao servidor e aguarda a saudação inicial.
   */
  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket = tls.connect({ host: this.host, port: this.port }, () => {
        this.setupParser();
        this.pending = () => resolve();
      });
      this.socket.once('error', reject);
      setTimeout(() => reject(new Error('POP3 connection timeout')), 15_000);
    });
  }

  /**
   * Autentica com usuário e senha.
   */
  async login(user: string, pass: string): Promise<void> {
    await this.command(`USER ${user}`);
    await this.command(`PASS ${pass}`);
  }

  /**
   * Lista mensagens com UIDL (identificador único).
   * @returns array com índice, tamanho e uid de cada mensagem
   */
  async list(): Promise<{ index: number; size: number; uid: string }[]> {
    const listResp = await this.command('LIST', true);
    const sizes = new Map<number, number>();
    for (const line of listResp.slice(1)) {
      const [idx, size] = line.split(' ');
      if (idx && size) sizes.set(Number(idx), Number(size));
    }
    const uidlResp = await this.command('UIDL', true);
    const result: { index: number; size: number; uid: string }[] = [];
    for (const line of uidlResp.slice(1)) {
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx === -1) continue;
      const index = Number(line.slice(0, spaceIdx));
      const uid = line.slice(spaceIdx + 1);
      result.push({ index, size: sizes.get(index) || 0, uid });
    }
    return result;
  }

  /**
   * Baixa o conteúdo bruto de uma mensagem.
   */
  async retrieve(index: number): Promise<Buffer> {
    const lines = await this.command(`RETR ${index}`, true);
    // Remove a linha de status (+OK) e desfaz o byte-stuffing (.. -> .)
    const body = lines.slice(1).map((l) => (l.startsWith('..') ? l.slice(1) : l));
    return Buffer.from(body.join('\r\n'), 'utf8');
  }

  /**
   * Marca mensagem para remoção no servidor (efetivada no QUIT).
   */
  async delete(index: number): Promise<void> {
    await this.command(`DELE ${index}`);
  }

  /**
   * Encerra a sessão (efetiva os DELE pendentes).
   */
  async quit(): Promise<void> {
    try {
      await this.command('QUIT');
    } finally {
      this.socket?.destroy();
      this.socket = null;
    }
  }

  // =========================================================================
  // MÉTODOS INTERNOS
  // =========================================================================

  /**
   * Configura o parser de linhas da resposta POP3.
   * Respostas multi-linha terminam com a linha ".".
   */
  private setupParser(): void {
    this.socket!.setEncoding('utf8');
    this.socket!.on('data', (chunk: string) => {
      this.buffer += chunk;
      let idx: number;
      while ((idx = this.buffer.indexOf('\r\n')) !== -1) {
        const line = this.buffer.slice(0, idx);
        this.buffer = this.buffer.slice(idx + 2);
        const cb = this.pending;
        if (cb) cb(line);
      }
    });
  }

  /**
   * Envia um comando e aguarda a resposta.
   * @param multi - se true, coleta resposta multi-linha até "."
   * @returns linhas da resposta (a primeira é o status +OK/-ERR)
   */
  private command(cmd: string, multi = false): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      let first = true;
      const timeout = setTimeout(() => reject(new Error('POP3 command timeout')), 30_000);

      this.pending = (line: string) => {
        if (first) {
          first = false;
          if (!line.startsWith('+OK')) {
            clearTimeout(timeout);
            this.pending = null;
            reject(new Error(`POP3 error: ${line}`));
            return;
          }
          if (!multi) {
            clearTimeout(timeout);
            this.pending = null;
            resolve([line]);
            return;
          }
          lines.push(line);
          return;
        }
        // Resposta multi-linha: termina com "."
        if (line === '.') {
          clearTimeout(timeout);
          this.pending = null;
          resolve(lines);
          return;
        }
        lines.push(line);
      };

      this.socket!.write(cmd + '\r\n');
    });
  }
}
