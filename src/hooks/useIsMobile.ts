/**
 * ============================================================================
 * USE IS MOBILE - Hook de deteção de modo mobile
 * ============================================================================
 *
 * O QUE É ESTE HOOK?
 * ------------------
 * Determina se a aplicação deve renderizar a versão mobile (nativa)
 * ou a versão PC, combinando DOIS critérios:
 *
 * 1. DISPOSITIVO — análise do User-Agent (telemóvel/tablet).
 * 2. LARGURA DO ECRÃ — abaixo da largura mínima (768px) é sempre mobile,
 *    mesmo que o User-Agent pareça desktop (ex.: janela estreita).
 *
 * REGRA FINAL:
 * ------------
 * - Largura < 768px → mobile (independentemente do dispositivo)
 * - Largura >= 768px + dispositivo móvel → mobile (telemóvel/tablet
 *   em modo paisagem continua com experiência nativa)
 * - Largura >= 768px + desktop → PC (layout preservado exatamente)
 *
 * O estado é reativo: atualiza em tempo real ao redimensionar a janela.
 * ============================================================================
 */

import { useEffect, useState } from 'react';

/** Largura mínima (px) para considerar modo PC */
export const MOBILE_MAX_WIDTH = 767;

/**
 * Deteta se o dispositivo é móvel através do User-Agent.
 * Cobre Android, iPhone, iPad, Windows Phone e afins.
 */
function detectMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
    navigator.userAgent,
  );
}

/**
 * Calcula se o modo mobile deve estar ativo neste momento.
 */
function computeIsMobile(): boolean {
  const width = window.innerWidth;

  // Ecrã pequeno → sempre mobile (independentemente do dispositivo)
  if (width <= MOBILE_MAX_WIDTH) return true;

  // Ecrã maior → mobile apenas se o dispositivo for telemóvel/tablet
  return detectMobileDevice();
}

/**
 * Hook useIsMobile — indica se a aplicação deve usar o modo mobile.
 *
 * Reage ao redimensionamento da janela (ex.: telemóvel em paisagem,
 * janela do browser estreitada, etc.).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(computeIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(computeIsMobile());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
