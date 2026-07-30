/**
 * ============================================================================
 * SECURE IMAGE - Componente de Imagem com URL Temporária
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente <img> que usa o sistema de URLs temporárias para exibir
 * imagens de forma segura. O caminho real do ficheiro nunca é exposto
 * ao browser.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Recebe o filePath (caminho real no servidor)
 * 2. Usa useFileUrl hook para obter uma URL temporária
 * 3. Exibe a imagem usando a URL temporária
 * 4. Se o token expirar (erro na imagem), mostra um fallback
 *
 * EXEMPLO DE USO:
 * ---------------
 * <SecureImage
 *   filePath={user.photoUrl}
 *   alt="Foto do perfil"
 *   className="w-16 h-16 rounded-full"
 *   fallback="/default-avatar.png"
 * />
 * ============================================================================
 */

import { useState } from 'react';
import { useFileUrl } from '@/hooks/useFileUrl';

/**
 * Props do componente SecureImage.
 */
interface SecureImageProps {
  /** Caminho relativo do ficheiro no servidor (ex: "userId/avatars/uuid.jpg") */
  filePath: string | null | undefined;
  /** Texto alternativo da imagem */
  alt?: string;
  /** Classes CSS adicionais (Tailwind) */
  className?: string;
  /** URL da imagem de fallback (quando filePath é null ou erro) */
  fallback?: string;
  /** Largura da imagem (HTML) */
  width?: number | string;
  /** Altura da imagem (HTML) */
  height?: number | string;
}

/**
 * Imagem placeholder padrão (SVG inline minimalista).
 */
const DEFAULT_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

/**
 * Componente SecureImage — exibe imagens via URLs temporárias seguras.
 */
export function SecureImage({
  filePath,
  alt = '',
  className,
  fallback,
  width,
  height,
}: SecureImageProps) {
  // Obtém a URL temporária do hook
  const { url, isLoading } = useFileUrl(filePath);

  // Estado para controlar erro de carregamento da imagem
  const [hasError, setHasError] = useState(false);

  // Determina qual src usar
  const placeholder = fallback || DEFAULT_FALLBACK;
  const src = hasError || !filePath ? placeholder : url || placeholder;

  // Se está a carregar a URL, mostra placeholder
  if (isLoading) {
    return (
      <img
        src={placeholder}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={{ opacity: 0.5 }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setHasError(true)}
    />
  );
}
