/**
 * ============================================================================
 * USE FILE URL - Hook para Obter URLs Temporárias de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook React que usa TanStack Query para obter uma URL temporária
 * de acesso a um ficheiro, dado o seu filePath no servidor.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Recebe o filePath (caminho real no servidor)
 * 2. Faz POST para /api/v1/upload/temp-url com o filePath
 * 3. Retorna a URL temporária (/api/v1/files/{token})
 * 4. A URL é cacheada por 4 minutos (staleTime)
 * 5. Ao expirar, nova URL é pedida automaticamente
 *
 * POR QUE 4 MINUTOS DE CACHE?
 * ---------------------------
 * O token no backend tem TTL de 5 minutos. Cacheamos por 4 minutos
 * para garantir que a URL nunca é usada após expirar (margem de 1 min).
 *
 * EXEMPLO DE USO:
 * ---------------
 * const { url, isLoading } = useFileUrl(user.photoUrl);
 * <img src={url || '/placeholder.png'} />
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { getTempUrl, buildFileUrl } from '@/services/upload.service';

/**
 * Hook para obter uma URL temporária de acesso a um ficheiro.
 *
 * @param filePath - Caminho relativo do ficheiro no servidor (ex: "userId/avatars/uuid.jpg")
 *                   Se null ou vazio, retorna url: null sem fazer request.
 * @returns Objeto com:
 *   - url: URL temporária para usar em src/href (null se filePath vazio ou loading)
 *   - isLoading: se está a carregar a URL
 *   - error: erro se a requisição falhou
 *   - refetch: função para forçar nova URL
 */
export function useFileUrl(filePath: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    // Query key única por filePath — muda quando o filePath muda
    queryKey: ['file-url', filePath],

    // Função que pede a URL temporária ao backend
    queryFn: async () => {
      const response = await getTempUrl(filePath!);
      return buildFileUrl(response.data.token);
    },

    // Só faz query se filePath for uma string não vazia
    enabled: !!filePath,

    // Cache por 4 minutos (token expira em 5 min no backend)
    staleTime: 4 * 60 * 1000,

    // Não faz retry automático (evita gerar tokens desnecessários)
    retry: false,

    // Não refetch ao focar a janela (token ainda é válido)
    refetchOnWindowFocus: false,
  });

  return {
    /** URL temporária para usar em <img src> ou <a href>. Null se não disponível. */
    url: data ?? null,
    /** Se está a carregar a URL */
    isLoading: isLoading && !!filePath,
    /** Erro se a requisição falhou */
    error,
    /** Forçar pedido de nova URL */
    refetch,
  };
}
