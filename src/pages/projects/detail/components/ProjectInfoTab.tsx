/**
 * ============================================================================
 * PROJECT INFO TAB - Aba de Informações do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe as informações detalhadas do projeto na aba "Info".
 * Mostra todos os campos em formato de leitura.
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import type { ProjectDetail } from '@/services/project.service';

/**
 * Props do componente ProjectInfoTab.
 */
interface ProjectInfoTabProps {
  project: ProjectDetail;
}

/**
 * Componente ProjectInfoTab - Exibe informações do projeto.
 */
export function ProjectInfoTab({ project }: ProjectInfoTabProps) {
  const { t } = useTranslation('projects');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.name')}</label>
          <p className="mt-1 text-gray-900">{project.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.client')}</label>
          <p className="mt-1 text-gray-900">{project.client}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.location')}</label>
          <p className="mt-1 text-gray-900">{project.location}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.scope')}</label>
          <p className="mt-1 text-gray-900">{project.scope || '-'}</p>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-500">{t('modal.description')}</label>
          <p className="mt-1 text-gray-900">{project.description || '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.latitude')}</label>
          <p className="mt-1 text-gray-900">{project.latitude ?? '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.longitude')}</label>
          <p className="mt-1 text-gray-900">{project.longitude ?? '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.startDate')}</label>
          <p className="mt-1 text-gray-900">
            {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('modal.status')}</label>
          <p className="mt-1 text-gray-900">{t(`status.${project.status}`)}</p>
        </div>
      </div>
    </div>
  );
}
