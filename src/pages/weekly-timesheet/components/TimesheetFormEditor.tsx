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

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Trash2, Save, RotateCcw, ChevronDown, ChevronRight,
  Check, X, GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateTimesheet } from '@/services/weekly-timesheet.service';
import { getProfile, updateSignature } from '@/services/auth.service';
import { getProjectMembers, getProjectTurbines, type ProjectMember } from '@/services/project.service';
import { DatePicker } from '@/components/ui/DatePicker';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { SecureImage } from '@/components/ui/SecureImage';
import { TranslatableField } from '@/components/ui/TranslatableField';
import { useTranslationLifecycle } from '@/hooks/useTranslationLifecycle';
import { TechnicianSelect } from './TechnicianSelect';
import type {
  TimesheetFormEditorProps,
  FormState,
  FormEntry,
  SystemUser,
  SharedFieldKey,
} from '../types/timesheet-form.types';
import {
  isDayFilled,
  timesheetToFormState,
  formStateToPayload,
  createEmptyEntry,
} from '../helpers/timesheet-form.helpers';

// =========================================================================
// COMPONENT
// =========================================================================

export function TimesheetFormEditor({
  timesheet,
  onSave,
  isSaving,
}: TimesheetFormEditorProps) {
  const { t } = useTranslation('timesheet');

  // Aquece o modelo de tradução ao abrir o formulário e o descarrega ao sair.
  // Atua apenas quando o idioma da interface é português.
  useTranslationLifecycle();

  // ── Busca membros do projeto para o select de técnicos ─────────────
  const { data: projectMembers } = useQuery({
    queryKey: ['project-members', timesheet.projectId],
    queryFn: () => getProjectMembers(timesheet.projectId),
  });

  // ── Busca turbinas do projeto para o select de turbina ─────────────
  const { data: projectTurbines } = useQuery({
    queryKey: ['project-turbines', timesheet.projectId],
    queryFn: () => getProjectTurbines(timesheet.projectId),
  });

  const systemUsers: SystemUser[] = (projectMembers || []).map((m: ProjectMember) => ({
    id: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    fullName: `${m.user.firstName} ${m.user.lastName}`,
    position: m.user.position || '',
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

  // ── Modal de configuração de assinatura (abre quando não há assinatura) ──
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Salva a assinatura no perfil do usuário e aplica no timesheet.
   */
  const saveSignatureMutation = useMutation({
    mutationFn: (dataUrl: string) => updateSignature(dataUrl),
    onSuccess: (_data, dataUrl) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
      handleMetaChange('technicianSignature', dataUrl);
      setSignatureModalOpen(false);
      toast.success(t('common:signature.saved'));
    },
    onError: (e: Error) => toast.error(e.message || t('common:signature.error')),
  });

  // ── Estado do formulário ───────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => timesheetToFormState(timesheet));

  // Ref para evitar reset do form durante auto-save (o form só reinicializa no remount)
  const isInitialLoad = useRef(true);

  // Accordion: todos os dias começam fechados
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(
    () => new Set(form.days.map((_, i) => i)),
  );

  // Refs para scroll automático ao abrir um dia
  const dayHeaderRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Erros de validação
  const [validationErrors, setValidationErrors] = useState<Set<number>>(new Set());

  // ── Drag-and-drop para reordenar técnicos ──────────────────────────
  const [dragInfo, setDragInfo] = useState<{ dayIdx: number; fromIdx: number; toIdx: number } | null>(null);
  const dragRowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Painéis de personalização recolhidos — removido (personalização descontinuada)

  // Inicializa form apenas na primeira carga do componente
  // O refetch é garantido pelo refetchOnMount:'always' na query (dados sempre frescos)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const state = timesheetToFormState(timesheet);
      setForm(state);
      setCollapsedDays(new Set(state.days.map((_, i) => i)));
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
                userId: currentUser?.id || day.entries[0].userId || null,
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
      // Se o dia já está aberto (não está no set), fecha ele
      if (!prev.has(dayIdx)) {
        const next = new Set(prev);
        next.add(dayIdx);
        return next;
      }
      // Abre apenas o dia clicado, fecha todos os outros (accordion: só 1 aberto)
      return new Set(form.days.map((_, i) => i).filter((i) => i !== dayIdx));
    });
    // Scroll suave até o título do acordeão aberto (com offset para ficar visível abaixo do header fixo)
    setTimeout(() => {
      const el = dayHeaderRefs.current[dayIdx];
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 120; // 120px de margem (header + sidebar)
      window.scrollTo({ top, behavior: 'smooth' });
    }, 50);
  }

  // ── Manipuladores ─────────────────────────────────────────────────

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

  /**
   * Validação de horas: restringe valor entre 0 e 24, com passo de 0.5.
   */
  function handleHourChange(dayIdx: number, field: SharedFieldKey, raw: string) {
    let val = parseFloat(raw);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 24) val = 24;
    // Arredonda para múltiplos de 0.5
    val = Math.round(val * 2) / 2;
    handleSharedChange(dayIdx, field, val === 0 && raw.trim() === '' ? '' : String(val));
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
    // Armazena o userId para que o backend vincule o técnico ao usuário do sistema
    setForm((prev) => {
      const days = [...prev.days];
      const entries = [...days[dayIdx].entries];
      entries[entryIdx] = { ...entries[entryIdx], userId: user.id };
      days[dayIdx] = { ...days[dayIdx], entries };
      return { ...prev, days };
    });
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

  /**
   * Move uma entry para cima ou baixo dentro do mesmo dia.
   * Usado para reordenar os técnicos nas linhas da planilha.
   */
  function handleMoveEntry(dayIdx: number, entryIdx: number, direction: 'up' | 'down') {
    setForm((prev) => {
      const days = [...prev.days];
      const entries = [...days[dayIdx].entries];
      const targetIdx = direction === 'up' ? entryIdx - 1 : entryIdx + 1;
      // Verifica se o índice de destino é válido
      if (targetIdx < 0 || targetIdx >= entries.length) return prev;
      // Troca as posições
      [entries[entryIdx], entries[targetIdx]] = [entries[targetIdx], entries[entryIdx]];
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


  // ── Drag-and-drop helpers (reordenar técnicos) ────────────────────

  /** Encontra o índice de destino com base na posição Y do toque/arrasto. */
  function findDropIndex(dayIdx: number, clientY: number, excludeIdx: number) {
    const entries = form.days[dayIdx].entries;
    for (let i = 0; i < entries.length; i++) {
      if (i === excludeIdx) continue;
      const el = dragRowRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return entries.length - 1;
  }

  /** Cancela long-press pendente. */
  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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

  // ── Estilos ─────────────────────────────────────────────────────────
  const inputClass =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';
  const smallInput =
    'w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
  const hourInput =
    'w-full px-1.5 py-1 border border-gray-200 rounded text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TranslatableField
              label={t('sheet.jobScope')}
              labelClassName={labelClass}
              value={form.jobScope}
              onChange={(v) => handleMetaChange('jobScope', v)}
              disabled={isSaving}
              fieldClassName={inputClass}
            />
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
              ref={(el) => { dayHeaderRefs.current[dayIdx] = el; }}
              className={`px-5 py-3 border-b ${borderColor} ${headerBg} flex items-center justify-between cursor-pointer hover:opacity-90 transition-all`}
              onClick={() => toggleDay(dayIdx)}
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                <h3 className="text-sm font-semibold text-gray-900">{t('days.' + day.dayName)}</h3>
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

                  {/* ── Turbina: dropdown + campos auto-preenchidos ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className={smallLabel}>{t('sheet.localTurbineNo')}</label>
                      <select
                        value={day.shared.localTurbineNo}
                        onChange={(e) => {
                          const turbineName = e.target.value;
                          // Ao selecionar turbina, preenche automaticamente os campos relacionados
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
                    <div>
                      <label className={smallLabel}>{t('sheet.standbyHrs')}</label>
                      <input
                        type="number" min="0" max="24" step="0.5"
                        value={day.shared.standbyHrs}
                        onChange={(e) => handleSharedChange(dayIdx, 'standbyHrs', e.target.value)}
                        onBlur={(e) => handleHourChange(dayIdx, 'standbyHrs', e.target.value)}
                        disabled={isSaving}
                        className={hourInput}
                      />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.workingHrs')}</label>
                      <input
                        type="number" min="0" max="24" step="0.5"
                        value={day.shared.workingHrs}
                        onChange={(e) => handleSharedChange(dayIdx, 'workingHrs', e.target.value)}
                        onBlur={(e) => handleHourChange(dayIdx, 'workingHrs', e.target.value)}
                        disabled={isSaving}
                        className={hourInput}
                      />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.travelHrs')}</label>
                      <input
                        type="number" min="0" max="24" step="0.5"
                        value={day.shared.travelHrs}
                        onChange={(e) => handleSharedChange(dayIdx, 'travelHrs', e.target.value)}
                        onBlur={(e) => handleHourChange(dayIdx, 'travelHrs', e.target.value)}
                        disabled={isSaving}
                        className={hourInput}
                      />
                    </div>
                    <div>
                      <label className={smallLabel}>{t('sheet.downtimeHrs')}</label>
                      <input
                        type="number" min="0" max="24" step="0.5"
                        value={day.shared.downtimeHrs}
                        onChange={(e) => handleSharedChange(dayIdx, 'downtimeHrs', e.target.value)}
                        onBlur={(e) => handleHourChange(dayIdx, 'downtimeHrs', e.target.value)}
                        disabled={isSaving}
                        className={hourInput}
                      />
                    </div>
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
                          ref={(el) => { dragRowRefs.current[entryIdx] = el; }}
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
                            longPressTimer.current = setTimeout(() => {
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
                          {/* Grip handle */}
                          <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab active:cursor-grabbing touch-none" />

                          {/* Nome como texto simples */}
                          <span className={`text-sm flex-1 min-w-0 truncate ${
                            entry.isCurrentUser ? 'font-medium text-blue-700' : 'text-gray-800'
                          }`}>
                            {entry.technicianName || '—'}
                          </span>

                          {/* Role como badge discreto */}
                          {entry.role && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 max-w-[100px] truncate">
                              {entry.role}
                            </span>
                          )}

                          {/* "Você" indicator */}
                          {entry.isCurrentUser && (
                            <span className="text-[10px] text-blue-400 shrink-0">{t('form.you')}</span>
                          )}

                          {/* Remover */}
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
                      value=""
                      onChange={(v) => {
                        if (v) {
                          handleAddEntry(dayIdx);
                          const newIdx = day.entries.length;
                          handleEntryChange(dayIdx, newIdx, 'technicianName', v);
                        }
                      }}
                      onSelectUser={(user) => {
                        handleAddEntry(dayIdx);
                        const newIdx = day.entries.length;
                        handleEntryChange(dayIdx, newIdx, 'technicianName', user.fullName);
                        handleSelectUser(dayIdx, newIdx, user);
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
      })}

      {/* ── Seção: Assinaturas ───────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">{t('form.signaturesTitle')}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                        // Se já tem assinatura, limpa (volta para em branco)
                        handleMetaChange('technicianSignature', '');
                      } else if (currentUserSignature) {
                        // Se está em branco e tem assinatura configurada, aplica
                        handleMetaChange('technicianSignature', currentUserSignature);
                      } else {
                        // Sem assinatura configurada → abre modal para configurar
                        setSignatureModalOpen(true);
                      }
                    }}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.technicianSignature ? 'bg-indigo-600' : 'bg-gray-200'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                {form.technicianSignature && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                    {form.technicianSignature.startsWith('data:image') ? (
                      <img
                        src={form.technicianSignature}
                        alt="Your signature"
                        className="w-auto object-contain"
                        style={{ maxHeight: '60px', mixBlendMode: 'multiply' }}
                      />
                    ) : (
                      <SecureImage
                        filePath={form.technicianSignature}
                        alt="Your signature"
                        className="w-auto object-contain"
                        />
                    )}
                    {/* Botão para limpar assinatura */}
                    <button
                      type="button"
                      onClick={() => handleMetaChange('technicianSignature', '')}
                      disabled={isSaving}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title={t('signatures.clearSignature')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {!currentUserSignature && !form.technicianSignature && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('signatures.noSignatureConfigured')}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t('signatures.date')}</label>
                <DatePicker
                  value={form.technicianDate}
                  onChange={(v) => handleMetaChange('technicianDate', v)}
                  disabled={isSaving}
                />
              </div>
            </div>
            {/* ── Coluna: Cliente (apenas leitura — cliente assina o PDF) ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">{t('signatures.clientSignature')}</h3>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    {t('signatures.clientSignsPdf')}
                  </p>
                </div>
                {/* Mostra os dados do cliente se já existirem */}
                {(form.clientName || form.clientDate) && (
                  <div className="text-xs text-amber-700 space-y-1 pt-2 border-t border-amber-200">
                    {form.clientName && (
                      <p><span className="font-medium">{t('signatures.clientName')}:</span> {form.clientName}</p>
                    )}
                    {form.clientDate && (
                      <p><span className="font-medium">{t('signatures.date')}:</span> {form.clientDate}</p>
                    )}
                  </div>
                )}
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

      {/* ── Modal: configurar assinatura (quando não há assinatura) ───── */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{t('common:signature.configure')}</h2>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-4">{t('common:signature.description')}</p>
              <SignaturePad
                initialValue={null}
                height={160}
                isSaving={saveSignatureMutation.isPending}
                onSave={(dataUrl) => saveSignatureMutation.mutate(dataUrl)}
                onCancel={() => setSignatureModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
