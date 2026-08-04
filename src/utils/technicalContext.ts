/**
 * ============================================================================
 * TECHNICAL CONTEXT - Coletor de Informações Técnicas do Ambiente
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Utility para coletar informações técnicas detalhadas sobre o ambiente
 * do usuário (browser, sistema, conexão, performance, etc.) quando um
 * feedback é reportado.
 *
 * INFORMAÇÕES COLETADAS:
 * ----------------------
 * - Browser e versão
 * - Sistema operacional
 * - Resolução de tela e viewport
 * - Idioma e timezone
 * - Conexão de rede (tipo, velocidade)
 * - Memória disponível
 * - Performance de navegação
 * - Cookies habilitados
 * - Do Not Track
 * - Plugins instalados
 * - WebGL/Canvas support
 * ============================================================================
 */

/**
 * Interface com todas as informações técnicas coletadas.
 */
export interface TechnicalContext {
  // Browser
  browser: {
    name: string;
    version: string;
    language: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: boolean;
    userAgent: string;
  };

  // Sistema
  system: {
    os: string;
    platform: string;
    cores: number;
    memory?: number; // GB
    online: boolean;
  };

  // Tela
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: string;
  };

  // Viewport
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };

  // Conexão
  connection: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };

  // Performance
  performance: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    memoryUsed?: number; // MB
    memoryLimit?: number; // MB
  };

  // Página atual
  page: {
    url: string;
    path: string;
    referrer: string;
    title: string;
  };

  // Suporte a features
  features: {
    webgl: boolean;
    canvas: boolean;
    webWorkers: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    serviceWorker: boolean;
  };

  // Timestamp
  timestamp: string;
}

/**
 * Detecta o nome do browser.
 */
function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Chrome')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Safari')) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Edge')) {
    name = 'Edge';
    const match = ua.match(/Edge\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  }

  return { name, version };
}

/**
 * Detecta o sistema operacional.
 */
function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Coleta informações de conexão de rede.
 */
function getConnectionInfo(): TechnicalContext['connection'] {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return {};

  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Coleta informações de performance.
 */
function getPerformanceInfo(): TechnicalContext['performance'] {
  const perf = performance;
  const timing = perf.timing || {};
  const memory = (perf as any).memory;

  return {
    navigationStart: timing.navigationStart || 0,
    domContentLoaded: timing.domContentLoadedEventEnd || 0,
    loadComplete: timing.loadEventEnd || 0,
    memoryUsed: memory?.usedJSHeapSize ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined,
    memoryLimit: memory?.jsHeapSizeLimit ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : undefined,
  };
}

/**
 * Verifica suporte a WebGL.
 */
function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

/**
 * Coleta todas as informações técnicas do ambiente.
 */
export function collectTechnicalContext(): TechnicalContext {
  const browser = detectBrowser();
  const screen = window.screen;

  return {
    browser: {
      name: browser.name,
      version: browser.version,
      language: navigator.language,
      languages: [...navigator.languages],
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      userAgent: navigator.userAgent,
    },

    system: {
      os: detectOS(),
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 0,
      memory: (navigator as any).deviceMemory,
      online: navigator.onLine,
    },

    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type || 'unknown',
    },

    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },

    connection: getConnectionInfo(),

    performance: getPerformanceInfo(),

    page: {
      url: window.location.href,
      path: window.location.pathname + window.location.search,
      referrer: document.referrer,
      title: document.title,
    },

    features: {
      webgl: hasWebGLSupport(),
      canvas: !!document.createElement('canvas').getContext,
      webWorkers: !!window.Worker,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      serviceWorker: 'serviceWorker' in navigator,
    },

    timestamp: new Date().toISOString(),
  };
}

/**
 * Formata o contexto técnico para exibição legível.
 */
export function formatTechnicalContext(ctx: TechnicalContext): string {
  const lines: string[] = [
    '=== Technical Context ===',
    '',
    `Browser: ${ctx.browser.name} ${ctx.browser.version}`,
    `OS: ${ctx.system.os}`,
    `Platform: ${ctx.system.platform}`,
    `CPU Cores: ${ctx.system.cores}`,
    ctx.system.memory ? `Memory: ${ctx.system.memory} GB` : '',
    `Language: ${ctx.browser.language}`,
    `Cookies: ${ctx.browser.cookiesEnabled ? 'Enabled' : 'Disabled'}`,
    `Online: ${ctx.system.online ? 'Yes' : 'No'}`,
    '',
    `Screen: ${ctx.screen.width}x${ctx.screen.height} (${ctx.screen.colorDepth}bit)`,
    `Viewport: ${ctx.viewport.width}x${ctx.viewport.height}`,
    `Pixel Ratio: ${ctx.screen.pixelRatio}`,
    '',
    ctx.connection.effectiveType ? `Connection: ${ctx.connection.effectiveType}` : '',
    ctx.connection.downlink ? `Downlink: ${ctx.connection.downlink} Mbps` : '',
    ctx.connection.rtt ? `RTT: ${ctx.connection.rtt} ms` : '',
    '',
    `Page: ${ctx.page.url}`,
    `Title: ${ctx.page.title}`,
    `Referrer: ${ctx.page.referrer || 'None'}`,
    '',
    'Features:',
    `  WebGL: ${ctx.features.webgl ? '✓' : '✗'}`,
    `  Canvas: ${ctx.features.canvas ? '✓' : '✗'}`,
    `  Web Workers: ${ctx.features.webWorkers ? '✓' : '✗'}`,
    `  Local Storage: ${ctx.features.localStorage ? '✓' : '✗'}`,
    `  Service Worker: ${ctx.features.serviceWorker ? '✓' : '✗'}`,
    '',
    `Timestamp: ${ctx.timestamp}`,
  ];

  return lines.filter((l) => l !== '').join('\n');
}
