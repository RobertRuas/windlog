/**
 * ============================================================================
 * PROJECT FILES TAB - Aba de Ficheiros do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente placeholder para a aba de ficheiros do projeto.
 * O sistema de upload foi removido e será reimplementado do zero.
 * Os botões e a UI estão mantidos mas sem ação por enquanto.
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetail } from '@/services/project.service';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

/**
 * Props do componente ProjectFilesTab.
 */
interface ProjectFilesTabProps {
  project: ProjectDetail;
}

/**
 * Componente ProjectFilesTab - Placeholder (upload desativado).
 */
export function ProjectFilesTab({ project: _project }: ProjectFilesTabProps) {
  const { t } = useTranslation('projects');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para drag & drop (visual apenas)
  const [isDragOver, setIsDragOver] = useState(false);

  const showMaintenance = () => {
    toast.info('Sistema de ficheiros em manutenção...');
  };

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    showMaintenance();
  }

  // Colunas vazias - sem dados por enquanto
  const columns: DataTableColumn<Record<string, never>>[] = [];

  return (
    <div className="space-y-4">
      {/* Input hidden para ficheiros (desativado) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={() => showMaintenance()}
        className="hidden"
      />

      {/* Zona de upload com drag & drop (desativada) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={showMaintenance}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <Upload
          size={40}
          className={`mx-auto mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
        />
        <p className="text-sm text-gray-600 mb-1">
          {t('files.dropzone')}
        </p>
        <p className="text-xs text-gray-400">
          {t('files.dropzoneHint')}
        </p>
      </div>

      {/* Tabela vazia - sem ficheiros */}
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        emptyIcon={Paperclip}
        emptyMessage={t('files.empty')}
        loadingMessage={t('table.loading')}
      />
    </div>
  );
}
