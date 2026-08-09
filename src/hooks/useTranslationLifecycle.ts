/**
 * ============================================================================
 * USE TRANSLATION LIFECYCLE - Ciclo de Vida do Modelo de Tradução
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook React que gerencia o ciclo de vida do modelo de tradução no backend:
 * aquece-o quando a página/formulário traduzível é ABERTO e o descarrega
 * quando é FECHADO (desmontado). Assim o modelo só consome recursos enquanto
 * é realmente necessário.
 *
 * COMO USAR?
 * ----------
 * Basta chamar este hook UMA VEZ no topo do formulário traduzível:
 *
 *   export function MeuFormulario() {
 *     useTranslationLifecycle(); // aquece ao abrir, descarrega ao sair
 *     ...
 *   }
 *
 * QUANDO ATUA?
 * ------------
 * Apenas quando o idioma da interface é português. Em qualquer outro idioma
 * o recurso de tradução não é necessário, então nada é carregado.
 * ============================================================================
 */

import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { warmUpTranslationModel, unloadTranslationModel } from '@/services/translation.service';

/**
 * Gerencia o ciclo de vida do modelo de tradução para a página atual.
 *
 * - No mount (idioma pt): chama /warmup para carregar o modelo em memória,
 *   garantindo que a primeira sugestão apareça sem atraso.
 * - No unmount: chama /unload (fire-and-forget) para liberar os recursos.
 */
export function useTranslationLifecycle(): void {
  const { settings } = useSettings();

  /** Recurso ativo apenas quando o idioma da interface é português. */
  const enabled = settings.language === 'pt';

  useEffect(() => {
    // Em idiomas diferentes de português o modelo não é necessário.
    if (!enabled) return;

    // Aquece o modelo assim que a página/formulário é aberto.
    // Falhas são silenciosas: a tradução simplesmente ficará indisponível.
    warmUpTranslationModel().catch(() => {
      /* silencioso — o recurso é opcional e não deve bloquear a UI */
    });

    // Ao sair da página/formulário, descarrega o modelo para liberar recursos.
    return () => {
      unloadTranslationModel().catch(() => {
        /* fire-and-forget — não é crítico para a experiência do usuário */
      });
    };
  }, [enabled]);
}
