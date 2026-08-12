/**
 * ============================================================================
 * TEMPLATE FIELD MAPS - Mapeamento de Campos para Elementos SVG
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Mapeia as chaves do formData para os elementos <text>/<tspan> do SVG
 * de cada template. Também mapeia os IDs dos inputs HTML dos formulários
 * para as chaves do formData, permitindo extração automática.
 *
 * ESTRUTURA:
 * ----------
 * Cada template tem:
 * - fields: mapa formData key → elemento SVG (replace/inject)
 * - formIdToKey: mapa input ID/name no form HTML → formData key
 *
 * FLUXO:
 * ------
 * 1. extractFormData() lê inputs do iframe
 * 2. formIdToKey converte IDs → chaves do formData
 * 3. renderTemplate() usa fields para injetar no SVG
 * ============================================================================
 */

// =========================================================================
// TIPOS
// =========================================================================

/** Tipo de operação no template */
export type FieldMapType = 'replace' | 'inject';

/** Mapeamento de um campo do formulário para o SVG */
export interface FieldMapEntry {
  /** Tipo de operação */
  type: FieldMapType;
  /** ID do elemento <tspan> no SVG */
  tspanId: string;
  /** Posição x para inject (opcional) */
  x?: number;
  /** Posição y para inject (opcional) */
  y?: number;
  /** Tamanho da fonte (padrão: 16) */
  fontSize?: number;
}

/** Mapa de campos: formData key → entrada SVG */
export type TemplateFieldMap = Record<string, FieldMapEntry>;

/** Configuração completa de um template */
export interface TemplateRenderConfig {
  /** ID do template */
  templateId: string;
  /** Mapa de campos: formData key → SVG element */
  fields: TemplateFieldMap;
  /** Mapa de IDs do form HTML → formData key */
  formIdToKey: Record<string, string>;
}

// =========================================================================
// INVOICE
// =========================================================================
// Form IDs (invoice-form.html) → formData keys → SVG tspan IDs

export const invoiceFieldMap: TemplateRenderConfig = {
  templateId: 'invoice',
  fields: {
    technicianName: { type: 'replace', tspanId: 'tspan3' },
    companyName: { type: 'replace', tspanId: 'tspan24' },
    email: { type: 'replace', tspanId: 'tspan42' },
    address: { type: 'replace', tspanId: 'tspan60' },
    vat: { type: 'replace', tspanId: 'tspan80' },
    tel: { type: 'replace', tspanId: 'tspan98' },
    ibanName: { type: 'replace', tspanId: 'tspan131' },
    iban: { type: 'replace', tspanId: 'tspan154' },
    swiftBic: { type: 'replace', tspanId: 'tspan173' },
    currency: { type: 'replace', tspanId: 'tspan192' },
    invoiceNumber: { type: 'replace', tspanId: 'tspan229' },
    invoiceDate: { type: 'replace', tspanId: 'tspan246' },
  },
  formIdToKey: {
    'invoice-no': 'invoiceNumber',
    'invoice-date': 'invoiceDate',
    'tech-name': 'technicianName',
    'tech-company': 'companyName',
    'tech-email': 'email',
    'tech-address': 'address',
    'tech-vat': 'vat',
    'tech-tel': 'tel',
    'bank-iban-name': 'ibanName',
    'bank-iban': 'iban',
    'bank-swift': 'swiftBic',
    'currency': 'currency',
  },
};

// =========================================================================
// CAR DAILY REPORT
// =========================================================================
// Form IDs (car-daily-report-form.html) → formData keys → SVG positions

export const carDailyReportFieldMap: TemplateRenderConfig = {
  templateId: 'car-daily-report',
  fields: {
    vehicle: { type: 'inject', tspanId: 'tspan_value_vehicle', x: 190, y: 143, fontSize: 13 },
    plantNoRegistration: { type: 'inject', tspanId: 'tspan_value_plant', x: 510, y: 143, fontSize: 13 },
    mileage: { type: 'inject', tspanId: 'tspan_value_mileage', x: 190, y: 172, fontSize: 13 },
    division: { type: 'inject', tspanId: 'tspan_value_division', x: 510, y: 172, fontSize: 13 },
    nextServiceDue: { type: 'inject', tspanId: 'tspan_value_service', x: 190, y: 200, fontSize: 13 },
    dateTime: { type: 'inject', tspanId: 'tspan_value_datetime', x: 510, y: 200, fontSize: 13 },
    trailerNo: { type: 'inject', tspanId: 'tspan_value_trailer', x: 680, y: 200, fontSize: 13 },
    comments: { type: 'inject', tspanId: 'tspan_value_comments', x: 80, y: 470, fontSize: 11 },
    driverName: { type: 'inject', tspanId: 'tspan_value_driver', x: 80, y: 530, fontSize: 13 },
  },
  formIdToKey: {
    'vehicle': 'vehicle',
    'registration': 'plantNoRegistration',
    'mileage': 'mileage',
    'division': 'division',
    'service-due': 'nextServiceDue',
    'date-time': 'dateTime',
    'trailer-no': 'trailerNo',
    'comments': 'comments',
    'driver-name': 'driverName',
  },
};

// =========================================================================
// TOOLBOX TALK
// =========================================================================
// Form IDs (toolbox-talk-form.html) → formData keys → SVG positions

export const toolboxTalkFieldMap: TemplateRenderConfig = {
  templateId: 'toolbox-talk',
  fields: {
    projectNo: { type: 'inject', tspanId: 'tspan_value_project', x: 145, y: 115, fontSize: 13 },
    location: { type: 'inject', tspanId: 'tspan_value_location', x: 400, y: 115, fontSize: 13 },
    typeOfService: { type: 'inject', tspanId: 'tspan_value_type', x: 145, y: 140, fontSize: 13 },
    startDate: { type: 'inject', tspanId: 'tspan_value_startdate', x: 400, y: 140, fontSize: 13 },
    generalComments: { type: 'inject', tspanId: 'tspan_value_comments', x: 80, y: 520, fontSize: 11 },
  },
  formIdToKey: {
    'project-no': 'projectNo',
    'location': 'location',
    'service-type': 'typeOfService',
    'start-date': 'startDate',
    'comments': 'generalComments',
  },
};

// =========================================================================
// REGISTRO DE MAPEAMENTOS
// =========================================================================

/** Mapa de todas as configurações de renderização por template ID */
export const templateFieldMaps: Record<string, TemplateRenderConfig> = {
  invoice: invoiceFieldMap,
  'car-daily-report': carDailyReportFieldMap,
  'toolbox-talk': toolboxTalkFieldMap,
};

/**
 * Retorna o mapeamento de campos para um template.
 */
export function getTemplateFieldMap(templateId: string): TemplateRenderConfig | null {
  return templateFieldMaps[templateId] ?? null;
}

/**
 * Retorna o mapa formId → fieldKey para um template.
 * Usado pelo extractFormData() para converter IDs dos inputs em chaves.
 */
export function getFormIdToKeyMap(templateId: string): Record<string, string> {
  return templateFieldMaps[templateId]?.formIdToKey ?? {};
}
