/**
 * ============================================================================
 * DOCUMENT FORM PAGE - Página de Formulário de Documento
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página para criar ou editar um documento gerado a partir de template.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - MODO CRIAÇÃO: seleciona template via query param (?template=xxx),
 *   preenche formulário dinâmico e gera o documento
 * - MODO EDIÇÃO: carrega documento existente pelo ID na URL,
 *   preenche formulário com dados atuais e salva (cria nova versão)
 * - Formulário específico por template: cada template tem seus próprios campos
 *   definidos em template-form-configs.ts (invoice, car-daily-report, toolbox-talk)
 * - Inclui checklists com opções Y/X/N/A para inspeções
 * - Ao salvar em modo edição, cria nova versão automaticamente
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Detecta se é criação (rota /documents/new) ou edição (/documents/:id/edit)
 * 2. Em criação: busca template pelo query param e exibe formulário
 * 3. Em edição: busca documento existente e preenche formulário
 * 4. Ao salvar: chama createDocument ou updateDocument conforme o modo
 * 5. Após salvar: redireciona para a página de visualização
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileText } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import {
  getDocumentById,
  getTemplates,
  createDocument,
  updateDocument,
  type DocumentTemplate,
} from '@/services/document.service';
import {
  getTemplateFormConfig,
  type TemplateFormConfig,
  type FormField,
  type FormSection,
} from './template-form-configs';

/**
 * Página DocumentFormPage - formulário de criação/edição de documento.
 */
export function DocumentFormPage() {
  const { t } = useTranslation('documents');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // Detecta se é modo edição (tem ID na URL)
  const isEditing = !!id;
  const templateParam = searchParams.get('template') || '';

  // Estado do formulário
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templateParam);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Busca templates disponíveis
  const { data: templatesData } = useQuery({
    queryKey: ['document-templates'],
    queryFn: getTemplates,
  });

  // Busca documento existente (modo edição)
  const { data: documentData, isLoading: isLoadingDocument } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocumentById(id!),
    enabled: isEditing && !!id,
  });

  // Preenche formulário com dados do documento existente
  useEffect(() => {
    if (documentData?.data) {
      const doc = documentData.data;
      setTitle(doc.title);
      setSelectedTemplate(doc.templateId);
      setFormData(doc.formData || {});
    }
  }, [documentData]);

  // Mutation para criar documento
  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (response) => {
      toast.success(t('messages.createSuccess'));
      navigate(`/documents/${response.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('messages.createError'));
    },
  });

  // Mutation para atualizar documento
  const updateMutation = useMutation({
    mutationFn: (data: { title: string; formData: Record<string, any> }) =>
      updateDocument(id!, data),
    onSuccess: (response) => {
      toast.success(t('messages.updateSuccess'));
      navigate(`/documents/${response.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('messages.updateError'));
    },
  });

  const templates = templatesData?.data || [];
  const currentTemplate = templates.find(
    (tpl: DocumentTemplate) => tpl.id === selectedTemplate,
  );
  const document = documentData?.data;

  // Configuração do formulário para o template selecionado
  const formConfig = selectedTemplate ? getTemplateFormConfig(selectedTemplate) : null;

  /**
   * Atualiza um campo do formulário.
   */
  function handleFieldChange(fieldId: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }

  /**
   * Atualiza um item de checklist (Y/X/N/A).
   */
  function handleChecklistChange(fieldKey: string, itemKey: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: { ...(prev[fieldKey] || {}), [itemKey]: value },
    }));
  }

  /**
   * Submete o formulário (criar ou atualizar).
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t('form.titleRequired'));
      return;
    }

    if (!selectedTemplate) {
      toast.error(t('form.selectTemplate'));
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ title: title.trim(), formData });
    } else {
      createMutation.mutate({
        templateId: selectedTemplate,
        title: title.trim(),
        formData,
      });
    }
  }

  /**
   * Volta para a página de listagem.
   */
  function handleBack() {
    navigate('/documents');
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <Sidebar />

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-60 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="p-2 text-gray-500 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-[#f5f5f7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
              title={t('form.back')}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f7]">
                {isEditing ? t('form.editTitle') : t('form.createTitle')}
              </h1>
              {isEditing && document && (
                <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mt-1">
                  {t('form.versionNotice', {
                    version: document.version + 1,
                  })}
                </p>
              )}
            </div>
          </div>

          {/* ── Loading (modo edição) ─────────────────────────────── */}
          {isEditing && isLoadingDocument ? (
            <div className="p-8 text-center text-gray-500 dark:text-[#a1a1a6]">
              {t('loading')}
            </div>
          ) : (
            /* ── Formulário ────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de template (apenas em modo criação) */}
              {!isEditing && (
                <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-2">
                    {t('form.template')} *
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('form.selectTemplate')}</option>
                    {templates.map((tpl: DocumentTemplate) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.code}) — {tpl.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Informação do template selecionado */}
              {currentTemplate && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      {currentTemplate.name}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      {currentTemplate.code} — {currentTemplate.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Título do documento */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-2">
                  {t('form.title')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('form.titlePlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] placeholder-gray-400 dark:placeholder-[#636366] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Campos específicos do template selecionado */}
              {selectedTemplate && formConfig && (
                <TemplateSpecificForm
                  config={formConfig}
                  formData={formData}
                  onChange={handleFieldChange}
                  onChecklistChange={handleChecklistChange}
                  t={t}
                />
              )}

              {/* Sem template selecionado */}
              {!selectedTemplate && !isEditing && (
                <div className="p-8 text-center bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a]">
                  <FileText
                    size={48}
                    className="mx-auto text-gray-300 dark:text-[#48484a] mb-4"
                  />
                  <p className="text-gray-500 dark:text-[#a1a1a6]">
                    {t('form.selectTemplate')}
                  </p>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] bg-gray-100 dark:bg-[#38383a] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTemplate || !title.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  {isSubmitting
                    ? isEditing
                      ? t('form.saving')
                      : t('form.generating')
                    : isEditing
                      ? t('form.save')
                      : t('form.generate')}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// COMPONENTES AUXILIARES - Formulário Específico por Template
// =========================================================================

/** Props do formulário específico do template */
interface TemplateSpecificFormProps {
  config: TemplateFormConfig;
  formData: Record<string, any>;
  onChange: (fieldId: string, value: string) => void;
  onChecklistChange: (fieldKey: string, itemKey: string, value: string) => void;
  t: (key: string) => string;
}

/**
 * Renderiza o formulário específico para o template selecionado.
 * Cada seção é exibida como um card com os campos agrupados.
 */
function TemplateSpecificForm({ config, formData, onChange, onChecklistChange, t }: TemplateSpecificFormProps) {
  return (
    <div className="space-y-6">
      {config.sections.map((section, idx) => (
        <FormSectionCard
          key={idx}
          section={section}
          formData={formData}
          onChange={onChange}
          onChecklistChange={onChecklistChange}
          t={t}
        />
      ))}
    </div>
  );
}

/**
 * Card de seção do formulário com título e campos.
 */
function FormSectionCard({
  section,
  formData,
  onChange,
  onChecklistChange,
  t,
}: {
  section: FormSection;
  formData: Record<string, any>;
  onChange: (fieldId: string, value: string) => void;
  onChecklistChange: (fieldKey: string, itemKey: string, value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-[#f5f5f7] mb-4">
        {t(section.titleKey)}
      </h3>
      <div className="space-y-4">
        {section.fields.map((field) => (
          <FormFieldRenderer
            key={field.key}
            field={field}
            formData={formData}
            onChange={onChange}
            onChecklistChange={onChecklistChange}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Renderiza um campo de formulário conforme o tipo (text, date, datetime-local, select, checklist).
 */
function FormFieldRenderer({
  field,
  formData,
  onChange,
  onChecklistChange,
  t,
}: {
  field: FormField;
  formData: Record<string, any>;
  onChange: (fieldId: string, value: string) => void;
  onChecklistChange: (fieldKey: string, itemKey: string, value: string) => void;
  t: (key: string) => string;
}) {
  const value = formData[field.key] ?? '';

  const inputClasses =
    'w-full px-3 py-2 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] placeholder-gray-400 dark:placeholder-[#636366] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1.5';

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className={labelClasses}>
            {t(field.labelKey)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
            className={inputClasses}
            required={field.required}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          <label className={labelClasses}>
            {t(field.labelKey)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={inputClasses}
            required={field.required}
          />
        </div>
      );

    case 'datetime-local':
      return (
        <div>
          <label className={labelClasses}>
            {t(field.labelKey)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={inputClasses}
            required={field.required}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className={labelClasses}>
            {t(field.labelKey)}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={inputClasses}
            required={field.required}
          >
            <option value="">—</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'checklist':
      return (
        <ChecklistField
          field={field}
          formData={formData}
          onChecklistChange={onChecklistChange}
          t={t}
        />
      );

    default:
      return null;
  }
}

/**
 * Campo de checklist com itens e opções Y (Satisfatório) / X (Defeituoso) / N/A.
 * Exibido como tabela com cada item e radio buttons.
 */
function ChecklistField({
  field,
  formData,
  onChecklistChange,
  t,
}: {
  field: FormField;
  formData: Record<string, any>;
  onChecklistChange: (fieldKey: string, itemKey: string, value: string) => void;
  t: (key: string) => string;
}) {
  const checklistValues: Record<string, string> = formData[field.key] || {};
  const items = field.checklistItems || [];

  const optionBtn = (active: boolean, color: string) =>
    `w-8 h-8 rounded-full text-xs font-semibold transition-colors border ${
      active
        ? `${color} text-white border-transparent`
        : 'bg-gray-50 dark:bg-[#1c1c1e] text-gray-500 dark:text-[#636366] border-gray-200 dark:border-[#38383a] hover:bg-gray-100 dark:hover:bg-[#38383a]'
    }`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-2">
        {t(field.labelKey)}
      </label>
      <div className="border border-gray-200 dark:border-[#38383a] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1c1c1e]">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                Item
              </th>
              <th className="text-center px-2 py-2 text-xs font-medium text-green-600 dark:text-green-400 uppercase">
                Y
              </th>
              <th className="text-center px-2 py-2 text-xs font-medium text-red-600 dark:text-red-400 uppercase">
                X
              </th>
              <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase">
                N/A
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#38383a]">
            {items.map((item) => {
              const currentVal = checklistValues[item.key] || '';
              return (
                <tr key={item.key} className="bg-white dark:bg-[#2c2c2e]">
                  <td className="px-3 py-2 text-gray-800 dark:text-[#f5f5f7]">
                    {t(item.labelKey)}
                  </td>
                  <td className="text-center px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onChecklistChange(field.key, item.key, 'Y')}
                      className={optionBtn(currentVal === 'Y', 'bg-green-500')}
                    >
                      Y
                    </button>
                  </td>
                  <td className="text-center px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onChecklistChange(field.key, item.key, 'X')}
                      className={optionBtn(currentVal === 'X', 'bg-red-500')}
                    >
                      X
                    </button>
                  </td>
                  <td className="text-center px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onChecklistChange(field.key, item.key, 'N/A')}
                      className={optionBtn(currentVal === 'N/A', 'bg-gray-400')}
                    >
                      N/A
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
