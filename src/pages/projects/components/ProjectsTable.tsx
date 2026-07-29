/**
 * ============================================================================
 * PROJECTS TABLE - Tabela de Projetos com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de projetos com paginação.
 * Design compacto sem quebras de linha, com ícones e badges de status.
 * ============================================================================
 */

import { FolderOpen, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, MapPin, Wind, Users as UsersIcon } from 'lucide-react';
import type { ProjectListItem } from '@/services/project.service';

/**
 * Props do componente ProjectsTable.
 */
interface ProjectsTableProps {
  data?: {
    data: ProjectListItem[];
    page: number;
    totalPages: number;
    total: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  isLoading: boolean;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onViewDetails: (project: ProjectListItem) => void;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Configuração visual de cada status do projeto.
 */
const STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  PLANNING:    { bg: 'bg-gray-50 text-gray-600',    dot: 'bg-gray-400' },
  IN_PROGRESS: { bg: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  ON_HOLD:     { bg: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-500' },
  COMPLETED:   { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED:   { bg: 'bg-red-50 text-red-700',      dot: 'bg-red-500' },
};

/**
 * Componente ProjectsTable - Tabela de projetos com design melhorado.
 */
export function ProjectsTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  onPageChange,
  t,
}: ProjectsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {isLoading ? (
        /* Estado de carregamento */
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">{t('table.loading')}</p>
        </div>
      ) : !data?.data.length ? (
        /* Estado vazio */
        <div className="p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <FolderOpen size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-900">{t('table.empty')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.name')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.client')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.location')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.status')}</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.turbines')}</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('table.members')}</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[120px]">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((project) => {
                  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNING;
                  return (
                    <tr
                      key={project.id}
                      className="group hover:bg-gray-50/80 transition-colors duration-100"
                    >
                      {/* Nome do projeto */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {project.name}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {project.client}
                        </span>
                      </td>

                      {/* Localização com ícone */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 whitespace-nowrap">
                          <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                          {project.location}
                        </span>
                      </td>

                      {/* Status com badge + dot */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {t(`status.${project.status}`)}
                        </span>
                      </td>

                      {/* Turbinas com ícone */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <Wind size={14} className="text-gray-400" />
                          {project._count?.turbines || 0}
                        </span>
                      </td>

                      {/* Membros com ícone */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          <UsersIcon size={14} className="text-gray-400" />
                          {project._count?.members || 0}
                        </span>
                      </td>

                      {/* Ações (coluna fixa) */}
                      <td className="px-5 py-3.5 sticky right-0 bg-white group-hover:bg-gray-50/80 z-10">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewDetails(project)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('actions.viewDetails')}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onEdit(project)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('actions.edit')}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(project)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('actions.delete')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500">
                {t('table.pagination', { page: data.page, totalPages: data.totalPages, total: data.total })}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(data.page - 1)}
                  disabled={!data.hasPreviousPage}
                  className="p-1.5 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => onPageChange(data.page + 1)}
                  disabled={!data.hasNextPage}
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
