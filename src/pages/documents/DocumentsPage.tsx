/**
 * ============================================================================
 * DOCUMENTS PAGE - Página de Listagem de Documentos Gerados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página principal do módulo Documents. Exibe a lista de documentos
 * gerados a partir de templates HTML/SVG padronizados.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista documentos criados pelo usuário (ou todos para ADMIN/HR)
 * - Filtro por tipo de template e status
 * - Botão para criar novo documento
 * - Ações: visualizar, editar, excluir
 * - Exibe versão e status de cada documento
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Ao carregar, busca documentos da API com paginação
 * 2. Exibe tabela com documentos (título, template, versão, status, data)
 * 3. Botão "Novo Documento" abre modal de seleção de template
 * 4. Ao clicar em um documento, navega para a página de visualização
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import {
  getDocuments,
  deleteDocument,
  getTemplates,
  type DocumentListItem,
  type DocumentTemplate,
} from '@/services/document.service';

/**
 * Página DocumentsPage - Lista documentos gerados.
 */
export function DocumentsPage() {
  const { t } = useTranslation('documents');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado para filtros
  const [templateFilter, setTemplateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Estado para modal de novo documento
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // Busca documentos com paginação e filtros
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', templateFilter, statusFilter, page],
    queryFn: () =>
      getDocuments({
        templateId: templateFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      }),
  });

  // Busca templates disponíveis
  const { data: templatesData } = useQuery({
    queryKey: ['document-templates'],
    queryFn: getTemplates,
  });

  // Mutation para excluir documento
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('messages.deleteSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('messages.deleteError'));
    },
  });

  const documents = documentsData?.data?.data || [];
  const templates = templatesData?.data || [];

  /**
   * Navega para a página de criação de novo documento.
   */
  function handleCreateDocument(templateId: string) {
    navigate(`/documents/new?template=${templateId}`);
    setShowNewDocModal(false);
  }

  /**
   * Navega para a página de visualização do documento.
   */
  function handleViewDocument(id: string) {
    navigate(`/documents/${id}`);
  }

  /**
   * Navega para a página de edição do documento.
   */
  function handleEditDocument(id: string) {
    navigate(`/documents/${id}/edit`);
  }

  /**
   * Exclui o documento após confirmação.
   */
  function handleDeleteDocument(id: string) {
    if (window.confirm(t('confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  }

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
   * Retorna o nome do template pelo ID.
   */
  function getTemplateName(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    return template?.name || templateId;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <Sidebar />

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-60 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Cabeçalho ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f7]">
                {t('title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mt-1">
                {t('subtitle')}
              </p>
            </div>

            {/* Botão novo documento */}
            <button
              onClick={() => setShowNewDocModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              {t('newDocument')}
            </button>
          </div>

          {/* ── Filtros ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a]">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-[#a1a1a6]">
                {t('filters')}:
              </span>
            </div>

            {/* Filtro por template */}
            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('allTemplates')}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            {/* Filtro por status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383a] rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-[#f5f5f7] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="DRAFT">{t('status.draft')}</option>
              <option value="SIGNED">{t('status.signed')}</option>
              <option value="FINAL">{t('status.final')}</option>
            </select>
          </div>

          {/* ── Tabela de documentos ──────────────────────────────── */}
          <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-[#a1a1a6]">
                {t('loading')}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center">
                <FileText
                  size={48}
                  className="mx-auto text-gray-300 dark:text-[#48484a] mb-4"
                />
                <p className="text-gray-500 dark:text-[#a1a1a6]">
                  {t('noDocuments')}
                </p>
                <button
                  onClick={() => setShowNewDocModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  {t('createFirst')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-[#38383a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.title')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.template')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.version')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.createdAt')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#a1a1a6] uppercase tracking-wider">
                        {t('table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#38383a]">
                    {documents.map((doc: DocumentListItem) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#1c1c1e] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText
                              size={18}
                              className="text-blue-500 flex-shrink-0"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7]">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#a1a1a6]">
                          {getTemplateName(doc.templateId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#a1a1a6]">
                          v{doc.version}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(doc.status)}`}
                          >
                            {getStatusLabel(doc.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#a1a1a6]">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title={t('actions.view')}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title={t('actions.edit')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title={t('actions.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Paginação ─────────────────────────────────────────── */}
          {documentsData?.data?.meta && documentsData.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500 dark:text-[#a1a1a6]">
                {t('pagination.showing', {
                  current: page,
                  total: documentsData.data.meta.totalPages,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#38383a] transition-colors"
                >
                  {t('pagination.previous')}
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(documentsData.data.meta.totalPages, p + 1),
                    )
                  }
                  disabled={page === documentsData.data.meta.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#38383a] transition-colors"
                >
                  {t('pagination.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal de seleção de template ──────────────────────────── */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-xl">
            {/* Cabeçalho do modal */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#38383a]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5f7]">
                {t('selectTemplate')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a6] mt-1">
                {t('selectTemplateHint')}
              </p>
            </div>

            {/* Lista de templates */}
            <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
              {templates.map((template: DocumentTemplate) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateDocument(template.id)}
                  className="w-full p-4 text-left border border-gray-200 dark:border-[#38383a] rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText
                      size={24}
                      className="text-blue-500 flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-[#f5f5f7]">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#a1a1a6]">
                        {template.code} — {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Rodapé do modal */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-[#38383a]">
              <button
                onClick={() => setShowNewDocModal(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#a1a1a6] bg-gray-100 dark:bg-[#38383a] rounded-xl hover:bg-gray-200 dark:hover:bg-[#48484a] transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
