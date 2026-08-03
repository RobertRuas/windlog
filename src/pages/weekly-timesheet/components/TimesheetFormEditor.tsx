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
 * FUNCIONALIDADES:
 * ----------------
 * - Accordion: primeiro dia aberto, demais recolhidos
 * - Bordas coloridas: verde = preenchido, laranja = pendente
 * - Data: somente leitura (gerada pelo sistema)
 * - Daily Progress: campo obrigatório
 * - Autocomplete de técnicos: sugere usuários do sistema
 * - Usuário atual: pré-preenchido como primeiro técnico em todos os dias
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Plus, Trash2, Save, RotateCcw, ChevronDown, ChevronRight,
  X, User as UserIcon, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  WeeklyTimesheet,
  UpdateTimesheetPayload,
  UpdateDayPayload,
  UpdateEntryPayload,
} from '@/services/weekly-timesheet.service';
import { updateTimesheet } from '@/services/weekly-timesheet.service';
import { getProfile } from '@/services/auth.service';
import { getUsers } from '@/services/user.service';
import { PREDEFINED_FUNCTIONS } from '@/constants/functions';

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
  date: string;
  dayName: string;
  progress: string;
  shared: Record<SharedFieldKey, string>;
  entries: FormEntry[];
}

interface FormEntry {
  id?: string;
  technicianName: string;
  role: string;
  /** Se é o entry do usuário atual (bloqueado para remoção) */
  isCurrentUser?: boolean;
}

interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
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
 * Verifica se um dia está "preenchido" (tem progress + pelo menos 1 entry com nome).
 */
function isDayFilled(day: FormDay): boolean {
  const hasProgress = day.progress.trim().length > 0;
  // Considera apenas técnicos que não são o usuário atual
  const hasNamedEntry = day.entries.some(
    (e) => e.technicianName.trim().length > 0 && !e.isCurrentUser,
  );
  return hasProgress && hasNamedEntry;
}

function detectSharedValues(
  entries: { [key: string]: any }[],
): Record<SharedFieldKey, string> {
  // NÃO MAIS USADO — sharedValues agora vem da API (persistidos no banco)
  // Mantido apenas como fallback para timesheets antigos sem sharedValues
  const result: Record<string, string> = {};
  for (const field of SHARED_FIELDS) {
    const values = entries.map((e) => e[field] || '');
    const allSame = values.length > 0 && values.every((v) => v === values[0]);
    result[field] = allSame ? values[0] : '';
  }
  return result as Record<SharedFieldKey, string>;
}

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
      // Usa sharedValues da API se disponível, senão detecta dos entries (fallback)
      const shared: Record<SharedFieldKey, string> = day.sharedValues
        ? {
            localTurbineNo: day.sharedValues.localTurbineNo || '',
            turbineIdNo: day.sharedValues.turbineIdNo || '',
            towerNo: day.sharedValues.towerNo || '',
            bladeNo: day.sharedValues.bladeNo || '',
            standbyHrs: day.sharedValues.standbyHrs || '',
            workingHrs: day.sharedValues.workingHrs || '',
            travelHrs: day.sharedValues.travelHrs || '',
            downtimeHrs: day.sharedValues.downtimeHrs || '',
            standbyReason: day.sharedValues.standbyReason || '',
          }
        : detectSharedValues(day.entries);
      return {
        id: day.id,
        date: formatDateBR(day.date),
        dayName: day.dayName,
        progress: day.progress || '',
        shared,
        entries: day.entries.map((e) => ({
          id: e.id,
          technicianName: e.technicianName || '',
          role: e.role || '',
        })),
      };
    }),
  };
}

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
      dayName: day.dayName,
      progress: day.progress,
      // Persiste sharedValues no banco para que sejam recarregados ao voltar à página
      sharedValues: { ...day.shared },
      entries: day.entries.map((e): UpdateEntryPayload => ({
        id: e.id,
        technicianName: e.technicianName,
        role: e.role || undefined,
        // Aplica shared values a cada entry (todos usam as informações comuns)
        localTurbineNo: day.shared.localTurbineNo || undefined,
        turbineIdNo: day.shared.turbineIdNo || undefined,
        towerNo: day.shared.towerNo || undefined,
        bladeNo: day.shared.bladeNo || undefined,
        standbyHrs: day.shared.standbyHrs || undefined,
        workingHrs: day.shared.workingHrs || undefined,
        travelHrs: day.shared.travelHrs || undefined,
        downtimeHrs: day.shared.downtimeHrs || undefined,
        standbyReason: day.shared.standbyReason || undefined,
      })),
    })),
  };
}

function createEmptyEntry(): FormEntry {
  return {
    technicianName: '',
    role: '',
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
// AUTOCOMPLETE INPUT COMPONENT
// =========================================================================

interface TechnicianAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectUser: (user: SystemUser) => void;
  users: SystemUser[];
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Input com autocomplete para nome do técnico.
 * Mostra sugestões de usuários do sistema enquanto digita.
 * Permite digitar nome customizado (não força seleção).
 */
function TechnicianAutocomplete({
  value,
  onChange,
  onSelectUser,
  users,
  disabled,
  placeholder,
}: TechnicianAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincroniza valor externo → interno
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim().length >= 2
    ? users.filter((u) =>
        u.fullName.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 5)
    : [];

  function handleSelect(user: SystemUser) {
    setQuery(user.fullName);
    onChange(user.fullName);
    onSelectUser(user);
    setShowSuggestions(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <UserIcon size={14} className="text-gray-400 shrink-0" />
              <div>
                <span className="font-medium text-gray-900">{user.fullName}</span>
                {user.position && (
                  <span className="ml-2 text-xs text-gray-500">{user.position}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  // ── Busca usuários do sistema para autocomplete ────────────────────
  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'all', 'autocomplete'],
    queryFn: () => getUsers({ limit: 100, isActive: true }),
  });

  const systemUsers: SystemUser[] = (usersResponse?.data || []).map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`,
    position: u.position || '',
  }));

  // ── Busca perfil do usuário atual ──────────────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: getProfile,
  });

  const currentUserName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : '';
  const currentUserPosition = currentUser?.position || '';
  const currentUserSignature = currentUser?.signatureData || null;

  // ── Estado do formulário ───────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => timesheetToFormState(timesheet));

  // Ref para evitar reset do form durante auto-save (o form só reinicializa no remount)
  const isInitialLoad = useRef(true);

  // Accordion: primeiro dia aberto, demais recolhidos
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(
    () => new Set(form.days.slice(1).map((_, i) => i + 1)),
  );

  // Erros de validação
  const [validationErrors, setValidationErrors] = useState<Set<number>>(new Set());

  // Painéis de personalização recolhidos — removido (personalização descontinuada)

  // Inicializa form apenas na primeira carga do componente
  // O refetch é garantido pelo refetchOnMount:'always' na query (dados sempre frescos)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const state = timesheetToFormState(timesheet);
      setForm(state);
      setCollapsedDays(new Set(state.days.slice(1).map((_, i) => i + 1)));
    }
  }, [timesheet]);

  // Pré-preenche usuário atual como primeiro entry em todos os dias (só na primeira carga)
  useEffect(() => {
    if (!currentUserName) return;

    setForm((prev) => {
      let changed = false;
      const days = prev.days.map((day) => {
        // Só preenche se o primeiro entry está vazio
        if (day.entries.length > 0 && day.entries[0].technicianName.trim() === '') {
          changed = true;
          return {
            ...day,
            entries: [
              {
                ...day.entries[0],
                technicianName: currentUserName,
                role: day.entries[0].role || currentUserPosition,
                isCurrentUser: true,
              },
              ...day.entries.slice(1),
            ],
          };
        }
        // Marca o primeiro entry como currentUser se o nome bater
        if (day.entries.length > 0 && day.entries[0].technicianName.trim() === currentUserName) {
          changed = true;
          return {
            ...day,
            entries: [
              { ...day.entries[0], isCurrentUser: true },
              ...day.entries.slice(1),
            ],
          };
        }
        return day;
      });

      return changed ? { ...prev, days } : prev;
    });
  }, [currentUserName, currentUserPosition]);

  // Auto-save silencioso com debounce: salva 600ms após a última edição
  // Não atualiza cache — o refetchOnMount:'always' garante dados frescos no remount
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (timesheet.id) {
        try {
          await updateTimesheet(timesheet.id, formStateToPayload(form));
        } catch {
          // silencioso — auto-save não mostra erros
        }
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  function toggleDay(dayIdx: number) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return next;
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────

  function handleMetaChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSharedChange(dayIdx: number, field: SharedFieldKey, value: string) {
    setForm((prev) => {
      const days = [...prev.days];
      const day = days[dayIdx];
      // Apenas atualiza o shared (os entries recebem shared values ao salvar)
      days[dayIdx] = {
        ...day,
        shared: { ...day.shared, [field]: value },
      };
      return { ...prev, days };
    });
  }

  function handleEntryChange(
    dayIdx: number,
    entryIdx: number,
    field: keyof FormEntry,
    value: string,
  ) {
    setForm((prev) => {
      const days = [...prev.days];
      const entries = [...days[dayIdx].entries];
      entries[entryIdx] = { ...entries[entryIdx], [field]: value };
      days[dayIdx] = { ...days[dayIdx], entries };
      return { ...prev, days };
    });
  }

  /**
   * Quando seleciona um usuário do autocomplete, preenche o role.
   */
  function handleSelectUser(dayIdx: number, entryIdx: number, user: SystemUser) {
    if (user.position) {
      handleEntryChange(dayIdx, entryIdx, 'role', user.position);
    }
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

  function handleProgressChange(dayIdx: number, value: string) {
    setForm((prev) => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], progress: value };
      return { ...prev, days };
    });
    // Limpa erro de validação quando preenchido
    if (value.trim()) {
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(dayIdx);
        return next;
      });
    }
  }

  function toggleCustomize() {
    // Removido — personalização por técnico foi descontinuada
    // Todos os técnicos de um dia usam as informações comuns
  }

  // ── Save / Cancel ─────────────────────────────────────────────────

  function handleSave() {
    onSave(formStateToPayload(form));
  }

  function handleCancel() {
    setForm(timesheetToFormState(timesheet));
    setValidationErrors(new Set());
    toast.info(t('form.changesReverted'));
  }

  // ── Styles ─────────────────────────────────────────────────────────
  const inputClass =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';
  const smallInput =
    'w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const smallLabel = 'block text-xs font-medium text-gray-500 mb-0.5';

  return (
    <div className="space-y-4 max-w-5xl">
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
              <label className={labelClass}>{t('sheet.week')}</label>
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
        const filled = isDayFilled(day);
        const hasError = validationErrors.has(dayIdx);

        // Borda: verde (preenchido), laranja-avermelhado (erro), laranja (vazio)
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
          <section key={day.id || dayIdx} className={`bg-white rounded-xl border-2 ${borderColor} overflow-hidden transition-colors`}>
            {/* Header do dia */}
            <div
              className={`px-5 py-3 border-b ${borderColor} ${headerBg} flex items-center justify-between cursor-pointer hover:opacity-90 transition-all`}
              onClick={() => toggleDay(dayIdx)}
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                <h3 className="text-sm font-semibold text-gray-900">{day.dayName}</h3>
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Indicador de status */}
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

                {/* ── Técnicos ── */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {t('form.technicians')}
                  </h4>

                  <div className="space-y-2">
                    {day.entries.map((entry, entryIdx) => (
                      <div
                        key={entryIdx}
                        className={`border rounded-lg overflow-hidden transition-colors ${
                          entry.isCurrentUser
                            ? 'border-blue-200 bg-blue-50/30'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                          <span className="text-xs text-gray-400 w-5 text-center font-medium shrink-0">
                            {entryIdx + 1}
                          </span>

                          {/* Nome com autocomplete */}
                          <div className="flex-1 min-w-0">
                            {entry.isCurrentUser ? (
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-sm font-medium text-gray-700">
                                <UserIcon size={14} className="text-blue-500 shrink-0" />
                                {entry.technicianName}
                                <span className="text-xs text-blue-500 ml-auto">{t('form.you')}</span>
                              </div>
                            ) : (
                              <TechnicianAutocomplete
                                value={entry.technicianName}
                                onChange={(v) => handleEntryChange(dayIdx, entryIdx, 'technicianName', v)}
                                onSelectUser={(user) => handleSelectUser(dayIdx, entryIdx, user)}
                                users={systemUsers}
                                disabled={isSaving}
                                placeholder={t('sheet.technicianName')}
                              />
                            )}
                          </div>

                          {/* Role: função do técnico (lista restritiva PREDEFINED_FUNCTIONS) */}
                          <div className="w-44 shrink-0">
                            <select
                              value={entry.role}
                              onChange={(e) => handleEntryChange(dayIdx, entryIdx, 'role', e.target.value)}
                              disabled={isSaving || entry.isCurrentUser}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 bg-white"
                            >
                              <option value="">{t('sheet.role')}</option>
                              {/* Fallback para valores legados fora da lista */}
                              {entry.role &&
                                !PREDEFINED_FUNCTIONS.some((fn) => fn.label === entry.role) && (
                                  <option value={entry.role}>{entry.role}</option>
                                )}
                              {PREDEFINED_FUNCTIONS.map((fn) => (
                                <option key={fn.id} value={fn.label}>
                                  {fn.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Toggle switch: removido — todos usam informações comuns */}

                          {/* Botão: Remover (não remove entry do currentUser) */}
                          {!entry.isCurrentUser && (
                            <button
                              onClick={() => handleRemoveEntry(dayIdx, entryIdx)}
                              disabled={isSaving}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                              title={t('sheet.removeRow')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {entry.isCurrentUser && <div className="w-7 shrink-0" />}
                        </div>
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

                {/* Daily Progress (obrigatório) */}
                <div>
                  <label className={labelClass}>
                    {t('sheet.dailyProgress')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={day.progress}
                    onChange={(e) => handleProgressChange(dayIdx, e.target.value)}
                    rows={2}
                    disabled={isSaving}
                    placeholder="07:00 Tooling prepare, grinding, lamination... 19:00 demob."
                    className={`${inputClass} ${hasError ? 'border-red-300 ring-1 ring-red-300' : ''}`}
                  />
                  {hasError && (
                    <p className="text-xs text-red-500 mt-1">{t('form.progressRequired')}</p>
                  )}
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
            {/* ── Coluna: Team Leader ────────────────────────────────── */}
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
                {/* Interruptor: Usar assinatura ou deixar em branco */}
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (form.technicianSignature) {
                        handleMetaChange('technicianSignature', '');
                      } else if (currentUserSignature) {
                        handleMetaChange('technicianSignature', currentUserSignature);
                      }
                    }}
                    disabled={isSaving || !currentUserSignature}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.technicianSignature ? 'bg-indigo-600' : 'bg-gray-200'
                    } ${isSaving || !currentUserSignature ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        form.technicianSignature ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {form.technicianSignature ? t('signatures.useMySignature') : t('signatures.leaveBlank')}
                  </span>
                </div>
                {/* Preview da assinatura quando ativa */}
                {form.technicianSignature && form.technicianSignature.startsWith('data:image') && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <img
                      src={form.technicianSignature}
                      alt="Your signature"
                      className="max-h-16 object-contain"
                    />
                  </div>
                )}
                {!currentUserSignature && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('signatures.noSignatureConfigured')}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t('signatures.date')} (DD/MM/YYYY)</label>
                <input type="text" value={form.technicianDate} onChange={(e) => handleMetaChange('technicianDate', e.target.value)} placeholder="DD/MM/YYYY" disabled={isSaving} className={inputClass} />
              </div>
            </div>
            {/* ── Coluna: Cliente (apenas nome e data) ──────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">{t('signatures.clientSignature')}</h3>
              <div>
                <label className={labelClass}>{t('signatures.clientName')}</label>
                <input type="text" value={form.clientName} onChange={(e) => handleMetaChange('clientName', e.target.value)} disabled={isSaving} className={inputClass} />
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  {t('signatures.clientSignsPdf')}
                </p>
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
