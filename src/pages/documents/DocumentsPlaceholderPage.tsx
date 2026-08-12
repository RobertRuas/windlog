/**
 * DOCUMENTS PLACEHOLDER PAGE - Página Provisória (Em Construção)
 *
 * Página temporária que indica que o módulo de Documentos
 * está em desenvolvimento. Será substituída quando o módulo
 * for reconstruído do zero.
 */

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Construction } from 'lucide-react';

export function DocumentsPlaceholderPage() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.documents')}
        subtitle={t('documents.comingSoon')}
      />

      {/* Mensagem centralizada */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Construction className="h-16 w-16 text-amber-500 mb-6" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {t('documents.underConstruction')}
        </h2>
        <p className="text-sm text-gray-500 max-w-md">
          {t('documents.willBeAvailable')}
        </p>
      </div>
    </div>
  );
}
