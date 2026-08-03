/**
 * ============================================================================
 * TIMESHEET METADATA - Cabeçalho com Dados do Projeto
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Renderiza as duas linhas de metadata do cabeçalho da planilha:
 * - Linha 1: Labels dos campos (Nordic Access Job Number, Week, Team No., etc.)
 * - Linha 2: Valores dos campos (editáveis no modo edição)
 *
 * CAMPOS EXIBIDOS:
 * ----------------
 * - Nordic Access Job Number (jobNumber)
 * - Week (semana ISO)
 * - Team No. (número da equipe)
 * - Job Scope (escopo do trabalho)
 * - Client (nome do cliente)
 * - Site Name (nome do local/projeto)
 *
 * COMO FUNCIONA?
 * --------------
 * No modo edição, os campos ficam contentEditable e as mudanças são
 * propagadas para o componente pai via callback onChange.
 * ============================================================================
 */

import type { WeeklyTimesheet } from '@/services/weekly-timesheet.service';

/**
 * Props do componente TimesheetMetadata.
 */
interface TimesheetMetadataProps {
  /** Dados do timesheet (metadata) */
  timesheet: WeeklyTimesheet;
  /** Se está no modo edição (campos editáveis) */
  isEditMode: boolean;
  /** Callback quando um campo de metadata muda */
  onFieldChange: (field: string, value: string) => void;
}

/**
 * Componente TimesheetMetadata - Cabeçalho com dados do projeto.
 *
 * Renderiza as linhas de labels e valores dos metadados do timesheet.
 * Os valores são editáveis quando isEditMode=true.
 */
export function TimesheetMetadata({
  timesheet,
  isEditMode,
  onFieldChange,
}: TimesheetMetadataProps) {

  /**
   * Handler para quando o usuário termina de editar um campo (blur).
   * Extrai o valor do campo e propaga para o componente pai.
   */
  function handleBlur(field: string, event: React.FocusEvent<HTMLElement>) {
    const value = event.currentTarget.innerText.trim();
    onFieldChange(field, value);
  }

  return (
    <>
      {/* ── Linha de labels (cabeçalho verde claro) ───────────────────── */}
      <tr className="row-metadata-header">
        <th className="cell-meta-header cell-meta-header-left-top">
          Nordic Access Job Number
        </th>
        <th className="cell-meta-header">Week</th>
        <th className="cell-meta-header">Team No.</th>
        <th className="cell-meta-header" colSpan={2}>
          Job Scope
        </th>
        <th className="cell-meta-header">Client</th>
        <th className="cell-meta-header" colSpan={4}>
          Site Name
        </th>
        {/* Células separadoras vazias (3 últimas colunas) */}
        <td className="cell-sep" />
        <td className="cell-sep" />
        <td className="cell-sep" />
      </tr>

      {/* ── Linha de valores (dados do timesheet) ────────────────────── */}
      <tr className="row-metadata-values">
        {/* Nordic Access Job Number */}
        <td
          className={`cell-meta-value cell-meta-value-left-top ${isEditMode ? 'cell-editable' : ''}`}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('jobNumber', e)}
        >
          {timesheet.jobNumber || ''}
        </td>

        {/* Week */}
        <td
          className={`cell-meta-value ${isEditMode ? 'cell-editable' : ''}`}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('week', e)}
        >
          {timesheet.week}
        </td>

        {/* Team No. */}
        <td
          className={`cell-meta-value ${isEditMode ? 'cell-editable' : ''}`}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('teamNo', e)}
        >
          {timesheet.teamNo || ''}
        </td>

        {/* Job Scope (colSpan=2) */}
        <td
          className={`cell-meta-value ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={2}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('jobScope', e)}
        >
          {timesheet.jobScope || ''}
        </td>

        {/* Client */}
        <td
          className={`cell-meta-value ${isEditMode ? 'cell-editable' : ''}`}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('client', e)}
        >
          {timesheet.client || ''}
        </td>

        {/* Site Name (colSpan=4, texto à esquerda) */}
        <td
          className={`cell-meta-value cell-meta-value-text ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={4}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('siteName', e)}
        >
          {timesheet.siteName || ''}
        </td>

        {/* Células separadoras vazias (3 últimas colunas) */}
        <td className="cell-sep" />
        <td className="cell-sep" />
        <td className="cell-sep" />
      </tr>
    </>
  );
}
