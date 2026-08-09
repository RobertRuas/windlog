/**
 * ============================================================================
 * TRANSLATABLE FIELD - Campo de Texto com Tradução Automática (PT -> EN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que envolve um campo de texto (input ou textarea)
 * e adiciona automaticamente o recurso de tradução para inglês:
 *   - Um indicador discreto junto ao label (apenas em português)
 *   - Um botão "Traduzir para inglês" abaixo do campo quando preenchido,
 *     com opção de reverter após a tradução ser aplicada
 *
 * POR QUE ESTE COMPONENTE EXISTE?
 * -------------------------------
 * Os campos traduzíveis costumam aparecer dentro de listas (ex.: um campo por
 * dia do timesheet). Como hooks não podem ser chamados dentro de loops, este
 * componente encapsula o hook useTranslateSuggestion() e pode ser renderizado
 * uma vez por item, respeitando as regras de hooks do React.
 *
 * COMO USAR?
 * ----------
 * <TranslatableField
 *   label={t('sheet.dailyProgress')}
 *   value={day.progress}
 *   onChange={(v) => handleProgressChange(dayIdx, v)}
 *   multiline
 *   fieldClassName={inputClass}
 * />
 * ============================================================================
 */

import type { ReactNode } from 'react';
import { useTranslateSuggestion } from '@/hooks/useTranslateSuggestion';
import { TranslateSuggestion } from '@/components/ui/TranslateSuggestion';

/**
 * Props do campo traduzível.
 */
interface TranslatableFieldProps {
  /** Conteúdo do label (já traduzido). Se omitido, nenhum label é renderizado. */
  label?: ReactNode;
  /** Classes CSS aplicadas ao label (ex.: labelClass ou smallLabel). */
  labelClassName?: string;
  /** Valor atual do campo. */
  value: string;
  /** Chamado com o novo valor sempre que o campo muda (digitação ou tradução aplicada). */
  onChange: (value: string) => void;
  /** Se true, renderiza um <textarea>; caso contrário, um <input type="text">. */
  multiline?: boolean;
  /** Número de linhas do textarea (apenas quando multiline). */
  rows?: number;
  /** Se o campo está desabilitado. */
  disabled?: boolean;
  /** Placeholder do campo. */
  placeholder?: string;
  /** Classes CSS aplicadas ao campo (input/textarea). */
  fieldClassName?: string;
}

/**
 * Componente TranslatableField - campo de texto com tradução automática.
 *
 * Renderiza: label (com indicador discreto) + campo + barra de sugestão.
 * O recurso só atua quando o idioma da interface é português; nos demais
 * idiomas o componente se comporta como um campo comum.
 */
export function TranslatableField({
  label,
  labelClassName,
  value,
  onChange,
  multiline = false,
  rows = 2,
  disabled,
  placeholder,
  fieldClassName,
}: TranslatableFieldProps) {
  // Hook que traduz sob demanda e guarda o original para permitir reverter.
  const translation = useTranslateSuggestion(value, onChange);

  return (
    <div>
      {/* Label do campo. */}
      {label !== undefined && (
        <label className={labelClassName}>
          {label}
        </label>
      )}

      {/* Campo: textarea (multiline) ou input de texto simples. */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className={fieldClassName}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}

      {/* Área de tradução: botão "Traduzir para inglês" / revert (apenas quando relevante). */}
      <TranslateSuggestion
        showPrompt={translation.showPrompt}
        isTranslating={translation.isTranslating}
        canRevert={translation.canRevert}
        disabled={disabled}
        onTranslate={translation.translate}
        onRevert={translation.revert}
      />
    </div>
  );
}
