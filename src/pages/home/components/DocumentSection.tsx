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
 * - Adiciona novo documento com tipo, número, datas e cópia digitalizada
 * - Edita documentos existentes
 * - Remove documentos com confirmação
 * - Mostra alertas para documentos expirados
 * - Suporte a upload de cópias digitalizadas (frente e verso)
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Check, AlertCircle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UserDocument } from '@/services/auth.service';

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

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<UserDocument, 'id'>>({
    type: 'PASSPORT',
    documentNumber: '',
    issuingCountry: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    filePath: '',
    filePathBack: '',
    fileName: '',
    fileType: '',
  });

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
      filePath: doc.filePath || '',
      filePathBack: doc.filePathBack || '',
      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
    });
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
      filePath: '',
      filePathBack: '',
      fileName: '',
      fileType: '',
    });
  };

  /**
   * Salva as alterações de um documento.
   */
  const handleSave = async () => {
    if (editingId) {
      await onUpdate(editingId, {
        ...formData,
        expiryDate: formData.expiryDate || undefined,
        issueDate: formData.issueDate || undefined,
        description: formData.description || undefined,
        documentNumber: formData.documentNumber || undefined,
        issuingCountry: formData.issuingCountry || undefined,
        filePath: formData.filePath || undefined,
        filePathBack: formData.filePathBack || undefined,
        fileName: formData.fileName || undefined,
        fileType: formData.fileType || undefined,
      });
      setEditingId(null);
    }
  };

  /**
   * Adiciona um novo documento.
   */
  const handleAdd = async () => {
    await onAdd({
      ...formData,
      expiryDate: formData.expiryDate || undefined,
      issueDate: formData.issueDate || undefined,
      description: formData.description || undefined,
      documentNumber: formData.documentNumber || undefined,
      issuingCountry: formData.issuingCountry || undefined,
      filePath: formData.filePath || undefined,
      filePathBack: formData.filePathBack || undefined,
      fileName: formData.fileName || undefined,
      fileType: formData.fileType || undefined,
    });
    setIsAdding(false);
    handleCancel();
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
   * Simula o upload de um ficheiro (guarda metadados).
   * Num futuro, isto fará upload real para o servidor.
   */
  const handleFileSelect = (field: 'filePath' | 'filePathBack') => {
    // Placeholder: num futuro, isto abrirá um file picker e fará upload
    // Por agora, apenas guarda o nome do ficheiro como simulação
    const fakeName = field === 'filePath' ? 'documento_frente.pdf' : 'documento_verso.pdf';
    setFormData((prev) => ({
      ...prev,
      [field]: `/uploads/documents/${fakeName}`,
      fileName: fakeName,
      fileType: 'application/pdf',
    }));
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

      {/* Upload de cópias digitalizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('documents.fileUpload')}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFileSelect('filePath')}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Upload size={14} />
              {formData.filePath ? formData.fileName || 'Ficheiro' : t('documents.noFile')}
            </button>
          </div>
        </div>
        <div>
          <label className="form-label">{t('documents.fileUploadBack')}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFileSelect('filePathBack')}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Upload size={14} />
              {formData.filePathBack ? 'Verso' : t('documents.noFile')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={isAddMode ? handleAdd : handleSave}>
          <Check className="w-4 h-4 mr-1" />
          {isAddMode ? t('actions.add') : t('actions.save')}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleCancel}>
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
                  {doc.filePath && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                      <FileText size={12} />
                      <span>{doc.fileName || 'Documento'}</span>
                      {doc.filePathBack && <span className="text-gray-400 ml-1">(+ verso)</span>}
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
