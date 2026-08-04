/**
 * ============================================================================
 * TEXTAREA COMPONENT - Campo de texto multilinha reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de textarea compartilhado para formulários.
 * Usa o FormField para label/erro e a classe .form-textarea do CSS global
 * para garantir consistência visual com Input e Select.
 *
 * COMO USAR?
 * ----------
 * <Textarea label="Observações" value={text} onChange={...} />
 *
 * PROPS:
 * ------
 * - label: texto exibido acima do campo
 * - error: mensagem de erro (opcional)
 * - hint: texto de ajuda (opcional)
 * - required: exibe asterisco no label
 * - ...rest: todas as props nativas do elemento <textarea>
 * ============================================================================
 */

import type { TextareaHTMLAttributes } from 'react';
import { FormField } from './FormField';

/**
 * Props do componente Textarea.
 * Herda todas as props nativas do elemento <textarea> do HTML.
 */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Texto exibido acima do campo */
  label: string;
  /** Mensagem de erro exibida abaixo do campo (quando houver) */
  error?: string;
  /** Texto de ajuda exibido abaixo do campo (opcional) */
  hint?: string;
  /** Se true, exibe asterisco no label */
  required?: boolean;
}

/**
 * Componente Textarea - Campo multilinha reutilizável.
 *
 * Usa a classe .form-textarea do CSS global para borda, foco
 * e resize. A largura é 100% para preencher o container,
 * alinhando com Input e Select.
 */
export function Textarea({
  label,
  error,
  hint,
  required,
  className = '',
  id,
  ...rest
}: TextareaProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        className={`form-textarea ${error ? 'error' : ''} ${className}`}
        {...rest}
      />
    </FormField>
  );
}
