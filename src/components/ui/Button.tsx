/**
 * ============================================================================
 * BUTTON COMPONENT - Botão reutilizável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de botão compartilhado que pode ser usado em qualquer lugar
 * da aplicação. Mantém consistência visual e facilita manutenção.
 *
 * COMO USAR?
 * ----------
 * <Button onClick={handleClick}>Clique aqui</Button>
 * <Button variant="secondary" disabled>Desabilitado</Button>
 *
 * PROPS:
 * ------
 * - children: conteúdo do botão (texto, ícone, etc.)
 * - variant: estilo visual ('primary' | 'secondary')
 * - type: tipo do botão HTML ('button' | 'submit' | 'reset')
 * - disabled: desabilita o botão
 * - onClick: função executada ao clicar
 * - className: classes CSS adicionais (Tailwind)
 * - ...rest: outras props HTML padrão de <button>
 * ============================================================================
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Define as propriedades aceitas pelo componente Button.
 * Herda todas as props nativas do elemento <button> do HTML.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Conteúdo exibido dentro do botão (texto, ícones, etc.) */
  children: ReactNode;
  /** Estilo visual do botão: 'primary' (azul) ou 'secondary' (cinza) */
  variant?: 'primary' | 'secondary';
  /** Tamanho do botão: 'sm' (compacto) ou 'md' (padrão) */
  size?: 'sm' | 'md';
}

/**
 * Componente Button - Botão reutilizável com variantes de estilo.
 *
 * O botão usa Tailwind CSS para estilização e aceita todas as props
 * nativas do HTML <button>, como disabled, type, onClick, etc.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  /**
   * Mapeia a variante para classes CSS do Tailwind.
   * Cada variante tem estilos diferentes para os estados normal, hover e disabled.
   */
  const variantClasses = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary:
      'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
  };

  /**
   * Mapeia o tamanho para classes CSS do Tailwind.
   */
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        rounded-lg font-medium
        transition-colors duration-200
        disabled:cursor-not-allowed
        inline-flex items-center justify-center
        whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
