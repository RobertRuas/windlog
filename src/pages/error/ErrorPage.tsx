/**
 * ============================================================================
 * ERROR PAGE - Página de Erro Estilo Programador Vintage
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página minimalista estilo terminal/programador vintage para exibir
 * mensagens de erro da aplicação de forma elegante e nostálgica.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. A mensagem de erro é passada via URL (search param ?msg=...)
 * 2. Se nenhuma mensagem for fornecida, exibe mensagem padrão
 * 3. Visual inspirado em terminais CRT antigos (fundo escuro, texto verde)
 * 4. Efeito de "scanline" para simular monitor vintage
 * 5. Cursor piscando para dar sensação "viva"
 *
 * ROTAS:
 * ------
 * - /error?msg=Token+n%C3%A3o+fornecido -> exibe a mensagem
 * - /error -> exibe mensagem padrão
 * ============================================================================
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * Mensagens de erro conhecidas e suas traduções amigáveis.
 * Mapeia mensagens da API para textos mais descritivos.
 */
const KNOWN_MESSAGES: Record<string, string> = {
  'Token não fornecido': 'Authentication token is missing. Please log in.',
  'Token expirado. Faça login novamente.': 'Session expired. Authentication required.',
  'Sessão expirada. Faça login novamente.': 'Your session has ended. Please sign in again.',
  'Link expirado ou inválido': 'This file link has expired or is no longer valid. Please go back and refresh the page to get a new link.',
  'Erro ao carregar ficheiro': 'An error occurred while loading the file. Please try again.',
};

/**
 * Componente ErrorPage - Página de erro estilo terminal vintage.
 *
 * Exibe a mensagem de erro com estética retro (fundo escuro,
 * texto verde fosforescente, efeito scanline, cursor piscando).
 */
export function ErrorPage() {
  // Lê a mensagem de erro dos parâmetros da URL
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mensagem bruta da URL (decodificada)
  const rawMessage = searchParams.get('msg') || 'Unknown error';

  // Traduz para mensagem amigável se for conhecida
  const message = KNOWN_MESSAGES[rawMessage] || rawMessage;

  // Determina o código de status baseado na mensagem
  const isFileError = rawMessage === 'Link expirado ou inválido' || rawMessage === 'Erro ao carregar ficheiro';
  const statusCode = isFileError ? '404' : '401';

  // Estado para o efeito de "typing" (digitação)
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Efeito de digitação caractere por caractere
  useEffect(() => {
    const fullText = `ERROR: ${message}`;
    let index = 0;
    setDisplayedText('');

    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 40); // 40ms por caractere

    return () => clearInterval(typeInterval);
  }, [message]);

  // Cursor piscante
  useEffect(() => {
    const blink = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(blink);
  }, []);

  /**
   * Redireciona para a página de login.
   */
  const handleGoToLogin = () => {
    navigate('/login');
  };

  /**
   * Tenta voltar para a página anterior.
   */
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  return (
    /* Container fullscreen com fundo escuro estilo terminal */
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Efeito scanline - simula linhas de monitor CRT */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
          zIndex: 1,
        }}
      />

      {/* Efeito de vinheta nas bordas (escurece os cantos) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)',
          zIndex: 1,
        }}
      />

      {/* Conteúdo principal */}
      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Header do "terminal" */}
        <div
          className="text-xs tracking-widest uppercase mb-8 opacity-40"
          style={{ color: '#00ff41', fontFamily: '"Courier New", Courier, monospace' }}
        >
          — windlog system —
        </div>

        {/* Caixa de erro estilo terminal */}
        <div
          className="border rounded-sm p-8 mb-8"
          style={{
            borderColor: '#00ff4133',
            backgroundColor: 'rgba(0, 255, 65, 0.02)',
          }}
        >
          {/* Código de status */}
          <div
            className="text-xs tracking-widest mb-4"
            style={{ color: '#00ff4180', fontFamily: '"Courier New", Courier, monospace' }}
          >
            STATUS: {statusCode}
          </div>

          {/* Separador */}
          <div
            className="mb-4"
            style={{ borderBottom: '1px solid #00ff4120' }}
          />

          {/* Mensagem de erro com efeito de digitação */}
          <div
            className="text-base leading-relaxed"
            style={{
              color: '#00ff41',
              fontFamily: '"Courier New", Courier, monospace',
              textShadow: '0 0 8px rgba(0, 255, 65, 0.4)',
            }}
          >
            <span>{'> '}</span>
            {displayedText}
            {/* Cursor piscante */}
            <span
              className="inline-block w-2 h-4 ml-0.5 align-middle"
              style={{
                backgroundColor: showCursor ? '#00ff41' : 'transparent',
                boxShadow: showCursor ? '0 0 6px rgba(0, 255, 65, 0.6)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Mensagem de rodapé do terminal */}
        <div
          className="text-xs mb-6 opacity-30"
          style={{ color: '#00ff41', fontFamily: '"Courier New", Courier, monospace' }}
        >
          Press a button to continue...
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-center gap-4">
          {/* Botão voltar */}
          <button
            onClick={handleGoBack}
            className="px-5 py-2 text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer"
            style={{
              color: '#00ff41',
              fontFamily: '"Courier New", Courier, monospace',
              border: '1px solid #00ff4140',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 65, 0.1)';
              e.currentTarget.style.borderColor = '#00ff41';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#00ff4140';
            }}
          >
            [ ← Back ]
          </button>

          {/* Botão login */}
          <button
            onClick={handleGoToLogin}
            className="px-5 py-2 text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer"
            style={{
              color: '#0a0a0a',
              fontFamily: '"Courier New", Courier, monospace',
              backgroundColor: '#00ff41',
              border: '1px solid #00ff41',
              boxShadow: '0 0 12px rgba(0, 255, 65, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 65, 0.3)';
            }}
          >
            [ Login → ]
          </button>
        </div>

        {/* Rodapé discreto */}
        <div
          className="mt-12 text-xs opacity-20"
          style={{ color: '#00ff41', fontFamily: '"Courier New", Courier, monospace' }}
        >
          WINDLOG v1.0 · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
