/**
 * ============================================================================
 * SECURE FILE LINK - Componente de Link com URL Temporária
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente <a> que usa o sistema de URLs temporárias para fornecer
 * acesso seguro a ficheiros (download ou visualização).
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Recebe o filePath (caminho real no servidor)
 * 2. Usa useFileUrl hook para obter uma URL temporária
 * 3. Renderiza um <a> com a URL temporária
 * 4. Se o filePath for null, renderiza texto "Sem ficheiro"
 *
 * EXEMPLO DE USO:
 * ---------------
 * <SecureFileLink
 *   filePath={cert.filePath}
 *   fileName="certificado.pdf"
 *   className="text-blue-600"
 * />
 * ============================================================================
 */

import { useFileUrl } from '@/hooks/useFileUrl';

/**
 * Props do componente SecureFileLink.
 */
interface SecureFileLinkProps {
  /** Caminho relativo do ficheiro no servidor */
  filePath: string | null | undefined;
  /** Nome do ficheiro para exibir no link */
  fileName?: string;
  /** Classes CSS adicionais (Tailwind) */
  className?: string;
  /** Se true, abre numa nova aba */
  openInNewTab?: boolean;
}

/**
 * Componente SecureFileLink — link seguro para acesso a ficheiros.
 */
export function SecureFileLink({
  filePath,
  fileName,
  className = 'text-blue-600 hover:text-blue-800 underline',
  openInNewTab = true,
}: SecureFileLinkProps) {
  // Obtém a URL temporária do hook
  const { url, isLoading } = useFileUrl(filePath);

  // Se não há filePath, mostra texto indicador
  if (!filePath) {
    return (
      <span className="text-gray-400 text-sm italic">
        No file attached
      </span>
    );
  }

  // Se está a carregar, mostra indicador
  if (isLoading) {
    return (
      <span className="text-gray-400 text-sm animate-pulse">
        Loading...
      </span>
    );
  }

  // Se não conseguiu obter URL (erro), mostra mensagem
  if (!url) {
    return (
      <span className="text-red-400 text-sm">
        File unavailable
      </span>
    );
  }

  // Nome para exibição (usa fileName ou extrai do filePath)
  const displayName = fileName || filePath.split('/').pop() || 'Download';

  return (
    <a
      href={url}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={className}
      title={displayName}
    >
      {displayName}
    </a>
  );
}
