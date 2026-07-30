/**
 * ============================================================================
 * PROJECT FILES TAB - Aba de Ficheiros do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe todos os ficheiros (fotos, documentos, etc.)
 * associados a um projeto. Permite upload de novos ficheiros e remoção.
 * Utiliza o componente reutilizável DataTable para manter o estilo
 * padronizado com a lista de projetos.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Listar ficheiros em formato de tabela (DataTable)
 * - Upload de novos ficheiros (drag & drop + botão)
 * - Download de ficheiros
 * - Remoção de ficheiros
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Trash2,
  FileIcon,
  Image as ImageIcon,
  FileText,
  Download,
  Calendar,
  Paperclip,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetail, ProjectFile } from '@/services/project.service';
import {
  getProjectFiles,
  addProjectFile,
  removeProjectFile,
} from '@/services/project.service';
import { validateFile, getAuthFileUrl } from '@/services/upload.service';
import { useAuthImage } from '@/hooks/useAuthImage';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';

/**
 * Props do componente ProjectFilesTab.
 */
interface ProjectFilesTabProps {
  project: ProjectDetail;
}

/**
 * Formata o tamanho do ficheiro para exibição legível.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Verifica se o ficheiro é uma imagem (para mostrar preview).
 */
function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Retorna o ícone adequado para o tipo de ficheiro.
 */
function getFileIcon(mimeType: string, size = 20) {
  if (isImage(mimeType)) return <ImageIcon size={size} className="text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-500" />;
  return <FileIcon size={size} className="text-gray-400" />;
}

/**
 * Thumbnail de ficheiro - usa blob URL para imagens privadas.
 */
function FileThumbnail({ url, name, mimeType }: { url: string; name: string; mimeType: string }) {
  const blobUrl = useAuthImage(isImage(mimeType) ? url : null);

  if (isImage(mimeType) && blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={name}
        className="w-8 h-8 rounded object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
      {getFileIcon(mimeType, 18)}
    </div>
  );
}

/**
 * Componente ProjectFilesTab - Gerencia ficheiros do projeto.
 */
export function ProjectFilesTab({ project }: ProjectFilesTabProps) {
  const { t } = useTranslation('projects');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  // Buscar ficheiros do projeto
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['project-files', project.id],
    queryFn: () => getProjectFiles(project.id),
  });

  // Mutation para upload de ficheiro
  const uploadMutation = useMutation({
    mutationFn: (file: File) => addProjectFile(project.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', project.id] });
      toast.success(t('toast.fileUploadSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('toast.fileUploadError'));
      console.error('Erro ao upload ficheiro:', error);
    },
  });

  // Mutation para remover ficheiro
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => removeProjectFile(project.id, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', project.id] });
      toast.success(t('toast.fileDeleteSuccess'));
    },
    onError: () => {
      toast.error(t('toast.fileDeleteError'));
    },
  });

  /**
   * Processa os ficheiros selecionados (via input ou drag & drop).
   */
  function handleFiles(fileList: FileList | File[]) {
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      try {
        validateFile(file);
        uploadMutation.mutate(file);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Ficheiro inválido';
        toast.error(msg);
      }
    }

    // Limpa o input para permitir selecionar o mesmo ficheiro novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  /**
   * Handler para o botão de upload (abre o file picker).
   */
  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  /**
   * Handler para mudança no input de ficheiros.
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  }

  /**
   * Handler para drag & drop.
   */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  /**
   * Remove um ficheiro com confirmação.
   */
  function handleDelete(projectFile: ProjectFile) {
    if (confirm(t('actions.confirmDeleteFile', { name: projectFile.file.originalName }))) {
      deleteMutation.mutate(projectFile.id);
    }
  }

  /**
   * Visualiza um ficheiro numa nova aba.
   */
  function handleView(projectFile: ProjectFile) {
    window.open(getAuthFileUrl(projectFile.file.url), '_blank');
  }

  /**
   * Faz download de um ficheiro.
   */
  function handleDownload(projectFile: ProjectFile) {
    const link = document.createElement('a');
    link.href = getAuthFileUrl(projectFile.file.url);
    link.download = projectFile.file.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Colunas da tabela de ficheiros.
   */
  const columns: DataTableColumn<ProjectFile>[] = [
    {
      header: t('filesTable.name'),
      render: (projectFile) => (
        <div className="flex items-center gap-3">
          <FileThumbnail
            url={projectFile.file.url}
            name={projectFile.file.originalName}
            mimeType={projectFile.file.mimeType}
          />
          <span
            className="text-sm font-medium text-gray-900 truncate max-w-[250px]"
            title={projectFile.file.originalName}
          >
            {projectFile.file.originalName}
          </span>
        </div>
      ),
    },
    {
      header: t('filesTable.type'),
      render: (projectFile) => (
        <span className="text-sm text-gray-500 uppercase">{projectFile.file.mimeType.split('/')[1]}</span>
      ),
    },
    {
      header: t('filesTable.size'),
      render: (projectFile) => (
        <span className="text-sm text-gray-500">{formatFileSize(projectFile.file.size)}</span>
      ),
    },
    {
      header: t('filesTable.date'),
      render: (projectFile) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar size={13} className="text-gray-400" />
          {new Date(projectFile.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      header: t('table.actions'),
      align: 'right',
      sticky: true,
      minWidth: '150px',
      render: (projectFile) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleView(projectFile)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title={t('actions.view')}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleDownload(projectFile)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('actions.download')}
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => handleDelete(projectFile)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('actions.delete')}
          >
            <Trash2 size={15} />
          </button>
        </div>
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
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Zona de upload com drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
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

      {/* Tabela de ficheiros (mesmo estilo da lista de projetos via DataTable) */}
      <DataTable
        columns={columns}
        data={files}
        isLoading={isLoading}
        emptyIcon={Paperclip}
        emptyMessage={t('files.empty')}
        loadingMessage={t('table.loading')}
      />
    </div>
  );
}
