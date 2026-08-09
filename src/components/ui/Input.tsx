/**
 * ============================================================================
 * INPUT COMPONENT - Campo de input reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de input compartilhado para formulários.
 * Usa o FormField para label/erro e a classe .form-input do CSS global
 * para garantir altura, borda e foco padronizados.
 *
 * COMO USAR?
 * ----------
 * <Input label="E-mail" type="email" value={email} onChange={...} />
 * <Input label="Senha" type="password" error="Senha é obrigatória" />
 *
 * PROPS:
 * ------
 * - label: texto exibido acima do campo
 * - error: mensagem de erro (opcional)
 * - hint: texto de ajuda (opcional)
 * - required: exibe asterisco no label
 * - ...rest: todas as props nativas do elemento <input>
 * ============================================================================
 */

import type { InputHTMLAttributes, Ref } from 'react';
import { FormField } from './FormField';

/**
 * Props do componente Input.
 * Herda todas as props nativas do elemento <input> do HTML.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Texto exibido acima do campo de input */
  label: string;
  /** Mensagem de erro exibida abaixo do campo (quando houver) */
  error?: string;
  /** Texto de ajuda exibido abaixo do campo (opcional) */
  hint?: string;
  /** Se true, exibe asterisco no label */
  required?: boolean;
  /** Ref encaminhada ao elemento <input> nativo */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Componente Input - Campo de formulário reutilizável.
 *
 * Usa a classe .form-input do CSS global para altura (40px),
 * borda, foco e transições padronizadas. O FormField cuida
 * do label e da mensagem de erro.
 */
export function Input({
  label,
  error,
  hint,
  required,
  className = '',
  id,
  ref,
  ...rest
}: InputProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        ref={ref}
        className={`form-input ${error ? 'error' : ''} ${className}`}
        {...rest}
      />
    </FormField>
  );
}
