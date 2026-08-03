/**
 * ============================================================================
 * PREDEFINED FUNCTIONS - Lista de Funções/Cargos Predefinidos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Lista de funções/cargos disponíveis para seleção ao criar ou editar um usuário.
 * Os valores são restritivos — o usuário deve escolher um cargo desta lista
 * ao invés de digitar livremente.
 *
 * POR QUE UMA LISTA?
 * ------------------
 * - Padronização dos dados no campo `position` do User
 * - Evita duplicatas e variações de escrita
 * - Facilita validações, filtros e relatórios
 * - Garante consistência organizacional
 * ============================================================================
 */

/**
 * Interface para uma função/cargo predefinido.
 */
export interface PredefinedFunction {
  id: string;    // Identificador único estável (usado como valor no select)
  label: string; // Nome em português exibido ao usuário
}

/**
 * Lista de funções/cargos predefinidos.
 * Ordenados hierarquicamente do maior nível de gestão para o menor.
 */
export const PREDEFINED_FUNCTIONS: PredefinedFunction[] = [
  { id: 'administrador',         label: 'Administrador' },
  { id: 'recursos-humanos',      label: 'Recursos Humanos' },
  { id: 'gerente-de-projetos',   label: 'Gerente de Projetos' },
  { id: 'gerente-de-site',       label: 'Gerente de Site' },
  { id: 'team-leader',           label: 'Team Leader' },
  { id: 'team-leader-l3',        label: 'Team Leader (L3)' },
  { id: 'l1',                    label: 'L1' },
  { id: 'l2',                    label: 'L2' },
  { id: 'l3',                    label: 'L3' },
];
