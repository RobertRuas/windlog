/**
 * ============================================================================
 * I18N CONFIGURATION - Configuração de Internacionalização
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Configura o i18next, que é a biblioteca de internacionalização (i18n).
 * Internacionalização permite que o app tenha múltiplos idiomas.
 *
 * O QUE É I18N?
 * -------------
 * "i18n" é uma abreviação de "internationalization" (internacionalização).
 * O número 18 representa as letras entre "i" e "n" na palavra em inglês.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Definimos traduções em arquivos JSON separados por idioma
 * 2. No código, usamos a função t() para buscar a tradução
 * 3. O i18next carrega o idioma correto automaticamente
 *
 * EXEMPLO:
 * --------
 * import { useTranslation } from 'react-i18next';
 * const { t } = useTranslation('login');
 * <h1>{t('title')}</h1>  // Exibe "Entrar" em português
 *
 * ESTRUTURA DE ARQUIVOS:
 * ----------------------
 * i18n/
 *   locales/
 *     pt/           <- Português (idioma padrão)
 *       common.json <- traduções compartilhadas
 *       login.json  <- traduções da página de login
 *       home.json   <- traduções da página home
 *     en/           <- Inglês (futuro)
 *       ...
 * ============================================================================
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importa as traduções de cada módulo/página
// Cada arquivo JSON contém as strings traduzidas para aquele namespace
import ptCommon from './locales/pt/common.json';
import ptLogin from './locales/pt/login.json';
import ptHome from './locales/pt/home.json';
import ptLogs from './locales/pt/logs.json';
import ptSettings from './locales/pt/settings.json';
import ptUsers from './locales/pt/users.json';
import ptProjects from './locales/pt/projects.json';
import ptTimesheet from './locales/pt/timesheet.json';
import ptOnboarding from './locales/pt/onboarding.json';
import ptFeedback from './locales/pt/feedback.json';
import ptNotifications from './locales/pt/notifications.json';

/**
 * Inicializa o i18next com as configurações do projeto.
 */
i18n
  .use(initReactI18next) // Integra o i18next com o React (hooks)
  .init({
    // Recursos (traduções) disponíveis
    resources: {
      pt: {
        common: ptCommon,    // Traduções compartilhadas (botões, labels, etc.)
        login: ptLogin,      // Traduções específicas da página de login
        home: ptHome,        // Traduções específicas da página home
        logs: ptLogs,        // Traduções da página de logs
        settings: ptSettings,// Traduções da página de configurações
        users: ptUsers,      // Traduções da página de usuários
        projects: ptProjects, // Traduções da página de projetos
        timesheet: ptTimesheet, // Traduções do módulo de timesheets
        onboarding: ptOnboarding, // Traduções da página de onboarding
        feedback: ptFeedback, // Traduções do módulo de feedback
        notifications: ptNotifications, // Traduções do módulo de notificações
      },
      // Futuramente, adicione novos idiomas aqui:
      // en: {
      //   common: enCommon,
      //   login: enLogin,
      //   home: enHome,
      // },
    },

    // Idioma padrão (fallback) - usado quando uma tradução não é encontrada
    fallbackLng: 'pt',

    // Namespace padrão - usado quando não especificamos qual arquivo usar
    defaultNS: 'common',

    // Configurações de interpolação (substituição de variáveis nas strings)
    interpolation: {
      // Evita escapar caracteres especiais (React já faz isso)
      escapeValue: false,
    },
  });

export default i18n;
