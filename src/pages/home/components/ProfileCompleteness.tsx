/**
 * ============================================================================
 * PROFILE COMPLETENESS - Barra de Progresso e Checklist do Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente visual que mostra o progresso de preenchimento do perfil
 * através de uma barra de progresso animada e um checklist expansível.
 *
 * COMO FUNCIONA?
 * --------------
 * - Calcula o percentual de completude com base nos dados do perfil
 * - Exibe barra de progresso com cor dinâmica (vermelho → amarelo → verde)
 * - Checklist expansível mostra cada seção e seu estado
 * - Seção "Documentos" tem badge "Obrigatório" se passaporte faltar
 * - Ao clicar numa seção incompleta, faz scroll até à seção correspondente
 * - Animação de "pulse" quando vem da notificação (hash #complete-profile)
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Sparkles,
  User,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  CreditCard,
  Landmark,
  Globe,
  Award,
} from 'lucide-react';
import { calculateProfileCompleteness, type SectionResult } from '@/utils/profileCompleteness';
import type { User as UserType } from '@/types/user.types';

/**
 * Mapeia ID da seção para ícone e cor.
 */
const SECTION_ICONS: Record<string, { icon: typeof User; color: string }> = {
  identity: { icon: User, color: 'text-blue-500' },
  contact: { icon: Phone, color: 'text-sky-500' },
  location: { icon: MapPin, color: 'text-emerald-500' },
  professional: { icon: Briefcase, color: 'text-violet-500' },
  about: { icon: FileText, color: 'text-gray-500' },
  documents: { icon: CreditCard, color: 'text-rose-500' },
  bankAccounts: { icon: Landmark, color: 'text-green-600' },
  languages: { icon: Globe, color: 'text-teal-500' },
  certifications: { icon: Award, color: 'text-purple-500' },
};

/**
 * Mapeia ID da seção para o ID do accordion na ProfilePage (scroll target).
 */
const SECTION_SCROLL_MAP: Record<string, string | null> = {
  identity: 'section-personal',
  contact: 'section-phones',
  location: 'section-personal',
  professional: 'section-personal',
  about: 'section-personal',
  documents: 'section-documents',
  bankAccounts: 'section-bank',
  languages: 'section-languages',
  certifications: 'section-certifications',
};

interface ProfileCompletenessProps {
  /** Dados completos do perfil */
  data: UserType;
}

/**
 * Componente ProfileCompleteness - Mostra progresso e checklist do perfil.
 */
export function ProfileCompleteness({ data }: ProfileCompletenessProps) {
  const { t } = useTranslation('home');
  const [expanded, setExpanded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcula completude com base nos dados
  const completeness = calculateProfileCompleteness(data);
  const { percentage, sections, hasRequiredMissing } = completeness;

  // Verifica se veio da notificação (hash na URL)
  useEffect(() => {
    if (window.location.hash === '#complete-profile' && percentage < 100) {
      setExpanded(true);
      setIsHighlighted(true);
      // Scroll suave até o componente
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
      // Remove highlight após 3 segundos
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentage]);

  // Cor dinâmica da barra baseada no percentual
  const getBarColor = () => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Cor de fundo da barra
  const getBarBg = () => {
    if (percentage >= 80) return 'bg-emerald-100';
    if (percentage >= 50) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  // Texto de status
  const getStatusText = () => {
    if (percentage === 100) return t('completeness.sectionsComplete');
    return t('completeness.percentage', { value: percentage });
  };

  // Faz scroll até a seção correspondente
  const handleSectionClick = (sectionId: string) => {
    const scrollTarget = SECTION_SCROLL_MAP[sectionId];
    if (scrollTarget) {
      const element = document.getElementById(scrollTarget);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Destaca a seção brevemente
        element.classList.add('ring-2', 'ring-blue-400', 'rounded-xl');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-400', 'rounded-xl');
        }, 2000);
      }
    }
  };

  // Se 100% completo, mostra mensagem de sucesso compacta
  if (percentage === 100) {
    return (
      <div
        ref={containerRef}
        id="complete-profile"
        className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">
            {t('completeness.sectionsComplete')}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {t('completeness.percentage', { value: 100 })}
          </p>
        </div>
        <div className="w-12 h-12 relative">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#d1fae5" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3"
              strokeDasharray="94.25" strokeDashoffset="0" strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-700">
            100
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="complete-profile"
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-500 ${
        isHighlighted
          ? 'border-blue-400 ring-2 ring-blue-200 shadow-lg shadow-blue-100'
          : 'border-gray-200 shadow-sm'
      }`}
    >
      {/* Header com barra de progresso */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          {/* Ícone com badge de alerta se faltar obrigatório */}
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasRequiredMissing ? 'bg-rose-100' : 'bg-amber-100'
            }`}>
              {hasRequiredMissing ? (
                <AlertCircle size={18} className="text-rose-600" />
              ) : (
                <Sparkles size={18} className="text-amber-600" />
              )}
            </div>
            {hasRequiredMissing && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          {/* Título e percentual */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {t('completeness.title')}
              </h3>
              {hasRequiredMissing && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 rounded-full flex-shrink-0">
                  {t('completeness.required')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {getStatusText()}
            </p>
          </div>

          {/* Mini gauge circular */}
          <div className="w-11 h-11 relative flex-shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                className={`${
                  percentage >= 80 ? 'stroke-emerald-500' : percentage >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                } transition-all duration-700`}
                strokeWidth="3"
                strokeDasharray="94.25"
                strokeDashoffset={94.25 - (94.25 * percentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {percentage}
            </span>
          </div>
        </div>

        {/* Barra de progresso linear */}
        <div className={`w-full h-2 rounded-full ${getBarBg()} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${getBarColor()} transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Botão expandir/recolher */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded ? (
            <>
              {t('completeness.hideDetails')}
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              {t('completeness.showDetails')}
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {/* Checklist expansível */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-3 pt-2 space-y-1">
          {sections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              t={t}
              onClick={() => !section.isComplete && handleSectionClick(section.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Linha individual do checklist de uma seção.
 */
function SectionRow({
  section,
  t,
  onClick,
}: {
  section: SectionResult;
  t: (key: string) => string;
  onClick: () => void;
}) {
  const { icon: Icon, color } = SECTION_ICONS[section.id] || { icon: FileText, color: 'text-gray-500' };
  const isComplete = section.isComplete;
  const isRequired = section.id === 'documents'; // passaporte obrigatório
  const progressText = `${section.filledFields}/${section.totalFields}`;

  return (
    <button
      onClick={onClick}
      disabled={isComplete}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        isComplete
          ? 'opacity-60 cursor-default'
          : 'hover:bg-gray-50 cursor-pointer group'
      }`}
    >
      {/* Ícone da seção */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isComplete ? 'bg-emerald-50' : 'bg-gray-100'
      }`}>
        <Icon size={15} className={isComplete ? 'text-emerald-500' : color} />
      </div>

      {/* Nome e hint */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${isComplete ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
            {t(`completeness.sections.${section.id}`)}
          </span>
          {isRequired && !isComplete && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-rose-100 text-rose-600 rounded">
              {t('completeness.required')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {!isComplete ? (
            <>
              <p className="text-[11px] text-gray-400 truncate">
                {t(`completeness.hints.${section.id}`)}
              </p>
              <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                {progressText}
              </span>
            </>
          ) : (
            <p className="text-[11px] text-emerald-500 truncate">
              {t('completeness.complete')}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      {isComplete ? (
        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Check size={12} className="text-emerald-600" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0 group-hover:border-blue-400 transition-colors" />
      )}
    </button>
  );
}
