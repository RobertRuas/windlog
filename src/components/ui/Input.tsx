/**
 * ============================================================================
 * INPUT COMPONENT - Campo de input reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de input compartilhado para formulários.
 * Inclui label, placeholder e tratamento de erros visual.
 *
 * COMO USAR?
 * ----------
 * <Input
 *   label="E-mail"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="seu@email.com"
 * />
 *
 * <Input
 *   label="Senha"
 *   type="password"
 *   error="Senha é obrigatória"
 * />
 *
 * PROPS:
 * ------
 * - label: texto exibido acima do campo
 * - error: mensagem de erro exibida abaixo do campo (opcional)
 * - ...rest: todas as props nativas do elemento <input>
 * ============================================================================
 */

import type { InputHTMLAttributes } from 'react';

/**
 * Define as propriedades aceitas pelo componente Input.
 * Herda todas as props nativas do elemento <input> do HTML.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Texto exibido acima do campo de input */
  label: string;
  /** Mensagem de erro exibida abaixo do campo (quando houver) */
  error?: string;
}

/**
 * Componente Input - Campo de formulário reutilizável.
 *
 * Exibe um label acima do campo e uma mensagem de erro abaixo
 * quando a prop 'error' é fornecida.
 */
export function Input({
  label,
  error,
  className = '',
  id,
  ...rest
}: InputProps) {
  /**
   * Gera um ID único para o campo se não for fornecido.
   * O ID conecta o label ao input (acessibilidade).
   */
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {/* Label do campo - clicável e acessível */}
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* Campo de input com borda vermelha quando há erro */}
      <input
        id={inputId}
        className={`
          px-3 py-2 rounded-lg border text-sm
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `.trim()}
        {...rest}
      />

      {/* Mensagem de erro exibida apenas quando há um erro */}
      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
