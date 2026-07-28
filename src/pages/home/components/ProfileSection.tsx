/**
 * ============================================================================
 * PROFILE SECTION - Seção de Perfil com Edição Inline
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que exibe uma seção do perfil com funcionalidade
 * de edição inline. Cada seção tem seu próprio estado de edição.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Exibe os dados em modo visualização (somente leitura)
 * 2. Ao clicar em "Editar", muda para modo de edição
 * 3. No modo de edição, os campos se tornam inputs editáveis
 * 4. Ao salvar, envia apenas os campos modificados
 * 5. Ao cancelar, descarta as alterações e volta ao modo visualização
 *
 * VALIDAÇÕES:
 * -----------
 * - Erros são exibidos como hints inline (abaixo do campo)
 * - Cada erro tem botão X para dismiss
 * - Erros são limpos automaticamente ao digitar
 *
 * PROPS:
 * ------
 * - title: título da seção
 * - description: descrição da seção
 * - fields: configuração dos campos (label, key, type, validation)
 * - data: dados atuais do usuário
 * - onSave: função chamada ao salvar (recebe dados modificados)
 * - isLoading: estado de carregamento (durante salvamento)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, X, Check, type LucideIcon } from 'lucide-react';

// Componentes compartilhados
import { Button } from '@/components/ui/Button';

/**
 * Interface para configuração de um campo da seção.
 */
export interface FieldConfig {
  /** Chave do campo nos dados (ex: 'firstName') */
  key: string;
  /** Label exibido acima do campo */
  label: string;
  /** Tipo do input (text, email, date, textarea, select) */
  type?: 'text' | 'email' | 'date' | 'textarea' | 'select';
  /** Validação mínima de caracteres */
  minLength?: number;
  /** Se o campo é obrigatório */
  required?: boolean;
  /** Opções para tipo select */
  options?: { value: string; label: string }[];
  /** Largura do campo no grid (1 = metade, 2 = linha inteira) */
  span?: 1 | 2;
  /** Categoria/grupo a que o campo pertence */
  category?: string;
}

/**
 * Definição de um grupo de campos dentro da seção.
 */
export interface FieldGroup {
  /** ID do grupo (usado no field.category) */
  id: string;
  /** Label do grupo */
  label: string;
  /** Ícone do grupo (lucide-react) */
  icon: LucideIcon;
}

/**
 * Props do componente ProfileSection.
 */
interface ProfileSectionProps {
  /** Título da seção (ex: "Informações Pessoais") */
  title: string;
  /** Descrição da seção (ex: "Seus dados básicos de contato") */
  description: string;
  /** Configuração dos campos exibidos na seção */
  fields: FieldConfig[];
  /** Grupos para categorizar os campos (opcional) */
  groups?: FieldGroup[];
  /** Dados atuais do usuário */
  data: Record<string, string | null | undefined>;
  /** Função chamada ao salvar (recebe dados modificados) */
  onSave: (data: Record<string, string | null>) => void;
  /** Se está salvando (mostra loading no botão) */
  isLoading: boolean;
}

/**
 * Componente ProfileSection - Seção de perfil com edição inline.
 */
export function ProfileSection({
  title,
  description,
  fields,
  groups,
  data,
  onSave,
  isLoading,
}: ProfileSectionProps) {
  const { t } = useTranslation('home');

  /**
   * Formata uma data ISO (yyyy-mm-dd) para dd/mm/yyyy.
   * Retorna o valor original se não for uma data válida.
   */
  function formatDate(value: string): string {
    if (!value) return value;
    // Suporta formato ISO (yyyy-mm-dd) ou já formatado (dd/mm/yyyy)
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    return value;
  }

  // Estados da seção
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Inicializa o formData com os dados atuais quando a seção entra em modo edição.
   */
  useEffect(() => {
    if (isEditing) {
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        const value = data[field.key];
        initialData[field.key] = value ?? '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isEditing, data, fields]);

  /**
   * Valida os dados do formulário antes de salvar.
   * Retorna true se válido, false se houver erros.
   */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.key] || '';

      // Validação de campo obrigatório
      if (field.required && !value.trim()) {
        newErrors[field.key] = t('validation.required');
        return;
      }

      // Validação de tamanho mínimo
      if (field.minLength && value && value.length < field.minLength) {
        newErrors[field.key] = t('validation.minLength', { count: field.minLength });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Atualiza um campo no formData e limpa o erro associado.
   */
  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Limpa o erro ao digitar
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  /**
   * Dismiss um erro específico (botão X).
   */
  function dismissError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /**
   * Salva as alterações após validação.
   */
  async function handleSave() {
    if (!validate()) return;

    // Envia apenas campos que mudaram
    const changedData: Record<string, string | null> = {};
    fields.forEach((field) => {
      const newValue = formData[field.key] || '';
      const oldValue = data[field.key] ?? '';
      if (newValue !== oldValue) {
        changedData[field.key] = newValue || null;
      }
    });

    // Só salva se houver alterações
    if (Object.keys(changedData).length > 0) {
      await onSave(changedData);
    }

    setIsEditing(false);
  }

  /**
   * Cancela a edição e descarta alterações.
   */
  function handleCancel() {
    setIsEditing(false);
    setErrors({});
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho da seção */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>

        {/* Botão de editar (apenas em modo visualização) */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Pencil size={14} />
            {t('actions.edit')}
          </button>
        )}
      </div>

      {/* Conteúdo da seção */}
      <div className="px-6 py-4 space-y-5">
        {isEditing ? (
          /* MODO EDIÇÃO - Campos agrupados */
          <div className="space-y-5">
            {(groups ?? []).map((group) => {
              const groupFields = fields.filter((f) => f.category === group.id);
              if (groupFields.length === 0) return null;
              const GroupIcon = group.icon;
              return (
                <div key={group.id}>
                  {/* Header do grupo */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <GroupIcon size={13} className="text-gray-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {group.label}
                    </span>
                  </div>
                  {/* Campos do grupo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupFields.map((field) => {
                      const spanClass = field.span === 2 ? 'sm:col-span-2' : '';
                      return (
                        <div key={field.key} className={`relative ${spanClass}`}>
                          <label className="form-label">{field.label}</label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={formData[field.key] || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              rows={3}
                              className={`form-textarea w-full ${errors[field.key] ? 'border-red-500' : ''}`}
                            />
                          ) : field.type === 'select' && field.options ? (
                            <select
                              value={formData[field.key] || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`form-select w-full ${errors[field.key] ? 'border-red-500' : ''}`}
                            >
                              <option value="">{t('validation.selectOption', { defaultValue: 'Selecione...' })}</option>
                              {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={formData[field.key] || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`form-input w-full ${errors[field.key] ? 'border-red-500' : ''}`}
                            />
                          )}
                          {errors[field.key] && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-red-600">{errors[field.key]}</span>
                              <button
                                onClick={() => dismissError(field.key)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Botões de ação (Salvar / Cancelar) */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isLoading}>
                <span className="flex items-center gap-1.5">
                  <Check size={14} />
                  {isLoading ? t('actions.saving') : t('actions.save')}
                </span>
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
                {t('actions.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          /* MODO VISUALIZAÇÃO - Dados agrupados */
          <div className="space-y-5">
            {(groups ?? []).map((group) => {
              const groupFields = fields.filter((f) => f.category === group.id);
              // Filtra apenas campos com valor
              const visibleFields = groupFields.filter((f) => data[f.key]);
              if (visibleFields.length === 0) return null;
              const GroupIcon = group.icon;
              return (
                <div key={group.id}>
                  {/* Header do grupo */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <GroupIcon size={13} className="text-gray-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {group.label}
                    </span>
                  </div>
                  {/* Campos do grupo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pl-8">
                    {visibleFields.map((field) => {
                      const value = data[field.key]!;
                      const spanClass = field.span === 2 ? 'sm:col-span-2' : '';
                      return (
                        <div key={field.key} className={`flex items-baseline gap-3 text-sm ${spanClass}`}>
                          <span
                            className="text-gray-500 w-[110px] flex-shrink-0 truncate"
                            title={field.label}
                          >
                            {field.label}
                          </span>
                          <span className="text-gray-900 font-medium truncate">
                            {field.type === 'date' ? formatDate(value) : value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
