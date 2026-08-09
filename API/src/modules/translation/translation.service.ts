/**
 * ============================================================================
 * TRANSLATION SERVICE - Serviço de Tradução com IA (Português -> Inglês)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço NestJS que executa a tradução de textos usando um modelo de IA
 * leve (arquitetura OPUS-MT do Helsinki-NLP, porte ONNX) rodando 100% no
 * backend via biblioteca @huggingface/transformers. Nenhum dado sai do
 * nosso servidor: a inferência acontece localmente.
 *
 * COMO O MODELO É GERENCIADO?
 * ---------------------------
 * O modelo é pesado (~40 MB em memória), então seguimos um ciclo de vida
 * controlado para NÃO desperdiçar recursos:
 *
 *   1. warmUp()  -> carrega o modelo em memória (chamado quando o usuário
 *                   ABRE um formulário com campos traduzíveis). Se já
 *                   estiver carregado, não faz nada (no-op).
 *   2. translate() -> traduz um texto usando o modelo já aquecido. Se por
 *                   algum motivo o modelo não estiver carregado, ele é
 *                   carregado sob demanda como fallback seguro.
 *   3. unload()  -> descarrega o modelo da memória (chamado quando o
 *                   usuário SAI do formulário). Libera os recursos.
 *   4. Timer de ociosidade -> rede de segurança: se ninguém usar o modelo
 *                   por ~5 minutos, ele é descarregado automaticamente.
 *
 * POR QUE CARGA "LAZY"?
 * ---------------------
 * Importar a @huggingface/transformers no topo do arquivo deixaria o boot
 * da aplicação mais lento. Por isso importamos a biblioteca dinamicamente
 * apenas na primeira vez em que ela é realmente necessária.
 *
 * MODELO UTILIZADO:
 * -----------------
 * "Xenova/opus-mt-mul-en" é o porte ONNX (compatível com transformers.js)
 * do modelo OPUS-MT many->English do Helsinki-NLP. Ele traduz diversos
 * idiomas (incluindo Português) para Inglês e é leve o suficiente para
 * não afetar o desempenho da aplicação.
 * ============================================================================
 */

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  OnModuleDestroy,
} from '@nestjs/common';
import path from 'node:path';

/**
 * Tipo mínimo que descreve o pipeline de tradução retornado pela biblioteca.
 * Mantemos solto de propósito: a forma exata vem da @huggingface/transformers.
 */
type TranslationPipeline = (text: string) => Promise<Array<{ translation_text: string }>>;

/**
 * Modelos de tradução disponíveis. O valor pode ser sobrescrito via variável
 * de ambiente TRANSLATION_MODEL_ID. Padrão: many->English (inclui Português).
 */
const DEFAULT_MODEL_ID = 'Xenova/opus-mt-mul-en';

/**
 * Tempo de ociosidade (ms) antes de descarregar o modelo automaticamente.
 * Padrão: 5 minutos. Pode ser ajustado via TRANSLATION_IDLE_TIMEOUT_MS.
 */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class TranslationService implements OnModuleDestroy {
  private readonly logger = new Logger(TranslationService.name);

  /** Pipeline carregado em memória (null quando descarregado). */
  private pipeline: TranslationPipeline | null = null;

  /**
   * Promise de carregamento em andamento. Evita que duas chamadas
   * simultâneas de warmUp()/translate() carreguem o modelo duas vezes.
   */
  private loadPromise: Promise<TranslationPipeline> | null = null;

  /** Timer que descarrega o modelo após período de ociosidade. */
  private idleTimer: NodeJS.Timeout | null = null;

  /** ID do modelo de tradução (configurável via ambiente). */
  private readonly modelId = process.env.TRANSLATION_MODEL_ID || DEFAULT_MODEL_ID;

  /** Tempo de ociosidade em ms (configurável via ambiente). */
  private readonly idleTimeoutMs =
    Number(process.env.TRANSLATION_IDLE_TIMEOUT_MS) || DEFAULT_IDLE_TIMEOUT_MS;

  /** Diretório local onde o modelo é baixado/armazenado em cache. */
  private readonly cacheDir =
    process.env.TRANSLATION_MODEL_CACHE_DIR || path.join(process.cwd(), '.model-cache');

  // ===========================================================================
  // API PÚBLICA
  // ===========================================================================

  /**
   * Aquece o modelo: carrega-o em memória para que as traduções seguintes
   * sejam instantâneas. Chamado quando o usuário abre um formulário.
   *
   * Se o modelo já estiver carregado, retorna imediatamente (no-op).
   *
   * @returns Status do aquecimento (se carregou agora ou já estava pronto).
   */
  async warmUp(): Promise<{ ready: boolean; alreadyLoaded: boolean }> {
    if (this.pipeline) {
      // Já está aquecido — apenas renova o timer de ociosidade.
      this.resetIdleTimer();
      return { ready: true, alreadyLoaded: true };
    }

    const startedAt = Date.now();
    await this.getPipeline();
    this.logger.log(`Modelo de tradução aquecido em ${Date.now() - startedAt}ms (${this.modelId})`);
    return { ready: true, alreadyLoaded: false };
  }

  /**
   * Traduz um texto de Português para Inglês.
   *
   * Usa o modelo já aquecido. Se por algum motivo ele não estiver carregado
   * (ex.: o timer de ociosidade o descarregou), ele é carregado sob demanda
   * como fallback seguro — a tradução ainda assim funciona.
   *
   * @param text - Texto em português a traduzir.
   * @returns Texto traduzido para inglês.
   */
  async translate(text: string): Promise<{ translatedText: string }> {
    const pipeline = await this.getPipeline();
    this.resetIdleTimer();

    try {
      const output = await pipeline(text);
      const translatedText = output?.[0]?.translation_text ?? '';
      return { translatedText };
    } catch (error) {
      this.logger.error(`Falha ao traduzir texto: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Não foi possível traduzir o texto no momento.');
    }
  }

  /**
   * Descarrega o modelo da memória, liberando os recursos.
   * Chamado quando o usuário sai do formulário.
   *
   * Se o modelo não estiver carregado, não faz nada (no-op).
   *
   * @returns Status da descarga.
   */
  async unload(): Promise<{ unloaded: boolean }> {
    this.clearIdleTimer();

    if (!this.pipeline) {
      return { unloaded: false };
    }

    const pipeline = this.pipeline;
    // Limpa o estado ANTES de descartar para evitar uso concorrente.
    this.pipeline = null;
    this.loadPromise = null;

    try {
      const disposable = pipeline as unknown as { dispose?: () => Promise<void> };
      if (typeof disposable.dispose === 'function') {
        await disposable.dispose();
      }
      this.logger.log('Modelo de tradução descarregado da memória.');
      return { unloaded: true };
    } catch (error) {
      this.logger.warn(`Erro ao descarregar modelo: ${(error as Error).message}`);
      return { unloaded: false };
    }
  }

  // ===========================================================================
  // CARGA LAZY DO MODELO
  // ===========================================================================

  /**
   * Retorna o pipeline de tradução, carregando-o se necessário.
   *
   * Usa o loadPromise para garantir que apenas UM carregamento aconteça
   * por vez, mesmo com várias chamadas simultâneas.
   */
  private async getPipeline(): Promise<TranslationPipeline> {
    if (this.pipeline) {
      return this.pipeline;
    }

    // Se já há um carregamento em andamento, aguardamos o mesmo resultado.
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadPipeline();

    try {
      this.pipeline = await this.loadPromise;
      this.resetIdleTimer();
      return this.pipeline;
    } catch (error) {
      // Falhou — permite nova tentativa no futuro.
      this.loadPromise = null;
      this.logger.error(`Falha ao carregar modelo de tradução: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        'O serviço de tradução não está disponível no momento.',
      );
    }
  }

  /**
   * Importa a biblioteca dinamicamente e cria o pipeline de tradução.
   *
   * A importação dinâmica evita carregar a biblioteca pesada no boot da
   * aplicação. Configuramos também o diretório de cache local para que o
   * modelo seja baixado uma única vez e reutilizado nas cargas seguintes.
   */
  private async loadPipeline(): Promise<TranslationPipeline> {
    const transformers = await import('@huggingface/transformers');

    // Define o diretório de cache local ANTES de carregar o modelo.
    transformers.env.cacheDir = this.cacheDir;

    const pipeline = await transformers.pipeline('translation', this.modelId);
    return pipeline as unknown as TranslationPipeline;
  }

  // ===========================================================================
  // TIMER DE OCIOSIDADE (liberação automática de recursos)
  // ===========================================================================

  /**
   * Reinicia o timer de ociosidade. Cada uso do modelo "zera" o relógio.
   * Quando o timer expira (sem uso), o modelo é descarregado sozinho.
   */
  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.logger.log('Modelo de tradução ocioso — descarregando automaticamente.');
      void this.unload();
    }, this.idleTimeoutMs);
    // Não impede o processo Node de encerrar por causa do timer.
    this.idleTimer.unref?.();
  }

  /**
   * Cancela o timer de ociosidade (se existir).
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  // ===========================================================================
  // CICLO DE VIDA DO MÓDULO
  // ===========================================================================

  /**
   * Garante a liberação dos recursos quando a aplicação encerrar.
   */
  onModuleDestroy(): void {
    void this.unload();
  }
}
