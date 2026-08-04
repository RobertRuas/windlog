/**
 * ============================================================================
 * BUTTON COMPONENT - Botão reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de botão compartilhado que pode ser usado em qualquer lugar
 * da aplicação. Usa as classes .form-button do CSS global para garantir
 * altura (40px) e consistência com os demais elementos de formulário.
 *
 * COMO USAR?
 * ----------
 * <Button onClick={handleClick}>Salvar</Button>
 * <Button variant="secondary" disabled>Desabilitado</Button>
 * <Button variant="danger">Eliminar</Button>
 *
 * PROPS:
 * ------
 * - children: conteúdo do botão (texto, ícone, etc.)
 * - variant: estilo visual ('primary' | 'secondary' | 'danger')
 * - size: tamanho ('sm' | 'md')
 * - type: tipo HTML ('button' | 'submit' | 'reset')
 * - disabled: desabilita o botão
 * - loading: exibe spinner e desabilita
 * - fullWidth: ocupa 100% da largura
 * - ...rest: outras props HTML padrão de <button>
 * ============================================================================
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Props do componente Button.
 * Herda todas as props nativas do elemento <button> do HTML.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Conteúdo exibido dentro do botão (texto, ícones, etc.) */
  children: ReactNode;
  /** Estilo visual do botão */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Tamanho do botão: 'sm' (compacto) ou 'md' (padrão 40px) */
  size?: 'sm' | 'md';
  /** Se true, exibe spinner de carregamento */
  loading?: boolean;
  /** Se true, ocupa 100% da largura do container */
  fullWidth?: boolean;
}

/**
 * Componente Button - Botão reutilizável com variantes de estilo.
 *
 * A altura é sempre 40px (padrão) para alinhar com Input e Select.
 * O border-radius segue o token --form-radius do design system.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  loading,
  fullWidth,
  className = '',
  ...rest
}: ButtonProps) {
  /**
   * Mapeia a variante para classes CSS do Tailwind.
   * A base é a classe .form-button do CSS global (altura, padding, fonte).
   */
  const variantClasses = {
    primary: 'form-button form-button-primary',
    secondary: 'form-button form-button-secondary',
    danger: 'form-button form-button-danger',
  };

  /**
   * Tamanhos — 'md' usa a altura padrão 40px do .form-button,
   * 'sm' é uma versão mais compacta.
   */
  const sizeClasses = {
    sm: 'h-[32px] px-3 text-xs',
    md: '',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      {...rest}
    >
      {/* Spinner de loading */}
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
