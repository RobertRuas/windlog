/**
 * ============================================================================
 * DATE PICKER - Componente de Seleção de Data
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente reutilizável que envolve o <input type="date"> nativo do browser,
 * fornecendo uma experiência de date picker consistente com o design do sistema.
 *
 * FUNCIONAMENTO:
 * --------------
 * - Trabalha internamente com formato ISO (YYYY-MM-DD) para o native picker
 * - Aceita e devolve valores no formato DD/MM/YYYY (padrão do formulário)
 * - Conversão automática entre formatos
 * - Suporta teclas de atalho e navegação por teclado
 *
 * ONDE É USADO?
 * -------------
 * - TimesheetFormEditor: campos de data das assinaturas
 * - Qualquer formulário que necessite de seleção de data
 * ============================================================================
 */

import { useCallback, useMemo, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Props do componente DatePicker.
 */
interface DatePickerProps {
  /** Valor atual no formato DD/MM/YYYY ou vazio */
  value: string;
  /** Callback ao mudar a data, devolve no formato DD/MM/YYYY */
  onChange: (value: string) => void;
  /** Se está desabilitado */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** ID do input (para labels) */
  id?: string;
  /** Data mínima (formato YYYY-MM-DD) */
  min?: string;
  /** Data máxima (formato YYYY-MM-DD) */
  max?: string;
}

/**
 * Converte DD/MM/YYYY → YYYY-MM-DD (para o native date input).
 */
function brToIso(brDate: string): string {
  if (!brDate) return '';
  const parts = brDate.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  // Se já está em ISO, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(brDate)) return brDate;
  return '';
}

/**
 * Converte YYYY-MM-DD → DD/MM/YYYY (para exibição no formulário).
 */
function isoToBr(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoDate;
}

/**
 * Componente DatePicker - Date picker nativo com styling consistente.
 */
export function DatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  id,
  min,
  max,
}: DatePickerProps) {
  // Converte o valor de DD/MM/YYYY para YYYY-MM-DD (formato do native picker)
  const isoValue = useMemo(() => brToIso(value), [value]);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handler do change do native picker.
   * Recebe YYYY-MM-DD e devolve DD/MM/YYYY.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newIso = e.target.value;
      if (!newIso) {
        onChange('');
        return;
      }
      onChange(isoToBr(newIso));
    },
    [onChange],
  );

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="date"
        id={id}
        value={isoValue}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        className="form-input disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
        style={{ paddingLeft: '2.25rem' }}
      />
      {/* Ícone de calendário à esquerda — também abre o picker nativo */}
      <Calendar
        size={14}
        onClick={() => {
          if (!disabled) inputRef.current?.showPicker?.();
        }}
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${
          disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
        }`}
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
