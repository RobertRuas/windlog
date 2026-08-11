/**
 * ============================================================================
 * MOBILE LIST VIEW - Lista Mobile Estilo iOS
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * -------------------------
 * Substituto mobile da DataTable. Em vez de uma tabela horizontal
 * (impraticável em ecrãs pequenos), renderiza uma lista vertical
 * estilo nativo iOS com:
 *
 * - Cards com título + subtítulo (campos configuráveis)
 * - Grid de label/valor para informação secundária
 * - Badges (opcional, com hideLabel para ícones de estado)
 * - Ações por item (botões touch-friendly)
 * - Chips de ordenação (se aplicável)
 * - Paginação touch-friendly
 *
 * UTILIZAÇÃO:
 * -----------
 * <MobileListView
 *   data={items}
 *   titleField="name"
 *   subtitleField="email"
 *   fields={[{ key: 'role', label: 'Role' }]}
 *   onItemPress={handlePress}
 * />
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Search, Filter, Plus } from 'lucide-react';
import type { DataTableToolbar } from './DataTable';

// ─── Tipos ──────────────────────────────────────────────────────────────────

/**
 * Define um campo visível na lista mobile.
 */
export interface MobileListField<T> {
  /** Chave do campo no objeto (ex: 'role') */
  key: string;
  /** Label exibido (ex: 'Cargo') */
  label: string;
  /** Se true, mostra apenas o valor sem o label (para badges) */
  hideLabel?: boolean;
  /** Render customizado do campo */
  render?: (item: T) => React.ReactNode;
}

/**
 * Define uma ação disponível para cada item.
 */
export interface MobileListAction<T> {
  /** Ícone da ação (Lucide) */
  icon: LucideIcon;
  /** Label acessível */
  label: string;
  /** Cor do ícone */
  color?: string;
  /** Callback ao tocar na ação */
  onPress: (item: T) => void;
}

/**
 * Configuração de ordenação.
 */
export interface MobileListSort {
  key: string;
  direction: 'asc' | 'desc' | null;
  onSort: (key: string, direction: 'asc' | 'desc') => void;
}

/**
 * Props do MobileListView.
 */
interface MobileListViewProps<T> {
  /** Dados a exibir */
  data: T[];
  /** Campo usado como título principal */
  titleField: string;
  /** Campo usado como subtítulo (opcional) */
  subtitleField?: string;
  /** Campos secundários exibidos como label/valor */
  fields?: MobileListField<T>[];
  /** Ações disponíveis por item */
  actions?: MobileListAction<T>[];
  /** Callback ao tocar num item (abre detalhe) */
  onItemPress?: (item: T) => void;
  /** Se está em carregamento */
  isLoading?: boolean;
  /** Ícone para estado vazio */
  emptyIcon?: LucideIcon;
  /** Mensagem para estado vazio */
  emptyMessage?: string;
  /** Mensagem de carregamento */
  loadingMessage?: string;
  /** Conteúdo de header (botões, filtros) */
  headerContent?: React.ReactNode;
  /** Paginação */
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPageChange: (page: number) => void;
    paginationLabel?: string;
  };
  /** Ordenação */
  sort?: MobileListSort;
  /** Colunas ordenáveis (para chips) */
  sortableColumns?: { key: string; label: string }[];
  /** Função para gerar key */
  getKey?: (item: T) => string;
  /** Toolbar integrada (pesquisa + filtros + adicionar) */
  toolbar?: DataTableToolbar;
}

// ─── Componente ─────────────────────────────────────────────────────────────

/**
 * Componente MobileListView - lista estilo iOS para ecrãs pequenos.
 */
export function MobileListView<T>({
  data,
  titleField,
  subtitleField,
  fields = [],
  actions = [],
  onItemPress,
  isLoading = false,
  emptyIcon: EmptyIcon = FolderOpen,
  emptyMessage = 'Nenhum item encontrado',
  loadingMessage = 'Carregando...',
  headerContent,
  pagination,
  sort,
  sortableColumns,
  getKey,
  toolbar,
}: MobileListViewProps<T>) {
  /**
   * Obtém o valor de um campo de um item.
   */
  function getFieldValue(item: T, key: string): string {
    if (item && typeof item === 'object' && key in item) {
      return String((item as Record<string, unknown>)[key] ?? '');
    }
    return '';
  }

  /**
   * Obtém a key de um item.
   */
  function resolveKey(item: T, index: number): string {
    if (getKey) return getKey(item);
    if (item && typeof item === 'object' && 'id' in item) return String((item as Record<string, unknown>).id);
    return String(index);
  }

  /**
   * Renderiza indicador de ordenação.
   */
  function renderSortIndicator(colKey: string) {
    if (!sort) return null;
    const isActive = sort.key === colKey;

    if (isActive && sort.direction) {
      return sort.direction === 'asc'
        ? <ChevronUp size={14} className="text-blue-600" />
        : <ChevronDown size={14} className="text-blue-600" />;
    }
    return <ArrowUpDown size={13} className="text-gray-300" />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* ── Toolbar integrada (pesquisa + filtros + adicionar) ── */}
      {toolbar && (
        <div className="px-4 pt-4 pb-3 space-y-3">
          {/* Linha principal: pesquisa + filtro + adicionar */}
          <div className="flex items-center gap-2">
            {/* Campo de pesquisa com ícone de filtro */}
            <div className="relative flex-1 h-10">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={toolbar.searchValue}
                onChange={(e) => toolbar.onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && toolbar.onSearch?.()}
                placeholder={toolbar.searchPlaceholder}
                className="w-full h-full text-sm pl-8 pr-10 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {toolbar.filters && (
                <button
                  type="button"
                  onClick={toolbar.onToggleFilters}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
                    toolbar.showFilters || toolbar.hasActiveFilters
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#a1a1a6]'
                  }`}
                >
                  <Filter size={15} />
                </button>
              )}
            </div>

            {/* Botão adicionar (apenas se onAdd definido) */}
            {toolbar.onAdd && toolbar.addLabel && (
              <button
                type="button"
                onClick={toolbar.onAdd}
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                title={toolbar.addLabel}
                aria-label={toolbar.addLabel}
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {/* Painel de filtros (quando aberto) */}
          {toolbar.showFilters && toolbar.filters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-[#38383a]">
              {toolbar.filters}
            </div>
          )}
        </div>
      )}

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
          {/* Header com ações */}
          {headerContent && (
            <div className="p-4 border-b border-gray-200 flex justify-end">
              {headerContent}
            </div>
          )}

          {/* Chips de ordenação (se houver colunas ordenáveis) */}
          {sortableColumns && sortableColumns.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto">
              {sortableColumns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => {
                    if (!sort) return;
                    const newDir = (sort.key === col.key && sort.direction === 'asc') ? 'desc' : 'asc';
                    sort.onSort(col.key, newDir);
                  }}
                  className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap
                    ${sort?.key === col.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  {col.label}
                  {renderSortIndicator(col.key)}
                </button>
              ))}
            </div>
          )}

          {/* Lista de itens */}
          <div className="divide-y divide-gray-100">
            {data.map((item, index) => {
              const title = getFieldValue(item, titleField);
              const subtitle = subtitleField ? getFieldValue(item, subtitleField) : undefined;

              return (
                <div
                  key={resolveKey(item, index)}
                  className={`p-4 ${onItemPress ? 'active:bg-gray-50 cursor-pointer' : ''}`}
                  onClick={() => onItemPress?.(item)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Título + Subtítulo */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                      {subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
                      )}
                    </div>

                    {/* Ações */}
                    {actions.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {actions.map((action, i) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={i}
                              onClick={() => action.onPress(item)}
                              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                              style={{ minWidth: 44, minHeight: 44 }}
                              title={action.label}
                            >
                              <ActionIcon size={16} className={action.color || 'text-gray-500'} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Campos secundários (label/valor) */}
                  {fields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {fields.map((field) => {
                        if (field.render) {
                          return (
                            <div key={field.key} className="flex items-center gap-1">
                              {field.render(item)}
                            </div>
                          );
                        }
                        const value = getFieldValue(item, field.key);
                        if (!value) return null;

                        if (field.hideLabel) {
                          return (
                            <span key={field.key} className="text-xs text-gray-600">
                              {value}
                            </span>
                          );
                        }

                        return (
                          <div key={field.key} className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-gray-400 uppercase">{field.label}:</span>
                            <span className="text-xs text-gray-700">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500">
                {pagination.paginationLabel}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  style={{ minWidth: 44, minHeight: 44 }}
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
