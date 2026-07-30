/**
 * ============================================================================
 * PROJECT FILES TAB - Aba de Ficheiros do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente funcional para upload e listagem de ficheiros do projeto.
 * Usa o sistema de upload real (POST /projects/:id/files) e exibe
 * os ficheiros numa tabela com links seguros (SecureFileLink).
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Upload de ficheiros via drag & drop ou clique
 * - Listagem de ficheiros com nome, tipo, tamanho e data
 * - Links seguros para download (URLs temporárias)
 * - Remoção de ficheiros com confirmação
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Paperclip,
  Trash2,
  FileText,
  Image,
  File,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetail, ProjectFile } from '@/services/project.service';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { SecureFileLink } from '@/components/ui/SecureFileLink';
import { Button } from '@/components/ui/Button';

/**
 * Props do componente ProjectFilesTab.
 */
interface ProjectFilesTabProps {
  project: ProjectDetail;
  onUploadFile: (file: File, category?: string) => void;
  onDeleteFile: (fileId: string) => void;
  isUploading: boolean;
}

/**
 * Formata bytes para formato legível (KB, MB).
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Retorna o ícone apropriado para o tipo MIME do ficheiro.
 */
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

/**
 * Componente ProjectFilesTab - Upload e listagem de ficheiros.
 */
export function ProjectFilesTab({
  project,
  onUploadFile,
  onDeleteFile,
  isUploading,
}: ProjectFilesTabProps) {
  const { t } = useTranslation('projects');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Ficheiros do projeto (vem da query do projeto)
  const files = project.files || [];

  /**
   * Abre o seletor de ficheiros.
   */
  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  /**
   * Processa ficheiros selecionados via input.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    for (const file of Array.from(selectedFiles)) {
      // Validação básica de tamanho (10 MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" excede o limite de 10 MB`);
        continue;
      }
      onUploadFile(file);
    }

    // Limpa o input para poder selecionar o mesmo ficheiro novamente
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Processa drag & drop.
   */
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

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles?.length) return;

    for (const file of Array.from(droppedFiles)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" excede o limite de 10 MB`);
        continue;
      }
      onUploadFile(file);
    }
  }

  /**
   * Confirma e remove um ficheiro.
   */
  function handleDelete(file: ProjectFile) {
    const confirmed = window.confirm(
      t('actions.confirmDeleteFile', { name: file.originalName }),
    );
    if (confirmed) {
      onDeleteFile(file.id);
    }
  }

  // Colunas da tabela de ficheiros
  const columns: DataTableColumn<ProjectFile>[] = [
    {
      header: t('filesTable.name'),
      render: (file) => {
        const Icon = getFileIcon(file.mimeType);
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-gray-400 flex-shrink-0" />
            <SecureFileLink
              filePath={file.filePath}
              fileName={file.originalName}
              className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-[200px]"
            />
          </div>
        );
      },
    },
    {
      header: t('filesTable.type'),
      render: (file) => (
        <span className="text-xs text-gray-500">
          {file.category || file.mimeType.split('/').pop()}
        </span>
      ),
    },
    {
      header: t('filesTable.size'),
      render: (file) => (
        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
      ),
    },
    {
      header: t('filesTable.date'),
      render: (file) => (
        <span className="text-xs text-gray-500">
          {new Date(file.createdAt).toLocaleDateString('pt-PT')}
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (file) => (
        <button
          onClick={() => handleDelete(file)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title={t('actions.delete')}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Input hidden para ficheiros */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Zona de upload com drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleSelectFiles}
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
          {isUploading ? 'A enviar...' : t('files.dropzone')}
        </p>
        <p className="text-xs text-gray-400">
          {t('files.dropzoneHint')}
        </p>
      </div>

      {/* Tabela de ficheiros */}
      <DataTable
        columns={columns}
        data={files}
        isLoading={false}
        emptyIcon={Paperclip}
        emptyMessage={t('files.empty')}
        loadingMessage={t('table.loading')}
      />
    </div>
  );
}
