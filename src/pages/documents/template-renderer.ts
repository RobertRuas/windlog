/**
 * ============================================================================
 * TEMPLATE RENDERER - Renderização de Templates com Dados do Formulário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Utilitário que pega o HTML/SVG do template e injeta os dados do formulário
 * nas posições corretas, gerando o documento final preenchido.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Carrega o HTML do template (fetch do arquivo estático)
 * 2. Para cada campo no mapeamento (template-field-maps.ts):
 *    - type 'replace': encontra o <tspan> pelo ID e substitui o texto
 *    - type 'inject': cria novo <text>/<tspan> na posição especificada
 * 3. Para checklists: converte valores Y/X/N/A em texto visível
 * 4. Retorna o HTML modificado pronto para visualização/impressão
 *
 * PADRÃO (igual ao timesheet):
 * ----------------------------
 * O documento é renderizado num modal em tela cheia.
 * O botão "Imprimir" chama window.print() com regras @media print
 * que isolam apenas o conteúdo do documento.
 * ============================================================================
 */

import { getTemplateFieldMap, type FieldMapEntry } from './template-field-maps';

// =========================================================================
// FUNÇÕES PRINCIPAIS
// =========================================================================

/**
 * Renderiza o template HTML com os dados do formulário injetados.
 *
 * @param templateId - ID do template (invoice, car-daily-report, toolbox-talk)
 * @param templateHtml - HTML original do template (SVG)
 * @param formData - Dados do formulário (Record<string, any>)
 * @returns HTML modificado com os dados injetados
 */
export function renderTemplate(
  templateId: string,
  templateHtml: string,
  formData: Record<string, any>,
): string {
  const config = getTemplateFieldMap(templateId);
  if (!config) return templateHtml;

  let html = templateHtml;

  // Processa cada campo do mapeamento
  for (const [fieldKey, entry] of Object.entries(config.fields)) {
    const value = resolveFieldValue(fieldKey, formData);
    if (!value && value !== 0) continue;

    const displayValue = formatDisplayValue(fieldKey, value);
    if (!displayValue) continue;

    if (entry.type === 'replace') {
      html = replaceTspanContent(html, entry.tspanId, displayValue);
    } else if (entry.type === 'inject') {
      html = injectTextElement(html, entry, displayValue);
    }
  }

  // Injeta assinatura do utilizador se disponível
  if (formData._userSignature) {
    html = injectSignature(html, templateId, formData._userSignature, formData._signedByName);
  }

  return html;
}

/**
 * Carrega o HTML do template a partir do endpoint do backend.
 * Retorna o conteúdo HTML cru do template SVG.
 *
 * @param templateId - ID do template
 * @returns HTML do template ou null se não encontrado
 */
export async function loadTemplateHtml(templateId: string): Promise<string | null> {
  try {
    // Usa fetch direto porque o endpoint retorna HTML puro (não JSON)
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/v1/documents/templates/${templateId}/html`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

/**
 * Resolve o valor de um campo do formData.
 * Suporta chaves aninhadas (ex: 'inspectionLeft.visualCheck').
 */
function resolveFieldValue(fieldKey: string, formData: Record<string, any>): any {
  // Chave direta
  if (formData[fieldKey] !== undefined) return formData[fieldKey];

  // Chave aninhada (ex: 'inspectionLeft.visualCheck')
  const parts = fieldKey.split('.');
  if (parts.length === 2) {
    const parent = formData[parts[0]];
    if (parent && typeof parent === 'object') {
      return parent[parts[1]];
    }
  }

  return undefined;
}

/**
 * Formata o valor para exibição no template.
 */
function formatDisplayValue(fieldKey: string, value: any): string {
  if (value === null || value === undefined || value === '') return '';

  // Para checklists, formata Y/X/N/A
  if (typeof value === 'string' && ['Y', 'X', 'N/A'].includes(value)) {
    return value;
  }

  // Para datas, formata DD/MM/YYYY
  if (fieldKey.includes('Date') || fieldKey.includes('date')) {
    return formatDateValue(String(value));
  }

  // Para datetime-local, formata DD/MM/YYYY HH:mm
  if (fieldKey === 'dateTime') {
    return formatDateTimeValue(String(value));
  }

  return String(value);
}

/**
 * Formata uma data (YYYY-MM-DD) para DD/MM/YYYY.
 */
function formatDateValue(dateStr: string): string {
  if (!dateStr) return '';
  const pure = dateStr.split('T')[0];
  const parts = pure.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formata datetime-local para DD/MM/YYYY HH:mm.
 */
function formatDateTimeValue(dtStr: string): string {
  if (!dtStr) return '';
  const [datePart, timePart] = dtStr.split('T');
  const formattedDate = formatDateValue(datePart);
  if (timePart) {
    const [hours, minutes] = timePart.split(':');
    return `${formattedDate} ${hours}:${minutes}`;
  }
  return formattedDate;
}

/**
 * Substitui o conteúdo de um <tspan> pelo ID.
 * Encontra o padrão: <tspan id="xxx" ...>CONTEÚDO</tspan>
 * e substitui CONTEÚDO pelo novo valor.
 */
function replaceTspanContent(html: string, tspanId: string, newValue: string): string {
  // Escapa caracteres especiais para regex
  const escapedId = tspanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Regex para encontrar o tspan pelo ID e capturar seu conteúdo
  // Suporta multi-line e atributos em qualquer ordem
  const regex = new RegExp(
    `(<tspan[^>]*\\bid=["']${escapedId}["'][^>]*>)([^<]*)(</tspan>)`,
    's',
  );

  return html.replace(regex, `$1${escapeXml(newValue)}$3`);
}

/**
 * Injeta um novo elemento <text>/<tspan> no SVG na posição especificada.
 * Usado para campos que não têm valor pré-preenchido no template.
 */
function injectTextElement(
  html: string,
  entry: FieldMapEntry,
  value: string,
): string {
  const { tspanId, x = 0, y = 0, fontSize = 13 } = entry;

  // Cria o elemento <text> com o valor
  const newText = `<text id="injected_${tspanId}" xml:space="preserve" ` +
    `transform="matrix(1.3333333,0,0,1.3333333,${x},${y})">` +
    `<tspan id="${tspanId}" ` +
    `style="font-variant:normal;font-weight:normal;font-size:${fontSize}px;` +
    `font-family:Calibri;writing-mode:lr-tb;fill:#000000;fill-opacity:1;` +
    `fill-rule:nonzero;stroke:none" x="0" y="0">${escapeXml(value)}</tspan></text>`;

  // Insere antes do fechamento do último </g> do SVG principal
  // Encontra o último </g> antes de </svg>
  const svgCloseIdx = html.lastIndexOf('</svg>');
  if (svgCloseIdx === -1) return html;

  // Encontra o último </g> antes do </svg>
  const lastGClose = html.lastIndexOf('</g>', svgCloseIdx);
  if (lastGClose === -1) return html;

  return html.slice(0, lastGClose) + newText + '\n    ' + html.slice(lastGClose);
}

/**
 * Injeta a assinatura do utilizador no template SVG.
 * Converte a imagem base64 em um elemento <image> SVG na posição apropriada.
 *
 * @param html - HTML do template
 * @param templateId - ID do template (para determinar posição)
 * @param signatureData - Dados da assinatura em base64 (data URL)
 * @param signerName - Nome de quem assinou (opcional)
 */
function injectSignature(
  html: string,
  templateId: string,
  signatureData: string,
  signerName?: string,
): string {
  // Posições da assinatura por template (ajustáveis)
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {
    invoice: { x: 80, y: 680, width: 200, height: 60 },
    'car-daily-report': { x: 80, y: 540, width: 200, height: 60 },
    'toolbox-talk': { x: 80, y: 560, width: 200, height: 60 },
  };

  const pos = positions[templateId] || positions['invoice'];

  // Cria elemento <image> SVG com a assinatura base64
  const sigImage = `<text id="sig_label" xml:space="preserve" ` +
    `style="font-size:10px;font-family:Calibri;fill:#666666;" ` +
    `x="${pos.x}" y="${pos.y - 5}">${escapeXml(signerName || 'Signed')}</text>` +
    `<image id="user_signature" x="${pos.x}" y="${pos.y}" ` +
    `width="${pos.width}" height="${pos.height}" ` +
    `href="${signatureData}" preserveAspectRatio="xMidYMid meet" />`;

  // Insere antes do último </g> antes de </svg>
  const svgCloseIdx = html.lastIndexOf('</svg>');
  if (svgCloseIdx === -1) return html;
  const lastGClose = html.lastIndexOf('</g>', svgCloseIdx);
  if (lastGClose === -1) return html;

  return html.slice(0, lastGClose) + '\n    ' + sigImage + '\n    ' + html.slice(lastGClose);
}

/**
 * Escapa caracteres especiais para XML/SVG.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
