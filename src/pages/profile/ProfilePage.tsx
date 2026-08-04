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
 * 1. Informações Pessoais e Profissionais (com avatar)
 * 2. Documentos Pessoais (logo após informações pessoais)
 * 3. Contato (telefones)
 * 4. Dados Bancários
 * 5. Certificações
 * 6. Idiomas
 *
 * LAYOUT:
 * -------
 * Utiliza o AppLayout (sidebar à esquerda).
 * ============================================================================
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Phone, Award, Globe, User, Mail, MapPin, Briefcase, FileText, CreditCard, Landmark, Pen } from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { ProfileSection, type FieldConfig, type FieldGroup } from '@/pages/home/components/ProfileSection';
import { PhoneNumberSection } from '@/pages/home/components/PhoneNumberSection';
import { CertificationSection } from '@/pages/home/components/CertificationSection';
import { LanguageSection } from '@/pages/home/components/LanguageSection';
import { DocumentSection } from '@/pages/home/components/DocumentSection';
import { BankAccountSection } from '@/pages/home/components/BankAccountSection';
import { AvatarUpload } from '@/pages/home/components/AvatarUpload';
import { Accordion } from '@/components/ui/Accordion';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { ProfileCompleteness } from '@/pages/home/components/ProfileCompleteness';
import { ProfileWizard } from '@/pages/home/components/ProfileWizard';

// Utilitários
import { shouldShowWizard } from '@/utils/profileCompleteness';

// Hooks
import { useProfileMutations } from './hooks/useProfileMutations';

// Serviços
import type { ProfileResponse } from '@/types/user.types';
import {
  getProfile,
  type PhoneNumber,
  type Certification,
  type Language,
  type UserDocument,
  type BankAccount,
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

  // Normaliza o número de telefone para remover o código do país,
  // pois o campo phone deve conter apenas o número local.
  const normalizedData = useMemo(() => {
    if (!data) return data;
    const normalized = { ...data };
    if (normalized.phone && normalized.phoneCountryCode) {
      const codeDigits = normalized.phoneCountryCode.replace(/\D/g, '');
      const phoneDigits = normalized.phone.replace(/\D/g, '');
      if (phoneDigits.startsWith(codeDigits) && phoneDigits.length > codeDigits.length) {
        normalized.phone = phoneDigits.slice(codeDigits.length);
      }
    }
    return normalized;
  }, [data]);

  const {
    profileMutation,
    phoneMutation,
    certMutation,
    langMutation,
    docMutation,
    bankMutation,
    signatureMutation,
  } = useProfileMutations();

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
    { key: 'email', label: t('profile.email'), type: 'email', category: 'contact' },
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
    { key: 'hireDate', label: t('profile.hireDate'), type: 'date', category: 'professional' },
    {
      key: 'role',
      label: t('profile.role'),
      category: 'professional',
      virtual: true,
      formatDisplay: (d) => {
        if (!d.role) return null;
        return t(`roles.${d.role}`);
      },
    },
    // Sobre
    { key: 'bio', label: t('profile.bio'), type: 'textarea', span: 2, category: 'about' },
  ];

  function handleSave(sectionData: Record<string, string | null>) {
    profileMutation.mutate(sectionData);
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

  async function handleAddDocument(data: Omit<UserDocument, 'id'>) {
    await docMutation.mutateAsync({ action: 'add', data });
  }
  async function handleUpdateDocument(id: string, data: Partial<UserDocument>) {
    await docMutation.mutateAsync({ action: 'update', id, data });
  }
  async function handleRemoveDocument(id: string) {
    await docMutation.mutateAsync({ action: 'remove', id });
  }

  async function handleAddBankAccount(data: Omit<BankAccount, 'id'>) {
    await bankMutation.mutateAsync({ action: 'add', data });
  }
  async function handleUpdateBankAccount(id: string, data: Partial<BankAccount>) {
    await bankMutation.mutateAsync({ action: 'update', id, data });
  }
  async function handleRemoveBankAccount(id: string) {
    await bankMutation.mutateAsync({ action: 'remove', id });
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
      {/* Cabeçalho com Avatar + Nome */}
      <div className="flex items-center gap-4 mb-6">
        <AvatarUpload
          currentPhotoUrl={data?.photoUrl}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
          compact
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('title')}, {data!.firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.position || data?.department || t('sections.personal.description')}
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      {data && shouldShowWizard(data as unknown as import('@/types/user.types').User) ? (
        /* MODO WIZARD - Assistente de configuração inicial */
        <ProfileWizard data={data as unknown as import('@/types/user.types').User} />
      ) : (
        /* MODO NORMAL - Visualização completa com seções editáveis */
        <div className="flex flex-col gap-6">
          {/* Progresso do Perfil (barra + checklist) */}
          {data && <ProfileCompleteness data={data as unknown as import('@/types/user.types').User} />}

          {/* 1. Informações Pessoais, Profissionais e Endereço */}
          <div id="section-personal">
            <ProfileSection
              title={t('sections.personal.title')}
              description={t('sections.personal.description')}
              fields={profileFields}
              groups={profileGroups}
              data={normalizedData as unknown as Record<string, string | null | undefined>}
              onSave={handleSave}
              isLoading={profileMutation.isPending}
            />
          </div>

          {/* 2. Documentos Pessoais */}
          <div id="section-documents">
            <Accordion
              title={t('documents.title')}
              icon={<CreditCard className="w-5 h-5 text-rose-600" />}
              defaultOpen={false}
            >
              <DocumentSection
                documents={(data?.documents || []) as unknown as UserDocument[]}
                onAdd={handleAddDocument}
                onUpdate={handleUpdateDocument}
                onRemove={handleRemoveDocument}
              />
            </Accordion>
          </div>

          {/* 3. Contato (telefones) */}
          <div id="section-phones">
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
          </div>

          {/* 4. Dados Bancários */}
          <div id="section-bank">
            <Accordion
              title={t('bankAccounts.title')}
              icon={<Landmark className="w-5 h-5 text-green-600" />}
              defaultOpen={false}
            >
              <BankAccountSection
                accounts={(data?.bankAccounts || []) as unknown as BankAccount[]}
                onAdd={handleAddBankAccount}
                onUpdate={handleUpdateBankAccount}
                onRemove={handleRemoveBankAccount}
              />
            </Accordion>
          </div>

          {/* 5. Certificações */}
          <div id="section-certifications">
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
          </div>

          {/* 6. Idiomas */}
          <div id="section-languages">
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

          {/* 7. Assinatura */}
          <div id="section-signature">
            <Accordion
              title={t('signatureSection.title')}
              icon={<Pen className="w-5 h-5 text-indigo-600" />}
              defaultOpen={false}
            >
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-4">
                  {t('signatureSection.description')}
                </p>
                <SignaturePad
                  initialValue={data?.signatureData}
                  height={160}
                  isSaving={signatureMutation.isPending}
                  onSave={(dataUrl) => {
                    signatureMutation.mutate({ action: 'save', data: dataUrl });
                    toast.success(t('common:signature.saved'));
                  }}
                  onClear={() => {
                    signatureMutation.mutate({ action: 'remove' });
                    toast.success(t('common:signature.removed'));
                  }}
                />
              </div>
            </Accordion>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
