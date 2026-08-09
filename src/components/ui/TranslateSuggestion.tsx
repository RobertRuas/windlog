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
 *   2. <TranslateSuggestion /> - Área sutil exibida abaixo do campo com
 *      três estados possíveis:
 *        a) Botão "Traduzir para inglês" quando o campo está preenchido
 *        b) "Traduzindo..." enquanto a IA processa a tradução
 *        c) Confirmação "Traduzido para inglês" com opção de REVERTER
 *
 * POR QUE REUTILIZÁVEIS?
 * ----------------------
 * Qualquer módulo pode adicionar o recurso a um campo com poucas linhas,
 * bastando combinar o hook useTranslateSuggestion() com estes componentes.
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { Languages, Loader2, Undo2 } from 'lucide-react';
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
   Botão "Traduzir para inglês" / processando / traduzido com opção de reverter.
   ========================================================================== */

interface TranslateSuggestionProps {
  /** Se o botão "Traduzir para inglês" deve ser exibido (campo preenchido) */
  showPrompt: boolean;
  /** Se uma tradução está em andamento */
  isTranslating: boolean;
  /** Se a tradução já foi aplicada e há como reverter */
  canRevert: boolean;
  /** Se as ações devem ficar desabilitadas (ex.: formulário salvando) */
  disabled?: boolean;
  /** Chamado quando o usuário clica em "Traduzir para inglês" */
  onTranslate: () => void;
  /** Chamado quando o usuário quer desfazer a tradução aplicada */
  onRevert: () => void;
}

/**
 * Área sutil de tradução exibida abaixo do campo.
 *
 * Estados:
 * - isTranslating -> mostra "Traduzindo..." com um pequeno spinner.
 * - canRevert     -> mostra "Traduzido para inglês" com botão de reverter.
 * - showPrompt    -> mostra o botão discreto "Traduzir para inglês".
 * - nenhum        -> não renderiza nada.
 */
export function TranslateSuggestion({
  showPrompt,
  isTranslating,
  canRevert,
  disabled,
  onTranslate,
  onRevert,
}: TranslateSuggestionProps) {
  const { t } = useTranslation('common');

  // Estado de processamento: aviso discreto enquanto a IA traduz.
  if (isTranslating) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        <span>{t('translate.processing')}</span>
      </div>
    );
  }

  // Tradução aplicada: confirmação discreta + opção de reverter.
  if (canRevert) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600">
        <Languages size={12} className="shrink-0" />
        <span>{t('translate.applied')}</span>
        <button
          type="button"
          onClick={onRevert}
          disabled={disabled}
          className="
            ml-1 inline-flex items-center gap-1 font-medium text-gray-500
            hover:text-blue-600 transition-colors disabled:opacity-50
          "
        >
          <Undo2 size={11} />
          {t('translate.revert')}
        </button>
      </div>
    );
  }

  // Campo preenchido: botão discreto para traduzir sob demanda.
  if (showPrompt) {
    return (
      <button
        type="button"
        onClick={onTranslate}
        disabled={disabled}
        className="
          mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium
          text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50
        "
      >
        <Languages size={12} />
        {t('translate.prompt')}
      </button>
    );
  }

  // Nenhum estado aplicável: não renderiza nada.
  return null;
}
