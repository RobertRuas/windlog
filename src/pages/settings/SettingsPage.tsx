/**
 * ============================================================================
 * SETTINGS PAGE - Página de Configurações
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página simples de configurações do sistema.
 * Inclui atalhos para funcionalidades administrativas como consulta de logs.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Atalho para consulta de logs do sistema
 * - Layout limpo e organizado por secções
 *
 * SEGURANÇA:
 * ----------
 * - Requer autenticação (rota protegida)
 * - Secção de logs visível apenas para ADMIN
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import { FileText, Shield, ChevronRight } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

/**
 * Verifica se o usuário atual tem role ADMIN.
 */
function isAdmin(): boolean {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Componente SettingsPage - Página de configurações.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const admin = isAdmin();

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie as opções do sistema
        </p>
      </div>

      {/* Secções */}
      <div className="space-y-4">
        {/* Secção: Administração */}
        {admin && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">Administração</h2>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Logs do Sistema */}
              <button
                onClick={() => navigate('/logs')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={18} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Logs do Sistema</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Consultar todas as ações registradas no sistema
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Mensagem para não-admin */}
        {!admin && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              Nenhuma configuração disponível para o seu perfil.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
