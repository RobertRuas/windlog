/**
 * ============================================================================
 * DOCUMENT SECTION - Seção de Documentos Pessoais
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia os documentos pessoais do usuário.
 * Usado dentro de um Accordion na ProfilePage.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todos os documentos (passaporte, ID, NIF, visto, etc.)
 * - Adiciona novo documento com tipo, número, datas
 * - Suporte a upload de múltiplos ficheiros (máx. 3 MB cada)
 * - Edita documentos existentes
 * - Remove documentos com confirmação
 * - Mostra alertas para documentos expirados
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Check, AlertCircle, FileText, Upload, Paperclip, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UserDocument, DocumentFile } from '@/services/auth.service';
import { uploadMultipleFiles, type UploadResult } from '@/services/upload.service';

// Constantes
import { PREDEFINED_COUNTRIES } from '@/constants/countries';

/**
 * Props do componente.
 */
interface DocumentSectionProps {
  documents: UserDocument[];
  onAdd: (data: Omit<UserDocument, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<UserDocument>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de documentos pessoais.
 */
export function DocumentSection({ documents, onAdd, onUpdate, onRemove }: DocumentSectionProps) {
  const { t } = useTranslation('home');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<UserDocument, 'id'>>({
    type: 'PASSPORT',
    documentNumber: '',
    issuingCountry: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    files: [],
  });

  // Ficheiros selecionados para upload (ainda não enviados)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  /**
   * Verifica se um documento está expirado.
   */
  const isExpired = (expiryDate?: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  /**
   * Formata o tipo do documento para exibição.
   */
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      PASSPORT: t('documents.types.passport'),
      ID_CARD: t('documents.types.id_card'),
      TAX_ID: t('documents.types.tax_id'),
      SOCIAL_SECURITY: t('documents.types.social_security'),
      WORK_PERMIT: t('documents.types.work_permit'),
      VISA: t('documents.types.visa'),
      DRIVERS_LICENSE: t('documents.types.drivers_license'),
      POSTING_ORDER: t('documents.types.posting_order'),
      MEDICAL_EXAM: t('documents.types.medical_exam'),
      OTHER: t('documents.types.other'),
    };
    return types[type] || type;
  };

  /**
   * Formata a data para exibição.
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  /**
   * Formata o nome do país para exibição.
   */
  const formatCountry = (code: string) => {
    if (!code) return '';
    return PREDEFINED_COUNTRIES.find((c) => c.code === code)?.name ?? code;
  };

  /**
   * Formata o tamanho do ficheiro para exibição.
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Inicia a edição de um documento.
   */
  const handleEdit = (doc: UserDocument) => {
    setEditingId(doc.id);
    setFormData({
      type: doc.type,
      documentNumber: doc.documentNumber || '',
      issuingCountry: doc.issuingCountry || '',
      issueDate: doc.issueDate ? doc.issueDate.split('T')[0] : '',
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
      description: doc.description || '',
      files: doc.files || [],
    });
    setPendingFiles([]);
    setUploadError(null);
  };

  /**
   * Cancela a edição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      type: 'PASSPORT',
      documentNumber: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: '',
      description: '',
      files: [],
    });
    setPendingFiles([]);
    setUploadError(null);
  };

  /**
   * Processa os ficheiros selecionados para upload.
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Valida cada ficheiro
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      // Valida tamanho (3 MB)
      if (file.size > 3 * 1024 * 1024) {
        errors.push(`${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB (máx. 3 MB)`);
        continue;
      }

      // Valida tipo
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
        errors.push(`${file.name}: tipo não suportado`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError(null);
    }

    setPendingFiles((prev) => [...prev, ...validFiles]);

    // Limpa o input para permitir selecionar o mesmo ficheiro novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove um ficheiro pendente da lista.
   */
  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Salva as alterações de um documento.
   */
  const handleSave = async () => {
    if (editingId) {
      setIsUploading(true);
      try {
        // Faz upload dos ficheiros pendentes (se houver)
        let newFiles: UploadResult[] = [];
        if (pendingFiles.length > 0) {
          newFiles = await uploadMultipleFiles(pendingFiles, 'document');
        }

        // Monta a lista de ficheiros (existentes + novos)
        const allFiles = [
          ...(formData.files || []).map((f, i) => ({ uploadedFileId: f.id, order: i })),
          ...newFiles.map((f, i) => ({ uploadedFileId: f.id, order: (formData.files?.length || 0) + i })),
        ];

        await onUpdate(editingId, {
          type: formData.type,
          documentNumber: formData.documentNumber || undefined,
          issuingCountry: formData.issuingCountry || undefined,
          issueDate: formData.issueDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          description: formData.description || undefined,
          files: allFiles as unknown as DocumentFile[],
        });

        setEditingId(null);
        setPendingFiles([]);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('feedback.error');
        setUploadError(message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  /**
   * Adiciona um novo documento.
   */
  const handleAdd = async () => {
    setIsUploading(true);
    try {
      // Faz upload dos ficheiros (se houver)
      let uploadedFiles: UploadResult[] = [];
      if (pendingFiles.length > 0) {
        uploadedFiles = await uploadMultipleFiles(pendingFiles, 'document');
      }

      await onAdd({
        type: formData.type,
        documentNumber: formData.documentNumber || undefined,
        issuingCountry: formData.issuingCountry || undefined,
        issueDate: formData.issueDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        description: formData.description || undefined,
        files: uploadedFiles.map((f, i) => ({ uploadedFileId: f.id, order: i })),
      } as unknown as Omit<UserDocument, 'id'>);

      setIsAdding(false);
      handleCancel();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('feedback.error');
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Remove um documento.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('documents.confirmDelete'))) {
      await onRemove(id);
    }
  };

  /**
   * Renderiza o formulário de edição/adição.
   */
  const renderForm = (isAddMode: boolean) => (
    <div className={`p-4 rounded-lg border space-y-4 ${isAddMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('documents.type')}</label>
          <select
            className="form-select w-full"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="PASSPORT">{t('documents.types.passport')}</option>
            <option value="ID_CARD">{t('documents.types.id_card')}</option>
            <option value="TAX_ID">{t('documents.types.tax_id')}</option>
            <option value="SOCIAL_SECURITY">{t('documents.types.social_security')}</option>
            <option value="WORK_PERMIT">{t('documents.types.work_permit')}</option>
            <option value="VISA">{t('documents.types.visa')}</option>
            <option value="DRIVERS_LICENSE">{t('documents.types.drivers_license')}</option>
            <option value="POSTING_ORDER">{t('documents.types.posting_order')}</option>
            <option value="MEDICAL_EXAM">{t('documents.types.medical_exam')}</option>
            <option value="OTHER">{t('documents.types.other')}</option>
          </select>
        </div>
        <div>
          <label className="form-label">{t('documents.documentNumber')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.documentNumber}
            onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            placeholder="AB123456"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('documents.issuingCountry')}</label>
          <select
            className="form-select w-full"
            value={formData.issuingCountry}
            onChange={(e) => setFormData({ ...formData, issuingCountry: e.target.value })}
          >
            <option value="">{t('validation.selectOption', { defaultValue: 'Selecione...' })}</option>
            {PREDEFINED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">{t('documents.description')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('documents.descriptionPlaceholder')}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('documents.issueDate')}</label>
          <input
            type="date"
            className="form-input w-full"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">{t('documents.expiryDate')}</label>
          <input
            type="date"
            className="form-input w-full"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      {/* Upload de múltiplos ficheiros */}
      <div>
        <label className="form-label">{t('documents.fileUpload')}</label>
        <p className="text-xs text-gray-500 mb-2">{t('documents.fileUploadMultiple')}</p>

        {/* Ficheiros já anexados (existentes) */}
        {formData.files && formData.files.length > 0 && (
          <div className="space-y-1 mb-2">
            {formData.files.map((file: DocumentFile) => (
              <div key={file.id} className="flex items-center gap-2 text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                <FileText size={14} className="text-blue-500 flex-shrink-0" />
                <span className="truncate flex-1">{file.originalName}</span>
                <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ficheiros pendentes de upload */}
        {pendingFiles.length > 0 && (
          <div className="space-y-1 mb-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <Paperclip size={14} className="flex-shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-xs text-blue-400">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removePendingFile(index)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botão para selecionar ficheiros */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Upload size={14} />
          {t('documents.fileUpload')}
        </button>
        <p className="text-xs text-gray-400 mt-1">{t('documents.fileUploadHint')}</p>

        {/* Erro de upload */}
        {uploadError && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
            <AlertCircle size={14} />
            <pre className="whitespace-pre-wrap font-sans">{uploadError}</pre>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={isAddMode ? handleAdd : handleSave} disabled={isUploading}>
          {isUploading ? (
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-1" />
          )}
          {isAddMode ? t('actions.add') : t('actions.save')}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleCancel} disabled={isUploading}>
          <X className="w-4 h-4 mr-1" />
          {t('actions.cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="pt-4">
      {/* Botão adicionar */}
      <div className="mb-4">
        {!isAdding && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('documents.add')}
          </Button>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="space-y-3">
        {documents.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('documents.empty')}
          </p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`p-4 rounded-lg border ${
              isExpired(doc.expiryDate)
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {editingId === doc.id ? (
              renderForm(false)
            ) : (
              /* Modo de visualização */
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText size={16} className="text-blue-600 flex-shrink-0" />
                    <p className="font-medium text-gray-900">{formatType(doc.type)}</p>
                    {isExpired(doc.expiryDate) && (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" />
                        {t('documents.expired')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    {doc.documentNumber && (
                      <span className="bg-gray-200 px-2 py-0.5 rounded">
                        #{doc.documentNumber}
                      </span>
                    )}
                    {doc.issuingCountry && (
                      <span>{formatCountry(doc.issuingCountry)}</span>
                    )}
                    {doc.issueDate && (
                      <span>{t('documents.issueDate')}: {formatDate(doc.issueDate)}</span>
                    )}
                    {doc.expiryDate && (
                      <span>{t('documents.expiryDate')}: {formatDate(doc.expiryDate)}</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                  )}
                  {/* Ficheiros anexados */}
                  {doc.files && doc.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {doc.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Paperclip size={12} />
                          <span className="truncate">{file.originalName}</span>
                          <span className="text-gray-400">({formatFileSize(file.size)})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(doc)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(doc.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Formulário para adicionar novo documento */}
        {isAdding && renderForm(true)}
      </div>
    </div>
  );
}
