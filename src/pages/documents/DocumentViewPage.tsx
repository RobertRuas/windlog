/**
 * ============================================================================
 * DOCUMENT VIEW PAGE - Página de Visualização de Documento
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página de visualização completa de um documento gerado.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Exibe o documento com todos os dados preenchidos
 * - Pré-visualização do HTML/SVG do template com dados aplicados
 * - Informações do documento (versão, status, criador, data)
 * - Seção de assinatura digital (com SignaturePad)
 * - Botão para download do HTML
 * - Botão para editar (navega para /documents/:id/edit)
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Busca o documento pelo ID da URL
 * 2. Exibe informações do documento no cabeçalho
 * 3. Renderiza o template HTML com os dados do formulário
 * 4. Se não assinado: permite assinar com SignaturePad
 * 5. Se já assinado: exibe assinatura e dados do signatário
 * ============================================================================
 */

import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Pen,
  Clock,
  User,
  Eye,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import {
  getDocumentById,
  signDocument,
  getTemplates,
  type GeneratedDocument,
  type DocumentTemplate,
} from '@/services/document.service';

/**
 * Página DocumentViewPage - visualização de documento gerado.
 */
export function DocumentViewPage() {
  const { t } = useTranslation('documents');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Estado para assinatura
  const [showSignSection, setShowSignSection] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');

  // Estado para o modal de preview do documento
  const [showPreview, setShowPreview] = useState(false);

  // Ref para o iframe do documento
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Busca documento pelo ID
  const { data: documentData, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

  // Busca templates para exibir nome
  const { data: templatesData } = useQuery({
    queryKey: ['document-templates'],
    queryFn: getTemplates,
  });

  // Mutation para assinar documento
  const signMutation = useMutation({
    mutationFn: () => signDocument(id!, signatureData!, signerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success(t('view.signSuccess'));
      setShowSignSection(false);
      setSignatureData(null);
      setSignerName('');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('view.signError'));
    },
  });

  const document = documentData?.data;
  const templates = templatesData?.data || [];
  const currentTemplate = templates.find(
    (tpl: DocumentTemplate) => tpl?.id === document?.templateId,
  );

  /**
   * Retorna o label do status do documento.
   */
  function getStatusLabel(status: string) {
    switch (status) {
      case 'DRAFT':
        return t('status.draft');
      case 'SIGNED':
        return t('status.signed');
      case 'FINAL':
        return t('status.final');
      default:
        return status;
    }
  }

  /**
   * Retorna a classe CSS do status do documento.
   */
  function getStatusClass(status: string) {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'SIGNED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'FINAL':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Volta para a página de listagem.
   */
  function handleBack() {
    navigate('/documents');
  }

  /**
   * Navega para a página de edição.
   */
  function handleEdit() {
    navigate(`/documents/${id}/edit`);
  }

  /**
   * Confirma a assinatura do documento.
   */
  function handleConfirmSign() {
    if (!signatureData) {
      toast.error(t('view.signaturePlaceholder'));
      return;
    }
    if (!signerName.trim()) {
      toast.error(t('view.signerNamePlaceholder'));
      return;
    }
    signMutation.mutate();
  }

  /**
   * Faz download do HTML do documento.
   * Gera um HTML com os dados do formulário aplicados.
   */
  function handleDownloadHtml() {
    if (!document) return;

    // Gera um HTML simples com os dados do documento
    const htmlContent = generateDocumentHtml(document, currentTemplate);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${document.version}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Gera o HTML do documento com dados preenchidos.
   */
  function generateDocumentHtml(
    doc: GeneratedDocument,
    template?: DocumentTemplate,
  ): string {
    const fields = Object.entries(doc.formData || {})
      .map(
        ([key, value]) =>
          `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600">${key}</td><td style="padding:8px;border:1px solid #ddd">${value}</td></tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    h1 { color: #1d4ed8; margin-bottom: 8px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; }
    .signature { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; }
    .signature img { max-height: 80px; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <div class="meta">
    <p>${template?.name || doc.templateId} — ${template?.code || ''}</p>
    <p>Versão ${doc.version} | ${getStatusLabel(doc.status)} | ${new Date(doc.createdAt).toLocaleDateString()}</p>
  </div>
  <table>
    <thead><tr><th>Campo</th><th>Valor</th></tr></thead>
    <tbody>${fields}</tbody>
  </table>
  ${doc.signatureData ? `
  <div class="signature">
    <h3>${t('view.signature')}</h3>
    <img src="${doc.signatureData}" alt="Assinatura" />
    <p>${doc.signedBy || ''} — ${doc.signatureDate ? new Date(doc.signatureDate).toLocaleDateString() : ''}</p>
  </div>` : ''}
</body>
</html>`;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <Sidebar />

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-60 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 dark:text-[#a1a1a6] hover:text-gray-900 dark:hover:text-[#f5f5f7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
                title={t('view.back')}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f7]">
                  {t('view.title')}
                </h1>
                {document && (
                  <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mt-1">
                    {document.title} — v{document.version}
                  </p>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            {document && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Eye size={16} />
                  {t('view.preview', { defaultValue: 'Visualizar' })}
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] border border-gray-200 dark:border-[#38383a] rounded-xl hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
                >
                  <Download size={16} />
                  {t('view.downloadHtml')}
                </button>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Edit size={16} />
                  {t('view.edit')}
                </button>
              </div>
            )}
          </div>

          {/* ── Loading ───────────────────────────────────────────── */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-[#a1a1a6]">
              {t('loading')}
            </div>
          ) : !document ? (
            <div className="p-8 text-center">
              <FileText
                size={48}
                className="mx-auto text-gray-300 dark:text-[#48484a] mb-4"
              />
              <p className="text-gray-500 dark:text-[#a1a1a6]">
                {t('messages.notFound')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Informações do documento ────────────────────────── */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider mb-1">
                      {t('view.status')}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(document.status)}`}
                    >
                      {getStatusLabel(document.status)}
                    </span>
                  </div>

                  {/* Versão */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider mb-1">
                      {t('view.version')}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7]">
                      v{document.version}
                    </p>
                  </div>

                  {/* Criador */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider mb-1">
                      {t('view.createdBy')}
                    </p>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-[#f5f5f7]">
                        {document.creator.firstName} {document.creator.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Data de criação */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider mb-1">
                      {t('view.createdAt')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-[#f5f5f7]">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Template */}
                {currentTemplate && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#38383a]">
                    <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider mb-1">
                      {t('form.template')}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-[#f5f5f7]">
                      {currentTemplate.name} ({currentTemplate.code})
                    </p>
                  </div>
                )}
              </div>

              {/* ── Dados do formulário ─────────────────────────────── */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5f7] mb-4">
                  {t('view.documentPreview')}
                </h3>

                {Object.keys(document.formData || {}).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-[#a1a1a6]">
                    {t('form.selectTemplate')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-[#1c1c1e]">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                            Campo
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-[#38383a]">
                        {Object.entries(document.formData || {}).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#a1a1a6]">
                                {key}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-[#f5f5f7]">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Seção de assinatura ─────────────────────────────── */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5f7] mb-4">
                  {t('view.signature')}
                </h3>

                {/* Documento já assinado */}
                {document.signatureData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Pen size={16} />
                      <span className="text-sm font-medium">
                        {t('view.signed')}
                      </span>
                    </div>

                    {/* Imagem da assinatura */}
                    <div className="p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#38383a]">
                      <img
                        src={document.signatureData}
                        alt={t('view.signature')}
                        className="max-h-20"
                      />
                    </div>

                    {/* Informações do signatário */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                          {t('view.signedBy')}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-[#f5f5f7] mt-1">
                          {document.signedBy || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                          {t('view.signedAt')}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-[#f5f5f7] mt-1">
                          {document.signatureDate
                            ? new Date(document.signatureDate).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : showSignSection ? (
                  /* Formulário de assinatura */
                  <div className="space-y-4">
                    <SignaturePad
                      onSave={(dataUrl) => setSignatureData(dataUrl)}
                      onClear={() => setSignatureData(null)}
                      label={t('view.signaturePlaceholder')}
                    />

                    {/* Nome do signatário */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a6] mb-1">
                        {t('view.signerName')}
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder={t('view.signerNamePlaceholder')}
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] placeholder-gray-400 dark:placeholder-[#636366] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Botões de assinatura */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleConfirmSign}
                        disabled={signMutation.isPending || !signatureData || !signerName.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Pen size={16} />
                        {signMutation.isPending
                          ? t('view.signing')
                          : t('view.confirmSign')}
                      </button>
                      <button
                        onClick={() => {
                          setShowSignSection(false);
                          setSignatureData(null);
                          setSignerName('');
                        }}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] bg-gray-100 dark:bg-[#38383a] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Botão para iniciar assinatura */
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mb-4">
                      {t('view.noSignature')}
                    </p>
                    <button
                      onClick={() => setShowSignSection(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Pen size={16} />
                      {t('view.sign')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal de preview do documento (template preenchido) ──── */}
      {showPreview && document && (
        <DocumentPreviewModal
          document={document}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
