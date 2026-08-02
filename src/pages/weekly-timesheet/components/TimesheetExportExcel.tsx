/**
 * ============================================================================
 * TIMESHEET EXPORT EXCEL - Lógica de Exportação para Excel (.xls)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Função utilitária que converte os dados do timesheet em um arquivo
 * Excel compatível (.xls XML) e dispara o download.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Monta uma tabela HTML com estilos inline (compatível com Excel)
 * 2. Cria um Blob do tipo "application/vnd.ms-excel"
 * 3. Dispara o download com o nome: WEEKLY_TIMESHEET_WEEK_{week}.xls
 *
 * NOTA: O Excel abre arquivos HTML com extensão .xls corretamente.
 * Os estilos inline garantem que as cores e bordas sejam preservadas.
 * ============================================================================
 */

import type { WeeklyTimesheet } from '@/services/weekly-timesheet.service';

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY.
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const pureDate = dateStr.split('T')[0];
  const parts = pureDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Estilos CSS inline para a tabela Excel.
 * Garantem que cores e formatação sejam preservadas ao abrir no Excel.
 */
const EXCEL_STYLES = `
  <style>
    table { border-collapse: collapse; font-family: "Calibri", sans-serif; font-size: 11px; }
    td, th { border: 1px solid #000000; text-align: center; vertical-align: middle; padding: 4px; }
    .title { font-size: 14px; font-weight: bold; border-bottom: 2px solid #92d050; text-align: center; }
    .header { background-color: #daf2d0; font-weight: normal; }
    .header-bold { background-color: #daf2d0; font-weight: bold; }
    .header-travel { background-color: #f2f2f2; color: #747474; }
    .progress-header { background-color: #daf2d0; text-align: left; vertical-align: top; }
    .data-progress { text-align: left; vertical-align: top; }
    .signature-label { text-align: right; border: none; }
    .signature-space { border: none; }
    .signature-value { border-bottom: 1px solid #000000; border-top: none; border-left: none; border-right: none; }
    .sep { border: none; height: 16px; }
  </style>
`;

/**
 * Exporta os dados do timesheet para um arquivo Excel (.xls).
 *
 * @param timesheet - Dados completos do timesheet
 */
export function exportToExcel(timesheet: WeeklyTimesheet): void {
  const data = timesheet;
  const fileName = `WEEKLY_TIMESHEET_WEEK_${data.week || 'NA'}.xls`;

  // ── Monta o HTML da tabela ──────────────────────────────────────────

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>NORD Timesheet v1.3</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      ${EXCEL_STYLES}
    </head>
    <body>
      <table>
        <!-- Título -->
        <tr style="height: 64px;">
          <td class="title" colspan="8">WEEKLY TIMESHEET</td>
          <td class="title"></td><td class="title"></td>
          <td class="title"></td><td class="title"></td><td class="title"></td>
        </tr>
        <tr class="sep"><td colspan="13" class="sep"></td></tr>

        <!-- Metadata Header -->
        <tr style="height: 34px;">
          <th class="header">Nordic Access Job Number</th>
          <th class="header">Week</th>
          <th class="header">Team No.</th>
          <th class="header" colspan="2">Job Scope</th>
          <th class="header">Client</th>
          <th class="header" colspan="4">Site Name</th>
          <td class="sep"></td><td class="sep"></td><td class="sep"></td>
        </tr>

        <!-- Metadata Values -->
        <tr style="height: 30.5px;">
          <td>${data.jobNumber || ''}</td>
          <td>${data.week}</td>
          <td>${data.teamNo || ''}</td>
          <td colspan="2">${data.jobScope || ''}</td>
          <td>${data.client || ''}</td>
          <td colspan="4" style="text-align: left;">${data.siteName || ''}</td>
          <td class="sep"></td><td class="sep"></td><td class="sep"></td>
        </tr>
        <tr class="sep"><td colspan="13" class="sep"></td></tr>
  `;

  // ── Dias e entradas ─────────────────────────────────────────────────

  data.days.forEach((day) => {
    const rowCount = day.entries.length;

    // Header do dia
    tableHtml += `
      <tr style="height: 68px;">
        <th class="header-bold">${day.dayName} Date</th>
        <th class="header">Technician Name</th>
        <th class="header">Role</th>
        <th class="header">Local Turbine No. (eg WEA1)</th>
        <th class="header">Turbine ID No. (eg 552201011)</th>
        <th class="header">Max B&ouml;gl Tower No. (eg G20_001234_DE)</th>
        <th class="header">Blade No. (if applicable)</th>
        <th class="header-bold">Stand-by/h</th>
        <th class="header-bold">Working/h</th>
        <th class="header-travel">Travel / h</th>
        <th class="header">WTG Downtime hours</th>
        <th class="header">Stand-by Time Reason</th>
        <th class="progress-header">
          Daily Progress<br>
          <i>Example: 07:00 Tooling prepare, grinding, chamfering, lamination, coating &amp; finishing. 19:00 demob.</i>
        </th>
      </tr>
    `;

    // Linhas de dados
    day.entries.forEach((entry, idx) => {
      tableHtml += `<tr style="height: 16px;">`;
      if (idx === 0) {
        tableHtml += `<td rowspan="${rowCount}">${formatDate(day.date)}</td>`;
      }

      tableHtml += `
        <td>${entry.technicianName || ''}</td>
        <td>${entry.role || ''}</td>
        <td>${entry.localTurbineNo || ''}</td>
        <td>${entry.turbineIdNo || ''}</td>
        <td>${entry.towerNo || ''}</td>
        <td>${entry.bladeNo || ''}</td>
        <td>${entry.standbyHrs || ''}</td>
        <td>${entry.workingHrs || ''}</td>
        <td>${entry.travelHrs || ''}</td>
        <td>${entry.downtimeHrs || ''}</td>
        <td>${entry.standbyReason || ''}</td>
      `;

      if (idx === 0) {
        tableHtml += `<td class="data-progress" rowspan="${rowCount}">${day.progress || ''}</td>`;
      }
      tableHtml += `</tr>`;
    });
  });

  // ── Assinaturas ─────────────────────────────────────────────────────

  tableHtml += `
        <tr class="sep"><td colspan="13" class="sep"></td></tr>
        <tr style="height: 58.25px;">
          <td class="signature-label">Signature</td>
          <td class="signature-space" colspan="2"></td>
          <td class="signature-label">Client Signature</td>
          <td class="signature-space" colspan="3"></td>
          <td class="signature-space" colspan="6"></td>
        </tr>
        <tr style="height: 17px;">
          <td class="signature-label">Name</td>
          <td class="signature-value" colspan="2">${data.technicianName || ''}</td>
          <td class="signature-label">Client Name</td>
          <td class="signature-value" colspan="3">${data.clientName || ''}</td>
          <td class="signature-space" colspan="6"></td>
        </tr>
        <tr style="height: 17px;">
          <td class="signature-label">Date</td>
          <td class="signature-value" colspan="2">${formatDate(data.technicianDate)}</td>
          <td class="signature-label">Date</td>
          <td class="signature-value" colspan="3">${formatDate(data.clientDate)}</td>
          <td class="signature-space" colspan="6"></td>
        </tr>
        <tr class="sep"><td colspan="13" class="sep"></td></tr>
      </table>
    </body>
    </html>
  `;

  // ── Dispara o download ──────────────────────────────────────────────

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
