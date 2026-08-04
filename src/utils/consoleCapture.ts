/**
 * ============================================================================
 * CONSOLE CAPTURE - Captura de Erros e Logs do Console
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Utility para capturar erros, warnings e logs do console do navegador.
 * Sobrescreve temporariamente os métodos do console para coletar informações
 * úteis para debugging quando o usuário reporta um feedback.
 *
 * COMO FUNCIONA:
 * --------------
 * 1. startCapture() - inicia a captura sobrescrevendo console.error/warn/log
 * 2. stopCapture() - para a captura e restaura os métodos originais
 * 3. getCapturedLogs() - retorna os logs capturados
 *
 * SEGURANÇA:
 * ----------
 * - Os logs são armazenados apenas em memória (não persistidos)
 * - Máximo de 50 logs para evitar problemas de memória
 * - Dados sensíveis são sanitizados antes de armazenar
 * ============================================================================
 */

/**
 * Tipo de log capturado.
 */
export type LogLevel = 'error' | 'warn' | 'log' | 'info';

/**
 * Estrutura de um log capturado.
 */
export interface CapturedLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  args?: string[];
}

/**
 * Limite máximo de logs capturados.
 */
const MAX_LOGS = 50;

/**
 * Array de logs capturados.
 */
let capturedLogs: CapturedLog[] = [];

/**
 * Flag para indicar se a captura está ativa.
 */
let isCapturing = false;

/**
 * Métodos originais do console (para restaurar depois).
 */
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
  info: console.info,
};

/**
 * Sanitiza argumentos do console para armazenamento seguro.
 * Remove dados sensíveis e converte para string.
 */
function sanitizeArgs(args: unknown[]): string[] {
  return args.map((arg) => {
    try {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.message}\n${arg.stack || ''}`;
      if (typeof arg === 'object') {
        const str = JSON.stringify(arg, null, 2);
        // Limita o tamanho para evitar problemas de memória
        return str.length > 500 ? str.substring(0, 500) + '...' : str;
      }
      return String(arg);
    } catch {
      return '[Unable to serialize]';
    }
  });
}

/**
 * Adiciona um log ao array de capturados.
 */
function addLog(level: LogLevel, args: unknown[]): void {
  if (capturedLogs.length >= MAX_LOGS) {
    // Remove o mais antigo se atingir o limite
    capturedLogs.shift();
  }

  capturedLogs.push({
    level,
    message: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
    timestamp: new Date().toISOString(),
    args: sanitizeArgs(args),
  });
}

/**
 * Inicia a captura de logs do console.
 * Sobrescreve console.error, console.warn, console.log e console.info.
 */
export function startConsoleCapture(): void {
  if (isCapturing) return;

  // Limpa logs anteriores
  capturedLogs = [];
  isCapturing = true;

  // Sobrescreve os métodos do console
  console.error = (...args: unknown[]) => {
    addLog('error', args);
    originalConsole.error.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    addLog('warn', args);
    originalConsole.warn.apply(console, args);
  };

  console.log = (...args: unknown[]) => {
    addLog('log', args);
    originalConsole.log.apply(console, args);
  };

  console.info = (...args: unknown[]) => {
    addLog('info', args);
    originalConsole.info.apply(console, args);
  };

  // Captura erros não tratados
  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

/**
 * Para a captura de logs e restaura os métodos originais do console.
 */
export function stopConsoleCapture(): void {
  if (!isCapturing) return;

  // Restaura métodos originais
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
  console.info = originalConsole.info;

  // Remove listeners
  window.removeEventListener('error', handleWindowError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  isCapturing = false;
}

/**
 * Retorna os logs capturados.
 */
export function getCapturedLogs(): CapturedLog[] {
  return [...capturedLogs];
}

/**
 * Limpa os logs capturados.
 */
export function clearCapturedLogs(): void {
  capturedLogs = [];
}

/**
 * Handler para erros não tratados (window.onerror).
 */
function handleWindowError(event: ErrorEvent): void {
  addLog('error', [
    `Uncaught Error: ${event.message}`,
    `at ${event.filename}:${event.lineno}:${event.colno}`,
  ]);
}

/**
 * Handler para promises rejeitadas não tratadas.
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const message = reason instanceof Error
    ? `Unhandled Promise Rejection: ${reason.message}`
    : `Unhandled Promise Rejection: ${String(reason)}`;
  addLog('error', [message]);
}

/**
 * Formata os logs capturados para exibição ou envio.
 */
export function formatCapturedLogs(logs: CapturedLog[]): string {
  if (logs.length === 0) return 'No console logs captured.';

  return logs
    .map((log) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const prefix = `[${time}] [${log.level.toUpperCase()}]`;
      return `${prefix} ${log.message}`;
    })
    .join('\n');
}
