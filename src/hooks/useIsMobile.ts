/**
 * ============================================================================
 * HOOK useIsMobile - Detecção de Dispositivo Móvel
 * ============================================================================
 *
 * O QUE É ESTE HOOK?
 * ------------------
 * Hook que detecta se o utilizador está num dispositivo móvel,
 * combinando duas estratégias para máxima fiabilidade:
 *
 * 1. User-Agent: detecta dispositivos móveis conhecidos (iOS, Android, etc.)
 * 2. Largura do ecrã: se < 768px, considera móvel
 *
 * POR QUÊ COMBINAR AS DUAS?
 * -------------------------
 * - Um telemóvel com ecrã grande em landscape pode ter > 768px
 *   mas continua a ser um telemóvel (touch, sem hover, etc.)
 * - Um browser redimensionado no PC pode ter < 768px mas não é
 *   um dispositivo móvel (tem mouse, hover, etc.)
 * - Combinar ambos garante que:
 *   → Telemóvel = sempre mobile (mesmo em landscape)
 *   → PC com janela estreita = também mobile (campos empilhados)
 *
 * UTILIZAÇÃO:
 * -----------
 * const isMobile = useIsMobile();
 * if (isMobile) { ... } // renderizar versão mobile
 * ============================================================================
 */

import { useState, useEffect } from 'react';

/**
 * Detecta se o User-Agent corresponde a um dispositivo móvel.
 * Cobre a grande maioria dos telemóveis e tablets.
 */
function detectMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Hook que retorna `true` se o dispositivo é móvel
 * (por User-Agent) OU se a largura do ecrã é < 768px.
 *
 * Atualiza automaticamente ao redimensionar a janela.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    return detectMobileUA() || window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(detectMobileUA() || window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
