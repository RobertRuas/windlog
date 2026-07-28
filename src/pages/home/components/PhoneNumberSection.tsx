/**
 * ============================================================================
 * PHONE NUMBER SECTION - Seção de Números de Telefone
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia os números de telefone do usuário.
 * Permite adicionar, editar e remover números.
 * Usado dentro de um Accordion na HomePage.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todos os números de telefone
 * - Adiciona novo número com código do país e tipo
 * - Edita números existentes inline
 * - Remove números com confirmação
 * - Design alinhado com altura consistente
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PREDEFINED_COUNTRIES } from '@/constants/countries';
import type { PhoneNumber } from '@/services/auth.service';

/**
 * Props do componente.
 */
interface PhoneNumberSectionProps {
  phones: PhoneNumber[];
  onAdd: (data: Omit<PhoneNumber, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<PhoneNumber>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de números de telefone.
 */
export function PhoneNumberSection({ phones, onAdd, onUpdate, onRemove }: PhoneNumberSectionProps) {
  const { t } = useTranslation('home');

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<PhoneNumber, 'id'>>({
    countryCode: '+351',
    number: '',
    type: 'mobile',
    isPrimary: false,
  });

  /**
   * Inicia a edição de um número.
   */
  const handleEdit = (phone: PhoneNumber) => {
    setEditingId(phone.id);
    setFormData({
      countryCode: phone.countryCode,
      number: phone.number,
      type: phone.type,
      isPrimary: phone.isPrimary,
    });
  };

  /**
   * Cancela a edição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      countryCode: '+351',
      number: '',
      type: 'mobile',
      isPrimary: false,
    });
  };

  /**
   * Salva as alterações de um número.
   */
  const handleSave = async () => {
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    }
  };

  /**
   * Adiciona um novo número.
   */
  const handleAdd = async () => {
    if (!formData.number.trim()) return;
    await onAdd(formData);
    setIsAdding(false);
    setFormData({
      countryCode: '+351',
      number: '',
      type: 'mobile',
      isPrimary: false,
    });
  };

  /**
   * Remove um número.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('phones.confirmDelete'))) {
      await onRemove(id);
    }
  };

  /**
   * Formata o tipo do número para exibição.
   */
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      mobile: t('phones.types.mobile'),
      home: t('phones.types.home'),
      work: t('phones.types.work'),
    };
    return types[type] || type;
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
            {t('phones.add')}
          </Button>
        )}
      </div>

      {/* Lista de números */}
      <div className="space-y-3">
        {phones.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('phones.empty')}
          </p>
        )}

        {phones.map((phone) => (
          <div
            key={phone.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3"
          >
            {editingId === phone.id ? (
              /* Modo de edição */
              <>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">{t('phones.countryCode')}</label>
                    <select
                      className="form-select w-full"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    >
                      {PREDEFINED_COUNTRIES.map((c: { phoneCode: string; name: string }) => (
                        <option key={c.phoneCode} value={c.phoneCode}>
                          {c.phoneCode} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('phones.number')}</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="912345678"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('phones.type')}</label>
                    <select
                      className="form-select w-full"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="mobile">{t('phones.types.mobile')}</option>
                      <option value="home">{t('phones.types.home')}</option>
                      <option value="work">{t('phones.types.work')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Modo de visualização */
              <>
                <div>
                  <p className="font-medium text-gray-900">
                    {phone.countryCode} {phone.number}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    {formatType(phone.type)}
                    {phone.isPrimary && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {t('phones.primary')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(phone)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(phone.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Formulário para adicionar novo número */}
        {isAdding && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">{t('phones.countryCode')}</label>
                <select
                  className="form-select w-full"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                >
                  {PREDEFINED_COUNTRIES.map((c: { phoneCode: string; name: string }) => (
                    <option key={c.phoneCode} value={c.phoneCode}>
                      {c.phoneCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('phones.number')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="912345678"
                />
              </div>
              <div>
                <label className="form-label">{t('phones.type')}</label>
                <select
                  className="form-select w-full"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="mobile">{t('phones.types.mobile')}</option>
                  <option value="home">{t('phones.types.home')}</option>
                  <option value="work">{t('phones.types.work')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAdd}>
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
