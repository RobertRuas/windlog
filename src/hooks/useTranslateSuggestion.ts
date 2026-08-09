/**
 * ============================================================================
 * USE TRANSLATE SUGGESTION - Hook de Tradução sob Demanda (PT -> EN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook React reutilizável que oferece tradução para inglês em campos de texto
 * livre, de forma controlada pelo usuário (sem traduções automáticas em
 * tempo real):
 *
 *   1. Quando o campo possui texto, o hook sinaliza que o botão
 *      "Traduzir para inglês" pode ser exibido abaixo dele.
 *   2. Ao clicar, o texto é enviado ao backend (POST /translation/translate)
 *      e o resultado substitui o conteúdo do campo.
 *   3. Após aplicar, o hook guarda o texto original e oferece a opção de
 *      REVERTER, restaurando o que o usuário havia digitado.
 *
 * SUPRESSÃO DE TEXTO JÁ EM INGLÊS (custo zero):
 * ---------------------------------------------
 * Se o usuário digitar um texto que já está em inglês, o modelo devolve um
 * resultado praticamente idêntico à entrada. O hook compara a similaridade
 * entre o texto original e a tradução recebida: se forem quase iguais, a
 * tradução não é aplicada e o botão deixa de ser oferecido para esse texto.
 *
 * QUANDO FICA INATIVO?
 * --------------------
 * Se o idioma da interface NÃO for português (settings.language !== 'pt'),
 * o hook não faz nenhuma requisição e não oferece o recurso.
 *
 * EXEMPLO DE USO:
 * ---------------
 * const translation = useTranslateSuggestion(day.progress, (v) =>
 *   handleProgressChange(dayIdx, v),
 * );
 *
 * <TranslateSuggestion
 *   showPrompt={translation.showPrompt}
 *   isTranslating={translation.isTranslating}
 *   canRevert={translation.canRevert}
 *   onTranslate={translation.translate}
 *   onRevert={translation.revert}
 * />
 * ============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { translateText } from '@/services/translation.service';

/** Tamanho mínimo do texto para valer a pena traduzir. */
const MIN_LENGTH = 3;

/**
 * Similaridade (0 a 1) acima da qual consideramos que a tradução é
 * praticamente idêntica ao original => o texto já estava em inglês.
 */
const SIMILARITY_THRESHOLD = 0.85;

/* ==========================================================================
   Funções auxiliares de comparação de textos
   ========================================================================== */

/** Normaliza o texto para comparação: minúsculas, sem pontuação, espaços únicos. */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula a similaridade entre dois textos (0 a 1) comparando as palavras.
 * É uma heurística leve e suficiente para detectar quando o modelo devolveu
 * praticamente o mesmo texto (sinal de que a entrada já estava em inglês).
 */
function textSimilarity(a: string, b: string): number {
  const wordsA = normalizeText(a).split(' ').filter(Boolean);
  const wordsB = normalizeText(b).split(' ').filter(Boolean);

  if (wordsA.length === 0 && wordsB.length === 0) return 1;
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setB = new Set(wordsB);
  const common = wordsA.filter((word) => setB.has(word)).length;
  return common / Math.max(wordsA.length, wordsB.length);
}

/* ==========================================================================
   Hook
   ========================================================================== */

/**
 * Hook que disponibiliza a tradução PT -> EN sob demanda para um campo.
 *
 * @param currentValue - Valor atual do campo observado.
 * @param onChange     - Função do componente pai para gravar o novo valor
 *                       no campo (usada para aplicar e para reverter).
 * @returns Objeto com:
 *   - enabled:       se o recurso está ativo (idioma é português)
 *   - showPrompt:    se o botão "Traduzir para inglês" deve ser exibido
 *   - isTranslating: se uma tradução está em andamento
 *   - canRevert:     se há texto original guardado para reverter
 *   - translate():   pede a tradução ao backend e aplica no campo
 *   - revert():      restaura o texto original digitado pelo usuário
 */
export function useTranslateSuggestion(
  currentValue: string,
  onChange: (value: string) => void,
) {
  const { settings } = useSettings();

  /** Recurso ativo apenas quando o idioma da interface é português. */
  const enabled = settings.language === 'pt';

  /** Se uma tradução está sendo processada no momento. */
  const [isTranslating, setIsTranslating] = useState(false);

  /** Texto original (antes da tradução) — null quando não há como reverter. */
  const [originalText, setOriginalText] = useState<string | null>(null);

  /** Último valor gravado pelo próprio hook (aplicar/reverter). */
  const appliedTextRef = useRef<string>(currentValue);

  /** Contador de requisições — descarta respostas atrasadas (stale). */
  const requestIdRef = useRef(0);

  /** Texto cujo botão foi suprimido (já estava em inglês ou a chamada falhou). */
  const skippedForRef = useRef<string | null>(null);

  // Se o usuário editar manualmente o campo após aplicar a tradução, o texto
  // original deixa de corresponder à realidade — descartamos a possibilidade
  // de reverter (o conteúdo agora é do usuário, não mais da tradução).
  useEffect(() => {
    if (originalText !== null && currentValue !== appliedTextRef.current) {
      setOriginalText(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  const trimmed = currentValue.trim();

  /** Há texto original guardado => estamos no estado "traduzido" com revert. */
  const canRevert = originalText !== null;

  /**
   * O botão de traduzir aparece quando: recurso ativo, campo preenchido,
   * sem tradução aplicada no momento e sem supressão prévia para este texto.
   */
  const showPrompt =
    enabled
    && !canRevert
    && trimmed.length >= MIN_LENGTH
    && trimmed !== skippedForRef.current;

  /**
   * Pede a tradução ao backend e aplica o resultado no campo.
   * Se a tradução retornar quase idêntica à entrada (texto já em inglês),
   * nada é aplicado e o botão deixa de ser oferecido para este texto.
   */
  const translate = useCallback(async () => {
    const text = currentValue.trim();
    if (!text || isTranslating) return;

    const requestId = ++requestIdRef.current;
    setIsTranslating(true);

    try {
      const translated = await translateText(text);

      // Descarta resposta atrasada (o usuário pode ter agido novamente).
      if (requestId !== requestIdRef.current) return;

      // Supressão: tradução ~= original => o texto já estava em inglês.
      if (textSimilarity(text, translated) >= SIMILARITY_THRESHOLD) {
        skippedForRef.current = text;
        return;
      }

      // Guarda o original (permite reverter) e aplica a tradução no campo.
      appliedTextRef.current = translated;
      setOriginalText(currentValue);
      onChange(translated);
    } catch {
      // Falha silenciosa: o botão some para este texto (não insiste).
      skippedForRef.current = text;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsTranslating(false);
      }
    }
  }, [currentValue, isTranslating, onChange]);

  /**
   * Reverte o campo para o texto original digitado pelo usuário.
   */
  const revert = useCallback(() => {
    if (originalText === null) return;
    appliedTextRef.current = originalText;
    onChange(originalText);
    setOriginalText(null);
  }, [originalText, onChange]);

  return { enabled, showPrompt, isTranslating, canRevert, translate, revert };
}
