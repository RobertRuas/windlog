/**
 * ============================================================================
 * PREDEFINED LANGUAGES - Lista de Idiomas Predefinidos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Lista de idiomas disponíveis para seleção no sistema.
 * Os usuários devem escolher um idioma desta lista ao invés de digitar.
 *
 * POR QUE UMA LISTA?
 * ------------------
 * - Padronização dos dados
 * - Evita duplicatas (ex: "English", "english", "EN")
 * - Facilita traduções e validações
 * - Melhora a experiência do usuário com autocomplete
 * ============================================================================
 */

/**
 * Interface para um idioma predefinido.
 */
export interface PredefinedLanguage {
  code: string;      // Código ISO 639-1 (ex: "en", "pt", "fr")
  name: string;      // Nome em inglês (padrão internacional)
  nativeName: string; // Nome no idioma original
}

/**
 * Lista de idiomas predefinidos mais comuns.
 * Ordenados alfabeticamente pelo nome em inglês.
 */
export const PREDEFINED_LANGUAGES: PredefinedLanguage[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

/**
 * Busca um idioma pelo código.
 */
export function getLanguageByCode(code: string): PredefinedLanguage | undefined {
  return PREDEFINED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Busca um idioma pelo nome.
 */
export function getLanguageByName(name: string): PredefinedLanguage | undefined {
  return PREDEFINED_LANGUAGES.find(lang =>
    lang.name.toLowerCase() === name.toLowerCase() ||
    lang.nativeName.toLowerCase() === name.toLowerCase()
  );
}
