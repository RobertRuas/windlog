/**
 * ============================================================================
 * BANK ACCOUNT SECTION - Seção de Dados Bancários
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Exibe e gerencia as contas bancárias do usuário.
 * Permite adicionar, editar e remover contas bancárias.
 * O usuário pode ter múltiplas contas e definir uma como principal.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todas as contas bancárias
 * - Adiciona nova conta com banco, IBAN, BIC, titular
 * - Edita contas existentes inline
 * - Remove contas com confirmação
 * - Define uma conta como principal
 * ============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Check, Building2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { BankAccount } from '@/services/auth.service';

/**
 * Props do componente.
 */
interface BankAccountSectionProps {
  accounts: BankAccount[];
  onAdd: (data: Omit<BankAccount, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<BankAccount>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

/**
 * Seção de dados bancários.
 */
export function BankAccountSection({ accounts, onAdd, onUpdate, onRemove }: BankAccountSectionProps) {
  const { t } = useTranslation('home');

  // Estado para controlar qual item está sendo editado
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<Omit<BankAccount, 'id'>>({
    bankName: '',
    iban: '',
    bicSwift: '',
    accountHolder: '',
    isPrimary: false,
    description: '',
  });

  /**
   * Inicia a edição de uma conta.
   */
  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      bankName: account.bankName,
      iban: account.iban,
      bicSwift: account.bicSwift || '',
      accountHolder: account.accountHolder,
      isPrimary: account.isPrimary,
      description: account.description || '',
    });
  };

  /**
   * Cancela a edição.
   */
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      bankName: '',
      iban: '',
      bicSwift: '',
      accountHolder: '',
      isPrimary: false,
      description: '',
    });
  };

  /**
   * Salva as alterações de uma conta.
   */
  const handleSave = async () => {
    if (editingId) {
      await onUpdate(editingId, {
        ...formData,
        bicSwift: formData.bicSwift || undefined,
        description: formData.description || undefined,
      });
      setEditingId(null);
    }
  };

  /**
   * Adiciona uma nova conta.
   */
  const handleAdd = async () => {
    if (!formData.bankName.trim() || !formData.iban.trim() || !formData.accountHolder.trim()) return;
    await onAdd({
      ...formData,
      bicSwift: formData.bicSwift || undefined,
      description: formData.description || undefined,
    });
    setIsAdding(false);
    handleCancel();
  };

  /**
   * Remove uma conta.
   */
  const handleRemove = async (id: string) => {
    if (window.confirm(t('bankAccounts.confirmDelete'))) {
      await onRemove(id);
    }
  };

  /**
   * Define uma conta como principal.
   */
  const handleSetPrimary = async (id: string) => {
    await onUpdate(id, { isPrimary: true });
  };

  /**
   * Renderiza o formulário de edição/adição.
   */
  const renderForm = (isAddMode: boolean) => (
    <div className={`p-4 rounded-lg border space-y-4 ${isAddMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('bankAccounts.bankName')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="Millennium BCP"
          />
        </div>
        <div>
          <label className="form-label">{t('bankAccounts.accountHolder')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.accountHolder}
            onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
            placeholder="João Manuel Silva"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('bankAccounts.iban')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            placeholder="PT50 0002 0123 12345678901 23"
          />
        </div>
        <div>
          <label className="form-label">{t('bankAccounts.bicSwift')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.bicSwift}
            onChange={(e) => setFormData({ ...formData, bicSwift: e.target.value })}
            placeholder="BESCPTPL"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('bankAccounts.description')}</label>
          <input
            type="text"
            className="form-input w-full"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('bankAccounts.descriptionPlaceholder')}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            />
            <span className="text-sm text-gray-700">{t('bankAccounts.isPrimary')}</span>
          </label>
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
            {t('bankAccounts.add')}
          </Button>
        )}
      </div>

      {/* Lista de contas */}
      <div className="space-y-3">
        {accounts.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 italic">
            {t('bankAccounts.empty')}
          </p>
        )}

        {accounts.map((account) => (
          <div
            key={account.id}
            className={`p-4 rounded-lg border ${
              account.isPrimary
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {editingId === account.id ? (
              renderForm(false)
            ) : (
              /* Modo de visualização */
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 size={16} className="text-blue-600 flex-shrink-0" />
                    <p className="font-medium text-gray-900">{account.bankName}</p>
                    {account.isPrimary && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3" />
                        {t('bankAccounts.primary')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span className="bg-gray-200 px-2 py-0.5 rounded font-mono">
                      IBAN: {account.iban}
                    </span>
                    {account.bicSwift && (
                      <span className="bg-gray-200 px-2 py-0.5 rounded font-mono">
                        BIC: {account.bicSwift}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{account.accountHolder}</p>
                  {account.description && (
                    <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!account.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(account.id)}
                      title={t('bankAccounts.isPrimary')}
                    >
                      <Star className="w-4 h-4 text-yellow-500" />
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(account)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRemove(account.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Formulário para adicionar nova conta */}
        {isAdding && renderForm(true)}
      </div>
    </div>
  );
}
