/**
 * ============================================================================
 * TIMESHEET SIGNATURES - Área de Assinaturas (Rodapé)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Renderiza o rodapé da planilha com as áreas de assinatura:
 * - Assinatura do Team Leader (técnico responsável)
 * - Assinatura do Cliente
 * - Nome e data de cada assinante
 *
 * ESTRUTURA VISUAL:
 * -----------------
 * Linha 1 (58.25px): Signature | [espaço] | Client Signature | [espaço]
 * Linha 2 (17px):    Name      | [linha]  | Client Name      | [linha]
 * Linha 3 (17px):    Date      | [linha]  | Date             | [linha]
 * ============================================================================
 */

import type { WeeklyTimesheet } from '@/services/weekly-timesheet.service';

/**
 * Props do componente TimesheetSignatures.
 */
interface TimesheetSignaturesProps {
  /** Dados do timesheet (assinaturas) */
  timesheet: WeeklyTimesheet;
  /** Se está no modo edição */
  isEditMode: boolean;
  /** Callback quando um campo de assinatura muda */
  onFieldChange: (field: string, value: string) => void;
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY.
 */
function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const pureDate = dateStr.split('T')[0];
  const parts = pureDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Componente TimesheetSignatures - Rodapé com assinaturas.
 */
export function TimesheetSignatures({
  timesheet,
  isEditMode,
  onFieldChange,
}: TimesheetSignaturesProps) {

  /**
   * Handler de blur para campos editáveis.
   */
  function handleBlur(field: string, event: React.FocusEvent<HTMLElement>) {
    const value = event.currentTarget.innerText.trim();
    onFieldChange(field, value);
  }

  return (
    <>
      {/* ── Separador antes das assinaturas ─────────────────────────── */}
      <tr className="row-separator">
        <td colSpan={13} className="cell-sep" />
      </tr>

      {/* ── Linha 1: Labels e espaço para assinatura ────────────────── */}
      <tr className="row-signature-main">
        {/* Label "Signature" */}
        <td className="cell-signature-label">Signature</td>

        {/* Espaço para assinatura do técnico (colSpan=2) */}
        <td
          className={`cell-signature-space ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={2}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('technicianSignature', e)}
        >
          {timesheet.technicianSignature?.startsWith('data:image') ? (
            <img
              src={timesheet.technicianSignature}
              alt="Technician Signature"
              className="w-auto object-contain"
              style={{ maxHeight: '60px', mixBlendMode: 'multiply' }}
            />
          ) : (
            timesheet.technicianSignature || ''
          )}
        </td>

        {/* Label "Client Signature" */}
        <td className="cell-signature-label">Client Signature</td>

        {/* Espaço para assinatura do cliente (colSpan=3) */}
        <td
          className={`cell-signature-space ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={3}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('clientSignature', e)}
        >
          {timesheet.clientSignature?.startsWith('data:image') ? (
            <img
              src={timesheet.clientSignature}
              alt="Client Signature"
              className="w-auto object-contain"
              style={{ maxHeight: '60px', mixBlendMode: 'multiply' }}
            />
          ) : (
            timesheet.clientSignature || ''
          )}
        </td>

        {/* Células vazias restantes */}
        <td className="cell-signature-space" colSpan={6} />
      </tr>

      {/* ── Linha 2: Nome (com linha inferior) ─────────────────────── */}
      <tr className="row-signature-line">
        <td className="cell-signature-label">Name</td>
        <td
          className={`cell-signature-line-value ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={2}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('technicianName', e)}
        >
          {timesheet.technicianName || ''}
        </td>

        <td className="cell-signature-label">Client Name</td>
        <td
          className={`cell-signature-line-value ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={3}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('clientName', e)}
        >
          {timesheet.clientName || ''}
        </td>

        <td className="cell-signature-space" colSpan={6} />
      </tr>

      {/* ── Linha 3: Data (com linha inferior) ─────────────────────── */}
      <tr className="row-signature-line">
        <td className="cell-signature-label">Date</td>
        <td
          className={`cell-signature-line-value ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={2}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('technicianDate', e)}
        >
          {formatDateDisplay(timesheet.technicianDate)}
        </td>

        <td className="cell-signature-label">Date</td>
        <td
          className={`cell-signature-line-value ${isEditMode ? 'cell-editable' : ''}`}
          colSpan={3}
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur('clientDate', e)}
        >
          {formatDateDisplay(timesheet.clientDate)}
        </td>

        <td className="cell-signature-space" colSpan={6} />
      </tr>

      {/* ── Separador final ─────────────────────────────────────────── */}
      <tr className="row-separator">
        <td colSpan={13} className="cell-sep" />
      </tr>
    </>
  );
}
