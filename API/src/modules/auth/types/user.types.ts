/**
 * ============================================================================
 * USER TYPES - Tipos e Enums Relacionados ao Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define enums e tipos TypeScript que espelham os enums do schema.prisma.
 * Usado para type-safety nos DTOs e services.
 *
 * IMPORTANTE:
 * -----------
 * Estes enums devem ser mantidos em sincronia com o schema.prisma.
 * ============================================================================
 */

/**
 * Enum: Nível de Proficiência em Idiomas (escala CEFR)
 *
 * Escala oficial do Common European Framework of Reference for Languages:
 * - A1: Iniciante
 * - A2: Básico
 * - B1: Intermediário
 * - B2: Intermediário Superior
 * - C1: Avançado
 * - C2: Proficiente
 * - NATIVE: Nativo
 */
export enum LanguageLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  NATIVE = 'NATIVE',
}

/**
 * Enum: Tipo de Certificação
 *
 * Classifica o tipo de certificação/cursos dos funcionários:
 * - CERTIFICATION: Certificação profissional (ex: GWO BST)
 * - DIPLOMA: Diploma acadêmico
 * - COURSE: Curso de formação
 * - TRAINING: Treinamento interno
 * - LICENSE: Licença profissional
 */
export enum CertificationType {
  CERTIFICATION = 'CERTIFICATION',
  DIPLOMA = 'DIPLOMA',
  COURSE = 'COURSE',
  TRAINING = 'TRAINING',
  LICENSE = 'LICENSE',
}
