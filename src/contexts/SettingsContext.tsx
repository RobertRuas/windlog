/**
 * ============================================================================
 * SETTINGS CONTEXT - Contexto Global de Preferências
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Provider React que gere as preferências do usuário (idioma, tema, escala)
 * e aplica-as globalmente ao documento HTML.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Ao iniciar a app, carrega as preferências da API (ou localStorage)
 * 2. Aplica o tema (light/dark/auto) como classe no <html>
 * 3. Aplica a escala via CSS zoom no <html>
 * 4. Disponibiliza updateSettings() para atualizar a partir da UI
 * ============================================================================
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getSettings, updateSettings as updateSettingsApi, type UserSettings, type Theme } from '@/services/settings.service';

/**
 * Chave usada para cache local das preferências.
 */
const STORAGE_KEY = 'windlog-settings';

/**
 * Preferências padrão (usadas quando não há dados salvos).
 */
const DEFAULT_SETTINGS: UserSettings = {
  language: 'pt',
  theme: 'auto',
  scale: 80,
};

/**
 * Tipo do contexto de preferências.
 */
interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (payload: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

/**
 * Aplica o tema ao documento HTML.
 * - "light" → classe "light" no <html>
 * - "dark"  → classe "dark" no <html>
 * - "auto"  → segue preferência do sistema
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

/**
 * Aplica a escala ao documento HTML via CSS zoom.
 * O valor é uma percentagem (60-110), convertida para decimal (0.6-1.1).
 */
function applyScale(scale: number): void {
  document.documentElement.style.zoom = String(scale / 100);
}

/**
 * Carrega preferências do localStorage (cache).
 */
function loadCachedSettings(): UserSettings {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
    }
  } catch {
    // Ignora erros de parsing
  }
  return DEFAULT_SETTINGS;
}

/**
 * Provider de preferências.
 * Deve ser envolvido em torno de toda a aplicação (dentro de QueryClientProvider).
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadCachedSettings);
  const [loading, setLoading] = useState(false);

  // Aplica tema e escala sempre que settings mudar
  useEffect(() => {
    applyTheme(settings.theme);
    applyScale(settings.scale);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Escuta mudanças na preferência do sistema (quando theme = "auto")
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  // Carrega preferências da API ao montar (se autenticado)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoading(true);
    getSettings()
      .then((apiSettings) => {
        setSettings(apiSettings);
      })
      .catch(() => {
        // Se falhar, mantém o cache do localStorage
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Atualiza preferências localmente + envia para a API.
   */
  const updateSettings = useCallback(async (payload: Partial<UserSettings>) => {
    // Atualiza imediatamente (otimista)
    setSettings((prev) => ({ ...prev, ...payload }));

    try {
      const updated = await updateSettingsApi(payload);
      setSettings(updated);
    } catch {
      // Reverte em caso de erro
      setSettings(loadCachedSettings());
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook para acessar as preferências do usuário.
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
