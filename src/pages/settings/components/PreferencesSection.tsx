/**
 * ============================================================================
 * PREFERENCES SECTION - Seção de Preferências nas Configurações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que permite ao usuário gerir as suas preferências pessoais:
 * - Idioma da interface (atualmente apenas Português)
 * - Tema visual (claro / escuro / automático)
 * - Escala da interface (60% a 110%, padrão 80%)
 *
 * As preferências são salvas no banco de dados via API.
 * ============================================================================
 */

import { useSettings } from '@/contexts/SettingsContext';
import { Sun, Moon, Monitor, Languages, ChevronDown } from 'lucide-react';
import type { Theme, Language } from '@/services/settings.service';

/**
 * Props do componente PreferencesSection.
 */
interface PreferencesSectionProps {
  t: (key: string) => string;
}

/**
 * Idiomas disponíveis para a interface.
 */
const LANGUAGE_OPTIONS: { value: Language; flag: string; label: string }[] = [
  { value: 'pt', flag: '🇵🇹', label: 'Português' },
  { value: 'en-GB', flag: '🇬🇧', label: 'English (UK)' },
  { value: 'es', flag: '🇪🇸', label: 'Español' },
  { value: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { value: 'fi', flag: '🇫🇮', label: 'Suomi' },
  { value: 'lt', flag: '🇱🇹', label: 'Lietuvių' },
];

/**
 * Opções de tema com ícones e labels.
 */
const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'preferences.theme_light' },
  { value: 'dark', icon: Moon, labelKey: 'preferences.theme_dark' },
  { value: 'auto', icon: Monitor, labelKey: 'preferences.theme_auto' },
];

/**
 * Componente PreferencesSection - Geridor de preferências.
 */
export function PreferencesSection({ t }: PreferencesSectionProps) {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
      {/* Cabeçalho da seção */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#38383a]">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-gray-500 dark:text-[#a1a1a6]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-[#f5f5f7]">{t('sections.preferences')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-[#38383a]">
        {/* Idioma */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-[#f5f5f7]">{t('preferences.language')}</p>
              <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5">{t('preferences.language_desc')}</p>
            </div>
            <div className="relative">
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as Language })}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-gray-100 dark:bg-[#2c2c2e] text-sm font-medium text-gray-700 dark:text-[#f5f5f7] border border-gray-200 dark:border-[#38383a] cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                {LANGUAGE_OPTIONS.map(({ value, flag, label }) => (
                  <option key={value} value={value}>{flag} {label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a1a1a6] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tema */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-[#f5f5f7]">{t('preferences.theme')}</p>
              <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5">{t('preferences.theme_desc')}</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg p-1">
              {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ theme: value })}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${settings.theme === value
                      ? 'bg-white dark:bg-[#3a3a3c] text-gray-900 dark:text-[#f5f5f7] shadow-sm'
                      : 'text-gray-500 dark:text-[#a1a1a6] hover:text-gray-700 dark:hover:text-[#f5f5f7]'
                    }
                  `}
                  title={t(labelKey)}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Escala */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-[#f5f5f7]">{t('preferences.scale')}</p>
              <p className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5">{t('preferences.scale_desc')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ scale: Math.max(60, settings.scale - 5) })}
                disabled={settings.scale <= 60}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-[#38383a] text-gray-400 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
              >
                −
              </button>
              <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1a6] tabular-nums min-w-[2.5ch] text-center">
                {settings.scale}%
              </span>
              <button
                onClick={() => updateSettings({ scale: Math.min(110, settings.scale + 5) })}
                disabled={settings.scale >= 110}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-[#38383a] text-gray-400 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
