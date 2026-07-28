/**
 * ============================================================================
 * MAIN.TSX - Ponto de Entrada da Aplicação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este é o ponto de entrada do React. É o primeiro arquivo executado
 * quando a aplicação carrega no navegador.
 *
 * O QUE ELE FAZ?
 * --------------
 * 1. Importa o componente raiz (App)
 * 2. Importa os estilos globais (CSS)
 * 3. Renderiza o App no elemento HTML com id="root" (do index.html)
 *
 * POR QUE <StrictMode>?
 * ---------------------
 * O StrictMode do React ajuda a encontrar problemas no código:
 * - Detecta uso de APIs deprecated
 * - Previne efeitos colaterais inesperados
 * - Em desenvolvimento, renderiza componentes duas vezes para
 *   ajudar a encontrar bugs de state
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Importa os estilos globais (Tailwind CSS + customizações)
import './index.css';

// Importa o componente raiz da aplicação
import App from './App';

/**
 * Renderiza a aplicação React no elemento DOM com id="root".
 *
 * createRoot(): cria a raiz do React (React 18+)
 * <StrictMode>: ativa verificações de desenvolvimento
 * <App />: componente raiz que contém toda a aplicação
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
