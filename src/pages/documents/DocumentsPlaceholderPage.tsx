/**
 * DOCUMENTS PLACEHOLDER PAGE - Página Provisória (Em Construção)
 *
 * Página temporária que indica que o módulo de Documentos
 * está em desenvolvimento. Será substituída quando o módulo
 * for reconstruído do zero.
 *
 * O módulo permitirá gerar documentos padronizados (invoices,
 * relatórios diários, toolbox talks) a partir de templates.
 */

import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Construction, FileText, FileSpreadsheet, ClipboardCheck } from 'lucide-react';

export function DocumentsPlaceholderPage() {
  const { t } = useTranslation('common');

  return (
    <AppLayout>
      <PageHeader
        title={t('nav.documents')}
        subtitle={t('documents.subtitle')}
      />

      {/* Mensagem central */}
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg w-full">
          <Construction className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {t('documents.underConstruction')}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('documents.willBeAvailable')}
          </p>

          {/* Prévia do que virá */}
          <div className="space-y-3 text-left">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t('documents.whatIsComing')}
            </p>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <FileText className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
              <span>{t('documents.feature_invoices')}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <FileSpreadsheet className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
              <span>{t('documents.feature_reports')}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <ClipboardCheck className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
              <span>{t('documents.feature_safety')}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
