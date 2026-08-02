/**
 * ============================================================================
 * HOOK: useTimesheetZoom
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook personalizado para controlar o zoom da planilha de timesheet.
 * Permite aumentar/diminuir a escala visual da planilha.
 *
 * COMO FUNCIONA?
 * --------------
 * - Mantém o valor de zoom no estado do React
 * - Persiste no localStorage para manter a preferência do usuário
 * - Limites: mínimo 50% (0.5) e máximo 150% (1.5)
 * - Incremento/decremento de 10% (0.1) por clique
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react';

/** Chave do localStorage para persistir o zoom */
const ZOOM_STORAGE_KEY = 'windlog_timesheet_zoom';

/** Valor mínimo de zoom (50%) */
const MIN_ZOOM = 0.5;

/** Valor máximo de zoom (150%) */
const MAX_ZOOM = 1.5;

/** Incremento por clique (10%) */
const ZOOM_STEP = 0.1;

/**
 * Hook useTimesheetZoom - Controla o zoom da planilha.
 *
 * @returns Objeto com: zoom, zoomIn, zoomOut, zoomPercent
 */
export function useTimesheetZoom() {
  // Carrega o zoom salvo no localStorage ou usa 100% (1.0)
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
        return parsed;
      }
    }
    return 1.0;
  });

  // Persiste no localStorage quando o zoom muda
  useEffect(() => {
    localStorage.setItem(ZOOM_STORAGE_KEY, zoom.toString());
  }, [zoom]);

  /**
   * Aumenta o zoom em 10% (máximo 150%).
   */
  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = parseFloat((prev + ZOOM_STEP).toFixed(1));
      return next <= MAX_ZOOM ? next : prev;
    });
  }, []);

  /**
   * Diminui o zoom em 10% (mínimo 50%).
   */
  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = parseFloat((prev - ZOOM_STEP).toFixed(1));
      return next >= MIN_ZOOM ? next : prev;
    });
  }, []);

  /**
   * Retorna o zoom em porcentagem para exibição (ex: "100%").
   */
  const zoomPercent = `${Math.round(zoom * 100)}%`;

  return { zoom, zoomIn, zoomOut, zoomPercent };
}
