/**
 * DaySection — Seção memoizada de um dia do timesheet.
 * Extraída para React.memo: quando o usuário edita o dia A,
 * os dias B–G NÃO re-renderizam (grande ganho em mobile).
 */

import { memo, type RefObject, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Check, GripVertical, X } from 'lucide-react';
import { TranslatableField } from '@/components/ui/TranslatableField';
import { TechnicianSelect } from './TechnicianSelect';
import { isDayFilled } from '../helpers/timesheet-form.helpers';
import type { FormState, FormEntry, SystemUser, SharedFieldKey } from '../types/timesheet-form.types';
import type { Turbine } from '@/services/project.service';

// ── Classes de estilo (partilhadas com o editor) ──────────────────────
const smallInput =
  'w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
const hourInput =
  'w-full px-1.5 py-1 border border-gray-200 rounded text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';
const smallLabel = 'block text-xs font-medium text-gray-500 mb-0.5';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

// ── Tipo de drag-and-drop ─────────────────────────────────────────────
interface DragInfo {
  dayIdx: number;
  fromIdx: number;
  toIdx: number;
}

// ── Props ─────────────────────────────────────────────────────────────
interface DaySectionProps {
  day: FormState['days'][number];
  dayIdx: number;
  isSaving: boolean;
  projectTurbines: Turbine[] | undefined;
  systemUsers: SystemUser[];
  addSelectKey: number;
  collapsedDays: Set<number>;
  validationErrors: Set<number>;
  dragInfo: DragInfo | null;
  dayHeaderRef: (el: HTMLDivElement | null) => void;
  dragRowRef: (idx: number, el: HTMLDivElement | null) => void;
  longPressTimerRef: RefObject<ReturnType<typeof setTimeout> | null>;
  toggleDay: (idx: number) => void;
  setDragInfo: Dispatch<SetStateAction<DragInfo | null>>;
  handleSharedChange: (dayIdx: number, field: SharedFieldKey, value: string) => void;
  handleHourChange: (dayIdx: number, field: SharedFieldKey, raw: string) => void;
  handleRemoveEntry: (dayIdx: number, entryIdx: number) => void;
  handleAddEntryWithUser: (dayIdx: number, user: SystemUser) => void;
  handleProgressChange: (dayIdx: number, value: string) => void;
  handleMoveEntry: (dayIdx: number, entryIdx: number, dir: 'up' | 'down') => void;
  findDropIndex: (dayIdx: number, clientY: number, excludeIdx: number) => number;
  cancelLongPress: () => void;
}

// ── Componente memoizado ──────────────────────────────────────────────
export const DaySection = memo(function DaySection({
  day,
  dayIdx,
  isSaving,
  projectTurbines,
  systemUsers,
  addSelectKey,
  collapsedDays,
  validationErrors,
  dragInfo,
  dayHeaderRef,
  dragRowRef,
  longPressTimerRef,
  toggleDay,
  setDragInfo,
  handleSharedChange,
  handleHourChange,
  handleRemoveEntry,
  handleAddEntryWithUser,
  handleProgressChange,
  handleMoveEntry,
  findDropIndex,
  cancelLongPress,
}: DaySectionProps) {
  const { t } = useTranslation('timesheet');

  const isCollapsed = collapsedDays.has(dayIdx);
  const filled = isDayFilled(day);
  const hasError = validationErrors.has(dayIdx);

  const borderColor = hasError
    ? 'border-red-300'
    : filled
      ? 'border-emerald-200'
      : 'border-amber-200';

  const headerBg = hasError
    ? 'bg-red-50'
    : filled
      ? 'bg-emerald-50'
      : 'bg-amber-50';

  return (
    <section className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden transition-colors`}>
      {/* Header do dia */}
      <div
        ref={dayHeaderRef}
        className={`px-5 py-3 border-b ${borderColor} ${headerBg} flex items-center justify-between cursor-pointer hover:opacity-90 transition-all`}
        onClick={() => toggleDay(dayIdx)}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          <h3 className="text-sm font-semibold text-gray-900">{t('days.' + day.dayName)}</h3>
          <span className="text-xs text-gray-500">{day.date}</span>
        </div>
        <div className="flex items-center gap-2">
          {filled ? (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {t('form.filled')}
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {t('form.pending')}
            </span>
          )}
          {hasError && (
            <span className="text-xs font-medium text-red-600">
              {t('form.progressRequired')}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {day.entries.length} {t('form.entries')}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-5 space-y-5">

          {/* ── Informações Comuns ── */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Check size={10} className="text-blue-600" />
              </div>
              <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                {t('form.commonInfo')}
              </h4>
            </div>

            {/* ── Turbina: dropdown + campos auto-preenchidos ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={smallLabel}>{t('sheet.localTurbineNo')}</label>
                <select
                  value={day.shared.localTurbineNo}
                  onChange={(e) => {
                    const turbineName = e.target.value;
                    const selected = (projectTurbines || []).find((tb) => tb.name === turbineName);
                    handleSharedChange(dayIdx, 'localTurbineNo', turbineName);
                    if (selected) {
                      handleSharedChange(dayIdx, 'turbineIdNo', selected.model || '');
                      handleSharedChange(dayIdx, 'towerNo', selected.manufacturer || '');
                      handleSharedChange(dayIdx, 'bladeNo', '');
                    } else {
                      handleSharedChange(dayIdx, 'turbineIdNo', '');
                      handleSharedChange(dayIdx, 'towerNo', '');
                      handleSharedChange(dayIdx, 'bladeNo', '');
                    }
                  }}
                  disabled={isSaving}
                  className={smallInput}
                >
                  <option value="">—</option>
                  {(projectTurbines || []).map((tb) => (
                    <option key={tb.id} value={tb.name}>
                      {tb.name}{tb.location ? ` (${tb.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={smallLabel}>{t('sheet.turbineIdNo')}</label>
                <input type="text" value={day.shared.turbineIdNo} readOnly placeholder="Auto" disabled={isSaving} className={smallInput + ' bg-gray-50 text-gray-500 cursor-default'} />
              </div>
              <div>
                <label className={smallLabel}>{t('sheet.towerNo')}</label>
                <input type="text" value={day.shared.towerNo} readOnly placeholder="Auto" disabled={isSaving} className={smallInput + ' bg-gray-50 text-gray-500 cursor-default'} />
              </div>
              <div>
                <label className={smallLabel}>{t('sheet.bladeNo')}</label>
                <input type="text" value={day.shared.bladeNo} readOnly placeholder="Auto" disabled={isSaving} className={smallInput + ' bg-gray-50 text-gray-500 cursor-default'} />
              </div>
            </div>

            {/* ── Horas compactas com validação ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {(['standbyHrs', 'workingHrs', 'travelHrs', 'downtimeHrs'] as SharedFieldKey[]).map((field) => (
                <div key={field}>
                  <label className={smallLabel}>{t(`sheet.${field}`)}</label>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={day.shared[field]}
                    onChange={(e) => handleSharedChange(dayIdx, field, e.target.value)}
                    onBlur={(e) => handleHourChange(dayIdx, field, e.target.value)}
                    disabled={isSaving}
                    className={hourInput}
                  />
                </div>
              ))}
            </div>

            {/* ── Motivo do Stand-by (texto livre) ── */}
            <div className="mt-2">
              <TranslatableField
                label={t('sheet.standbyReason')}
                labelClassName={smallLabel}
                value={day.shared.standbyReason}
                onChange={(v) => handleSharedChange(dayIdx, 'standbyReason', v)}
                disabled={isSaving}
                fieldClassName={smallInput}
                placeholder=" "
              />
            </div>
          </div>

          {/* ── Técnicos (lista simples + drag para reordenar) ── */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              {t('form.technicians')}
            </h4>

            <div className="space-y-0.5">
              {day.entries.map((entry, entryIdx) => {
                const isDragging = dragInfo?.dayIdx === dayIdx && dragInfo.fromIdx === entryIdx;
                const isDropTarget = dragInfo?.dayIdx === dayIdx && dragInfo.toIdx === entryIdx && dragInfo.toIdx !== dragInfo.fromIdx;

                return (
                  <div
                    key={entryIdx}
                    ref={(el) => dragRowRef(entryIdx, el)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      setDragInfo({ dayIdx, fromIdx: entryIdx, toIdx: entryIdx });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const toIdx = findDropIndex(dayIdx, e.clientY, entryIdx);
                      setDragInfo((prev) => prev ? { ...prev, toIdx } : null);
                    }}
                    onDragEnd={() => {
                      if (dragInfo && dragInfo.fromIdx !== dragInfo.toIdx) {
                        const diff = dragInfo.toIdx - dragInfo.fromIdx;
                        for (let i = 0; i < Math.abs(diff); i++) {
                          handleMoveEntry(dayIdx, dragInfo.fromIdx, diff > 0 ? 'down' : 'up');
                        }
                      }
                      setDragInfo(null);
                    }}
                    onTouchStart={(e) => {
                      if (e.target instanceof HTMLButtonElement) return;
                      cancelLongPress();
                      longPressTimerRef.current = setTimeout(() => {
                        setDragInfo({ dayIdx, fromIdx: entryIdx, toIdx: entryIdx });
                      }, 400);
                    }}
                    onTouchMove={(e) => {
                      if (!dragInfo || dragInfo.dayIdx !== dayIdx || dragInfo.fromIdx !== entryIdx) return;
                      const toIdx = findDropIndex(dayIdx, e.touches[0].clientY, entryIdx);
                      setDragInfo((prev) => prev ? { ...prev, toIdx } : null);
                    }}
                    onTouchEnd={() => {
                      if (dragInfo && dragInfo.dayIdx === dayIdx && dragInfo.fromIdx === entryIdx) {
                        if (dragInfo.fromIdx !== dragInfo.toIdx) {
                          const diff = dragInfo.toIdx - dragInfo.fromIdx;
                          for (let i = 0; i < Math.abs(diff); i++) {
                            handleMoveEntry(dayIdx, dragInfo.fromIdx, diff > 0 ? 'down' : 'up');
                          }
                        }
                        setDragInfo(null);
                      }
                      cancelLongPress();
                    }}
                    onTouchCancel={() => cancelLongPress()}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all select-none ${
                      isDragging ? 'opacity-30' : ''
                    } ${isDropTarget ? 'bg-blue-50 ring-1 ring-blue-300' : ''} ${
                      entry.isCurrentUser ? 'border-l-2 border-blue-400' : ''
                    }`}
                  >
                    <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab active:cursor-grabbing touch-none" />
                    <span className={`text-sm flex-1 min-w-0 truncate ${
                      entry.isCurrentUser ? 'font-medium text-blue-700' : 'text-gray-800'
                    }`}>
                      {entry.technicianName || '—'}
                    </span>
                    {entry.role && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 max-w-[100px] truncate">
                        {entry.role}
                      </span>
                    )}
                    {entry.isCurrentUser && (
                      <span className="text-[10px] text-blue-400 shrink-0">{t('form.you')}</span>
                    )}
                    <button
                      onClick={() => handleRemoveEntry(dayIdx, entryIdx)}
                      disabled={isSaving}
                      className="p-0.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                      title={t('sheet.removeRow')}
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Adicionar técnico — inline e discreto */}
            <div className="mt-1.5">
              <TechnicianSelect
                key={addSelectKey}
                value=""
                onChange={() => {
                  /* ignora texto livre — usa apenas seleção da lista */
                }}
                onSelectUser={(user) => {
                  handleAddEntryWithUser(dayIdx, user);
                }}
                users={systemUsers}
                excludeNames={day.entries.map((e) => e.technicianName).filter(Boolean)}
                disabled={isSaving}
                placeholder={`+ ${t('sheet.addRow')}`}
              />
            </div>
          </div>

          {/* Daily Progress (obrigatório) */}
          <div>
            <TranslatableField
              label={
                <>
                  {t('sheet.dailyProgress')} <span className="text-red-500">*</span>
                </>
              }
              labelClassName={labelClass}
              value={day.progress}
              onChange={(v) => handleProgressChange(dayIdx, v)}
              multiline
              rows={2}
              disabled={isSaving}
              placeholder="07:00 Tooling prepare, grinding, lamination... 19:00 demob."
              fieldClassName={`${inputClass} ${hasError ? 'border-red-300 ring-1 ring-red-300' : ''}`}
            />
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{t('form.progressRequired')}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
});
