/**
 * Componente PageHeader - Cabeçalho padronizado para todas as páginas.
 *
 * Garante consistência visual de título, subtítulo e ações em todo o sistema.
 * Inclui separador discreto entre o cabeçalho e o conteúdo.
 *
 * Uso:
 *   <PageHeader title={t('title')} subtitle={t('subtitle')} />
 *   <PageHeader title={t('title')} subtitle={t('subtitle')} actions={<Button>Novo</Button>} />
 */

import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Título principal da página */
  title: string;
  /** Breve descrição abaixo do título (opcional) */
  subtitle?: string;
  /** Botões ou ações no lado direito do cabeçalho (opcional) */
  actions?: ReactNode;
  /** Exibe separador abaixo do cabeçalho (padrão: true) */
  showSeparator?: boolean;
}

export function PageHeader({ title, subtitle, actions, showSeparator = true }: PageHeaderProps) {
  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1">{actions}</div>
        )}
      </div>

      {/* Separador discreto */}
      {showSeparator && (
        <div className="h-px bg-gray-200 mb-6" />
      )}
    </>
  );
}
