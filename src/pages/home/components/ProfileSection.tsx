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
import { Pencil, X, Check } from 'lucide-react';

// Componentes compartilhados
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * Interface para configuração de um campo da seção.
 */
export interface FieldConfig {
  /** Chave do campo nos dados (ex: 'firstName') */
  key: string;
  /** Label exibido acima do campo */
  label: string;
  /** Tipo do input (text, email, date, textarea) */
  type?: 'text' | 'email' | 'date' | 'textarea';
  /** Validação mínima de caracteres */
  minLength?: number;
  /** Se o campo é obrigatório */
  required?: boolean;
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
  data,
  onSave,
  isLoading,
}: ProfileSectionProps) {
  const { t } = useTranslation('home');

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
      <div className="px-6 py-4">
        {isEditing ? (
          /* MODO EDIÇÃO - Campos editáveis */
          <div className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.key} className="relative">
                {field.type === 'textarea' ? (
                  /* Campo textarea */
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      rows={3}
                      className={`
                        px-3 py-2 rounded-lg border text-sm resize-none
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors[field.key] ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                  </div>
                ) : (
                  /* Campo input normal */
                  <Input
                    label={field.label}
                    type={field.type || 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFieldChange(field.key, e.target.value)
                    }
                    error={errors[field.key]}
                  />
                )}

                {/* Botão X para dismiss do erro */}
                {errors[field.key] && (
                  <button
                    onClick={() => dismissError(field.key)}
                    className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

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
          /* MODO VISUALIZAÇÃO - Dados em texto */
          <div className="flex flex-col gap-3">
            {fields.map((field) => {
              const value = data[field.key];
              if (!value) return null;

              return (
                <div key={field.key} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-500 min-w-[140px]">{field.label}:</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
