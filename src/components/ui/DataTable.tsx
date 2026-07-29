/**
 * ============================================================================
 * DATA TABLE - Componente Reutilizável de Tabela de Dados
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * -------------------------
 * Tabela genérica e reutilizável que padroniza o visual de todas as listas
 * do sistema. Segue exatamente o estilo da tabela de projetos.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Colunas configuráveis com header e render customizado
 * - Estado de carregamento (spinner)
 * - Estado vazio com ícone e mensagem
 * - Paginação opcional com navegação
 * - Header opcional para ações (botões de criar, filtros, etc.)
 * - Suporte a sticky column (para ações)
 *
 * UTILIZAÇÃO:
 * -----------
 * <DataTable
 *   columns={[
 *     { header: 'Nome', render: (item) => <span>{item.name}</span> },
 *     { header: 'Email', render: (item) => <span>{item.email}</span> },
 *   ]}
 *   data={items}
 *   isLoading={loading}
 *   emptyIcon={FolderOpen}
 *   emptyMessage="Nenhum item encontrado"
 *   loadingMessage="Carregando..."
 * />
 * ============================================================================
 */

import type { LucideIcon } from 'lucide-react';
import { FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Define uma coluna da tabela.
 */
export interface DataTableColumn<T> {
  /** Texto do cabeçalho da coluna */
  header: string;
  /** Função que renderiza o conteúdo da célula para cada item */
  render: (item: T) => React.ReactNode;
  /** Alinhamento da coluna (padrão: left) */
  align?: 'left' | 'center' | 'right';
  /** Se true, a coluna fica fixa (sticky) ao scroll horizontal */
  sticky?: boolean;
  /** Largura mínima da coluna (ex: '120px') */
  minWidth?: string;
}

/**
 * Dados de paginação (opcional).
 */
export interface DataTablePagination {
  page: number;
  totalPages: number;
  total: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  /** Texto de paginação (ex: "Página 1 de 5 (20 projetos)") */
  paginationLabel?: string;
}

/**
 * Props do componente DataTable.
 */
interface DataTableProps<T> {
  /** Colunas da tabela */
  columns: DataTableColumn<T>[];
  /** Dados a exibir na tabela */
  data: T[];
  /** Se está em estado de carregamento */
  isLoading?: boolean;
  /** Ícone para o estado vazio (padrão: FolderOpen) */
  emptyIcon?: LucideIcon;
  /** Mensagem para o estado vazio */
  emptyMessage?: string;
  /** Mensagem para o estado de carregamento */
  loadingMessage?: string;
  /** Conteúdo opcional no header (botões, filtros, etc.) */
  headerContent?: React.ReactNode;
  /** Dados de paginação (opcional) */
  pagination?: DataTablePagination;
  /** Função para gerar a key de cada item (padrão: item.id) */
  getKey?: (item: T) => string;
}

/**
 * Componente DataTable - Tabela reutilizável com estilo padronizado.
 *
 * Usado em:
 * - ProjectsTable (lista de projetos)
 * - ProjectFilesTab (ficheiros do projeto)
 * - Qualquer outra lista/tabela do sistema
 */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyIcon: EmptyIcon = FolderOpen,
  emptyMessage = 'Nenhum item encontrado',
  loadingMessage = 'Carregando...',
  headerContent,
  pagination,
  getKey,
}: DataTableProps<T>) {
  /**
   * Resolve o alinhamento CSS da coluna.
   */
  function getAlignClass(align?: 'left' | 'center' | 'right') {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  }

  /**
   * Resolve o justify do conteúdo da célula.
   */
  function getJustifyClass(align?: 'left' | 'center' | 'right') {
    switch (align) {
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      default: return '';
    }
  }

  /**
   * Obtém a key de um item (usa item.id como fallback).
   */
  function resolveKey(item: T, index: number): string {
    if (getKey) return getKey(item);
    if (item && typeof item === 'object' && 'id' in item) return String((item as Record<string, unknown>).id);
    return String(index);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {isLoading ? (
        /* Estado de carregamento */
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">{loadingMessage}</p>
        </div>
      ) : !data.length ? (
        /* Estado vazio */
        <div className="p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <EmptyIcon size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Header com ações (opcional) */}
          {headerContent && (
            <div className="p-4 border-b border-gray-200 flex justify-end">
              {headerContent}
            </div>
          )}

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3 ${getAlignClass(col.align)} text-[11px] font-semibold text-gray-400 uppercase tracking-wider${col.sticky ? ' sticky right-0 bg-gray-100 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.04)] whitespace-nowrap' : ''}`}
                      style={col.sticky ? { width: '1%', minWidth: col.minWidth } : col.minWidth ? { minWidth: col.minWidth } : undefined}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((item, index) => (
                  <tr
                    key={resolveKey(item, index)}
                    className="group hover:bg-gray-50/80 transition-colors duration-100"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-5 py-3.5${col.sticky ? ' sticky right-0 bg-gray-50 group-hover:bg-gray-100/80 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.04)] whitespace-nowrap' : ''}`}
                        style={col.sticky ? { width: '1%' } : undefined}
                      >
                        <div className={getJustifyClass(col.align)}>
                          {col.render(item)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação (opcional) */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500">
                {pagination.paginationLabel}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-1.5 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-1.5 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
