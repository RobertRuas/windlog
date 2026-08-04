/**
 * ============================================================================
 * PPE SECTION - Seção de EPIs (Equipamentos de Proteção Individual)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia os EPIs do usuário (fornecidos pela empresa e pessoais).
 * Usado dentro de um Accordion na página de perfil.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todos os EPIs com informações completas (nome, tipo, marca, serial)
 * - Adiciona novo EPI com formulário inline
 * - Edita EPIs existentes
 * - Remove EPIs com confirmação
 * - Alertas visuais para EPIs com inspeção vencida ou a vencer
 * - Badge de condição do equipamento (NEW, GOOD, FAIR, etc.)
 * - Design alinhado com os demais componentes do perfil
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Ppe } from '@/services/auth.service';

/**
 * Props do componente.
 */
interface PpeSectionProps {
  ppes: Ppe[];
  onAdd: (data: Omit<Ppe, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Ppe>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de EPIs (Equipamentos de Proteção Individual).
 */
export function PpeSection({ ppes, onAdd, onUpdate, onRemove }: PpeSectionProps) {
  const { t } = useTranslation('home');

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<Ppe, 'id'>>({
    name: '',
    category: 'COMPANY_PROVIDED',
    type: 'HARNESS',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    lastInspectionDate: '',
    nextInspectionDate: '',
    condition: 'GOOD',
    notes: '',
    filePath: null,
  });

  /**
   * Verifica se a inspeção está vencida.
   */
  const isInspectionOverdue = (nextDate?: string) => {
    if (!nextDate) return false;
    return new Date(nextDate) < new Date();
  };

  /**
   * Verifica se a inspeção está a vencer em breve (30 dias).
   */
  const isInspectionExpiring = (nextDate?: string) => {
    if (!nextDate) return false;
    const diff = new Date(nextDate).getTime() - new Date().getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  };

  /**
   * Formata a data para exibição (formato europeu: dd/mm/yyyy).
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  /**
   * Formata a condição para exibição.
   */
  const formatCondition = (condition: string) => {
    const conditions: Record<string, string> = {
      NEW: t('ppes.conditions.new'),
      GOOD: t('ppes.conditions.good'),
      FAIR: t('ppes.conditions.fair'),
      NEEDS_REPLACEMENT: t('ppes.conditions.needs_replacement'),
      EXPIRED: t('ppes.conditions.expired'),
      RETIRED: t('ppes.conditions.retired'),
    };
    return conditions[condition] || condition;
  };

  /**
   * Formata o tipo do EPI para exibição.
   */
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      HARNESS: t('ppes.types.harness'),
      HELMET: t('ppes.types.helmet'),
      ROPE: t('ppes.types.rope'),
      FALL_ARREST: t('ppes.types.fall_arrest'),
      GLOVES: t('ppes.types.gloves'),
      FOOTWEAR: t('ppes.types.footwear'),
      EYE_PROTECTION: t('ppes.types.eye_protection'),
      RESPIRATORY: t('ppes.types.respiratory'),
      ANCHOR_CONNECTOR: t('ppes.types.anchor_connector'),
      FIRST_AID: t('ppes.types.first_aid'),
      OTHER: t('ppes.types.other'),
    };
    return types[type] || type;
  };

  /**
   * Formata a categoria para exibição.
   */
  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      COMPANY_PROVIDED: t('ppes.categories.company_provided'),
      PERSONAL: t('ppes.categories.personal'),
    };
    return categories[category] || category;
  };

  /**
   * Reseta o formulário para o estado inicial.
   */
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'COMPANY_PROVIDED',
      type: 'HARNESS',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      lastInspectionDate: '',
      nextInspectionDate: '',
      condition: 'GOOD',
      notes: '',
      filePath: null,
    });
  };

  /**
   * Inicia a edição de um EPI.
   */
  const handleEdit = (ppe: Ppe) => {
    setEditingId(ppe.id);
    setFormData({
      name: ppe.name,
      category: ppe.category,
      type: ppe.type,
      brand: ppe.brand || '',
      model: ppe.model || '',
      serialNumber: ppe.serialNumber || '',
      purchaseDate: ppe.purchaseDate ? ppe.purchaseDate.split('T')[0] : '',
      lastInspectionDate: ppe.lastInspectionDate ? ppe.lastInspectionDate.split('T')[0] : '',
      nextInspectionDate: ppe.nextInspectionDate ? ppe.nextInspectionDate.split('T')[0] : '',
      condition: ppe.condition,
      notes: ppe.notes || '',
      filePath: ppe.filePath ?? null,
    });
  };

  /**
   * Cancela a edição ou adição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  /**
   * Salva as alterações de um EPI.
   */
  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (editingId) {
      setIsSaving(true);
      try {
        await onUpdate(editingId, {
          ...formData,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          purchaseDate: formData.purchaseDate || undefined,
          lastInspectionDate: formData.lastInspectionDate || undefined,
          nextInspectionDate: formData.nextInspectionDate || undefined,
          notes: formData.notes || undefined,
        });
        setEditingId(null);
        resetForm();
      } catch {
        toast.error(t('common:error', { defaultValue: 'Erro ao salvar EPI' }));
      } finally {
        setIsSaving(false);
      }
    }
  };

  /**
   * Adiciona um novo EPI.
   */
  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      await onAdd({
        ...formData,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        lastInspectionDate: formData.lastInspectionDate || undefined,
        nextInspectionDate: formData.nextInspectionDate || undefined,
        notes: formData.notes || undefined,
      });
      setIsAdding(false);
      handleCancel();
    } catch {
      toast.error(t('common:error', { defaultValue: 'Erro ao adicionar EPI' }));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Remove um EPI.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('ppes.confirmDelete'))) {
      await onRemove(id);
    }
  };

  /**
   * Renderiza o formulário inline (usado tanto para adicionar quanto para editar).
   */
  const renderForm = (isNew: boolean) => (
    <div className={`p-4 rounded-lg border space-y-4 ${isNew ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
      {/* Nome + Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('ppes.name')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('ppes.namePlaceholder')}
          />
        </div>
        <div>
          <label className="form-label">{t('ppes.category')}</label>
          <select
            className="form-select w-full"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="COMPANY_PROVIDED">{t('ppes.categories.company_provided')}</option>
            <option value="PERSONAL">{t('ppes.categories.personal')}</option>
          </select>
        </div>
      </div>

      {/* Tipo + Marca + Modelo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">{t('ppes.type')}</label>
          <select
            className="form-select w-full"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="HARNESS">{t('ppes.types.harness')}</option>
            <option value="HELMET">{t('ppes.types.helmet')}</option>
            <option value="ROPE">{t('ppes.types.rope')}</option>
            <option value="FALL_ARREST">{t('ppes.types.fall_arrest')}</option>
            <option value="GLOVES">{t('ppes.types.gloves')}</option>
            <option value="FOOTWEAR">{t('ppes.types.footwear')}</option>
            <option value="EYE_PROTECTION">{t('ppes.types.eye_protection')}</option>
            <option value="RESPIRATORY">{t('ppes.types.respiratory')}</option>
            <option value="ANCHOR_CONNECTOR">{t('ppes.types.anchor_connector')}</option>
            <option value="FIRST_AID">{t('ppes.types.first_aid')}</option>
            <option value="OTHER">{t('ppes.types.other')}</option>
          </select>
        </div>
        <div>
          <label className="form-label">{t('ppes.brand')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Petzl"
          />
        </div>
        <div>
          <label className="form-label">{t('ppes.model')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="AVAO BOD"
          />
        </div>
      </div>

      {/* Número de série + Condição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('ppes.serialNumber')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            placeholder="PZ-2024-001"
          />
        </div>
        <div>
          <label className="form-label">{t('ppes.condition')}</label>
          <select
            className="form-select w-full"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="NEW">{t('ppes.conditions.new')}</option>
            <option value="GOOD">{t('ppes.conditions.good')}</option>
            <option value="FAIR">{t('ppes.conditions.fair')}</option>
            <option value="NEEDS_REPLACEMENT">{t('ppes.conditions.needs_replacement')}</option>
            <option value="EXPIRED">{t('ppes.conditions.expired')}</option>
            <option value="RETIRED">{t('ppes.conditions.retired')}</option>
          </select>
        </div>
      </div>

      {/* Datas: Aquisição, Última Inspeção, Próxima Inspeção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">{t('ppes.purchaseDate')}</label>
          <input
            type="date"
            className="form-input w-full"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">{t('ppes.lastInspectionDate')}</label>
          <input
            type="date"
            className="form-input w-full"
            value={formData.lastInspectionDate}
            onChange={(e) => setFormData({ ...formData, lastInspectionDate: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">{t('ppes.nextInspectionDate')}</label>
          <input
            type="date"
            className="form-input w-full"
            value={formData.nextInspectionDate}
            onChange={(e) => setFormData({ ...formData, nextInspectionDate: e.target.value })}
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="form-label">{t('ppes.notes')}</label>
        <textarea
          className="form-input w-full"
          rows={2}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={t('ppes.notesPlaceholder')}
        />
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button size="sm" onClick={isNew ? handleAdd : handleSave} disabled={isSaving}>
          <Check className="w-4 h-4 mr-1" />
          {isNew ? t('actions.add') : t('actions.save')}
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
            {t('ppes.add')}
          </Button>
        )}
      </div>

      {/* Lista de EPIs */}
      <div className="space-y-3">
        {ppes.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('ppes.empty')}
          </p>
        )}

        {ppes.map((ppe) => (
          <div
            key={ppe.id}
            className={`p-4 rounded-lg border ${
              isInspectionOverdue(ppe.nextInspectionDate)
                ? 'bg-red-50 border-red-200'
                : isInspectionExpiring(ppe.nextInspectionDate)
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
            }`}
          >
            {editingId === ppe.id ? (
              /* Modo de edição */
              renderForm(false)
            ) : (
              /* Modo de visualização */
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Nome + badges de condição e categoria */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{ppe.name}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {formatCategory(ppe.category)}
                    </span>
                    {ppe.condition === 'EXPIRED' || ppe.condition === 'NEEDS_REPLACEMENT' ? (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" />
                        {formatCondition(ppe.condition)}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {formatCondition(ppe.condition)}
                      </span>
                    )}
                  </div>

                  {/* Tipo + Marca/Modelo */}
                  <p className="text-sm text-gray-600">
                    {formatType(ppe.type)}
                    {ppe.brand && ` — ${ppe.brand}`}
                    {ppe.model && ` ${ppe.model}`}
                  </p>

                  {/* Detalhes: serial, datas */}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    {ppe.serialNumber && (
                      <span className="bg-gray-200 px-2 py-0.5 rounded font-mono">
                        S/N: {ppe.serialNumber}
                      </span>
                    )}
                    {ppe.purchaseDate && (
                      <span>{t('ppes.purchaseDate')}: {formatDate(ppe.purchaseDate)}</span>
                    )}
                    {ppe.lastInspectionDate && (
                      <span>{t('ppes.lastInspectionDate')}: {formatDate(ppe.lastInspectionDate)}</span>
                    )}
                    {ppe.nextInspectionDate && (
                      <span className={isInspectionOverdue(ppe.nextInspectionDate) ? 'text-red-600 font-medium' : ''}>
                        {t('ppes.nextInspectionDate')}: {formatDate(ppe.nextInspectionDate)}
                      </span>
                    )}
                  </div>

                  {/* Alertas de inspeção */}
                  {isInspectionOverdue(ppe.nextInspectionDate) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('ppes.inspectionOverdue')}
                    </p>
                  )}
                  {isInspectionExpiring(ppe.nextInspectionDate) && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {t('ppes.inspectionExpiring')}
                    </p>
                  )}

                  {/* Observações */}
                  {ppe.notes && (
                    <p className="text-sm text-gray-500 mt-1">{ppe.notes}</p>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(ppe)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(ppe.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Formulário para adicionar novo EPI */}
        {isAdding && renderForm(true)}
      </div>
    </div>
  );
}
