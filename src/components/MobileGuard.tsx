/**
 * ============================================================================
 * MOBILE GUARD - Proteção contra acesso em dispositivos móveis
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que impede o acesso à aplicação quando o utilizador está
 * num dispositivo com ecrã pequeno (telemóvel ou tablet pequeno).
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Monitoriza a largura da janela em tempo real (resize listener).
 * 2. Se a largura for inferior ao breakpoint definido (1024px),
 *    exibe uma tela cheia com mensagem amigável.
 * 3. Caso contrário, renderiza normalmente os children (a aplicação).
 *
 * POR QUÊ?
 * --------
 * O Windlog foi desenhado para PC. A interface não é responsiva e
 * a experiência em ecrãs pequenos seria prejudicada.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Largura mínima permitida (breakpoint md do Tailwind — exclui apenas telemóveis) */
const MIN_WIDTH = 768;

/**
 * Hook que monitoriza se a janela tem largura suficiente para a aplicação.
 * Atualiza o estado em tempo real ao redimensionar a janela.
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= MIN_WIDTH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}

/**
 * Componente MobileGuard - envolve a aplicação e bloqueia acesso em mobile.
 *
 * @param children - conteúdo da aplicação a renderizar quando em desktop
 */
export function MobileGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');
  const isDesktop = useIsDesktop();

  // Se está em desktop, renderiza a aplicação normalmente
  if (isDesktop) {
    return <>{children}</>;
  }

  // Ecrã pequeno: exibe tela cheia com mensagem amigável
  return (
    <div className="mobile-guard">
      <div className="mobile-guard__icon">
        {/* Ícone de monitor (desktop) */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>

      <h1 className="mobile-guard__title">
        {t('mobileGuard.title')}
      </h1>

      <p className="mobile-guard__description">
        {t('mobileGuard.description')}
      </p>

      <p className="mobile-guard__hint">
        {t('mobileGuard.hint')}
      </p>
    </div>
  );
}
