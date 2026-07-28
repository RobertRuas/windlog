/**
 * ============================================================================
 * PROFILE PAGE - Página de Perfil do Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página de perfil do usuário, exibida na rota /profile.
 * Mostra os dados do usuário organizados em seções categorizadas,
 * cada uma com funcionalidade de edição inline.
 *
 * SEÇÕES DO PERFIL:
 * -----------------
 * 1. Informações Pessoais e Profissionais (unificada)
 * 2. Números de Telefone (acordeão)
 * 3. Certificações (acordeão)
 * 4. Idiomas (acordeão)
 *
 * LAYOUT:
 * -------
 * Utiliza o AppLayout (sidebar à esquerda).
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Phone, Award, Globe, User, Mail, MapPin, Briefcase, FileText } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { ProfileSection, type FieldConfig, type FieldGroup } from '@/pages/home/components/ProfileSection';
import { PhoneNumberSection } from '@/pages/home/components/PhoneNumberSection';
import { CertificationSection } from '@/pages/home/components/CertificationSection';
import { LanguageSection } from '@/pages/home/components/LanguageSection';
import { Accordion } from '@/components/ui/Accordion';

// Serviços
import type { ProfileResponse } from '@/types/user.types';
import {
  getProfile,
  updateProfile,
  addPhone,
  updatePhone,
  removePhone,
  addCertification,
  updateCertification,
  removeCertification,
  addLanguage,
  updateLanguage,
  removeLanguage,
  type PhoneNumber,
  type Certification,
  type Language,
} from '@/services/auth.service';

// Constantes
import { PREDEFINED_COUNTRIES } from '@/constants/countries';

/**
 * Componente ProfilePage - Página de perfil com layout sidebar.
 */
export function ProfilePage() {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const phoneMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<PhoneNumber, 'id'> | Partial<PhoneNumber> }) => {
      if (action === 'add') return addPhone(data as Omit<PhoneNumber, 'id'>);
      if (action === 'update') return updatePhone(id!, data as Partial<PhoneNumber>);
      return removePhone(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const certMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<Certification, 'id'> | Partial<Certification> }) => {
      if (action === 'add') return addCertification(data as Omit<Certification, 'id'>);
      if (action === 'update') return updateCertification(id!, data as Partial<Certification>);
      return removeCertification(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const langMutation = useMutation({
    mutationFn: async ({ action, id, data }: { action: 'add' | 'update' | 'remove'; id?: string; data?: Omit<Language, 'id'> | Partial<Language> }) => {
      if (action === 'add') return addLanguage(data as Omit<Language, 'id'>);
      if (action === 'update') return updateLanguage(id!, data as Partial<Language>);
      return removeLanguage(id!);
    },
    onSuccess: () => {
      toast.success(t('feedback.success'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      toast.error(t('feedback.error'));
    },
  });

  const countryOptions = PREDEFINED_COUNTRIES.map((c: { code: string; name: string }) => ({
    value: c.code,
    label: c.name,
  }));

  const phoneCodeOptions = PREDEFINED_COUNTRIES.map((c: { phoneCode: string; name: string }) => ({
    value: c.phoneCode,
    label: `${c.phoneCode} - ${c.name}`,
  }));

  const profileGroups: FieldGroup[] = [
    { id: 'identity', label: t('groups.identity'), icon: User },
    { id: 'contact', label: t('groups.contact'), icon: Mail },
    { id: 'location', label: t('groups.location'), icon: MapPin },
    { id: 'professional', label: t('groups.professional'), icon: Briefcase },
    { id: 'about', label: t('groups.about'), icon: FileText },
  ];

  const profileFields: FieldConfig[] = [
    // Identidade
    { key: 'firstName', label: t('profile.firstName'), minLength: 2, required: true, category: 'identity' },
    { key: 'lastName', label: t('profile.lastName'), minLength: 2, required: true, category: 'identity' },
    { key: 'dateOfBirth', label: t('profile.dateOfBirth'), type: 'date', category: 'identity' },
    {
      key: 'nationality',
      label: t('profile.nationality'),
      type: 'select',
      options: countryOptions,
      category: 'identity',
      formatDisplay: (d) => {
        if (!d.nationality) return null;
        return PREDEFINED_COUNTRIES.find((c) => c.code === d.nationality)?.name ?? d.nationality;
      },
    },
    // Contato
    { key: 'email', label: t('profile.email'), type: 'email', span: 2, category: 'contact' },
    {
      key: 'fullPhone',
      label: t('profile.phone'),
      category: 'contact',
      virtual: true,
      formatDisplay: (d) => {
        if (!d.phone) return null;
        return d.phoneCountryCode ? `${d.phoneCountryCode} ${d.phone}` : d.phone;
      },
    },
    { key: 'phoneCountryCode', label: t('profile.phoneCountryCode'), type: 'select', options: phoneCodeOptions, category: 'contact', hideInView: true },
    { key: 'phone', label: t('profile.phone'), category: 'contact', hideInView: true },
    // Localização
    {
      key: 'fullAddress',
      label: t('profile.address'),
      category: 'location',
      span: 2,
      virtual: true,
      formatDisplay: (d) => {
        const parts = [d.address, d.city, d.postalCode, d.country ? PREDEFINED_COUNTRIES.find((c) => c.code === d.country)?.name ?? d.country : null].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
      },
    },
    { key: 'address', label: t('profile.address'), span: 2, category: 'location', hideInView: true },
    { key: 'city', label: t('profile.city'), category: 'location', hideInView: true },
    { key: 'postalCode', label: t('profile.postalCode'), category: 'location', hideInView: true },
    { key: 'country', label: t('profile.country'), type: 'select', options: countryOptions, category: 'location', hideInView: true },
    // Profissional
    { key: 'department', label: t('profile.department'), category: 'professional' },
    { key: 'position', label: t('profile.position'), category: 'professional' },
    // Sobre
    { key: 'bio', label: t('profile.bio'), type: 'textarea', span: 2, category: 'about' },
  ];

  function handleSave(sectionData: Record<string, string | null>) {
    mutation.mutate(sectionData);
  }

  async function handleAddPhone(data: Omit<PhoneNumber, 'id'>) {
    await phoneMutation.mutateAsync({ action: 'add', data });
  }
  async function handleUpdatePhone(id: string, data: Partial<PhoneNumber>) {
    await phoneMutation.mutateAsync({ action: 'update', id, data });
  }
  async function handleRemovePhone(id: string) {
    await phoneMutation.mutateAsync({ action: 'remove', id });
  }

  async function handleAddCertification(data: Omit<Certification, 'id'>) {
    await certMutation.mutateAsync({ action: 'add', data });
  }
  async function handleUpdateCertification(id: string, data: Partial<Certification>) {
    await certMutation.mutateAsync({ action: 'update', id, data });
  }
  async function handleRemoveCertification(id: string) {
    await certMutation.mutateAsync({ action: 'remove', id });
  }

  async function handleAddLanguage(data: Omit<Language, 'id'>) {
    await langMutation.mutateAsync({ action: 'add', data });
  }
  async function handleUpdateLanguage(id: string, data: Partial<Language>) {
    await langMutation.mutateAsync({ action: 'update', id, data });
  }
  async function handleRemoveLanguage(id: string) {
    await langMutation.mutateAsync({ action: 'remove', id });
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">{t('common:status.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-red-600">{t('common:status.error')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Título da página */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('title')}, {data!.firstName}!
      </h1>

      {/* Seções do perfil */}
      <div className="flex flex-col gap-6">
        {/* Informações Pessoais, Profissionais e Endereço */}
        <ProfileSection
          title={t('sections.personal.title')}
          description={t('sections.personal.description')}
          fields={profileFields}
          groups={profileGroups}
          data={data as unknown as Record<string, string | null | undefined>}
          onSave={handleSave}
          isLoading={mutation.isPending}
        />

        {/* Números de Telefone */}
        <Accordion
          title={t('phones.title')}
          icon={<Phone className="w-5 h-5 text-blue-600" />}
          defaultOpen={false}
        >
          <PhoneNumberSection
            phones={(data?.phoneNumbers || []) as unknown as PhoneNumber[]}
            onAdd={handleAddPhone}
            onUpdate={handleUpdatePhone}
            onRemove={handleRemovePhone}
          />
        </Accordion>

        {/* Certificações */}
        <Accordion
          title={t('certifications.title')}
          icon={<Award className="w-5 h-5 text-purple-600" />}
          defaultOpen={false}
        >
          <CertificationSection
            certifications={(data?.certifications || []) as unknown as Certification[]}
            onAdd={handleAddCertification}
            onUpdate={handleUpdateCertification}
            onRemove={handleRemoveCertification}
          />
        </Accordion>

        {/* Idiomas */}
        <Accordion
          title={t('languages.title')}
          icon={<Globe className="w-5 h-5 text-green-600" />}
          defaultOpen={false}
        >
          <LanguageSection
            languages={(data?.languages || []) as unknown as Language[]}
            onAdd={handleAddLanguage}
            onUpdate={handleUpdateLanguage}
            onRemove={handleRemoveLanguage}
          />
        </Accordion>
      </div>
    </AppLayout>
  );
}
