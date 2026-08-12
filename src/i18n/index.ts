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
 *     en-GB/        <- Inglês (Reino Unido)
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
import ptMail from './locales/pt/mail.json';
import ptDocuments from './locales/pt/documents.json';

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
import enGBMail from './locales/en-GB/mail.json';
import enGBDocuments from './locales/en-GB/documents.json';

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
        mail: ptMail,
        documents: ptDocuments,
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
        mail: enGBMail,
        documents: enGBDocuments,
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
