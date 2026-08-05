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

// English (UK)
import enGBCommon from './locales/en-GB/common.json';
import enGBLogin from './locales/en-GB/login.json';
import enGBHome from './locales/en-GB/home.json';
import enGBLogs from './locales/en-GB/logs.json';
import enGBSettings from './locales/en-GB/settings.json';
import enGBUsers from './locales/en-GB/users.json';
import enGBProjects from './locales/en-GB/projects.json';
import enGBTimesheet from './locales/en-GB/timesheet.json';
import enGBOnboarding from './locales/en-GB/onboarding.json';
import enGBFeedback from './locales/en-GB/feedback.json';
import enGBNotifications from './locales/en-GB/notifications.json';

// Spanish
import esCommon from './locales/es/common.json';
import esLogin from './locales/es/login.json';
import esHome from './locales/es/home.json';
import esLogs from './locales/es/logs.json';
import esSettings from './locales/es/settings.json';
import esUsers from './locales/es/users.json';
import esProjects from './locales/es/projects.json';
import esTimesheet from './locales/es/timesheet.json';
import esOnboarding from './locales/es/onboarding.json';
import esFeedback from './locales/es/feedback.json';
import esNotifications from './locales/es/notifications.json';

// German
import deCommon from './locales/de/common.json';
import deLogin from './locales/de/login.json';
import deHome from './locales/de/home.json';
import deLogs from './locales/de/logs.json';
import deSettings from './locales/de/settings.json';
import deUsers from './locales/de/users.json';
import deProjects from './locales/de/projects.json';
import deTimesheet from './locales/de/timesheet.json';
import deOnboarding from './locales/de/onboarding.json';
import deFeedback from './locales/de/feedback.json';
import deNotifications from './locales/de/notifications.json';

// Finnish
import fiCommon from './locales/fi/common.json';
import fiLogin from './locales/fi/login.json';
import fiHome from './locales/fi/home.json';
import fiLogs from './locales/fi/logs.json';
import fiSettings from './locales/fi/settings.json';
import fiUsers from './locales/fi/users.json';
import fiProjects from './locales/fi/projects.json';
import fiTimesheet from './locales/fi/timesheet.json';
import fiOnboarding from './locales/fi/onboarding.json';
import fiFeedback from './locales/fi/feedback.json';
import fiNotifications from './locales/fi/notifications.json';

// Lithuanian
import ltCommon from './locales/lt/common.json';
import ltLogin from './locales/lt/login.json';
import ltHome from './locales/lt/home.json';
import ltLogs from './locales/lt/logs.json';
import ltSettings from './locales/lt/settings.json';
import ltUsers from './locales/lt/users.json';
import ltProjects from './locales/lt/projects.json';
import ltTimesheet from './locales/lt/timesheet.json';
import ltOnboarding from './locales/lt/onboarding.json';
import ltFeedback from './locales/lt/feedback.json';
import ltNotifications from './locales/lt/notifications.json';

/**
 * Inicializa o i18next com as configurações do projeto.
 */
i18n
  .use(initReactI18next) // Integra o i18next com o React (hooks)
  .init({
    // Recursos (traduções) disponíveis
    resources: {
      pt: {
        common: ptCommon,
        login: ptLogin,
        home: ptHome,
        logs: ptLogs,
        settings: ptSettings,
        users: ptUsers,
        projects: ptProjects,
        timesheet: ptTimesheet,
        onboarding: ptOnboarding,
        feedback: ptFeedback,
        notifications: ptNotifications,
      },
      'en-GB': {
        common: enGBCommon,
        login: enGBLogin,
        home: enGBHome,
        logs: enGBLogs,
        settings: enGBSettings,
        users: enGBUsers,
        projects: enGBProjects,
        timesheet: enGBTimesheet,
        onboarding: enGBOnboarding,
        feedback: enGBFeedback,
        notifications: enGBNotifications,
      },
      es: {
        common: esCommon,
        login: esLogin,
        home: esHome,
        logs: esLogs,
        settings: esSettings,
        users: esUsers,
        projects: esProjects,
        timesheet: esTimesheet,
        onboarding: esOnboarding,
        feedback: esFeedback,
        notifications: esNotifications,
      },
      de: {
        common: deCommon,
        login: deLogin,
        home: deHome,
        logs: deLogs,
        settings: deSettings,
        users: deUsers,
        projects: deProjects,
        timesheet: deTimesheet,
        onboarding: deOnboarding,
        feedback: deFeedback,
        notifications: deNotifications,
      },
      fi: {
        common: fiCommon,
        login: fiLogin,
        home: fiHome,
        logs: fiLogs,
        settings: fiSettings,
        users: fiUsers,
        projects: fiProjects,
        timesheet: fiTimesheet,
        onboarding: fiOnboarding,
        feedback: fiFeedback,
        notifications: fiNotifications,
      },
      lt: {
        common: ltCommon,
        login: ltLogin,
        home: ltHome,
        logs: ltLogs,
        settings: ltSettings,
        users: ltUsers,
        projects: ltProjects,
        timesheet: ltTimesheet,
        onboarding: ltOnboarding,
        feedback: ltFeedback,
        notifications: ltNotifications,
      },
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
