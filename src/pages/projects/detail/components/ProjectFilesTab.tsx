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

/**
 * Props do componente ProjectFilesTab.
 */
interface ProjectFilesTabProps {
  project: ProjectDetail;
  /** Se false, oculta upload e exclusão (somente leitura) */
  canEdit: boolean;
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
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileText;
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return FileText;
  return File;
}

/**
 * Converte MIME type para nome legível pelo utilizador.
 */
function getFileTypeName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
  };
  return typeMap[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'Ficheiro';
}

/**
 * Componente ProjectFilesTab - Upload e listagem de ficheiros.
 */
export function ProjectFilesTab({
  project,
  canEdit,
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
        toast.error(t('files.exceedsLimit', { name: file.name }));
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
        toast.error(t('files.exceedsLimit', { name: file.name }));
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
      sortable: true,
      sortKey: 'originalName',
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
      sortable: true,
      sortKey: 'mimeType',
      render: (file) => (
        <span className="text-xs text-gray-500">
          {getFileTypeName(file.mimeType)}
        </span>
      ),
    },
    {
      header: t('filesTable.size'),
      sortable: true,
      sortKey: 'size',
      render: (file) => (
        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
      ),
    },
    {
      header: t('filesTable.date'),
      sortable: true,
      sortKey: 'createdAt',
      render: (file) => (
        <span className="text-xs text-gray-500">
          {new Date(file.createdAt).toLocaleDateString('pt-PT')}
        </span>
      ),
    },
    // Coluna de exclusão apenas para ADMIN/HR
    ...(canEdit ? [{
      header: '',
      align: 'right' as const,
      render: (file: ProjectFile) => (
        <button
          onClick={() => handleDelete(file)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title={t('actions.delete')}
        >
          <Trash2 size={14} />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Input hidden para ficheiros */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Zona de upload com drag & drop (apenas ADMIN/HR) */}
      {canEdit && (
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
            {isUploading ? t('files.uploading') : t('files.dropzone')}
          </p>
          <p className="text-xs text-gray-400">
            {t('files.dropzoneHint')}
          </p>
        </div>
      )}

      {/* Tabela de ficheiros */}
      <DataTable
        columns={columns}
        data={files}
        isLoading={false}
        clientSort
        emptyIcon={Paperclip}
        emptyMessage={t('files.empty')}
        loadingMessage={t('table.loading')}
      />
    </div>
  );
}
