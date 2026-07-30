/**
 * ============================================================================
 * USE AUTH IMAGE - Hook para Carregar Imagens com Autenticação
 * ============================================================================
 *
 * O QUE É ESTE HOOK?
 * ------------------
 * Hook React que carrega uma imagem privada via API autenticada
 * e retorna uma blob URL para uso em <img src>.
 *
 * POR QUE BLOB URL?
 * -----------------
 * Tags <img src> NÃO enviam headers (Authorization).
 * Então fazemos fetch da imagem via api (com JWT no header),
 * criamos um Blob e geramos uma URL local (blob:http://...).
 *
 * USO:
 * ----
 * const imageUrl = useAuthImage(user.photoUrl);
 * return <img src={imageUrl} alt="Avatar" />;
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

/**
 * Carrega uma imagem privada via API e retorna uma blob URL.
 *
 * @param url - URL do ficheiro na API (ex: "/api/v1/upload/file/:id")
 *              ou URL antiga ("/api/v1/uploads/...")
 * @returns Blob URL para uso em <img src>, ou null se URL for inválida.
 */
export function useAuthImage(url: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    let cancelled = false;

    // Converte URL antiga para formato do endpoint
    let fetchUrl = url;
    if (url.includes('/api/v1/uploads/')) {
      const relativePath = url.replace('/api/v1/uploads/', '');
      fetchUrl = `/api/v1/upload/${relativePath}`;
    }

    // Busca a imagem via API autenticada e cria blob URL
    api.getBlob(fetchUrl).then((blob) => {
      if (!cancelled) {
        setBlobUrl(URL.createObjectURL(blob));
      }
    }).catch(() => {
      if (!cancelled) {
        setBlobUrl(null);
      }
    });

    // Limpa a blob URL ao desmontar (evita memory leak)
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
