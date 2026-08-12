/**
 * ============================================================================
 * TEMPLATE FIELD MAPS - Mapeamento de Campos para Elementos SVG
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Mapeia as chaves do formData para os elementos <text>/<tspan> do SVG
 * de cada template. Permite que o renderer injete os valores do formulário
 * nas posições corretas do template HTML/SVG.
 *
 * COMO FUNCIONA?
 * --------------
 * Cada template tem um mapa de campos que define:
 * - type: 'replace' (substitui texto existente) ou 'inject' (adiciona texto novo)
 * - tspanId: ID do elemento <tspan> a modificar
 * - position: para tipo 'inject', coordenadas x,y no SVG
 *
 * Templates:
 * - invoice: Fatura (campos com valores existentes)
 * - car-daily-report: Inspeção diária de veículo (campos em células vazias)
 * - toolbox-talk: Reunião de segurança (campos em células vazias)
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

/** Mapa de campos de um template: formData key → entrada SVG */
export type TemplateFieldMap = Record<string, FieldMapEntry>;

/** Configuração completa de renderização de um template */
export interface TemplateRenderConfig {
  /** ID do template */
  templateId: string;
  /** Mapa de campos */
  fields: TemplateFieldMap;
}

// =========================================================================
// INVOICE - Mapeamento de campos
// =========================================================================
// Os IDs dos tspan correspondem aos elementos <text>/<tspan> no SVG
// extraídos do template invoice-sample.html

export const invoiceFieldMap: TemplateRenderConfig = {
  templateId: 'invoice',
  fields: {
    // Dados do contratante
    technicianName: { type: 'replace', tspanId: 'tspan3' },
    companyName: { type: 'replace', tspanId: 'tspan24' },
    email: { type: 'replace', tspanId: 'tspan42' },
    address: { type: 'replace', tspanId: 'tspan60' },
    vat: { type: 'replace', tspanId: 'tspan80' },
    tel: { type: 'replace', tspanId: 'tspan98' },
    // Dados bancários
    ibanName: { type: 'replace', tspanId: 'tspan131' },
    iban: { type: 'replace', tspanId: 'tspan154' },
    swiftBic: { type: 'replace', tspanId: 'tspan173' },
    currency: { type: 'replace', tspanId: 'tspan192' },
    // Detalhes da fatura
    invoiceNumber: { type: 'replace', tspanId: 'tspan229' },
    invoiceDate: { type: 'replace', tspanId: 'tspan246' },
  },
};

// =========================================================================
// CAR DAILY REPORT - Mapeamento de campos
// =========================================================================
// Os campos são injetados em posições específicas do SVG (células vazias)
// Coordenadas baseadas na grelha do template

export const carDailyReportFieldMap: TemplateRenderConfig = {
  templateId: 'car-daily-report',
  fields: {
    // Detalhes do veículo (células ao lado dos labels)
    vehicle: { type: 'inject', tspanId: 'tspan_value_vehicle', x: 190, y: 143, fontSize: 13 },
    plantNoRegistration: { type: 'inject', tspanId: 'tspan_value_plant', x: 510, y: 143, fontSize: 13 },
    mileage: { type: 'inject', tspanId: 'tspan_value_mileage', x: 190, y: 172, fontSize: 13 },
    division: { type: 'inject', tspanId: 'tspan_value_division', x: 510, y: 172, fontSize: 13 },
    nextServiceDue: { type: 'inject', tspanId: 'tspan_value_service', x: 190, y: 200, fontSize: 13 },
    dateTime: { type: 'inject', tspanId: 'tspan_value_datetime', x: 510, y: 200, fontSize: 13 },
    trailerNo: { type: 'inject', tspanId: 'tspan_value_trailer', x: 680, y: 200, fontSize: 13 },
    // Checklist - valores Y/X/N/A nas células "Checked" da esquerda
    'inspectionLeft.visualCheck': { type: 'inject', tspanId: 'tspan_chk_visual', x: 263, y: 283, fontSize: 13 },
    'inspectionLeft.brakes': { type: 'inject', tspanId: 'tspan_chk_brakes', x: 263, y: 299, fontSize: 13 },
    'inspectionLeft.engineOil': { type: 'inject', tspanId: 'tspan_chk_oil', x: 263, y: 315, fontSize: 13 },
    'inspectionLeft.coolantLevels': { type: 'inject', tspanId: 'tspan_chk_coolant', x: 263, y: 331, fontSize: 13 },
    'inspectionLeft.tyresAndWheels': { type: 'inject', tspanId: 'tspan_chk_tyres', x: 263, y: 347, fontSize: 13 },
    'inspectionLeft.spareWheel': { type: 'inject', tspanId: 'tspan_chk_spare', x: 263, y: 363, fontSize: 13 },
    'inspectionLeft.bodywork': { type: 'inject', tspanId: 'tspan_chk_body', x: 263, y: 379, fontSize: 13 },
    'inspectionLeft.hydraulics': { type: 'inject', tspanId: 'tspan_chk_hydra', x: 263, y: 395, fontSize: 13 },
    // Checklist - valores Y/X/N/A nas células "Checked" da direita
    'inspectionRight.mirrorsCCTV': { type: 'inject', tspanId: 'tspan_chk_mirrors', x: 505, y: 283, fontSize: 13 },
    'inspectionRight.tidinessInterior': { type: 'inject', tspanId: 'tspan_chk_tidy', x: 505, y: 299, fontSize: 13 },
    'inspectionRight.drivingControls': { type: 'inject', tspanId: 'tspan_chk_steering', x: 505, y: 315, fontSize: 13 },
    'inspectionRight.fireExtinguisher': { type: 'inject', tspanId: 'tspan_chk_fire', x: 505, y: 331, fontSize: 13 },
    'inspectionRight.firstAidKit': { type: 'inject', tspanId: 'tspan_chk_firstaid', x: 505, y: 347, fontSize: 13 },
    'inspectionRight.spillKit': { type: 'inject', tspanId: 'tspan_chk_spill', x: 505, y: 363, fontSize: 13 },
    'inspectionRight.towBarHitch': { type: 'inject', tspanId: 'tspan_chk_tow', x: 505, y: 379, fontSize: 13 },
    'inspectionRight.trailer': { type: 'inject', tspanId: 'tspan_chk_trailer', x: 505, y: 395, fontSize: 13 },
  },
};

// =========================================================================
// TOOLBOX TALK - Mapeamento de campos
// =========================================================================

export const toolboxTalkFieldMap: TemplateRenderConfig = {
  templateId: 'toolbox-talk',
  fields: {
    // Info do projeto
    projectNo: { type: 'inject', tspanId: 'tspan_value_project', x: 145, y: 115, fontSize: 13 },
    location: { type: 'inject', tspanId: 'tspan_value_location', x: 400, y: 115, fontSize: 13 },
    typeOfService: { type: 'inject', tspanId: 'tspan_value_type', x: 145, y: 140, fontSize: 13 },
    startDate: { type: 'inject', tspanId: 'tspan_value_startdate', x: 400, y: 140, fontSize: 13 },
    // Info da empresa
    registered: { type: 'inject', tspanId: 'tspan_value_registered', x: 145, y: 175, fontSize: 13 },
    address: { type: 'inject', tspanId: 'tspan_value_address', x: 400, y: 175, fontSize: 13 },
    web: { type: 'inject', tspanId: 'tspan_value_web', x: 145, y: 200, fontSize: 13 },
    tel: { type: 'inject', tspanId: 'tspan_value_tel', x: 400, y: 200, fontSize: 13 },
    email: { type: 'inject', tspanId: 'tspan_value_email', x: 145, y: 225, fontSize: 13 },
    // Aprovação
    preparedBy: { type: 'inject', tspanId: 'tspan_value_prepared', x: 145, y: 260, fontSize: 13 },
    approvedBy: { type: 'inject', tspanId: 'tspan_value_approved', x: 400, y: 260, fontSize: 13 },
    lastRevisionDate: { type: 'inject', tspanId: 'tspan_value_revdate', x: 145, y: 285, fontSize: 13 },
    revision: { type: 'inject', tspanId: 'tspan_value_revision', x: 400, y: 285, fontSize: 13 },
    // Checklist de segurança
    'equipmentSafetyChecks.equipmentSafetyChecks': { type: 'inject', tspanId: 'tspan_tb_equipment', x: 530, y: 330, fontSize: 13 },
    'equipmentSafetyChecks.generalJobDetails': { type: 'inject', tspanId: 'tspan_tb_general', x: 530, y: 346, fontSize: 13 },
    'equipmentSafetyChecks.accessEgress': { type: 'inject', tspanId: 'tspan_tb_access', x: 530, y: 362, fontSize: 13 },
    'equipmentSafetyChecks.safetyHarness': { type: 'inject', tspanId: 'tspan_tb_harness', x: 530, y: 378, fontSize: 13 },
    'equipmentSafetyChecks.fallProtection': { type: 'inject', tspanId: 'tspan_tb_fall', x: 530, y: 394, fontSize: 13 },
    'equipmentSafetyChecks.exclusionZones': { type: 'inject', tspanId: 'tspan_tb_exclusion', x: 530, y: 410, fontSize: 13 },
    'equipmentSafetyChecks.weatherConditions': { type: 'inject', tspanId: 'tspan_tb_weather', x: 530, y: 426, fontSize: 13 },
    'equipmentSafetyChecks.emergencyProcedures': { type: 'inject', tspanId: 'tspan_tb_emergency', x: 530, y: 442, fontSize: 13 },
    // Comentários
    generalComments: { type: 'inject', tspanId: 'tspan_value_comments', x: 80, y: 520, fontSize: 11 },
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
 * @param templateId - ID do template
 * @returns Configuração de renderização ou null se não encontrado
 */
export function getTemplateFieldMap(templateId: string): TemplateRenderConfig | null {
  return templateFieldMaps[templateId] ?? null;
}
