/**
 * ============================================================================
 * TIMESHEET DAY SECTION - Seção Completa de um Dia da Semana
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Renderiza a seção completa de um dia na planilha, incluindo:
 * 1. Header do dia (colunas: Date, Technician Name, Role, Turbine, etc.)
 * 2. Linhas de dados (uma por técnico, com rowspan para Date e Progress)
 *
 * ESTRUTURA VISUAL:
 * -----------------
 * Para cada dia, temos:
 * - 1 linha de header (68px de altura) com os nomes das colunas
 * - N linhas de dados (16px cada), uma por técnico
 * - A coluna "Date" usa rowspan para ocupar todas as linhas do dia
 * - A coluna "Daily Progress" usa rowspan igual
 *
 * CAMPOS DO HEADER:
 * -----------------
 * - Day Date | Technician Name | Role | Local Turbine No | Turbine ID No
 * - Max Bögl Tower No | Blade No | Stand-by/h | Working/h | Travel/h
 * - WTG Downtime | Stand-by Time Reason | Daily Progress
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import type { TimesheetDay } from '@/services/weekly-timesheet.service';

/**
 * Props do componente TimesheetDaySection.
 */
interface TimesheetDaySectionProps {
  /** Dados do dia (com entradas) */
  day: TimesheetDay;
  /** Índice do dia na semana (0=Monday, 6=Sunday) */
  dayIdx: number;
  /** Se está no modo edição */
  isEditMode: boolean;
  /** Callback quando um campo de entrada muda */
  onEntryChange: (dayIdx: number, rowIdx: number, field: string, value: string) => void;
  /** Callback quando o progresso diário muda */
  onProgressChange: (dayIdx: number, value: string) => void;
  /** Callback quando a data muda */
  onDateChange: (dayIdx: number, value: string) => void;
  /** Callback para adicionar nova entrada (linha de técnico) */
  onAddEntry?: (dayIdx: number) => void;
  /** Callback para remover uma entrada (linha de técnico) */
  onRemoveEntry?: (dayIdx: number, rowIdx: number) => void;
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY (formato brasileiro).
 */
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const pureDate = dateStr.split('T')[0];
  const parts = pureDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Componente TimesheetDaySection - Seção completa de um dia.
 *
 * Renderiza: header do dia + linhas de técnicos + data (rowspan) + progress (rowspan).
 */
export function TimesheetDaySection({
  day,
  dayIdx,
  isEditMode,
  onEntryChange,
  onProgressChange,
  onDateChange,
  onAddEntry,
  onRemoveEntry,
}: TimesheetDaySectionProps) {
  const { t } = useTranslation('timesheet');

  /** Quantidade de linhas (técnicos) neste dia (mínimo 1 para renderizar) */
  const rowCount = Math.max(day.entries.length, 1);
  const hasEntries = day.entries.length > 0;

  return (
    <>
      {/* ── HEADER DO DIA ────────────────────────────────────────────── */}
      <tr className="row-day-header">
        {/* Coluna 1: "{DayName} Date" (ex: "Monday Date") */}
        <th className="cell-day-header cell-day-header-bold">
          {day.dayName} {t('sheet.dayDate')}
        </th>

        {/* Coluna 2: Technician Name */}
        <th className="cell-day-header">{t('sheet.technicianName')}</th>

        {/* Coluna 3: Role */}
        <th className="cell-day-header">{t('sheet.role')}</th>

        {/* Coluna 4: Local Turbine No. */}
        <th className="cell-day-header">{t('sheet.localTurbineNo')}</th>

        {/* Coluna 5: Turbine ID No. */}
        <th className="cell-day-header">{t('sheet.turbineIdNo')}</th>

        {/* Coluna 6: Max Bögl Tower No. */}
        <th className="cell-day-header">{t('sheet.towerNo')}</th>

        {/* Coluna 7: Blade No. */}
        <th className="cell-day-header">{t('sheet.bladeNo')}</th>

        {/* Coluna 8: Stand-by/h (texto rotacionado, fundo verde) */}
        <th className="cell-day-header-rotated">
          <div className="rotated-text-container">
            <span className="rotated-text">{t('sheet.standbyHrs')}</span>
          </div>
        </th>

        {/* Coluna 9: Working/h (texto rotacionado, fundo verde) */}
        <th className="cell-day-header-rotated">
          <div className="rotated-text-container">
            <span className="rotated-text">{t('sheet.workingHrs')}</span>
          </div>
        </th>

        {/* Coluna 10: Travel/h (texto rotacionado, fundo cinza) */}
        <th className="cell-day-header-rotated-grey">
          <div className="rotated-text-container">
            <span className="rotated-text-grey">{t('sheet.travelHrs')}</span>
          </div>
        </th>

        {/* Coluna 11: WTG Downtime hours */}
        <th className="cell-day-header">{t('sheet.downtimeHrs')}</th>

        {/* Coluna 12: Stand-by Time Reason */}
        <th className="cell-day-header">{t('sheet.standbyReason')}</th>

        {/* Coluna 13: Daily Progress */}
        <th className="cell-day-header-progress">
          {t('sheet.dailyProgress')}
        </th>
      </tr>

      {/* ── LINHAS DE DADOS (uma por técnico) ─────────────────────────── */}
      {hasEntries ? (
        day.entries.map((entry, rowIdx) => (
          <tr key={entry.id || rowIdx} className="row-data">
            {/* Coluna 1: Data (apenas na primeira linha, com rowspan) */}
            {rowIdx === 0 && (
              <td
                className={`cell-data-date ${isEditMode ? 'cell-editable' : ''}`}
                rowSpan={rowCount}
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onDateChange(dayIdx, e.currentTarget.innerText.trim())}
              >
                {formatDateDisplay(day.date)}
              </td>
            )}

            {/* Colunas 2-12: Dados do técnico */}
            {[
              'technicianName', 'role', 'localTurbineNo', 'turbineIdNo',
              'towerNo', 'bladeNo', 'standbyHrs', 'workingHrs',
              'travelHrs', 'downtimeHrs', 'standbyReason',
            ].map((field) => (
              <td
                key={field}
                className={`cell-data ${isEditMode ? 'cell-editable' : ''}`}
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onEntryChange(dayIdx, rowIdx, field, e.currentTarget.innerText.trim())
                }
              >
                {(entry[field as keyof typeof entry] as string) || ''}
              </td>
            ))}

            {/* Coluna 13: Daily Progress (apenas na primeira linha, com rowspan) */}
            {rowIdx === 0 && (
              <td
                className={`cell-data-progress ${isEditMode ? 'cell-editable' : ''}`}
                rowSpan={rowCount}
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => onProgressChange(dayIdx, e.currentTarget.innerText.trim())}
              >
                {day.progress || ''}
              </td>
            )}
          </tr>
        ))
      ) : (
        /* Dia sem entradas - renderiza linha vazia com data e progress */
        <tr className="row-data">
          <td className="cell-data-date">{formatDateDisplay(day.date)}</td>
          {Array.from({ length: 11 }).map((_, i) => (
            <td key={i} className="cell-data" />
          ))}
          <td className="cell-data-progress" />
        </tr>
      )}

      {/* ── Botões de ação (adicionar/remover linha) ──────────────────── */}
      {isEditMode && (
        <tr className="row-data ts-no-print">
          <td colSpan={13} style={{ textAlign: 'center', padding: '4px', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {/* Botão: Adicionar linha de técnico */}
              <button
                onClick={() => onAddEntry?.(dayIdx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#059669',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} />
                {t('sheet.addRow')}
              </button>

              {/* Botão: Remover última linha (só se houver entradas) */}
              {hasEntries && (
                <button
                  onClick={() => onRemoveEntry?.(dayIdx, day.entries.length - 1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  {t('sheet.removeRow')}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
