/**
 * ============================================================================
 * PROJECT FILES TAB - Aba de Ficheiros do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe todos os ficheiros (fotos, documentos, etc.)
 * associados a um projeto. Permite upload de novos ficheiros e remoção.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Listar ficheiros em grid com preview de imagens
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
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDetail, ProjectFile } from '@/services/project.service';
import {
  getProjectFiles,
  addProjectFile,
  removeProjectFile,
} from '@/services/project.service';
import { validateFile } from '@/services/upload.service';

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
function getFileIcon(mimeType: string) {
  if (isImage(mimeType)) return <ImageIcon size={32} className="text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText size={32} className="text-red-500" />;
  return <FileIcon size={32} className="text-gray-400" />;
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
   * Faz download de um ficheiro.
   */
  function handleDownload(projectFile: ProjectFile) {
    const link = document.createElement('a');
    link.href = projectFile.file.url;
    link.download = projectFile.file.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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

      {/* Grid de ficheiros ou estado vazio */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          <p>{t('table.loading')}</p>
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((projectFile) => (
            <div
              key={projectFile.id}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview do ficheiro */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {isImage(projectFile.file.mimeType) ? (
                  <img
                    src={projectFile.file.url}
                    alt={projectFile.file.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(projectFile.file.mimeType)
                )}
              </div>

              {/* Info do ficheiro */}
              <div className="p-2">
                <p
                  className="text-xs font-medium text-gray-900 truncate"
                  title={projectFile.file.originalName}
                >
                  {projectFile.file.originalName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFileSize(projectFile.file.size)}
                </p>
              </div>

              {/* Ações (aparecem no hover) */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(projectFile);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 rounded-lg shadow-sm transition-colors"
                  title={t('actions.download')}
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(projectFile);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-red-600 rounded-lg shadow-sm transition-colors"
                  title={t('actions.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <FolderOpen size={48} className="mx-auto mb-3 text-gray-300" />
          <p>{t('files.empty')}</p>
        </div>
      )}
    </div>
  );
}
