/**
 * ============================================================================
 * ATTACHMENT FIELD - Campo de Anexo (Foto ou PDF)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Componentes reutilizáveis para anexar ficheiros (foto ou PDF) em
 * formulários de documentos e certificações.
 *
 * COMPONENTES EXPORTADOS:
 * -----------------------
 * - AttachmentLink:  link para visualizar um anexo já salvo no servidor
 * - AttachmentField: campo de formulário para selecionar/substituir/remover
 *                    o ficheiro a anexar
 *
 * FLUXO DE USO NO FORMULÁRIO:
 * ---------------------------
 * 1. Usuário seleciona o ficheiro no AttachmentField (estado no pai)
 * 2. Ao salvar, o pai faz o upload via uploadFile() e envia o filePath
 * 3. Para remover um anexo existente, o pai marca removeAttachment
 * ============================================================================
 */

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, X, Upload, Undo2 } from 'lucide-react';
import { useFileUrl } from '@/hooks/useFileUrl';

/**
 * Tipos de ficheiro aceitos como anexo (foto ou PDF).
 */
export const ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

/**
 * Link para visualizar um anexo já salvo no servidor.
 * Usa o hook useFileUrl para obter uma URL temporária segura.
 */
export function AttachmentLink({ filePath }: { filePath: string }) {
  const { t } = useTranslation('home');
  const { url, isLoading } = useFileUrl(filePath);

  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // Impede o clique enquanto a URL temporária carrega
        if (!url) e.preventDefault();
      }}
      className={`inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 ${
        isLoading ? 'opacity-50 cursor-wait' : ''
      }`}
    >
      <Paperclip size={12} />
      {isLoading ? '...' : t('documents.viewAttachment')}
    </a>
  );
}

/**
 * Props do AttachmentField.
 */
interface AttachmentFieldProps {
  /** Caminho do anexo atual no servidor (se existir) */
  filePath?: string | null;
  /** Ficheiro selecionado pelo usuário (ainda não enviado) */
  selectedFile: File | null;
  /** Se o usuário pediu para remover o anexo existente */
  removeRequested: boolean;
  /** Callback quando o usuário seleciona/limpa um ficheiro */
  onFileChange: (file: File | null) => void;
  /** Callback quando o usuário pede/desiste de remover o anexo */
  onRemoveRequest: (remove: boolean) => void;
}

/**
 * Campo de formulário para anexar foto ou PDF.
 */
export function AttachmentField({
  filePath,
  selectedFile,
  removeRequested,
  onFileChange,
  onRemoveRequest,
}: AttachmentFieldProps) {
  const { t } = useTranslation('home');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="form-label">{t('documents.fileUpload')}</label>

      {/* Input de ficheiro (aceita imagens e PDF) */}
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onFileChange(file);
          if (file) onRemoveRequest(false);
          // Limpa o input para permitir selecionar o mesmo ficheiro novamente
          e.target.value = '';
        }}
      />

      <div className="space-y-2">
        {/* Anexo existente no servidor */}
        {filePath && !removeRequested && !selectedFile && (
          <div className="flex items-center gap-2 flex-wrap">
            <AttachmentLink filePath={filePath} />
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700 underline"
              onClick={() => inputRef.current?.click()}
            >
              {t('documents.replaceAttachment')}
            </button>
            <button
              type="button"
              className="text-xs text-red-600 hover:text-red-700 underline"
              onClick={() => onRemoveRequest(true)}
            >
              {t('documents.removeFile')}
            </button>
          </div>
        )}

        {/* Usuário pediu para remover o anexo existente */}
        {filePath && removeRequested && !selectedFile && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600">
              {t('documents.attachmentWillBeRemoved')}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 underline"
              onClick={() => onRemoveRequest(false)}
            >
              <Undo2 size={12} />
              {t('actions.cancel')}
            </button>
          </div>
        )}

        {/* Novo ficheiro selecionado (ainda não enviado) */}
        {selectedFile && (
          <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2">
            <Paperclip size={14} className="text-blue-600 flex-shrink-0" />
            <span className="text-xs text-gray-700 truncate">{selectedFile.name}</span>
            <button
              type="button"
              className="ml-auto text-gray-400 hover:text-red-600"
              onClick={() => onFileChange(null)}
              title={t('documents.removeFile')}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Botão para escolher ficheiro */}
        {!selectedFile && (!filePath || removeRequested) && (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            {t('documents.chooseFile')}
          </button>
        )}

        <p className="text-xs text-gray-400">{t('documents.fileUploadHint')}</p>
      </div>
    </div>
  );
}
