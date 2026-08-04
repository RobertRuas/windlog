/**
 * ============================================================================
 * FORM FIELD - Wrapper padronizado para campos de formulário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente wrapper que renderiza label + campo + mensagem de erro
 * de forma consistente em todos os formulários da aplicação.
 *
 * COMO USAR?
 * ----------
 * <FormField label="Nome" error="Obrigatório">
 *   <input className="form-input" />
 * </FormField>
 *
 * O FormField cuida do layout vertical, label acessível e exibição
 * de erros, enquanto o children é o campo em si (input, select, etc.)
 * ============================================================================
 */

import { type ReactNode, useId } from 'react';

/**
 * Props do componente FormField.
 */
interface FormFieldProps {
  /** Texto do label exibido acima do campo */
  label: string;
  /** Mensagem de erro exibida abaixo do campo (opcional) */
  error?: string;
  /** Texto de ajuda exibido abaixo do campo (opcional, não mostrado se houver erro) */
  hint?: string;
  /** Campo (input, select, textarea) renderizado entre label e erro */
  children: ReactNode;
  /** Classes CSS adicionais para o container externo */
  className?: string;
  /** Se true, exibe asterisco (*) no label indicando campo obrigatório */
  required?: boolean;
}

/**
 * Componente FormField - Wrapper padronizado para campos de formulário.
 *
 * Garante que todos os campos tenham:
 * - Label consistente com tamanho e cor padronizados
 * - ID automático para acessibilidade (label htmlFor ↔ input id)
 * - Mensagem de erro com estilo uniforme
 * - Espaçamento vertical uniforme entre os elementos
 */
export function FormField({
  label,
  error,
  hint,
  children,
  className = '',
  required,
}: FormFieldProps) {
  const autoId = useId();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Label acessível — conectado ao campo via htmlFor/id */}
      <label htmlFor={autoId} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Campo (input, select, textarea) — recebe o id automaticamente */}
      <div>
        {children}
      </div>

      {/* Mensagem de erro — prioridade sobre a hint */}
      {error && (
        <span className="form-error">{error}</span>
      )}

      {/* Hint — exibida apenas quando não há erro */}
      {!error && hint && (
        <span className="text-xs text-gray-400 mt-1">{hint}</span>
      )}
    </div>
  );
}
