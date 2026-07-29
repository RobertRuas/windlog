/**
 * ============================================================================
 * PROJECT TURBINES TAB - Aba de Turbinas do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a lista de turbinas do projeto com ações de
 * criar, editar e excluir. Inclui o modal de criação/edição.
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Wind } from 'lucide-react';
import type { ProjectDetail, Turbine, CreateTurbinePayload, UpdateTurbinePayload } from '@/services/project.service';
import { TurbineModal } from './TurbineModal';

/**
 * Props do componente ProjectTurbinesTab.
 */
interface ProjectTurbinesTabProps {
  project: ProjectDetail;
  onCreateTurbine: (payload: CreateTurbinePayload, options?: { onSuccess: () => void }) => void;
  onUpdateTurbine: (turbineId: string, payload: UpdateTurbinePayload, options?: { onSuccess: () => void }) => void;
  onDeleteTurbine: (turbineId: string) => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
}

/**
 * Componente ProjectTurbinesTab - Gerencia turbinas do projeto.
 */
export function ProjectTurbinesTab({
  project,
  onCreateTurbine,
  onUpdateTurbine,
  onDeleteTurbine,
  isCreatePending,
  isUpdatePending,
}: ProjectTurbinesTabProps) {
  const { t } = useTranslation('projects');

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurbine, setEditingTurbine] = useState<Turbine | null>(null);

  function openCreateModal() {
    setEditingTurbine(null);
    setIsModalOpen(true);
  }

  function openEditModal(turbine: Turbine) {
    setEditingTurbine(turbine);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTurbine(null);
  }

  function handleSubmit(payload: CreateTurbinePayload | UpdateTurbinePayload) {
    if (editingTurbine) {
      onUpdateTurbine(editingTurbine.id, payload as UpdateTurbinePayload, {
        onSuccess: () => closeModal(),
      });
    } else {
      onCreateTurbine(payload as CreateTurbinePayload, {
        onSuccess: () => closeModal(),
      });
    }
  }

  function handleDelete(turbine: Turbine) {
    if (confirm(t('actions.confirmDeleteTurbine', { name: turbine.name }))) {
      onDeleteTurbine(turbine.id);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header com botão de adicionar */}
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            {t('actions.addTurbine')}
          </button>
        </div>

        {/* Tabela ou estado vazio */}
        {project.turbines?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.location')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.manufacturer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.model')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.nacelleHeight')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('turbineTable.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.turbines.map((turbine) => (
                  <tr key={turbine.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{turbine.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{turbine.location || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{turbine.manufacturer || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{turbine.model || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{turbine.nacelleHeight ? `${turbine.nacelleHeight}m` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        turbine.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' :
                        turbine.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                        turbine.status === 'OFFLINE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`turbineStatus.${turbine.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(turbine)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(turbine)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Wind size={48} className="mx-auto mb-3 text-gray-300" />
            <p>{t('turbineTable.empty')}</p>
          </div>
        )}
      </div>

      {/* Modal de Turbina */}
      <TurbineModal
        turbine={editingTurbine}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isPending={isCreatePending || isUpdatePending}
      />
    </>
  );
}
