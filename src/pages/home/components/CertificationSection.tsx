/**
 * ============================================================================
 * CERTIFICATION SECTION - Seção de Certificações
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia as certificações do usuário.
 * Usado dentro de um Accordion na HomePage.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todas as certificações
 * - Adiciona nova certificação
 * - Suporte a anexo de foto ou PDF da certificação (máx. 10 MB)
 * - Edita certificações existentes
 * - Remove certificações com confirmação
 * - Mostra alertas para certificações expiradas
 * - Design alinhado com altura consistente
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Certification } from '@/services/auth.service';
import { uploadFile } from '@/services/upload.service';
import { AttachmentField, AttachmentLink } from './AttachmentField';

/**
 * Props do componente.
 */
interface CertificationSectionProps {
  certifications: Certification[];
  onAdd: (data: Omit<Certification, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Certification>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de certificações.
 */
export function CertificationSection({ certifications, onAdd, onUpdate, onRemove }: CertificationSectionProps) {
  const { t } = useTranslation('home');

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<Certification, 'id'>>({
    name: '',
    issuer: '',
    type: 'CERTIFICATION',
    description: '',
    certNumber: '',
    issueDate: '',
    expiryDate: '',
    filePath: null,
  });

  // Estado do anexo (foto ou PDF da certificação)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Resolve o filePath final ao salvar:
   * - Se há ficheiro selecionado, faz upload e retorna o novo filePath
   * - Se o usuário pediu remoção, retorna null (remove o anexo)
   * - Caso contrário, retorna undefined (sem alteração)
   */
  const resolveFilePath = async (): Promise<string | null | undefined> => {
    if (selectedFile) {
      const response = await uploadFile(selectedFile, 'certifications');
      return response.data.filePath;
    }
    if (removeAttachment && formData.filePath) return null;
    return undefined;
  };

  /**
   * Reseta o estado do anexo.
   */
  const resetAttachmentState = () => {
    setSelectedFile(null);
    setRemoveAttachment(false);
  };

  /**
   * Verifica se uma certificação está expirada.
   */
  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  /**
   * Formata o tipo da certificação para exibição.
   */
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      CERTIFICATION: t('certifications.types.certification'),
      DIPLOMA: t('certifications.types.diploma'),
      COURSE: t('certifications.types.course'),
      TRAINING: t('certifications.types.training'),
      LICENSE: t('certifications.types.license'),
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
   * Inicia a edição de uma certificação.
   */
  const handleEdit = (cert: Certification) => {
    setEditingId(cert.id);
    setFormData({
      name: cert.name,
      issuer: cert.issuer,
      type: cert.type,
      description: cert.description || '',
      certNumber: cert.certNumber || '',
      issueDate: cert.issueDate ? cert.issueDate.split('T')[0] : '',
      expiryDate: cert.expiryDate ? cert.expiryDate.split('T')[0] : '',
      filePath: cert.filePath ?? null,
    });
    resetAttachmentState();
  };

  /**
   * Cancela a edição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      name: '',
      issuer: '',
      type: 'CERTIFICATION',
      description: '',
      certNumber: '',
      issueDate: '',
      expiryDate: '',
      filePath: null,
    });
    resetAttachmentState();
  };

  /**
   * Salva as alterações de uma certificação.
   */
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.issuer.trim() || !formData.issueDate) return;
    if (editingId) {
      setIsSaving(true);
      try {
        const filePath = await resolveFilePath();
        await onUpdate(editingId, {
          ...formData,
          expiryDate: formData.expiryDate || undefined,
          description: formData.description || undefined,
          certNumber: formData.certNumber || undefined,
          ...(filePath !== undefined ? { filePath } : {}),
        });
        setEditingId(null);
        resetAttachmentState();
      } catch (error) {
        toast.error(t('common:error', { defaultValue: 'Erro ao salvar certificação' }));
      } finally {
        setIsSaving(false);
      }
    }
  };

  /**
   * Adiciona uma nova certificação.
   */
  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.issuer.trim() || !formData.issueDate) return;
    setIsSaving(true);
    try {
      const filePath = await resolveFilePath();
      await onAdd({
        ...formData,
        expiryDate: formData.expiryDate || undefined,
        description: formData.description || undefined,
        certNumber: formData.certNumber || undefined,
        filePath: filePath ?? null,
      });
      setIsAdding(false);
      handleCancel();
    } catch (error) {
      toast.error(t('common:error', { defaultValue: 'Erro ao adicionar certificação' }));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Remove uma certificação.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('certifications.confirmDelete'))) {
      await onRemove(id);
    }
  };

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
            {t('certifications.add')}
          </Button>
        )}
      </div>

      {/* Lista de certificações */}
      <div className="space-y-3">
        {certifications.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('certifications.empty')}
          </p>
        )}

        {certifications.map((cert) => (
          <div
            key={cert.id}
            className={`p-4 rounded-lg border ${
              isExpired(cert.expiryDate)
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {editingId === cert.id ? (
              /* Modo de edição */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('certifications.name')}</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="GWO BST"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('certifications.issuer')}</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      placeholder="GWO"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">{t('certifications.type')}</label>
                    <select
                      className="form-select w-full"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="CERTIFICATION">{t('certifications.types.certification')}</option>
                      <option value="DIPLOMA">{t('certifications.types.diploma')}</option>
                      <option value="COURSE">{t('certifications.types.course')}</option>
                      <option value="TRAINING">{t('certifications.types.training')}</option>
                      <option value="LICENSE">{t('certifications.types.license')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('certifications.certNumber')}</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formData.certNumber}
                      onChange={(e) => setFormData({ ...formData, certNumber: e.target.value })}
                      placeholder="GWO-2024-12345"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('certifications.description')}</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('certifications.descriptionPlaceholder')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('certifications.issueDate')}</label>
                    <input
                      type="date"
                      className="form-input w-full"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('certifications.expiryDate')}</label>
                    <input
                      type="date"
                      className="form-input w-full"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Anexo: foto ou PDF da certificação */}
                <AttachmentField
                  filePath={formData.filePath}
                  selectedFile={selectedFile}
                  removeRequested={removeAttachment}
                  onFileChange={setSelectedFile}
                  onRemoveRequest={setRemoveAttachment}
                />

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-1" />
                    {t('actions.save')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-1" />
                    {t('actions.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              /* Modo de visualização */
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{cert.name}</p>
                    {isExpired(cert.expiryDate) && (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" />
                        {t('certifications.expired')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span className="bg-gray-200 px-2 py-0.5 rounded">
                      {formatType(cert.type)}
                    </span>
                    {cert.certNumber && (
                      <span>#{cert.certNumber}</span>
                    )}
                    <span>{t('certifications.issueDate')}: {formatDate(cert.issueDate)}</span>
                    {cert.expiryDate && (
                      <span>{t('certifications.expiryDate')}: {formatDate(cert.expiryDate)}</span>
                    )}
                  </div>
                  {cert.description && (
                    <p className="text-sm text-gray-500 mt-1">{cert.description}</p>
                  )}
                  {/* Link para visualizar o anexo (foto ou PDF) */}
                  {cert.filePath && (
                    <div className="mt-2">
                      <AttachmentLink filePath={cert.filePath} />
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(cert)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(cert.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Formulário para adicionar nova certificação */}
        {isAdding && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('certifications.name')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="GWO BST"
                />
              </div>
              <div>
                <label className="form-label">{t('certifications.issuer')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="GWO"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">{t('certifications.type')}</label>
                <select
                  className="form-select w-full"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="CERTIFICATION">{t('certifications.types.certification')}</option>
                  <option value="DIPLOMA">{t('certifications.types.diploma')}</option>
                  <option value="COURSE">{t('certifications.types.course')}</option>
                  <option value="TRAINING">{t('certifications.types.training')}</option>
                  <option value="LICENSE">{t('certifications.types.license')}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('certifications.certNumber')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.certNumber}
                  onChange={(e) => setFormData({ ...formData, certNumber: e.target.value })}
                  placeholder="GWO-2024-12345"
                />
              </div>
              <div>
                <label className="form-label">{t('certifications.description')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('certifications.descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('certifications.issueDate')}</label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('certifications.expiryDate')}</label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            {/* Anexo: foto ou PDF da certificação */}
            <AttachmentField
              filePath={formData.filePath}
              selectedFile={selectedFile}
              removeRequested={removeAttachment}
              onFileChange={setSelectedFile}
              onRemoveRequest={setRemoveAttachment}
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isSaving}>
                <Check className="w-4 h-4 mr-1" />
                {t('actions.add')}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                {t('actions.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
