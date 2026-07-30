/**
 * ============================================================================
 * PROFILE COMPLETENESS - Cálculo de Completude do Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Calcula o percentual de preenchimento do perfil do usuário,
 * dividindo os dados em seções e atribuindo peso a cada uma.
 *
 * COMO FUNCIONA?
 * --------------
 * Cada seção tem um peso (weight) e uma lista de campos verificáveis.
 * A pontuação de cada seção = (campos preenchidos / total de campos) × peso
 * O percentual total = soma das pontuações / soma dos pesos × 100
 *
 * REGRAS IMPORTANTES:
 * -------------------
 * - Passaporte é OBRIGATÓRIO (marca como "required")
 * - Campos required bloqueiam o progresso a 100% se não preenchidos
 * - Seções com peso maior impactam mais no percentual final
 * ============================================================================
 */

import type { User } from '@/types/user.types';

/**
 * Representa uma seção verificável do perfil.
 * Cada seção tem campos que podem estar preenchidos ou não.
 */
export interface ProfileSection {
  /** ID único da seção (usado como chave i18n) */
  id: string;
  /** Peso da seção no cálculo total (quanto maior, mais impacta) */
  weight: number;
  /** Campos que existem nesta seção */
  fields: string[];
  /** Campos que são obrigatórios (bloqueiam 100%) */
  requiredFields: string[];
  /** Se a seção é considerada "completa" */
  isComplete: (data: User) => boolean;
  /** Quantos campos estão preenchidos */
  filledCount: (data: User) => number;
}

/**
 * Resultado do cálculo de completude do perfil.
 */
export interface CompletenessResult {
  /** Percentual total de preenchimento (0-100) */
  percentage: number;
  /** Total de seções */
  totalSections: number;
  /** Seções completas */
  completedSections: number;
  /** Detalhes por seção */
  sections: SectionResult[];
  /** Se há algum campo obrigatório faltando */
  hasRequiredMissing: boolean;
  /** IDs das seções com campos obrigatórios faltando */
  requiredMissingSections: string[];
}

/**
 * Resultado detalhado de uma seção individual.
 */
export interface SectionResult {
  /** ID da seção */
  id: string;
  /** Peso da seção */
  weight: number;
  /** Total de campos na seção */
  totalFields: number;
  /** Campos preenchidos */
  filledFields: number;
  /** Percentual desta seção (0-100) */
  percentage: number;
  /** Se a seção está completa */
  isComplete: boolean;
  /** Se tem campos obrigatórios faltando */
  hasRequiredMissing: boolean;
}

/**
 * Helper: verifica se um valor é considerado "preenchido".
 * Considera strings vazias, null, undefined e strings apenas com espaços como não preenchidos.
 */
function isFilled(value: unknown): boolean {
  // Null ou undefined
  if (value === null || value === undefined) return false;
  // String vazia ou apenas espaços
  if (typeof value === 'string' && value.trim() === '') return false;
  // Array vazio
  if (Array.isArray(value) && value.length === 0) return false;
  // Tudo o resto é considerado preenchido
  return true;
}

/**
 * Define todas as seções verificáveis do perfil com seus pesos.
 *
 * PESOS (total = 100):
 * - Identidade: 15 (nome, sobrenome, data nascimento, nacionalidade, foto)
 * - Contato: 10 (telefone)
 * - Localização: 12 (endereço, cidade, código postal, país)
 * - Profissional: 13 (departamento, cargo, data contratação)
 * - Sobre: 5 (biografia)
 * - Documentos: 25 (passaporte obrigatório + outros)
 * - Dados Bancários: 10 (pelo menos uma conta)
 * - Idiomas: 5 (pelo menos um idioma)
 * - Certificações: 5 (pelo menos uma certificação)
 */
function getProfileSections(): ProfileSection[] {
  return [
    {
      id: 'identity',
      weight: 15,
      fields: ['firstName', 'lastName', 'dateOfBirth', 'nationality', 'photoUrl'],
      requiredFields: [],
      isComplete: (d) => [d.firstName, d.lastName, d.dateOfBirth, d.nationality, d.photoUrl].every(isFilled),
      filledCount: (d) => [d.firstName, d.lastName, d.dateOfBirth, d.nationality, d.photoUrl].filter(isFilled).length,
    },
    {
      id: 'contact',
      weight: 10,
      fields: ['phone'],
      requiredFields: [],
      isComplete: (d) => (d.phoneNumbers?.length ?? 0) > 0,
      filledCount: (d) => (d.phoneNumbers?.length ?? 0) > 0 ? 1 : 0,
    },
    {
      id: 'location',
      weight: 12,
      fields: ['address', 'city', 'postalCode', 'country'],
      requiredFields: [],
      isComplete: (d) => [d.address, d.city, d.postalCode, d.country].every(isFilled),
      filledCount: (d) => [d.address, d.city, d.postalCode, d.country].filter(isFilled).length,
    },
    {
      id: 'professional',
      weight: 13,
      fields: ['department', 'position', 'hireDate'],
      requiredFields: [],
      isComplete: (d) => [d.department, d.position, d.hireDate].every(isFilled),
      filledCount: (d) => [d.department, d.position, d.hireDate].filter(isFilled).length,
    },
    {
      id: 'about',
      weight: 5,
      fields: ['bio'],
      requiredFields: [],
      isComplete: (d) => isFilled(d.bio),
      filledCount: (d) => isFilled(d.bio) ? 1 : 0,
    },
    {
      id: 'documents',
      weight: 25,
      fields: ['passport', 'otherDocuments'],
      requiredFields: ['passport'],
      isComplete: (d) => {
        const hasPassport = d.documents?.some(doc => doc.type === 'PASSPORT') ?? false;
        return hasPassport;
      },
      filledCount: (d) => {
        const hasPassport = d.documents?.some(doc => doc.type === 'PASSPORT') ?? false;
        return hasPassport ? 1 : 0;
      },
    },
    {
      id: 'bankAccounts',
      weight: 10,
      fields: ['bankAccount'],
      requiredFields: [],
      isComplete: (d) => (d.bankAccounts?.length ?? 0) > 0,
      filledCount: (d) => (d.bankAccounts?.length ?? 0) > 0 ? 1 : 0,
    },
    {
      id: 'languages',
      weight: 5,
      fields: ['language'],
      requiredFields: [],
      isComplete: (d) => (d.languages?.length ?? 0) > 0,
      filledCount: (d) => (d.languages?.length ?? 0) > 0 ? 1 : 0,
    },
    {
      id: 'certifications',
      weight: 5,
      fields: ['certification'],
      requiredFields: [],
      isComplete: (d) => (d.certifications?.length ?? 0) > 0,
      filledCount: (d) => (d.certifications?.length ?? 0) > 0 ? 1 : 0,
    },
  ];
}

/**
 * Calcula a completude do perfil do usuário.
 *
 * @param data - Dados completos do perfil (User)
 * @returns Objeto CompletenessResult com percentual e detalhes por seção
 */
export function calculateProfileCompleteness(data: User): CompletenessResult {
  const sections = getProfileSections();
  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);

  let weightedScore = 0;
  let completedSections = 0;
  const hasRequiredMissing: string[] = [];

  const sectionResults: SectionResult[] = sections.map((section) => {
    const filled = section.filledCount(data);
    const total = section.fields.length;
    const sectionPercentage = total > 0 ? (filled / total) * 100 : 0;
    const isComplete = section.isComplete(data);

    // Contribuição ponderada desta seção para o total
    weightedScore += (filled / total) * section.weight;

    if (isComplete) completedSections++;

    // Verifica se há campos obrigatórios faltando
    let sectionRequiredMissing = false;
    if (section.id === 'documents') {
      const hasPassport = data.documents?.some(doc => doc.type === 'PASSPORT') ?? false;
      if (!hasPassport) {
        sectionRequiredMissing = true;
        hasRequiredMissing.push(section.id);
      }
    }

    return {
      id: section.id,
      weight: section.weight,
      totalFields: total,
      filledFields: filled,
      percentage: Math.round(sectionPercentage),
      isComplete,
      hasRequiredMissing: sectionRequiredMissing,
    };
  });

  const percentage = Math.round((weightedScore / totalWeight) * 100);

  return {
    percentage,
    totalSections: sections.length,
    completedSections,
    sections: sectionResults,
    hasRequiredMissing: hasRequiredMissing.length > 0,
    requiredMissingSections: hasRequiredMissing,
  };
}

/**
 * Verifica se o wizard deve ser exibido.
 * O wizard aparece quando faltam dados ESENCIAIS:
 * - Passaporte (OBRIGATÓRIO)
 * - Pelo menos um telefone OU localização básica (país + cidade)
 *
 * Se esses requisitos não forem atendidos, o wizard é mostrado.
 * Uma vez atendidos, o usuário pode completar o resto no modo normal.
 *
 * @param data - Dados completos do perfil
 * @returns true se o wizard deve ser exibido
 */
export function shouldShowWizard(data: User): boolean {
  // Passaporte é obrigatório - se não tem, mostra wizard
  const hasPassport = data.documents?.some(doc => doc.type === 'PASSPORT') ?? false;
  if (!hasPassport) return true;

  // Precisa de pelo menos um telefone
  const hasPhone = (data.phoneNumbers?.length ?? 0) > 0 || !!data.phone;
  if (!hasPhone) return true;

  // Precisa de localização básica (país + cidade)
  const hasBasicLocation = !!data.country && !!data.city;
  if (!hasBasicLocation) return true;

  // Tudo essencial preenchido - não mostra wizard
  return false;
}

/**
 * Determina qual passo do wizard deve ser exibido com base nos dados preenchidos.
 * Pula etapas já completas para ir direto à próxima pendente.
 *
 * @param data - Dados completos do perfil
 * @returns ID do passo atual (identity, contact, location, professional, documents)
 */
export function getWizardStep(data: User): string {
  // Step 1: Identidade (dateOfBirth, nationality)
  if (!data.dateOfBirth || !data.nationality) return 'identity';

  // Step 2: Contato (telefone)
  const hasPhone = (data.phoneNumbers?.length ?? 0) > 0 || !!data.phone;
  if (!hasPhone) return 'contact';

  // Step 3: Localização (país + cidade)
  if (!data.country || !data.city) return 'location';

  // Step 4: Profissional (departamento + cargo)
  if (!data.department || !data.position) return 'professional';

  // Step 5: Documentos (passaporte - obrigatório)
  const hasPassport = data.documents?.some(doc => doc.type === 'PASSPORT') ?? false;
  if (!hasPassport) return 'documents';

  // Tudo preenchido - volta para o primeiro passo
  return 'identity';
}
