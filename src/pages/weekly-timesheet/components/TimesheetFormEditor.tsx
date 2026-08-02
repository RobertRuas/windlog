/**
 * ============================================================================
 * TIMESHEET FORM EDITOR - Editor Organizado (Baseado em Formulário)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente de edição do timesheet baseado em formulário padrão da aplicação.
 *
 * CONCEITO PRINCIPAL:
 * -------------------
 * Em um dia de trabalho, a maioria dos campos é IGUAL para todos os técnicos:
 * Turbine No., Tower No., Blade No., horas, etc.
 * Por isso, cada dia tem uma seção "Informações Comuns" no topo, cujos valores
 * são aplicados a TODOS os técnicos ao salvar.
 *
 * Cada técnico precisa apenas de: Nome + Role.
 * Se um técnico tiver valores diferentes, um botão "Personalizar" expande
 * os campos extras para aquela linha específica.
 *
 * AO SALVAR:
 * ----------
 * - Os valores comuns são copiados para cada entrada (exceto se personalizada)
 * - O backend recebe o payload completo como antes
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Trash2, Save, RotateCcw, ChevronDown, ChevronRight,
  Settings2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  WeeklyTimesheet,
  UpdateTimesheetPayload,
  UpdateDayPayload,
  UpdateEntryPayload,
} from '@/services/weekly-timesheet.service';

// =========================================================================
// TYPES
// =========================================================================

interface TimesheetFormEditorProps {
  timesheet: WeeklyTimesheet;
  onSave: (payload: UpdateTimesheetPayload) => void;
  isSaving: boolean;
}

/**
 * Campos compartilhados entre técnicos de um mesmo dia.
 */
const SHARED_FIELDS = [
  'localTurbineNo', 'turbineIdNo', 'towerNo', 'bladeNo',
  'standbyHrs', 'workingHrs', 'travelHrs', 'downtimeHrs', 'standbyReason',
] as const;

type SharedFieldKey = (typeof SHARED_FIELDS)[number];

interface FormState {
  jobNumber: string;
  week: string;
  teamNo: string;
  jobScope: string;
  client: string;
  siteName: string;
  technicianName: string;
  technicianSignature: string;
  technicianDate: string;
  clientName: string;
  clientSignature: string;
  clientDate: string;
  days: FormDay[];
}

interface FormDay {
  id: string;
  date: string; // DD/MM/YYYY
  dayName: string;
  progress: string;
  /** Valores comuns aplicados a todos os técnicos ao salvar */
  shared: Record<SharedFieldKey, string>;
  entries: FormEntry[];
}

interface FormEntry {
  id?: string;
  technicianName: string;
  role: string;
  /** Se true, esta entrada usa valores próprios em vez dos compartilhados */
  customized: boolean;
  /** Valores personalizados (usados quando customized = true) */
  localTurbineNo: string;
  turbineIdNo: string;
  towerNo: string;
  bladeNo: string;
  standbyHrs: string;
  workingHrs: string;
  travelHrs: string;
  downtimeHrs: string;
  standbyReason: string;
}

// =========================================================================
// HELPERS
// =========================================================================

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const pureDate = dateStr.split('T')[0];
  const parts = pureDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatDateISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

/**
 * Detecta os valores comuns de um dia analisando as entradas existentes.
 * Se TODAS as entradas têm o mesmo valor para um campo, esse é o valor comum.
 */
function detectSharedValues(
  entries: { [key: string]: any }[],
): Record<SharedFieldKey, string> {
  const shared: Record<string, string> = {};

  for (const field of SHARED_FIELDS) {
    const values = entries.map((e) => e[field] || '');
    const allSame = values.length > 0 && values.every((v) => v === values[0]);
    shared[field] = allSame ? values[0] : '';
  }

  return shared as Record<SharedFieldKey, string>;
}

/**
 * Converte timesheet → form state.
 */
function timesheetToFormState(ts: WeeklyTimesheet): FormState {
  return {
    jobNumber: ts.jobNumber || '',
    week: ts.week || '',
    teamNo: ts.teamNo || '',
    jobScope: ts.jobScope || '',
    client: ts.client || '',
    siteName: ts.siteName || '',
    technicianName: ts.technicianName || '',
    technicianSignature: ts.technicianSignature || '',
    technicianDate: formatDateBR(ts.technicianDate),
    clientName: ts.clientName || '',
    clientSignature: ts.clientSignature || '',
    clientDate: formatDateBR(ts.clientDate),
    days: ts.days.map((day) => {
      const shared = detectSharedValues(day.entries);

      return {
        id: day.id,
        date: formatDateBR(day.date),
        dayName: day.dayName,
        progress: day.progress || '',
        shared,
        entries: day.entries.map((e) => {
          // Verifica se esta entrada tem valores diferentes dos comuns
          const isCustomized = SHARED_FIELDS.some(
            (f) => (e[f as keyof typeof e] || '') !== shared[f],
          );

          return {
            id: e.id,
            technicianName: e.technicianName || '',
            role: e.role || '',
            customized: isCustomized,
            localTurbineNo: e.localTurbineNo || '',
            turbineIdNo: e.turbineIdNo || '',
            towerNo: e.towerNo || '',
            bladeNo: e.bladeNo || '',
            standbyHrs: e.standbyHrs || '',
            workingHrs: e.workingHrs || '',
            travelHrs: e.travelHrs || '',
            downtimeHrs: e.downtimeHrs || '',
            standbyReason: e.standbyReason || '',
          };
        }),
      };
    }),
  };
}

/**
 * Converte form state → payload de atualização.
 * Copia os valores compartilhados para cada entrada (exceto se personalizada).
 */
function formStateToPayload(form: FormState): UpdateTimesheetPayload {
  return {
    jobNumber: form.jobNumber || undefined,
    week: form.week || undefined,
    teamNo: form.teamNo || undefined,
    jobScope: form.jobScope || undefined,
    client: form.client || undefined,
    siteName: form.siteName || undefined,
    technicianName: form.technicianName || undefined,
    technicianSignature: form.technicianSignature || undefined,
    technicianDate: form.technicianDate ? formatDateISO(form.technicianDate) : undefined,
    clientName: form.clientName || undefined,
    clientSignature: form.clientSignature || undefined,
    clientDate: form.clientDate ? formatDateISO(form.clientDate) : undefined,
    days: form.days.map((day): UpdateDayPayload => ({
      id: day.id,
      date: day.date ? formatDateISO(day.date) : undefined,
      dayName: day.dayName,
      progress: day.progress,
      entries: day.entries.map((e): UpdateEntryPayload => {
        // Se personalizada, usa os valores próprios; senão, usa os compartilhados
        const vals = e.customized
          ? e
          : { ...day.shared };

        return {
          id: e.id,
          technicianName: e.technicianName,
          role: e.role || undefined,
          localTurbineNo: (vals as any).localTurbineNo || undefined,
          turbineIdNo: (vals as any).turbineIdNo || undefined,
          towerNo: (vals as any).towerNo || undefined,
          bladeNo: (vals as any).bladeNo || undefined,
          standbyHrs: (vals as any).standbyHrs || undefined,
          workingHrs: (vals as any).workingHrs || undefined,
          travelHrs: (vals as any).travelHrs || undefined,
          downtimeHrs: (vals as any).downtimeHrs || undefined,
          standbyReason: (vals as any).standbyReason || undefined,
        };
      }),
    })),
  };
}

function createEmptyEntry(): FormEntry {
  return {
    technicianName: '',
    role: '',
    customized: false,
    localTurbineNo: '',
    turbineIdNo: '',
    towerNo: '',
    bladeNo: '',
    standbyHrs: '',
    workingHrs: '',
    travelHrs: '',
    downtimeHrs: '',
    standbyReason: '',
  };
}

function emptyShared(): Record<SharedFieldKey, string> {
  return {
    localTurbineNo: '', turbineIdNo: '', towerNo: '', bladeNo: '',
    standbyHrs: '', workingHrs: '', travelHrs: '', downtimeHrs: '',
    standbyReason: '',
  };
}

// =========================================================================
// COMPONENT
// =========================================================================

export function TimesheetFormEditor({
  timesheet,
  onSave,
  isSaving,
}: TimesheetFormEditorProps) {
  const { t } = useTranslation('timesheet');

  const [form, setForm] = useState<FormState>(() => timesheetToFormState(timesheet));
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    setForm(timesheetToFormState(timesheet));
  }, [timesheet]);

  function toggleDay(dayIdx: number) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return next;
    });
  }

  // ── Metadata handlers ───────────────────────────────────────────────

  function handleMetaChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Shared field handlers ───────────────────────────────────────────

  function handleSharedChange(dayIdx: number, field: SharedFieldKey, value: string) {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], shared: { ...days[dayIdx].shared, [field]: value } };
      return { ...prev, days };
    });
  }

  // ── Entry handlers ──────────────────────────────────────────────────

  function handleEntryChange(
    dayIdx: number,
    entryIdx: number,
    field: keyof FormEntry,
    value: string | boolean,
  ) {
    setForm((prev) => {
      const days = [...prev.days];
      const entries = [...days[dayIdx].entries];
      entries[entryIdx] = { ...entries[entryIdx], [field]: value };
      days[dayIdx] = { ...days[dayIdx], entries };
      return { ...prev, days };
    });
  }

  function handleAddEntry(dayIdx: number) {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], entries: [...days[dayIdx].entries, createEmptyEntry()] };
      return { ...prev, days };
    });
  }

  function handleRemoveEntry(dayIdx: number, entryIdx: number) {
    setForm((prev) => {
      const days = [...prev.days];
      const entries = days[dayIdx].entries.filter((_, i) => i !== entryIdx);
      days[dayIdx] = { ...days[dayIdx], entries };
      return { ...prev, days };
    });
  }

  function handleDayFieldChange(dayIdx: number, field: 'date' | 'progress', value: string) {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], [field]: value };
      return { ...prev, days };
    });
  }

  /**
   * Toggle personalizado: quando ativado, copia os valores compartilhados
   * para os campos da entrada (para o usuário editar a partir dali).
   */
  function toggleCustomize(dayIdx: number, entryIdx: number) {
    setForm((prev) => {
      const days = [...prev.days];
      const entries = [...days[dayIdx].entries];
      const entry = entries[entryIdx];
      const shared = days[dayIdx].shared;

      if (!entry.customized) {
        // Ativando: copia valores compartilhados para os campos
        entries[entryIdx] = {
          ...entry,
          customized: true,
          localTurbineNo: entry.localTurbineNo || shared.localTurbineNo,
          turbineIdNo: entry.turbineIdNo || shared.turbineIdNo,
          towerNo: entry.towerNo || shared.towerNo,
          bladeNo: entry.bladeNo || shared.bladeNo,
          standbyHrs: entry.standbyHrs || shared.standbyHrs,
          workingHrs: entry.workingHrs || shared.workingHrs,
          travelHrs: entry.travelHrs || shared.travelHrs,
          downtimeHrs: entry.downtimeHrs || shared.downtimeHrs,
          standbyReason: entry.standbyReason || shared.standbyReason,
        };
      } else {
        // Desativando: limpa valores personalizados
        entries[entryIdx] = { ...entry, customized: false };
      }

      days[dayIdx] = { ...days[dayIdx], entries };
      return { ...prev, days };
    });
  }

  // ── Save / Cancel ───────────────────────────────────────────────────

  function handleSave() {
    onSave(formStateToPayload(form));
  }

  function handleCancel() {
    setForm(timesheetToFormState(timesheet));
    toast.info(t('form.changesReverted'));
  }

  // ── Styles ──────────────────────────────────────────────────────────
  const inputClass =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';
  const smallInput =
    'w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const smallLabel = 'block text-xs font-medium text-gray-500 mb-0.5';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Seção: Metadata ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">{t('form.metadataTitle')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('sheet.jobNumber')}</label>
              <input type="text" value={form.jobNumber} onChange={(e) => handleMetaChange('jobNumber', e.target.value)} disabled={isSaving} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('sheet.week')} *</label>
              <input type="text" value={form.week} disabled className={inputClass + ' bg-gray-50'} />
            </div>
            <div>
              <label className={labelClass}>{t('sheet.teamNo')}</label>
              <input type="text" value={form.teamNo} onChange={(e) => handleMetaChange('teamNo', e.target.value)} disabled={isSaving} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('sheet.jobScope')}</label>
              <input type="text" value={form.jobScope} onChange={(e) => handleMetaChange('jobScope', e.target.value)} disabled={isSaving} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('sheet.client')}</label>
              <input type="text" value={form.client} onChange={(e) => handleMetaChange('client', e.target.value)} disabled={isSaving} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('sheet.siteName')}</label>
              <input type="text" value={form.siteName} onChange={(e) => handleMetaChange('siteName', e.target.value)} disabled={isSaving} className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção: Dias da Semana ────────────────────────────────────── */}
      {form.days.map((day, dayIdx) => {
        const isCollapsed = collapsedDays.has(dayIdx);

        return (
          <section key={day.id || dayIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header do dia (clicável para colapsar) */}
            <div
              className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleDay(dayIdx)}
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                <h3 className="text-sm font-semibold text-gray-900">{day.dayName}</h3>
                <span className="text-xs text-gray-500">{day.date} • {day.entries.length} {t('form.entries')}</span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="p-4 space-y-5">
                {/* Data + Progresso */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{day.dayName} {t('sheet.dayDate')}</label>
                    <input type="text" value={day.date} onChange={(e) => handleDayFieldChange(dayIdx, 'date', e.target.value)} placeholder="DD/MM/YYYY" disabled={isSaving} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('sheet.dailyProgress')}</label>
                    <textarea value={day.progress} onChange={(e) => handleDayFieldChange(dayIdx, 'progress', e.target.value)} rows={2} disabled={isSaving} placeholder="07:00 Tooling prepare, grinding, lamination... 19:00 demob." className={inputClass} />
                  </div>
                </div>

                {/* ── Informações Comuns (aplicadas a todos os técnicos) ── */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Settings2 size={12} className="text-blue-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                      {t('form.commonInfo')}
                    </h4>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className={smallLabel}>{t('sheet.localTurbineNo')}</label>
                      <input type="text" value={day.shared.localTurbineNo} onChange={(e) => handleSharedChange(dayIdx, 'localTurbineNo', e.target.value)} placeholder="eg WEA1" disabled={isSaving} className={smallInput} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.turbineIdNo')}</label>
                      <input type="text" value={day.shared.turbineIdNo} onChange={(e) => handleSharedChange(dayIdx, 'turbineIdNo', e.target.value)} placeholder="eg 552201011" disabled={isSaving} className={smallInput} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.towerNo')}</label>
                      <input type="text" value={day.shared.towerNo} onChange={(e) => handleSharedChange(dayIdx, 'towerNo', e.target.value)} placeholder="eg G20_001234_DE" disabled={isSaving} className={smallInput} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.bladeNo')}</label>
                      <input type="text" value={day.shared.bladeNo} onChange={(e) => handleSharedChange(dayIdx, 'bladeNo', e.target.value)} disabled={isSaving} className={smallInput} />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 mt-3">
                    <div>
                      <label className={smallLabel}>{t('sheet.standbyHrs')}</label>
                      <input type="text" value={day.shared.standbyHrs} onChange={(e) => handleSharedChange(dayIdx, 'standbyHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.workingHrs')}</label>
                      <input type="text" value={day.shared.workingHrs} onChange={(e) => handleSharedChange(dayIdx, 'workingHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.travelHrs')}</label>
                      <input type="text" value={day.shared.travelHrs} onChange={(e) => handleSharedChange(dayIdx, 'travelHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.downtimeHrs')}</label>
                      <input type="text" value={day.shared.downtimeHrs} onChange={(e) => handleSharedChange(dayIdx, 'downtimeHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.standbyReason')}</label>
                      <input type="text" value={day.shared.standbyReason} onChange={(e) => handleSharedChange(dayIdx, 'standbyReason', e.target.value)} disabled={isSaving} className={smallInput} />
                    </div>
                  </div>
                </div>

                {/* ── Técnicos ──────────────────────────────────────────── */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {t('form.technicians')}
                  </h4>

                  <div className="space-y-2">
                    {day.entries.map((entry, entryIdx) => (
                      <div key={entryIdx} className="border border-gray-150 rounded-lg overflow-hidden">
                        {/* Linha principal: Nome + Role + botões */}
                        <div className="flex items-center gap-3 px-3 py-2 bg-white">
                          <span className="text-xs text-gray-400 w-5 text-center font-medium">{entryIdx + 1}</span>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={entry.technicianName}
                              onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'technicianName', e.target.value)}
                              placeholder={t('sheet.technicianName')}
                              disabled={isSaving}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="w-32">
                            <input
                              type="text"
                              value={entry.role}
                              onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'role', e.target.value)}
                              placeholder={t('sheet.role')}
                              disabled={isSaving}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Botão: Personalizar campos */}
                          <button
                            onClick={() => toggleCustomize(dayIdx, entryIdx)}
                            disabled={isSaving}
                            className={`p-1.5 rounded transition-colors ${
                              entry.customized
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                            }`}
                            title={entry.customized ? t('form.useCommon') : t('form.customize')}
                          >
                            <Settings2 size={14} />
                          </button>

                          {/* Botão: Remover */}
                          <button
                            onClick={() => handleRemoveEntry(dayIdx, entryIdx)}
                            disabled={isSaving}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            title={t('sheet.removeRow')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Campos personalizados (aparece quando customized = true) */}
                        {entry.customized && (
                          <div className="px-3 py-3 bg-amber-50/50 border-t border-amber-100">
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-xs font-medium text-amber-700">{t('form.customizedFields')}</span>
                              <button
                                onClick={() => toggleCustomize(dayIdx, entryIdx)}
                                className="ml-auto p-0.5 text-amber-400 hover:text-amber-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className={smallLabel}>{t('sheet.localTurbineNo')}</label>
                                <input type="text" value={entry.localTurbineNo} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'localTurbineNo', e.target.value)} disabled={isSaving} className={smallInput} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.turbineIdNo')}</label>
                                <input type="text" value={entry.turbineIdNo} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'turbineIdNo', e.target.value)} disabled={isSaving} className={smallInput} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.towerNo')}</label>
                                <input type="text" value={entry.towerNo} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'towerNo', e.target.value)} disabled={isSaving} className={smallInput} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.bladeNo')}</label>
                                <input type="text" value={entry.bladeNo} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'bladeNo', e.target.value)} disabled={isSaving} className={smallInput} />
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                              <div>
                                <label className={smallLabel}>{t('sheet.standbyHrs')}</label>
                                <input type="text" value={entry.standbyHrs} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'standbyHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.workingHrs')}</label>
                                <input type="text" value={entry.workingHrs} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'workingHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.travelHrs')}</label>
                                <input type="text" value={entry.travelHrs} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'travelHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.downtimeHrs')}</label>
                                <input type="text" value={entry.downtimeHrs} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'downtimeHrs', e.target.value)} disabled={isSaving} className={smallInput + ' text-center'} />
                              </div>
                              <div>
                                <label className={smallLabel}>{t('sheet.standbyReason')}</label>
                                <input type="text" value={entry.standbyReason} onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'standbyReason', e.target.value)} disabled={isSaving} className={smallInput} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botão adicionar técnico */}
                  <button
                    onClick={() => handleAddEntry(dayIdx)}
                    disabled={isSaving}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {t('sheet.addRow')}
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* ── Seção: Assinaturas ───────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">{t('form.signaturesTitle')}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                {t('signatures.signature')} ({t('sheet.technicianName')})
              </h3>
              <div>
                <label className={labelClass}>{t('signatures.name')}</label>
                <input type="text" value={form.technicianName} onChange={(e) => handleMetaChange('technicianName', e.target.value)} disabled={isSaving} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('signatures.signature')}</label>
                <input type="text" value={form.technicianSignature} onChange={(e) => handleMetaChange('technicianSignature', e.target.value)} disabled={isSaving} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('signatures.date')} (DD/MM/YYYY)</label>
                <input type="text" value={form.technicianDate} onChange={(e) => handleMetaChange('technicianDate', e.target.value)} placeholder="DD/MM/YYYY" disabled={isSaving} className={inputClass} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">{t('signatures.clientSignature')}</h3>
              <div>
                <label className={labelClass}>{t('signatures.clientName')}</label>
                <input type="text" value={form.clientName} onChange={(e) => handleMetaChange('clientName', e.target.value)} disabled={isSaving} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('signatures.clientSignature')}</label>
                <input type="text" value={form.clientSignature} onChange={(e) => handleMetaChange('clientSignature', e.target.value)} disabled={isSaving} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('signatures.date')} (DD/MM/YYYY)</label>
                <input type="text" value={form.clientDate} onChange={(e) => handleMetaChange('clientDate', e.target.value)} placeholder="DD/MM/YYYY" disabled={isSaving} className={inputClass} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Botões de ação ────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 pb-8 sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 -mx-6 px-6">
        <button onClick={handleCancel} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
          <RotateCcw size={14} />
          {t('form.cancel')}
        </button>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={14} />
          {isSaving ? t('form.saving') : t('form.saveChanges')}
        </button>
      </div>
    </div>
  );
}
