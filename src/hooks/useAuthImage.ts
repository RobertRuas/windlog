/**
 * ============================================================================
 * USE AUTH IMAGE - Hook para Carregar Imagens com Autenticação
 * ============================================================================
 *
 * O QUE É ESTE HOOK?
 * ------------------
 * Hook React que retorna a URL de uma imagem com o token JWT incluído.
 * Usa a função getAuthFileUrl() para adicionar o token automaticamente.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O hook recebe uma URL (ex: "/api/v1/uploads/avatars/xxx.jpg")
 * 2. Adiciona o token JWT como query param via getAuthFileUrl()
 * 3. Retorna a URL completa para uso em <img src>
 * 4. Se a URL for null/undefined, retorna null
 *
 * USO:
 * ----
 * const imageUrl = useAuthImage('/api/v1/uploads/avatars/xxx.jpg');
 * return <img src={imageUrl} alt="Avatar" />;
 * ============================================================================
 */

import { useMemo } from 'react';
import { getAuthFileUrl } from '@/services/upload.service';

/**
 * Retorna a URL da imagem com o token JWT incluído.
 *
 * @param url - URL da imagem (ex: "/api/v1/uploads/avatars/xxx.jpg")
 *              Se null/undefined, retorna null imediatamente.
 * @returns URL com token (ex: "/api/v1/uploads/avatars/xxx.jpg?token=eyJ...")
 *          ou null se a URL for null/undefined.
 */
export function useAuthImage(url: string | null | undefined): string | null {
  // useMemo evita recalcular a URL em cada render
  return useMemo(() => {
    if (!url) return null;
    return getAuthFileUrl(url);
  }, [url]);
}
