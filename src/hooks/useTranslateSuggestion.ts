/**
 * ============================================================================
 * USE TRANSLATE SUGGESTION - Hook de Sugestão de Tradução (PT -> EN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook React reutilizável que observa o texto de um campo e, quando o usuário
 * para de digitar, pede ao backend uma tradução para inglês e a expõe como
 * sugestão.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Recebe o valor atual do campo (string)
 * 2. Aguarda o usuário pausar a digitação (~800 ms de debounce)
 * 3. Envia o texto ao backend (POST /translation/translate)
 * 4. Expõe a tradução como "suggestion" para o componente exibir
 *
 * POR QUE DEBOUNCE + CONTROLE DE REQUISIÇÃO?
 * ------------------------------------------
 * - Debounce evita traduzir a cada tecla (economia de recursos).
 * - Um contador de requisição descarta respostas "atrasadas" (stale) que
 *   chegarem depois que o usuário já voltou a digitar.
 *
 * QUANDO FICA INATIVO?
 * --------------------
 * Se o idioma da interface NÃO for português (settings.language !== 'pt'),
 * o hook não faz nenhuma requisição e não exibe sugestão.
 *
 * EXEMPLO DE USO:
 * ---------------
 * const { suggestion, isLoading, apply, dismiss, enabled } =
 *   useTranslateSuggestion(day.progress);
 *
 * <TranslateSuggestion
 *   suggestion={suggestion}
 *   isLoading={isLoading}
 *   onApply={() => handleProgressChange(dayIdx, apply())}
 *   onDismiss={dismiss}
 * />
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { translateText } from '@/services/translation.service';

/** Tempo (ms) que o usuário precisa ficar sem digitar antes de traduzir. */
const DEBOUNCE_MS = 800;

/** Tamanho mínimo do texto para valer a pena traduzir. */
const MIN_LENGTH = 3;

/**
 * Hook que gera uma sugestão de tradução (PT -> EN) para um campo de texto.
 *
 * @param currentValue - Valor atual do campo observado.
 * @returns Objeto com:
 *   - enabled:     se o recurso está ativo (idioma é português)
 *   - suggestion:  texto traduzido sugerido (null se não houver)
 *   - isLoading:   se uma tradução está em andamento
 *   - apply():     retorna a sugestão e evita re-traduzir o texto aplicado
 *   - dismiss():   dispensa a sugestão atual (não reoferece o mesmo texto)
 */
export function useTranslateSuggestion(currentValue: string) {
  const { settings } = useSettings();

  /** Recurso ativo apenas quando o idioma da interface é português. */
  const enabled = settings.language === 'pt';

  /** Sugestão de tradução atual (null quando não há). */
  const [suggestion, setSuggestion] = useState<string | null>(null);

  /** Se uma tradução está sendo processada. */
  const [isLoading, setIsLoading] = useState(false);

  /** Contador de requisições — descarta respostas atrasadas (stale). */
  const requestIdRef = useRef(0);

  /** Referência ao timer de debounce para poder cancelá-lo. */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Último texto que já foi traduzido (evita retraduzir o mesmo texto). */
  const lastTranslatedRef = useRef<string | null>(null);

  /** Texto cuja sugestão foi dispensada (evita reoferecer a mesma sugestão). */
  const dismissedForRef = useRef<string | null>(null);

  useEffect(() => {
    // Sempre que o usuário digita (valor muda), escondemos a sugestão anterior
    // para que ela não fique "sobrando" com conteúdo desatualizado.
    setSuggestion(null);

    // Se o recurso não está ativo (idioma diferente de pt), não fazemos nada.
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const text = currentValue.trim();

    // Cancela qualquer debounce anterior (o usuário voltou a digitar).
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Texto muito curto: não vale a pena traduzir.
    if (text.length < MIN_LENGTH) {
      setIsLoading(false);
      return;
    }

    // Já traduzimos (ou o usuário dispensou) exatamente este texto: não repete.
    if (text === lastTranslatedRef.current || text === dismissedForRef.current) {
      setIsLoading(false);
      return;
    }

    // Agenda a tradução após a pausa na digitação.
    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);

      translateText(text)
        .then((translated) => {
          // Aplica apenas se esta ainda for a requisição mais recente.
          if (requestId === requestIdRef.current) {
            lastTranslatedRef.current = text;
            setSuggestion(translated);
          }
        })
        .catch(() => {
          // Falha silenciosa: o usuário simplesmente não vê a sugestão.
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    // Limpeza: cancela o debounce se o valor mudar ou o componente desmontar.
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [currentValue, enabled]);

  /**
   * Aplica a sugestão: retorna o texto traduzido para o componente pai gravar
   * no campo e marca-o como "já tratado" para não re-traduzir o resultado.
   */
  const apply = useCallback((): string => {
    const text = suggestion ?? '';
    if (text) {
      // Quando o valor do campo se tornar esta tradução, não a re-traduzimos.
      lastTranslatedRef.current = text;
    }
    setSuggestion(null);
    return text;
  }, [suggestion]);

  /**
   * Dispensa a sugestão atual e evita reoferecê-la para o mesmo texto.
   */
  const dismiss = useCallback(() => {
    dismissedForRef.current = lastTranslatedRef.current;
    setSuggestion(null);
    setIsLoading(false);
  }, []);

  return { enabled, suggestion, isLoading, apply, dismiss };
}
