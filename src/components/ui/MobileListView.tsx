/**
 * ============================================================================
 * MOBILE LIST VIEW - Versão mobile nativa do DataTable
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Renderização alternativa do DataTable para o modo mobile, com aparência
 * de aplicação nativa (lista estilo iOS): cada registro vira um item de
 * lista com título, campos secundários no formato rótulo/valor e ações
 * à direita.
 *
 * MAPEAMENTO COLUNAS → LISTA:
 * ---------------------------
 * - 1.ª coluna          → título do item
 * - Coluna sticky       → ações (exibidas à direita do título)
 * - Restantes colunas   → pares rótulo/valor abaixo do título
 *
 * IMPORTANTE: a versão PC (tabela) permanece exatamente igual — este
 * componente só é usado quando o hook useIsMobile indica modo mobile.
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

import type { DataTableColumn, DataTablePagination, DataTableSort } from './DataTable';

// ─── Tipos ──────────────────────────────────────────────────────────────────

/**
 * Props da lista mobile (mesma API do DataTable).
 */
interface MobileListViewProps<T> {
  /** Colunas (mapeadas para título/campos/ações) */
  columns: DataTableColumn<T>[];
  /** Dados a exibir */
  data: T[];
  /** Estado de carregamento */
  isLoading?: boolean;
  /** Ícone do estado vazio */
  emptyIcon?: LucideIcon;
  /** Mensagem do estado vazio */
  emptyMessage?: string;
  /** Mensagem de carregamento */
  loadingMessage?: string;
  /** Conteúdo do header (botões, filtros) */
  headerContent?: React.ReactNode;
  /** Paginação */
  pagination?: DataTablePagination;
  /** Ordenação externa */
  sort?: DataTableSort;
  /** Ordenação interna (client-side) */
  clientSort?: boolean;
  /** Função para gerar a key de cada item */
  getKey?: (item: T) => string;
  /** Callback ao tocar num item */
  onRowClick?: (item: T) => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────

/**
 * Componente MobileListView — lista nativa para o modo mobile.
 */
export function MobileListView<T>({
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
}: MobileListViewProps<T>) {
  // Estado para ordenação client-side (idêntico ao do DataTable)
  const [localSort, setLocalSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'asc',
  });

  // Ordenação ativa (externa ou interna)
  const activeSort = sort ?? (clientSort ? localSort : null);

  /**
   * Alterna a ordenação ao tocar num chip.
   */
  function handleSortClick(col: DataTableColumn<T>) {
    if (!col.sortable || !col.sortKey) return;

    if (sort) {
      const newDirection = (sort.key === col.sortKey && sort.direction === 'asc') ? 'desc' : 'asc';
      sort.onSort(col.sortKey, newDirection);
    } else if (clientSort) {
      setLocalSort((prev) => ({
        key: col.sortKey!,
        direction: (prev.key === col.sortKey && prev.direction === 'asc') ? 'desc' : 'asc',
      }));
    }
  }

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
   * Dados ordenados (apenas para clientSort).
   */
  const sortedData = useMemo(() => {
    if (!clientSort || !localSort.key) return data;
    const col = columns.find((c) => c.sortKey === localSort.key);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const cmp = String(getSortValue(a, localSort.key)).localeCompare(
        String(getSortValue(b, localSort.key)),
        undefined,
        { numeric: true },
      );
      return localSort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, clientSort, localSort, columns]);

  // Dados a exibir
  const displayData = clientSort ? sortedData : data;

  // ── Mapeamento das colunas para o formato de lista nativa ──
  // 1.ª coluna = título | coluna sticky = ações | restantes = subtítulo ou detalhes
  const titleCol = columns[0];
  const actionCol = columns.find((c) => c.sticky);
  const restCols = columns.slice(1).filter((c) => !c.sticky);
  // Colunas marcadas como subtítulo: exibidas logo abaixo do título, sem rótulo
  // (ordenadas por mobile.order, preservando a ordem das colunas em empate)
  const subtitleCols = restCols
    .filter((c) => c.mobile?.asSubtitle)
    .sort((a, b) => (a.mobile?.order ?? 0) - (b.mobile?.order ?? 0));
  // Demais colunas: área de detalhes (grelha ou linha de badges sem rótulo)
  const detailCols = restCols.filter((c) => !c.mobile?.asSubtitle);
  // Se todos os detalhes dispensam rótulo (ex.: badges), exibir em linha
  const allDetailsLabelless = detailCols.length > 0 && detailCols.every((c) => c.mobile?.hideLabel);
  const sortableCols = columns.filter((c) => c.sortable && c.sortKey);

  /**
   * Obtém a key de um item (usa item.id como fallback).
   */
  function resolveKey(item: T, index: number): string {
    if (getKey) return getKey(item);
    if (item && typeof item === 'object' && 'id' in item) return String((item as Record<string, unknown>).id);
    return String(index);
  }

  return (
    <div className="space-y-3">
      {/* Header com ações (opcional) — ocupa toda a largura no mobile */}
      {headerContent && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {headerContent}
        </div>
      )}

      {/* Chips de ordenação (estilo nativo, scroll horizontal) */}
      {sortableCols.length > 0 && !isLoading && displayData.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {sortableCols.map((col) => {
            const activeDirection = activeSort && activeSort.key === col.sortKey
              ? activeSort.direction
              : null;
            return (
              <button
                key={col.sortKey}
                onClick={() => handleSortClick(col)}
                className={`
                  shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-colors active:scale-95
                  ${activeDirection
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-[#1c1c1e] text-gray-600 dark:text-[#a1a1a6] border border-gray-200 dark:border-[#38383a]'}
                `}
              >
                {col.header}
                {activeDirection ? (
                  activeDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                ) : (
                  <ArrowUpDown size={12} className="text-gray-400 dark:text-[#636366]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Container da lista */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden shadow-sm">
        {isLoading ? (
          /* Estado de carregamento */
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500 dark:text-[#a1a1a6]">{loadingMessage}</p>
          </div>
        ) : !displayData.length ? (
          /* Estado vazio */
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-[#2c2c2e] flex items-center justify-center">
              <EmptyIcon size={28} className="text-gray-300 dark:text-[#636366]" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7]">{emptyMessage}</p>
          </div>
        ) : (
          /* Lista de itens (estilo nativo: separadores recuados tipo iOS,
             aplicados pela classe mobile-list-inset no CSS global) */
          <div className="mobile-list-inset">
            {displayData.map((item, index) => (
              <div
                key={resolveKey(item, index)}
                className={`px-4 py-3 transition-colors ${
                  onRowClick
                    ? 'cursor-pointer active:bg-gray-100 dark:active:bg-[#2c2c2e]'
                    : ''
                }`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {/* Linha principal: título + ações (+ chevron se a linha navega).
                 * Tipografia seguindo convenções nativas: título 16px semibold,
                 * conteúdo secundário 14px e terciário 13px.
                 * As ações usam mobile-list-actions para alvo de toque de 44px. */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 text-[16px] font-semibold text-gray-900 dark:text-[#f5f5f7]">
                    {titleCol.render(item)}
                  </div>
                  {/* Ações (coluna sticky da tabela) à direita, centradas verticalmente */}
                  {actionCol && (
                    <div
                      className="mobile-list-actions flex items-center shrink-0 -my-2 -mr-2"
                      onClick={(e) => {
                        // Impede que ações dispararem o clique do item
                        if (onRowClick) e.stopPropagation();
                      }}
                    >
                      {actionCol.render(item)}
                    </div>
                  )}
                  {/* Chevron de navegação — affordance nativo quando a linha é clicável */}
                  {onRowClick && (
                    <ChevronRight size={16} className="shrink-0 text-gray-300 dark:text-[#48484a]" />
                  )}
                </div>

                {/* Subtítulos: exibidos logo abaixo do título, sem rótulo
                 * (ex.: e-mail, cargo) — padrão nativo tipo app de contatos */}
                {subtitleCols.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {subtitleCols.map((col, colIndex) => (
                      /* whitespace-normal nos spans internos permite que
                       * valores longos (ex.: e-mail) quebrem em vez de transbordar */
                      <div key={colIndex} className="text-[14px] text-gray-500 dark:text-[#a1a1a6] [&_span]:whitespace-normal">
                        {col.render(item)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Campos secundários. Se todos dispensam rótulo (badges),
                 * são exibidos em linha para aproveitar melhor o espaço;
                 * caso contrário, grelha compacta de 2 colunas com rótulo
                 * por cima do valor. */}
                {detailCols.length > 0 && (
                  allDetailsLabelless ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {detailCols.map((col, colIndex) => (
                        <div key={colIndex}>{col.render(item)}</div>
                      ))}
                    </div>
                  ) : (
                    <div className={`mt-2.5 grid gap-x-4 gap-y-2 ${
                      detailCols.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                    }`}>
                      {detailCols.map((col, colIndex) => (
                        <div key={colIndex} className="min-w-0">
                          {/* Rótulo pequeno em maiúsculas (pode ser ocultado por coluna) */}
                          {!col.mobile?.hideLabel && (
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366] mb-0.5 truncate">
                              {col.header}
                            </div>
                          )}
                          {/* Valor */}
                          <div className="text-[13px] text-gray-800 dark:text-[#e5e5ea] break-words">
                            {col.render(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Paginação — barra inferior com alvos de toque maiores */}
        {pagination && pagination.totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-[#2c2c2e] bg-gray-50/50 dark:bg-[#161617]">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-[#a1a1a6] active:bg-gray-200 dark:active:bg-[#2c2c2e] rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-gray-500 dark:text-[#a1a1a6]">
              {pagination.paginationLabel}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-[#a1a1a6] active:bg-gray-200 dark:active:bg-[#2c2c2e] rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
