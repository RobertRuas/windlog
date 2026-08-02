/**
 * ============================================================================
 * TIMESHEET CREATE MODAL - Modal para Criar Novo Timesheet
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal que permite ao Team Leader criar um novo Weekly Timesheet.
 * O usuário seleciona o projeto e a semana através de um dropdown.
 *
 * SEMANA:
 * -------
 * - Dropdown com as 53 semanas do ano (ISO 8601)
 * - Cada opção mostra o intervalo de datas: "Semana 30 — 21 Jul - 27 Jul"
 * - A semana atual vem pré-selecionada
 *
 * AO CRIAR:
 * ---------
 * - Os 7 dias da semana são gerados automaticamente no backend
 * - jobScope, client e siteName são preenchidos do projeto
 * - O usuário é redirecionado para a página de detalhes
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { getProjects } from '@/services/project.service';
import { useTimesheetMutations } from '../hooks/useTimesheetMutations';

/**
 * Props do componente TimesheetCreateModal.
 */
interface TimesheetCreateModalProps {
  onClose: () => void;
  onSuccess: (timesheetId: string) => void;
}

/**
 * Retorna o intervalo de datas (Seg-Dom) de uma semana ISO em um dado ano.
 */
function getWeekDateRange(weekNum: number, year: number): { start: string; end: string } {
  // Dia 4 de janeiro sempre está na semana 1 ISO
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Domingo = 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);

  // Segunda da semana desejada
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);

  // Domingo = segunda + 6
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return { start: fmt(monday), end: fmt(sunday) };
}

/**
 * Retorna a semana ISO atual.
 */
function getCurrentISOWeek(): number {
  const now = new Date();
  const day = now.getDay() || 7;
  now.setDate(now.getDate() + 4 - day);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Componente TimesheetCreateModal - Formulário de criação.
 */
export function TimesheetCreateModal({
  onClose,
  onSuccess,
}: TimesheetCreateModalProps) {
  const { t } = useTranslation('timesheet');
  const mutations = useTimesheetMutations();

  const currentYear = new Date().getFullYear();
  const currentWeek = getCurrentISOWeek();

  // ── Estado do formulário ────────────────────────────────────────────
  const [projectId, setProjectId] = useState('');
  const [week, setWeek] = useState(String(currentWeek));
  const [jobNumber, setJobNumber] = useState('');
  const [teamNo, setTeamNo] = useState('');

  // ── Gera opções de semana (1-53) com range de datas ───────────────
  const weekOptions = useMemo(() => {
    return Array.from({ length: 53 }, (_, i) => {
      const w = i + 1;
      const range = getWeekDateRange(w, currentYear);
      return {
        value: String(w),
        label: `${t('sheet.week')} ${w}  •  ${range.start} — ${range.end}`,
      };
    });
  }, [currentYear, t]);

  // ── Busca projetos para o select ────────────────────────────────────
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => getProjects({ limit: 100 }),
  });

  const projects = projectsResponse?.data || [];

  /**
   * Submete o formulário para criar o timesheet.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!projectId || !week) return;

    mutations.createTimesheet.mutate(
      {
        projectId,
        week,
        jobNumber: jobNumber || undefined,
        teamNo: teamNo || undefined,
      },
      {
        onSuccess: (response) => {
          onSuccess(response.data.id);
        },
      },
    );
  }

  // Range da semana selecionada (para preview)
  const selectedRange = week
    ? getWeekDateRange(Number(week), currentYear)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('create.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campo: Projeto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('create.selectProject')} *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- {t('create.selectProject')} --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>
          </div>

          {/* Campo: Semana (dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('create.weekNumber')} *
            </label>
            <select
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{t('create.selectWeek')}</option>
              {weekOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedRange && (
              <p className="text-xs text-blue-600 mt-1.5 font-medium">
                {selectedRange.start} — {selectedRange.end}, {currentYear}
              </p>
            )}
          </div>

          {/* Campo: Job Number (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('create.jobNumber')}
            </label>
            <input
              type="text"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Campo: Team No. (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('create.teamNo')}
            </label>
            <input
              type="text"
              value={teamNo}
              onChange={(e) => setTeamNo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Footer com botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('create.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutations.createTimesheet.isPending || !projectId || !week}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutations.createTimesheet.isPending ? '...' : t('create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
