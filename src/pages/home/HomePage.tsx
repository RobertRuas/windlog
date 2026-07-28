/**
 * ============================================================================
 * HOME PAGE - Página Inicial com Perfil Editável
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página inicial do sistema, exibida após o login.
 * Mostra os dados do usuário organizados em seções categorizadas,
 * cada uma com funcionalidade de edição inline.
 *
 * SEÇÕES DO PERFIL:
 * -----------------
 * 1. Informações Pessoais: nome, email, telefone, data nascimento, nacionalidade
 * 2. Endereço: endereço, cidade, código postal, país
 * 3. Informações Profissionais: departamento, cargo, biografia
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Usa TanStack Query para buscar e cache o perfil
 * 2. Cada seção tem seu próprio estado de edição
 * 3. Ao salvar, usa mutation do TanStack Query para atualizar
 * 4. Exibe toast de sucesso/erro usando Sonner
 * 5. Invalida o cache para recarregar os dados automaticamente
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LogOut, Wind } from 'lucide-react';

// Componentes
import { ProfileSection, type FieldConfig } from './components/ProfileSection';

// Serviços
import type { ProfileResponse } from '@/types/user.types';
import { getProfile, updateProfile, logout } from '@/services/auth.service';

/**
 * Componente HomePage - Página inicial com perfil editável.
 */
export function HomePage() {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();

  /**
   * Query para buscar o perfil do usuário.
   * Os dados são cacheados e reutilizados.
   */
  const { data, isLoading, isError } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  /**
   * Mutation para atualizar o perfil.
   * Após sucesso, invalida o cache para recarregar os dados.
   */
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Mostra toast de sucesso
      toast.success(t('feedback.success'));
      // Invalida o cache para recarregar o perfil
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      // Mostra toast de erro
      toast.error(t('feedback.error'));
    },
  });

  /**
   * Configuração dos campos da seção Pessoal.
   */
  const personalFields: FieldConfig[] = [
    { key: 'firstName', label: t('profile.firstName'), minLength: 2, required: true },
    { key: 'lastName', label: t('profile.lastName'), minLength: 2, required: true },
    { key: 'email', label: t('profile.email'), type: 'email' },
    { key: 'phone', label: t('profile.phone') },
    { key: 'phoneCountryCode', label: t('profile.phoneCountryCode') },
    { key: 'dateOfBirth', label: t('profile.dateOfBirth'), type: 'date' },
    { key: 'nationality', label: t('profile.nationality') },
  ];

  /**
   * Configuração dos campos da seção Endereço.
   */
  const addressFields: FieldConfig[] = [
    { key: 'address', label: t('profile.address') },
    { key: 'city', label: t('profile.city') },
    { key: 'postalCode', label: t('profile.postalCode') },
    { key: 'country', label: t('profile.country') },
  ];

  /**
   * Configuração dos campos da seção Profissional.
   */
  const professionalFields: FieldConfig[] = [
    { key: 'department', label: t('profile.department') },
    { key: 'position', label: t('profile.position') },
    { key: 'bio', label: t('profile.bio'), type: 'textarea' },
  ];

  /**
   * Função de logout - remove o token e redireciona.
   */
  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  /**
   * Handler genérico para salvar alterações de uma seção.
   */
  function handleSave(sectionData: Record<string, string | null>) {
    mutation.mutate(sectionData);
  }

  /**
   * Estado de loading.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t('common:status.loading')}</p>
      </div>
    );
  }

  /**
   * Estado de erro.
   */
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('common:status.error')}</p>
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline"
          >
            {t('common:buttons.logout')}
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renderiza a página com as seções do perfil.
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com logo e botão de logout */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="text-blue-600" size={24} />
            <span className="text-lg font-semibold text-gray-900">
              {t('common:app_name')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            {t('common:buttons.logout')}
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Título de boas-vindas */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('title')}, {data!.firstName}!
        </h1>

        {/* Seções do perfil */}
        <div className="flex flex-col gap-6">
          {/* Seção: Informações Pessoais */}
          <ProfileSection
            title={t('sections.personal.title')}
            description={t('sections.personal.description')}
            fields={personalFields}
            data={data as unknown as Record<string, string | null | undefined>}
            onSave={handleSave}
            isLoading={mutation.isPending}
          />

          {/* Seção: Endereço */}
          <ProfileSection
            title={t('sections.address.title')}
            description={t('sections.address.description')}
            fields={addressFields}
            data={data as unknown as Record<string, string | null | undefined>}
            onSave={handleSave}
            isLoading={mutation.isPending}
          />

          {/* Seção: Informações Profissionais */}
          <ProfileSection
            title={t('sections.professional.title')}
            description={t('sections.professional.description')}
            fields={professionalFields}
            data={data as unknown as Record<string, string | null | undefined>}
            onSave={handleSave}
            isLoading={mutation.isPending}
          />
        </div>
      </main>
    </div>
  );
}
