/**
 * ============================================================================
 * SELECT COMPONENT - Dropdown reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de dropdown (select) compartilhado para formulários.
 * Usa o FormField para label/erro e a classe .form-select do CSS global
 * para garantir altura idêntica ao Input (40px) e alinhamento perfeito.
 *
 * COMO USAR?
 * ----------
 * <Select label="País" value={country} onChange={...}>
 *   <option value="">Selecione</option>
 *   <option value="PT">Portugal</option>
 *   <option value="BR">Brasil</option>
 * </Select>
 *
 * PROPS:
 * ------
 * - label: texto exibido acima do campo
 * - error: mensagem de erro (opcional)
 * - hint: texto de ajuda (opcional)
 * - required: exibe asterisco no label
 * - ...rest: todas as props nativas do elemento <select>
 * ============================================================================
 */

import type { SelectHTMLAttributes } from 'react';
import { FormField } from './FormField';

/**
 * Props do componente Select.
 * Herda todas as props nativas do elemento <select> do HTML.
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Texto exibido acima do dropdown */
  label: string;
  /** Mensagem de erro exibida abaixo do campo (quando houver) */
  error?: string;
  /** Texto de ajuda exibido abaixo do campo (opcional) */
  hint?: string;
  /** Se true, exibe asterisco no label */
  required?: boolean;
}

/**
 * Componente Select - Dropdown reutilizável com estilo padronizado.
 *
 * Usa a classe .form-select do CSS global para altura (40px),
 * borda, foco e seta customizada. A altura é idêntica ao Input
 * para garantir alinhamento visual em formulários.
 */
export function Select({
  label,
  error,
  hint,
  required,
  className = '',
  id,
  children,
  ...rest
}: SelectProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        className={`form-select ${error ? 'error' : ''} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FormField>
  );
}
