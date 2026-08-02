/**
 * ============================================================================
 * TIMESHEET SHEET - Container da Planilha (Tabela Completa)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente principal que renderiza a tabela completa do timesheet.
 * Envolve todos os sub-componentes (metadata, dias, assinaturas) em uma
 * única tabela HTML com as dimensões exatas do design original (1489px).
 *
 * ESTRUTURA DA TABELA:
 * --------------------
 * 1. Colgroup (13 colunas com larguras fixas)
 * 2. Título "WEEKLY TIMESHEET"
 * 3. Metadata (cabeçalho do projeto)
 * 4. Dias (7 seções: header + linhas de técnicos)
 * 5. Assinaturas (rodapé)
 *
 * LARGURAS DAS COLUNAS:
 * ---------------------
 * Total: 1489px (fixas via <col style="width:...">)
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';
import { TimesheetMetadata } from './TimesheetMetadata';
import { TimesheetDaySection } from './TimesheetDaySection';
import { TimesheetSignatures } from './TimesheetSignatures';
import type { WeeklyTimesheet } from '@/services/weekly-timesheet.service';

/**
 * Larguras fixas das 13 colunas (em pixels).
 * Copiadas fielmente do design original do Excel XML.
 */
const COLUMN_WIDTHS = [
  95, 150, 119, 95, 91, 124, 83, 47, 47, 47, 66, 194, 331,
];

/**
 * Props do componente TimesheetSheet.
 */
interface TimesheetSheetProps {
  /** Dados completos do timesheet */
  timesheet: WeeklyTimesheet;
  /** Se está no modo edição */
  isEditMode: boolean;
  /** Nível de zoom atual (0.5 a 1.5) */
  zoom: number;
  /** Callback quando metadata muda */
  onMetadataChange: (field: string, value: string) => void;
  /** Callback quando entrada de dado muda */
  onEntryChange: (dayIdx: number, rowIdx: number, field: string, value: string) => void;
  /** Callback quando progresso diário muda */
  onProgressChange: (dayIdx: number, value: string) => void;
  /** Callback quando data do dia muda */
  onDateChange: (dayIdx: number, value: string) => void;
  /** Callback quando campo de assinatura muda */
  onSignatureChange: (field: string, value: string) => void;
  /** Callback para adicionar nova entrada (linha de técnico) */
  onAddEntry?: (dayIdx: number) => void;
  /** Callback para remover uma entrada (linha de técnico) */
  onRemoveEntry?: (dayIdx: number, rowIdx: number) => void;
}

/**
 * Componente TimesheetSheet - Tabela completa da planilha.
 *
 * Renderiza o container (card branco) + wrapper de zoom + tabela com
 * todas as seções (título, metadata, dias, assinaturas).
 */
export function TimesheetSheet({
  timesheet,
  isEditMode,
  zoom,
  onMetadataChange,
  onEntryChange,
  onProgressChange,
  onDateChange,
  onSignatureChange,
  onAddEntry,
  onRemoveEntry,
}: TimesheetSheetProps) {
  const { t } = useTranslation('timesheet');

  return (
    /* ── Card branco (folha de papel) ─────────────────────────────────── */
    <main className="ts-sheet-card">
      {/* Wrapper com zoom controlado */}
      <div
        className="ts-sheet-scroll-wrapper"
        style={{ '--sheet-zoom': zoom } as React.CSSProperties}
      >
        {/* ── Tabela principal ──────────────────────────────────────── */}
        <table className="ts-excel-table">
          {/* Colgroup: define larguras fixas das 13 colunas */}
          <colgroup>
            {COLUMN_WIDTHS.map((width, i) => (
              <col key={i} style={{ width: `${width}px` }} />
            ))}
          </colgroup>

          {/* ── Título "WEEKLY TIMESHEET" ──────────────────────────── */}
          <tr className="row-title">
            <td className="cell-title" colSpan={8}>
              {t('sheet.title')}
            </td>
            <td className="cell-title" />
            <td className="cell-title" />
            <td className="cell-title" />
            <td className="cell-title" />
            <td className="cell-title" />
          </tr>

          {/* Separador */}
          <tr className="row-separator">
            <td colSpan={13} className="cell-sep" />
          </tr>

          {/* ── Metadata do projeto ─────────────────────────────────── */}
          <TimesheetMetadata
            timesheet={timesheet}
            isEditMode={isEditMode}
            onFieldChange={onMetadataChange}
          />

          {/* Separador */}
          <tr className="row-separator">
            <td colSpan={13} className="cell-sep" />
          </tr>

          {/* ── Dias da semana (7 seções) ───────────────────────────── */}
          {timesheet.days.map((day, dayIdx) => (
            <TimesheetDaySection
              key={day.id || dayIdx}
              day={day}
              dayIdx={dayIdx}
              isEditMode={isEditMode}
              onEntryChange={onEntryChange}
              onProgressChange={onProgressChange}
              onDateChange={onDateChange}
              onAddEntry={onAddEntry}
              onRemoveEntry={onRemoveEntry}
            />
          ))}

          {/* ── Assinaturas (rodapé) ────────────────────────────────── */}
          <TimesheetSignatures
            timesheet={timesheet}
            isEditMode={isEditMode}
            onFieldChange={onSignatureChange}
          />
        </table>
      </div>
    </main>
  );
}
