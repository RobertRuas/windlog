/**
 * ============================================================================
 * USE AUTH IMAGE - Hook para Carregar Imagens Protegidas por JWT
 * ============================================================================
 *
 * O QUE É ESTE HOOK?
 * ------------------
 * Hook React que busca imagens de rotas protegidas por autenticação JWT
 * e as converte em blob URLs para uso em tags <img>.
 *
 * POR QUE PRECISAMOS DESTE HOOK?
 * ------------------------------
 * A tag <img src="/api/v1/uploads/..."> faz uma requisição GET simples
 * que NÃO envia headers personalizados (como Authorization: Bearer <token>).
 * Como os ficheiros de upload são protegidos por JWT no backend, a requisição
 * seria rejeitada com 401 Unauthorized.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O hook recebe uma URL relativa (ex: "/api/v1/uploads/avatars/xxx.jpg")
 * 2. Faz fetch() com o header Authorization (token do localStorage)
 * 3. Converte a resposta em blob
 * 4. Cria um blob URL (ex: "blob:http://localhost:5173/abc-123")
 * 5. Retorna o blob URL para uso no <img src>
 * 6. Faz cleanup automático (revokeObjectURL) ao desmontar ou mudar a URL
 *
 * USO:
 * ----
 * const blobUrl = useAuthImage('/api/v1/uploads/avatars/xxx.jpg');
 * return <img src={blobUrl} alt="Avatar" />;
 * ============================================================================
 */

import { useState, useEffect } from 'react';

/**
 * Busca uma imagem protegida por JWT e retorna um blob URL.
 *
 * @param url - URL relativa da imagem (ex: "/api/v1/uploads/avatars/xxx.jpg")
 *              Se null/undefined, retorna null imediatamente.
 * @returns Blob URL da imagem (ex: "blob:http://localhost:5173/abc-123")
 *          ou null se a imagem não pôde ser carregada.
 */
export function useAuthImage(url: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Se não há URL, limpa o blob URL anterior
    if (!url) {
      setBlobUrl(null);
      return;
    }

    // Flag para evitar atualizar estado após desmontagem
    let cancelled = false;
    // Captura o valor (TypeScript narrow: neste ponto url é string)
    const imageUrl = url!;

    async function fetchImage() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (!cancelled) setBlobUrl(null);
        return;
      }

      try {
        const response = await fetch(imageUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (!cancelled) setBlobUrl(null);
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setBlobUrl(objectUrl);
        } else {
          // Componente desmontou antes do fetch completar - limpa o blob
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    }

    fetchImage();

    // Cleanup: revoga o blob URL anterior ao desmontar ou mudar a URL
    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [url]);

  return blobUrl;
}
