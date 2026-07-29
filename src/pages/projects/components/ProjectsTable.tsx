/**
 * ============================================================================
 * PROJECTS TABLE - Tabela de Projetos com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de projetos com paginação.
 * Inclui ações de editar, excluir e visualizar detalhes.
 * ============================================================================
 */

import { FolderOpen, ChevronLeft, ChevronRight, Edit2, Trash2, Eye } from 'lucide-react';
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
 * Mapeia o status do projeto para as classes de estilo.
 */
function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    PLANNING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Componente ProjectsTable - Tabela de projetos com paginação.
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">{t('table.loading')}</div>
      ) : !data?.data.length ? (
        <div className="p-8 text-center text-gray-500">
          <FolderOpen size={48} className="mx-auto mb-3 text-gray-300" />
          <p>{t('table.empty')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.client')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.location')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.turbines')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.members')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{project.client}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{project.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(project.status)}`}>
                        {t(`status.${project.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{project._count?.turbines || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{project._count?.members || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetails(project)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={t('actions.viewDetails')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEdit(project)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={t('actions.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(project)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('actions.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {t('table.pagination', { page: data.page, totalPages: data.totalPages, total: data.total })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(data.page - 1)}
                  disabled={!data.hasPreviousPage}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => onPageChange(data.page + 1)}
                  disabled={!data.hasNextPage}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
