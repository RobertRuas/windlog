/**
 * ============================================================================
 * HOME PAGE - Painel de Resumo
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página inicial do sistema, exibida na rota /.
 * Mostra um resumo minimalista da atividade do usuário:
 * - Horas de timesheet do mês corrente
 * - Resumo de projetos
 * - Dicas informativas sobre regras de negócio
 * - Lembrete discreto sobre perfil incompleto
 *
 * LAYOUT:
 * -------
 * Utiliza o AppLayout (sidebar à esquerda).
 * Design minimalista e discreto, sem cards grandes.
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import {
  Clock,
  FolderOpen,
  Lightbulb,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Serviços
import { getProfile } from '@/services/auth.service';
import { getTimesheets, type TimesheetListItem } from '@/services/weekly-timesheet.service';
import { getProjects } from '@/services/project.service';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import type { ProfileResponse } from '@/types/user.types';

/**
 * Componente HomePage - Painel de resumo minimalista.
 */
export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  // Tip rotativo — muda a cada 8 segundos
  const [tipIndex, setTipIndex] = useState(0);
  const totalTips = 5;

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % totalTips);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Dados do perfil
  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  // Timesheets do usuário (paginação grande para capturar os do mês)
  const { data: timesheetsData } = useQuery({
    queryKey: ['timesheets', 'dashboard'],
    queryFn: async () => {
      const res = await getTimesheets({ limit: 100 });
      return res.data; // PaginatedResponse<TimesheetListItem>
    },
  });

  // Projetos
  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'dashboard'],
    queryFn: () => getProjects({ limit: 100 }),
  });

  // ── Cálculo de horas do mês corrente ──
  const monthlyHours = useMemo(() => {
    if (!timesheetsData?.data) {
      return { working: 0, standby: 0, travel: 0, total: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtra timesheets criados no mês corrente
    const monthTimesheets = timesheetsData.data.filter((ts: TimesheetListItem) => {
      // O campo week é uma string tipo "2024-W01" — usamos a data de criação
      // como fallback para filtrar por mês
      const created = new Date(ts.createdAt);
      return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    });

    const working = monthTimesheets.reduce((sum: number, ts: TimesheetListItem) => sum + (ts._totals?.workingHrs ?? 0), 0);
    const standby = monthTimesheets.reduce((sum: number, ts: TimesheetListItem) => sum + (ts._totals?.standbyHrs ?? 0), 0);
    const travel = monthTimesheets.reduce((sum: number, ts: TimesheetListItem) => sum + (ts._totals?.travelHrs ?? 0), 0);

    return {
      working: Math.round(working * 10) / 10,
      standby: Math.round(standby * 10) / 10,
      travel: Math.round(travel * 10) / 10,
      total: Math.round((working + standby + travel) * 10) / 10,
    };
  }, [timesheetsData]);

  // ── Contagem de projetos ──
  const projectStats = useMemo(() => {
    if (!projectsData?.data) return { active: 0, total: 0 };
    const total = projectsData.data.length;
    const active = projectsData.data.filter(
      (p) => p.isActive && (p.status === 'IN_PROGRESS' || p.status === 'PLANNING'),
    ).length;
    return { active, total };
  }, [projectsData]);

  // ── Completude do perfil ──
  const completeness = useMemo(() => {
    if (!profile) return null;
    return calculateProfileCompleteness(profile);
  }, [profile]);

  const hasMissingProfile = completeness && (completeness.percentage < 100 || completeness.hasRequiredMissing);

  // ── Dicas rotativas ──
  const tips = [
    t('dashboard.tips.tip1'),
    t('dashboard.tips.tip2'),
    t('dashboard.tips.tip3'),
    t('dashboard.tips.tip4'),
    t('dashboard.tips.tip5'),
  ];

  const hasAnyHours = monthlyHours.total > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* ── Cabeçalho ── */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {t('title')}, {profile?.firstName}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('homeSubtitle')}
          </p>
        </div>

        {/* ── Linha de resumos compactos ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Timesheet — Horas do mês */}
          <button
            onClick={() => navigate('/timesheets')}
            className="bg-white rounded-lg border border-gray-100 p-3 text-left hover:border-gray-200 transition-colors group"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={13} className="text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                {t('dashboard.timesheets.title')}
              </span>
            </div>
            {hasAnyHours ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-gray-900 tabular-nums">
                    {monthlyHours.total}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">h</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="flex gap-3 text-[10px] text-gray-400">
                  <span>{t('dashboard.timesheets.working')} {monthlyHours.working}h</span>
                  <span>{t('dashboard.timesheets.standby')} {monthlyHours.standby}h</span>
                  <span>{t('dashboard.timesheets.travel')} {monthlyHours.travel}h</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 italic">{t('dashboard.timesheets.noData')}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
            )}
          </button>

          {/* Projetos */}
          <button
            onClick={() => navigate('/projects')}
            className="bg-white rounded-lg border border-gray-100 p-3 text-left hover:border-gray-200 transition-colors group"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <FolderOpen size={13} className="text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                {t('dashboard.projects.title')}
              </span>
            </div>
            {projectStats.total > 0 ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-gray-900 tabular-nums">
                    {projectStats.active}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">
                      /{projectStats.total} {t('dashboard.projects.active').toLowerCase()}
                    </span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 italic">{t('dashboard.projects.noData')}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
            )}
          </button>
        </div>

        {/* ── Dica informativa ── */}
        <div className="bg-gray-50/80 rounded-lg px-3 py-2.5 mb-4 flex items-start gap-2">
          <Lightbulb size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
              {t('dashboard.tips.title')}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed transition-opacity duration-500">
              {tips[tipIndex]}
            </p>
          </div>
        </div>

        {/* ── Lembrete de perfil (apenas se incompleto) ── */}
        {hasMissingProfile && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/60 border border-amber-100/60 hover:bg-amber-50 transition-colors group"
          >
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-600/80 flex-1 text-left">
              {t('dashboard.profileReminder.message')}
            </span>
            <span className="text-[10px] font-medium text-amber-500 group-hover:text-amber-600 transition-colors">
              {t('dashboard.profileReminder.action')}
            </span>
          </button>
        )}

        {/* ── Perfil completo (mensagem subtil) ── */}
        {!hasMissingProfile && completeness && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50/40 border border-green-100/40">
            <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
            <span className="text-xs text-green-500/70">
              {t('dashboard.profileReminder.complete')}
            </span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
