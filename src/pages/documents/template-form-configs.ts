/**
 * ============================================================================
 * TEMPLATE FORM CONFIGS - Configuração de Formulários por Template
 * ============================================================================
 *
 * Define os campos específicos de cada template de documento.
 * Cada template tem sua própria estrutura de formulário com campos
 * identificados, tipos e agrupamentos.
 *
 * Templates:
 * - invoice: Fatura de serviços
 * - car-daily-report: Inspeção diária de veículo
 * - toolbox-talk: Reunião de segurança (Toolbox Talk)
 */

// =========================================================================
// TYPES - Tipos para configuração dos formulários
// =========================================================================

/** Tipo de campo suportado no formulário */
export type FormFieldType =
  | 'text'
  | 'date'
  | 'datetime-local'
  | 'select'
  | 'checklist';

/** Opção para campos do tipo select */
export interface FormFieldOption {
  label: string;
  value: string;
}

/** Definição de um campo do formulário */
export interface FormField {
  /** Chave no formData (id técnico) */
  key: string;
  /** Tipo de input */
  type: FormFieldType;
  /** Chave i18n para o label (relativa a forms.{templateId}) */
  labelKey: string;
  /** Placeholder (chave i18n) */
  placeholderKey?: string;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Opções para tipo select */
  options?: FormFieldOption[];
  /** Itens para tipo checklist */
  checklistItems?: ChecklistItem[];
}

/** Item de uma checklist (para inspeção de veículo) */
export interface ChecklistItem {
  key: string;
  labelKey: string;
}

/** Seção do formulário (agrupamento lógico de campos) */
export interface FormSection {
  /** Chave i18n para o título da seção */
  titleKey: string;
  /** Campos desta seção */
  fields: FormField[];
}

/** Configuração completa de formulário para um template */
export interface TemplateFormConfig {
  /** ID do template (deve bater com o templateId do backend) */
  templateId: string;
  /** Seções do formulário */
  sections: FormSection[];
}

// =========================================================================
// INVOICE - Formulário de Fatura
// =========================================================================

export const invoiceFormConfig: TemplateFormConfig = {
  templateId: 'invoice',
  sections: [
    {
      titleKey: 'forms.invoice.sections.contractor',
      fields: [
        {
          key: 'technicianName',
          type: 'text',
          labelKey: 'forms.invoice.technicianName',
          placeholderKey: 'forms.invoice.technicianNamePh',
          required: true,
        },
        {
          key: 'companyName',
          type: 'text',
          labelKey: 'forms.invoice.companyName',
          placeholderKey: 'forms.invoice.companyNamePh',
          required: true,
        },
        {
          key: 'email',
          type: 'text',
          labelKey: 'forms.invoice.email',
          placeholderKey: 'forms.invoice.emailPh',
        },
        {
          key: 'address',
          type: 'text',
          labelKey: 'forms.invoice.address',
          placeholderKey: 'forms.invoice.addressPh',
        },
        {
          key: 'vat',
          type: 'text',
          labelKey: 'forms.invoice.vat',
          placeholderKey: 'forms.invoice.vatPh',
        },
        {
          key: 'tel',
          type: 'text',
          labelKey: 'forms.invoice.tel',
          placeholderKey: 'forms.invoice.telPh',
        },
      ],
    },
    {
      titleKey: 'forms.invoice.sections.banking',
      fields: [
        {
          key: 'ibanName',
          type: 'text',
          labelKey: 'forms.invoice.ibanName',
          placeholderKey: 'forms.invoice.ibanNamePh',
        },
        {
          key: 'iban',
          type: 'text',
          labelKey: 'forms.invoice.iban',
          placeholderKey: 'forms.invoice.ibanPh',
        },
        {
          key: 'swiftBic',
          type: 'text',
          labelKey: 'forms.invoice.swiftBic',
          placeholderKey: 'forms.invoice.swiftBicPh',
        },
        {
          key: 'currency',
          type: 'select',
          labelKey: 'forms.invoice.currency',
          options: [
            { label: 'EUR (€)', value: 'EUR' },
            { label: 'USD ($)', value: 'USD' },
            { label: 'GBP (£)', value: 'GBP' },
            { label: 'PLN (zł)', value: 'PLN' },
            { label: 'SEK (kr)', value: 'SEK' },
            { label: 'NOK (kr)', value: 'NOK' },
            { label: 'DKK (kr)', value: 'DKK' },
          ],
        },
      ],
    },
    {
      titleKey: 'forms.invoice.sections.invoiceDetails',
      fields: [
        {
          key: 'invoiceNumber',
          type: 'text',
          labelKey: 'forms.invoice.invoiceNumber',
          placeholderKey: 'forms.invoice.invoiceNumberPh',
          required: true,
        },
        {
          key: 'invoiceDate',
          type: 'date',
          labelKey: 'forms.invoice.invoiceDate',
          required: true,
        },
      ],
    },
  ],
};

// =========================================================================
// CAR DAILY REPORT - Formulário de Inspeção Diária de Veículo
// =========================================================================

/** Itens da checklist de inspeção do veículo */
const vehicleChecklistItems: ChecklistItem[] = [
  { key: 'visualCheck', labelKey: 'forms.carDaily.checklist.visualCheck' },
  { key: 'brakes', labelKey: 'forms.carDaily.checklist.brakes' },
  { key: 'engineOil', labelKey: 'forms.carDaily.checklist.engineOil' },
  { key: 'coolantLevels', labelKey: 'forms.carDaily.checklist.coolantLevels' },
  { key: 'tyresAndWheels', labelKey: 'forms.carDaily.checklist.tyresAndWheels' },
  { key: 'spareWheel', labelKey: 'forms.carDaily.checklist.spareWheel' },
  { key: 'bodywork', labelKey: 'forms.carDaily.checklist.bodywork' },
  { key: 'hydraulics', labelKey: 'forms.carDaily.checklist.hydraulics' },
];

const vehicleChecklistItemsRight: ChecklistItem[] = [
  { key: 'mirrorsCCTV', labelKey: 'forms.carDaily.checklist.mirrorsCCTV' },
  { key: 'tidinessInterior', labelKey: 'forms.carDaily.checklist.tidinessInterior' },
  { key: 'drivingControls', labelKey: 'forms.carDaily.checklist.drivingControls' },
  { key: 'fireExtinguisher', labelKey: 'forms.carDaily.checklist.fireExtinguisher' },
  { key: 'firstAidKit', labelKey: 'forms.carDaily.checklist.firstAidKit' },
  { key: 'spillKit', labelKey: 'forms.carDaily.checklist.spillKit' },
  { key: 'towBarHitch', labelKey: 'forms.carDaily.checklist.towBarHitch' },
  { key: 'trailer', labelKey: 'forms.carDaily.checklist.trailer' },
];

export const carDailyReportFormConfig: TemplateFormConfig = {
  templateId: 'car-daily-report',
  sections: [
    {
      titleKey: 'forms.carDaily.sections.vehicleDetails',
      fields: [
        {
          key: 'vehicle',
          type: 'text',
          labelKey: 'forms.carDaily.vehicle',
          placeholderKey: 'forms.carDaily.vehiclePh',
          required: true,
        },
        {
          key: 'plantNoRegistration',
          type: 'text',
          labelKey: 'forms.carDaily.plantNoRegistration',
          placeholderKey: 'forms.carDaily.plantNoRegistrationPh',
          required: true,
        },
        {
          key: 'mileage',
          type: 'text',
          labelKey: 'forms.carDaily.mileage',
          placeholderKey: 'forms.carDaily.mileagePh',
        },
        {
          key: 'division',
          type: 'text',
          labelKey: 'forms.carDaily.division',
          placeholderKey: 'forms.carDaily.divisionPh',
        },
        {
          key: 'nextServiceDue',
          type: 'date',
          labelKey: 'forms.carDaily.nextServiceDue',
        },
        {
          key: 'dateTime',
          type: 'datetime-local',
          labelKey: 'forms.carDaily.dateTime',
          required: true,
        },
        {
          key: 'trailerNo',
          type: 'text',
          labelKey: 'forms.carDaily.trailerNo',
          placeholderKey: 'forms.carDaily.trailerNoPh',
        },
      ],
    },
    {
      titleKey: 'forms.carDaily.sections.inspectionLeft',
      fields: [
        {
          key: 'inspectionLeft',
          type: 'checklist',
          labelKey: 'forms.carDaily.inspectionLeft',
          checklistItems: vehicleChecklistItems,
        },
      ],
    },
    {
      titleKey: 'forms.carDaily.sections.inspectionRight',
      fields: [
        {
          key: 'inspectionRight',
          type: 'checklist',
          labelKey: 'forms.carDaily.inspectionRight',
          checklistItems: vehicleChecklistItemsRight,
        },
      ],
    },
  ],
};

// =========================================================================
// TOOLBOX TALK - Formulário de Reunião de Segurança
// =========================================================================

export const toolboxTalkFormConfig: TemplateFormConfig = {
  templateId: 'toolbox-talk',
  sections: [
    {
      titleKey: 'forms.toolboxTalk.sections.projectInfo',
      fields: [
        {
          key: 'projectNo',
          type: 'text',
          labelKey: 'forms.toolboxTalk.projectNo',
          placeholderKey: 'forms.toolboxTalk.projectNoPh',
          required: true,
        },
        {
          key: 'location',
          type: 'text',
          labelKey: 'forms.toolboxTalk.location',
          placeholderKey: 'forms.toolboxTalk.locationPh',
          required: true,
        },
        {
          key: 'typeOfService',
          type: 'text',
          labelKey: 'forms.toolboxTalk.typeOfService',
          placeholderKey: 'forms.toolboxTalk.typeOfServicePh',
        },
        {
          key: 'startDate',
          type: 'date',
          labelKey: 'forms.toolboxTalk.startDate',
          required: true,
        },
      ],
    },
    {
      titleKey: 'forms.toolboxTalk.sections.companyInfo',
      fields: [
        {
          key: 'registered',
          type: 'text',
          labelKey: 'forms.toolboxTalk.registered',
          placeholderKey: 'forms.toolboxTalk.registeredPh',
        },
        {
          key: 'address',
          type: 'text',
          labelKey: 'forms.toolboxTalk.address',
          placeholderKey: 'forms.toolboxTalk.addressPh',
        },
        {
          key: 'web',
          type: 'text',
          labelKey: 'forms.toolboxTalk.web',
          placeholderKey: 'forms.toolboxTalk.webPh',
        },
        {
          key: 'tel',
          type: 'text',
          labelKey: 'forms.toolboxTalk.tel',
          placeholderKey: 'forms.toolboxTalk.telPh',
        },
        {
          key: 'email',
          type: 'text',
          labelKey: 'forms.toolboxTalk.email',
          placeholderKey: 'forms.toolboxTalk.emailPh',
        },
      ],
    },
    {
      titleKey: 'forms.toolboxTalk.sections.approval',
      fields: [
        {
          key: 'preparedBy',
          type: 'text',
          labelKey: 'forms.toolboxTalk.preparedBy',
          placeholderKey: 'forms.toolboxTalk.preparedByPh',
        },
        {
          key: 'approvedBy',
          type: 'text',
          labelKey: 'forms.toolboxTalk.approvedBy',
          placeholderKey: 'forms.toolboxTalk.approvedByPh',
        },
        {
          key: 'lastRevisionDate',
          type: 'date',
          labelKey: 'forms.toolboxTalk.lastRevisionDate',
        },
        {
          key: 'revision',
          type: 'text',
          labelKey: 'forms.toolboxTalk.revision',
          placeholderKey: 'forms.toolboxTalk.revisionPh',
        },
      ],
    },
    {
      titleKey: 'forms.toolboxTalk.sections.checklist',
      fields: [
        {
          key: 'equipmentSafetyChecks',
          type: 'checklist',
          labelKey: 'forms.toolboxTalk.checklist.equipmentSafetyChecks',
          checklistItems: [
            { key: 'equipmentSafetyChecks', labelKey: 'forms.toolboxTalk.checklistItems.equipmentSafetyChecks' },
            { key: 'generalJobDetails', labelKey: 'forms.toolboxTalk.checklistItems.generalJobDetails' },
            { key: 'accessEgress', labelKey: 'forms.toolboxTalk.checklistItems.accessEgress' },
            { key: 'safetyHarness', labelKey: 'forms.toolboxTalk.checklistItems.safetyHarness' },
            { key: 'fallProtection', labelKey: 'forms.toolboxTalk.checklistItems.fallProtection' },
            { key: 'exclusionZones', labelKey: 'forms.toolboxTalk.checklistItems.exclusionZones' },
            { key: 'weatherConditions', labelKey: 'forms.toolboxTalk.checklistItems.weatherConditions' },
            { key: 'emergencyProcedures', labelKey: 'forms.toolboxTalk.checklistItems.emergencyProcedures' },
          ],
        },
      ],
    },
    {
      titleKey: 'forms.toolboxTalk.sections.comments',
      fields: [
        {
          key: 'generalComments',
          type: 'text',
          labelKey: 'forms.toolboxTalk.generalComments',
          placeholderKey: 'forms.toolboxTalk.generalCommentsPh',
        },
      ],
    },
  ],
};

// =========================================================================
// REGISTRO DE CONFIGURAÇÕES
// =========================================================================

/** Mapa de todas as configurações de formulário por template ID */
export const templateFormConfigs: Record<string, TemplateFormConfig> = {
  invoice: invoiceFormConfig,
  'car-daily-report': carDailyReportFormConfig,
  'toolbox-talk': toolboxTalkFormConfig,
};

/**
 * Retorna a configuração de formulário para um template.
 * @param templateId - ID do template
 * @returns Configuração do formulário ou null se não encontrado
 */
export function getTemplateFormConfig(templateId: string): TemplateFormConfig | null {
  return templateFormConfigs[templateId] ?? null;
}
