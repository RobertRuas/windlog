/**
 * ============================================================================
 * DATA TABLE - Componente Profissional de Tabela de Dados
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * -------------------------
 * Tabela genérica e reutilizável que padroniza o visual de todas as listas
 * do sistema. Design profissional inspirado no estilo Apple.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Colunas configuráveis com header e render customizado
 * - Ordenação por coluna (opcional, com indicadores visuais)
 * - Paginação profissional com números de página
 * - Estado de carregamento (spinner)
 * - Estado vazio com ícone e mensagem
 * - Header opcional para ações (botões de criar, filtros, etc.)
 * - Suporte a sticky column (para ações)
 * - Linhas clicáveis (opcional)
 * - Todas as funcionalidades são opt-in (máxima flexibilidade)
 *
 * UTILIZAÇÃO:
 * -----------
 * // Simples (sem ordenação, sem paginação)
 * <DataTable columns={columns} data={items} />
 *
 * // Com paginação
 * <DataTable columns={columns} data={items} pagination={{ ... }} />
 *
 * // Com ordenação
 * <DataTable
 *   columns={[{ header: 'Nome', render: ..., sortable: true, sortKey: 'name' }]}
 *   data={items}
 *   sort={{ key: 'name', direction: 'asc', onSort: handleSort }}
 * />
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileListView } from './MobileListView';

// ─── Tipos ──────────────────────────────────────────────────────────────────

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
  /** Se true, a coluna é ordenável (exibe ícone de ordenação) */
  sortable?: boolean;
  /** Chave usada para ordenação (identificador da coluna) */
  sortKey?: string;
  /** Opções de exibição apenas na lista mobile (não afetam a tabela PC) */
  mobile?: {
    /** Se true, o valor vira subtítulo logo abaixo do título (sem rótulo) */
    asSubtitle?: boolean;
    /** Se true, oculta o rótulo na área de detalhes da lista */
    hideLabel?: boolean;
    /** Ordem entre subtítulos (menor aparece primeiro; padrão 0) */
    order?: number;
  };
}

/**
 * Configuração de ordenação externa (controlada pelo pai).
 */
export interface DataTableSort {
  /** Chave da coluna atualmente ordenada */
  key: string | null;
  /** Direção da ordenação */
  direction: 'asc' | 'desc' | null;
  /** Callback chamado ao clicar num header ordenável */
  onSort: (key: string, direction: 'asc' | 'desc') => void;
}

/**
 * Dados de paginação (opcional).
 */
export interface DataTablePagination {
  /** Página atual (1-based) */
  page: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de registros */
  total: number;
  /** Se existe página anterior */
  hasPreviousPage: boolean;
  /** Se existe próxima página */
  hasNextPage: boolean;
  /** Callback ao mudar de página */
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
  /** Configuração de ordenação externa (opcional) */
  sort?: DataTableSort;
  /** Se true, habilita ordenação interna (client-side) — usa sortKey das colunas */
  clientSort?: boolean;
  /** Função para gerar a key de cada item (padrão: item.id) */
  getKey?: (item: T) => string;
  /** Callback ao clicar numa linha (opcional) */
  onRowClick?: (item: T) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────

/**
 * Componente DataTable - Tabela profissional reutilizável.
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
  sort,
  clientSort = false,
  getKey,
  onRowClick,
}: DataTableProps<T>) {
  // Modo mobile → renderiza a lista nativa (MobileListView) em vez da tabela.
  // A deteção combina dispositivo (User-Agent) + largura mínima do ecrã.
  const isMobile = useIsMobile();

  // Estado para ordenação client-side (quando clientSort = true)
  const [localSort, setLocalSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  // Determina qual configuração de ordenação usar
  const activeSort = sort ?? (clientSort ? localSort : null);

  /**
   * Handle clique no header de coluna ordenável.
   */
  function handleSortClick(col: DataTableColumn<T>) {
    if (!col.sortable || !col.sortKey) return;

    if (sort) {
      // Ordenação externa (controlada pelo pai)
      const newDirection = (sort.key === col.sortKey && sort.direction === 'asc') ? 'desc' : 'asc';
      sort.onSort(col.sortKey, newDirection);
    } else if (clientSort) {
      // Ordenação interna (client-side)
      setLocalSort((prev) => ({
        key: col.sortKey!,
        direction: (prev.key === col.sortKey && prev.direction === 'asc') ? 'desc' : 'asc',
      }));
    }
  }

  /**
   * Dados ordenados (apenas para clientSort).
   */
  const sortedData = useMemo(() => {
    if (!clientSort || !localSort.key) return data;
    const col = columns.find((c) => c.sortKey === localSort.key);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const aVal = getSortValue(a, localSort.key);
      const bVal = getSortValue(b, localSort.key);
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return localSort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, clientSort, localSort, columns]);

  /**
   * Extrai valor de ordenação de um item por chave.
   */
  function getSortValue(item: T, key: string): string {
    if (item && typeof item === 'object' && key in item) {
      const val = (item as Record<string, unknown>)[key];
      return String(val ?? '');
    }
    return '';
  }

  /**
   * Renderiza o indicador de ordenação num header.
   */
  function renderSortIndicator(col: DataTableColumn<T>) {
    if (!col.sortable) return null;

    const isActive = activeSort && col.sortKey === activeSort.key;

    if (isActive && activeSort.direction) {
      return activeSort.direction === 'asc'
        ? <ChevronUp size={14} className="text-blue-600" />
        : <ChevronDown size={14} className="text-blue-600" />;
    }

    return <ArrowUpDown size={13} className="text-gray-300" />;
  }

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

  // Dados a exibir (ordenados se clientSort, ou originais)
  const displayData = clientSort ? sortedData : data;

  // ── Modo mobile: lista nativa (a tabela de PC permanece intacta abaixo) ──
  if (isMobile) {
    return (
      <MobileListView
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        emptyIcon={EmptyIcon}
        emptyMessage={emptyMessage}
        loadingMessage={loadingMessage}
        headerContent={headerContent}
        pagination={pagination}
        sort={sort}
        getKey={getKey}
        onRowClick={onRowClick}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {isLoading ? (
        /* Estado de carregamento */
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">{loadingMessage}</p>
        </div>
      ) : !displayData.length ? (
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
                  {columns.map((col, i) => {
                    const isSortable = col.sortable && col.sortKey;
                    return (
                      <th
                        key={i}
                        className={[
                          col.sticky ? 'sticky right-0 bg-gray-100 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.04)] whitespace-nowrap px-3' : 'px-5',
                          'py-3',
                          getAlignClass(col.align),
                          'text-[11px] font-semibold text-gray-400 uppercase tracking-wider',
                          isSortable ? 'cursor-pointer select-none hover:text-gray-600 transition-colors' : '',
                        ].join(' ')}
                        style={col.sticky ? { width: '1%' } : col.minWidth ? { minWidth: col.minWidth } : undefined}
                        onClick={isSortable ? () => handleSortClick(col) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.header}
                          {renderSortIndicator(col)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayData.map((item, index) => (
                  <tr
                    key={resolveKey(item, index)}
                    className={[
                      'group hover:bg-gray-50/80 transition-colors duration-100',
                      onRowClick ? 'cursor-pointer' : '',
                    ].join(' ')}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`${col.sticky ? 'sticky right-0 bg-gray-50 group-hover:bg-gray-100/80 z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.04)] whitespace-nowrap px-3' : 'px-5'} py-3.5`}
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
