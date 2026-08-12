/**
 * ============================================================================
 * DOCUMENT FORM PAGE - Página de Formulário de Documento (iframe HTML)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página para criar ou editar um documento gerado a partir de template.
 * Usa os formulários HTML completos (servidos pelo backend) renderizados
 * num iframe, mantendo o layout e funcionalidades originais (tabelas
 * dinâmicas, signature pads, checklists, cálculos automáticos).
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Seleciona template → busca form HTML via API
 * 2. Renderiza o form HTML num iframe (isolamento de estilos)
 * 3. Ao salvar: extrai dados do iframe e envia ao backend
 * 4. Após salvar: redireciona para a página de visualização
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { getFormIdToKeyMap } from './template-field-maps';
import { getProfile } from '@/services/auth.service';

/**
 * Mapeamento dos radios do checklist (por índice) para chaves do formData.
 * O form HTML nomeia os radios como item-0, item-1, etc.
 */
const checklistIndexToKey: Record<string, string> = {
  'item-0': 'inspectionLeft.visualCheck',
  'item-1': 'inspectionRight.mirrorsCCTV',
  'item-2': 'inspectionLeft.brakes',
  'item-3': 'inspectionRight.tidinessInterior',
  'item-4': 'inspectionLeft.engineOil',
  'item-5': 'inspectionRight.drivingControls',
  'item-6': 'inspectionLeft.coolantLevels',
  'item-7': 'inspectionRight.fireExtinguisher',
  'item-8': 'inspectionLeft.tyresAndWheels',
  'item-9': 'inspectionRight.firstAidKit',
  'item-10': 'inspectionLeft.spareWheel',
  'item-11': 'inspectionRight.spillKit',
  'item-12': 'inspectionLeft.bodywork',
  'item-13': 'inspectionRight.towBarHitch',
  'item-14': 'inspectionLeft.hydraulics',
  'item-15': 'inspectionRight.trailer',
};

/**
 * Extrai dados de um formulário dentro de um iframe.
 * Usa o mapeamento formIdToKey para converter IDs dos inputs em chaves do formData.
 */
function extractFormData(iframe: HTMLIFrameElement, templateId: string): Record<string, any> {
  const doc = iframe.contentDocument;
  if (!doc) return {};

  const data: Record<string, any> = {};
  const form = doc.querySelector('form');
  if (!form) return {};

  const idToKey = getFormIdToKeyMap(templateId);

  // Extrai inputs por ID (text, email, date, datetime-local, number)
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input[id], select[id], textarea[id]'
  ).forEach((el) => {
    const id = el.id;
    if (!id) return;

    // Converte ID do form para chave do formData
    const fieldKey = idToKey[id] || id;

    if (el instanceof HTMLInputElement) {
      if (el.type === 'radio' || el.type === 'checkbox') return; // tratados abaixo
      data[fieldKey] = el.value;
    } else {
      data[fieldKey] = el.value;
    }
  });

  // Radios do checklist (car-daily-report): item-0, item-1, etc.
  const checkedRadios = form.querySelectorAll<HTMLInputElement>(
    'input[type="radio"]:checked'
  );
  checkedRadios.forEach((radio) => {
    const name = radio.name; // ex: "item-3"
    const value = radio.value; // Y, X, ou N/A
    const checkKey = checklistIndexToKey[name];
    if (checkKey) {
      // Chave aninhada: 'inspectionLeft.visualCheck' → { inspectionLeft: { visualCheck: 'Y' } }
      const parts = checkKey.split('.');
      if (parts.length === 2) {
        if (!data[parts[0]]) data[parts[0]] = {};
        data[parts[0]][parts[1]] = value;
      } else {
        data[checkKey] = value;
      }
    }
  });

  // Checkboxes (toolbox-talk): sec1-1, sec1-2, etc.
  form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => {
    if (el.id && el.checked) {
      data[`check_${el.id}`] = true;
    }
  });

  // Tabelas dinâmicas (invoice: project-table, cost-table)
  const tables = form.querySelectorAll<HTMLTableElement>('table[id]');
  tables.forEach((table) => {
    const tableId = table.id;
    const rows: Record<string, string>[] = [];
    table.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((tr) => {
      const rowData: Record<string, string> = {};
      tr.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((input, idx) => {
        rowData[`col${idx}`] = input.value;
      });
      if (Object.keys(rowData).length > 0) rows.push(rowData);
    });
    if (rows.length > 0) data[`table_${tableId}`] = rows;
  });

  return data;
}

/**
 * Página DocumentFormPage — formulário HTML em iframe.
 */
export function DocumentFormPage() {
  const { t } = useTranslation('documents');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isEditing = !!id;
  const templateParam = searchParams.get('template') || '';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Estado
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templateParam);

  // Busca perfil do utilizador (para assinatura)
  const { data: profile } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: getProfile,
  });

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

  // Busca o HTML do formulário correspondente ao template
  const { data: formHtml } = useQuery({
    queryKey: ['document-form-html', selectedTemplate],
    queryFn: async () => {
      if (!selectedTemplate) return null;
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/documents/templates/${selectedTemplate}/form-html`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) return null;
      return await response.text();
    },
    enabled: !!selectedTemplate,
  });

  // Preenche com dados do documento existente (edição)
  useEffect(() => {
    if (documentData?.data) {
      const doc = documentData.data;
      setTitle(doc.title);
      setSelectedTemplate(doc.templateId);
    }
  }, [documentData]);

  // Injeta o HTML do formulário no iframe
  useEffect(() => {
    if (iframeRef.current && formHtml) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        // Injeta CSS para esconder botões do form (usamos os nossos próprios)
        const styleOverride = `
          <style id="windlog-override">
            .form-actions { display: none !important; }
            body { padding: 10px !important; }
          </style>
        `;
        const htmlWithOverride = formHtml.replace('</head>', `${styleOverride}</head>`);
        iframeDoc.open();
        iframeDoc.write(htmlWithOverride);
        iframeDoc.close();
      }
    }
  }, [formHtml]);

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
  const currentTemplate = templates.find((tpl: DocumentTemplate) => tpl.id === selectedTemplate);
  const document = documentData?.data;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /**
   * Extrai dados do iframe e submete.
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        toast.error(t('form.titleRequired'));
        return;
      }
      if (!selectedTemplate) {
        toast.error(t('form.selectTemplate'));
        return;
      }

      // Extrai dados do formulário no iframe
      if (iframeRef.current) {
        const extracted = extractFormData(iframeRef.current, selectedTemplate);

        // Adiciona assinatura do perfil se disponível
        if (profile?.signatureData) {
          extracted._userSignature = profile.signatureData;
          extracted._signedByName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email;
        }

        if (isEditing) {
          updateMutation.mutate({ title: title.trim(), formData: extracted });
        } else {
          createMutation.mutate({
            templateId: selectedTemplate,
            title: title.trim(),
            formData: extracted,
          });
        }
      }
    },
    [title, selectedTemplate, isEditing, t, createMutation, updateMutation],
  );

  const handleBack = () => navigate('/documents');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <Sidebar />

      <main className="flex-1 md:ml-60 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
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
                  {t('form.versionNotice', { version: document.version + 1 })}
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
            <div className="space-y-6">
              {/* ── Controles: template + título ────────────────────── */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1.5">
                      {t('form.template')} *
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      disabled={isEditing}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-60"
                    >
                      <option value="">{t('form.selectTemplate')}</option>
                      {templates.map((tpl: DocumentTemplate) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1.5">
                      {t('form.title')} *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('form.titlePlaceholder')}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] placeholder-gray-400 dark:placeholder-[#636366] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Info do template */}
                {currentTemplate && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#38383a]">
                    <FileText size={16} className="text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-[#a1a1a6]">
                      {currentTemplate.description}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Iframe do formulário HTML ───────────────────────── */}
              {selectedTemplate && formHtml ? (
                <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    title={`Form: ${selectedTemplate}`}
                    style={{
                      width: '100%',
                      minHeight: '800px',
                      border: 'none',
                      display: 'block',
                    }}
                  />
                </div>
              ) : selectedTemplate ? (
                <div className="p-8 text-center bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a]">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-[#a1a1a6]">
                    {t('loading')}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a]">
                  <FileText size={48} className="mx-auto text-gray-300 dark:text-[#48484a] mb-4" />
                  <p className="text-gray-500 dark:text-[#a1a1a6]">
                    {t('form.selectTemplate')}
                  </p>
                </div>
              )}

              {/* ── Botões de ação ──────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] bg-gray-100 dark:bg-[#38383a] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
