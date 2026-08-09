/**
 * ============================================================================
 * TRANSLATE SUGGESTION - Componentes de Tradução para Campos de Texto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Dois componentes reutilizáveis que dão suporte ao recurso de tradução
 * automática (PT -> EN) em qualquer campo de texto livre da aplicação:
 *
 *   1. <TranslateFieldHint />  - Indicador DISCRETO colocado junto ao label
 *      do campo, avisando que a tradução automática está disponível ali.
 *      Aparece apenas quando o idioma da interface é português.
 *
 *   2. <TranslateSuggestion /> - Barra sutil exibida abaixo do campo com a
 *      sugestão de tradução, permitindo aplicar ou dispensar, além de um
 *      estado de "processando" enquanto a IA traduz.
 *
 * POR QUE REUTILIZÁVEIS?
 * ----------------------
 * Qualquer módulo pode adicionar o recurso a um campo com poucas linhas,
 * bastando combinar o hook useTranslateSuggestion() com estes componentes.
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { Languages, Check, X, Loader2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

/* ==========================================================================
   Componente: TranslateFieldHint
   Ícone discreto junto ao label indicando que o campo pode ser traduzido.
   ========================================================================== */

/**
 * Indicador discreto de que a tradução automática está disponível no campo.
 *
 * Renderiza um pequeno ícone de idiomas com um tooltip explicativo.
 * Só aparece quando o idioma da interface é português (pt); caso contrário
 * o recurso não faz sentido e o indicador é omitido.
 */
export function TranslateFieldHint() {
  const { t } = useTranslation('common');
  const { settings } = useSettings();

  // Recurso (e portanto o indicador) ativo apenas em português.
  if (settings.language !== 'pt') return null;

  return (
    <span className="group relative inline-flex items-center align-middle ml-1">
      {/* Ícone discreto em cinza suave */}
      <Languages size={13} className="text-gray-400 group-hover:text-blue-500 transition-colors" />

      {/* Tooltip exibido ao passar o mouse (discreto, tons de azul) */}
      <span
        className="
          pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2
          whitespace-nowrap rounded-lg bg-blue-50 border border-blue-200/60
          px-2.5 py-1 text-[11px] font-medium text-blue-800 shadow-sm
          opacity-0 transition-opacity duration-150 group-hover:opacity-100
        "
      >
        {t('translate.fieldHint')}
      </span>
    </span>
  );
}

/* ==========================================================================
   Componente: TranslateSuggestion
   Barra com a sugestão de tradução (aplicar / dispensar / processando).
   ========================================================================== */

interface TranslateSuggestionProps {
  /** Texto traduzido sugerido (null quando não há sugestão) */
  suggestion: string | null;
  /** Se uma tradução está em andamento */
  isLoading: boolean;
  /** Chamado quando o usuário aceita a sugestão */
  onApply: () => void;
  /** Chamado quando o usuário dispensa a sugestão */
  onDismiss: () => void;
}

/**
 * Barra sutil de sugestão de tradução, exibida abaixo do campo.
 *
 * Estados:
 * - isLoading   -> mostra "Traduzindo..." com um pequeno spinner.
 * - suggestion  -> mostra o texto traduzido com botões aplicar/dispensar.
 * - nenhum      -> não renderiza nada.
 */
export function TranslateSuggestion({
  suggestion,
  isLoading,
  onApply,
  onDismiss,
}: TranslateSuggestionProps) {
  const { t } = useTranslation('common');

  // Nada a exibir: nem carregando, nem sugestão disponível.
  if (!isLoading && !suggestion) return null;

  // Estado de processamento: aviso discreto enquanto a IA traduz.
  if (isLoading && !suggestion) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        <span>{t('translate.processing')}</span>
      </div>
    );
  }

  // Sugestão disponível: barra com preview + ações.
  return (
    <div
      className="
        mt-1.5 flex items-start gap-2 rounded-lg border border-blue-200/60
        bg-blue-50/60 px-2.5 py-1.5
      "
    >
      {/* Ícone identificando o recurso */}
      <Languages size={13} className="mt-0.5 shrink-0 text-blue-500" />

      {/* Texto sugerido */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
          {t('translate.suggestionLabel')}
        </p>
        <p className="text-[12px] leading-snug text-blue-900 break-words">{suggestion}</p>
      </div>

      {/* Ações: aplicar e dispensar */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onApply}
          title={t('translate.apply')}
          aria-label={t('translate.apply')}
          className="
            flex h-6 w-6 items-center justify-center rounded-md text-blue-600
            hover:bg-blue-100 transition-colors
          "
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          title={t('translate.dismiss')}
          aria-label={t('translate.dismiss')}
          className="
            flex h-6 w-6 items-center justify-center rounded-md text-blue-400
            hover:bg-blue-100 transition-colors
          "
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
