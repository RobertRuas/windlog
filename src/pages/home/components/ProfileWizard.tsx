/**
 * ============================================================================
 * PROFILE WIZARD - Assistente de Configuração do Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Wizard multi-step que guia o usuário no preenchimento das informações
 * essenciais do perfil. Exibido quando dados críticos estão em falta.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. Detecta automaticamente qual etapa o usuário precisa preencher
 * 2. Exibe uma etapa por vez com campos relevantes
 * 3. Permite pular etapas não-obrigatórias
 * 4. Avança automaticamente após salvar com sucesso
 * 5. Quando tudo essencial está preenchido, converte para modo normal
 *
 * ETAPAS (por ordem de importância):
 * -----------------------------------
 * 1. Identidade - data nascimento, nacionalidade
 * 2. Contato - número de telefone
 * 3. Localização - país, cidade, endereço, código postal
 * 4. Profissional - departamento, cargo, data contratação
 * 5. Documentos - passaporte (OBRIGATÓRIO, não pode pular)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Check,
  Sparkles,
} from 'lucide-react';

// Serviços
import { updateProfile, addPhone, addDocument } from '@/services/auth.service';
import type { User as UserType } from '@/types/user.types';

// Constantes
import { PREDEFINED_COUNTRIES } from '@/constants/countries';

// Utilitários
import { shouldShowWizard, getWizardStep } from '@/utils/profileCompleteness';

/**
 * Definição de cada passo do wizard.
 */
const WIZARD_STEPS = [
  { id: 'identity', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'contact', icon: Phone, color: 'text-sky-600', bg: 'bg-sky-100' },
  { id: 'location', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'professional', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-100' },
  { id: 'documents', icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-100' },
] as const;

interface ProfileWizardProps {
  data: UserType;
}

/**
 * Componente ProfileWizard - Assistente multi-step para configuração do perfil.
 */
export function ProfileWizard({ data }: ProfileWizardProps) {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => getWizardStep(data));
  const [showCompletion, setShowCompletion] = useState(false);

  // Estados do formulário por step
  const [identityData, setIdentityData] = useState({
    dateOfBirth: data.dateOfBirth?.split('T')[0] || '',
    nationality: data.nationality || '',
  });
  const [phoneData, setPhoneData] = useState({
    countryCode: '+351',
    number: '',
    type: 'mobile',
  });
  const [locationData, setLocationData] = useState({
    address: data.address || '',
    city: data.city || '',
    postalCode: data.postalCode || '',
    country: data.country || '',
  });
  const [professionalData, setProfessionalData] = useState({
    department: data.department || '',
    position: data.position || '',
    hireDate: data.hireDate?.split('T')[0] || '',
  });
  const [documentData, setDocumentData] = useState({
    documentNumber: '',
    issuingCountry: '',
    expiryDate: '',
  });

  // Atualiza o step atual quando os dados mudam (ex: após salvar)
  useEffect(() => {
    const nextStep = getWizardStep(data);
    if (nextStep !== currentStep && nextStep !== 'identity') {
      setCurrentStep(nextStep);
    }
  }, [data]);

  // Verifica se o wizard deve ser fechado
  useEffect(() => {
    if (!shouldShowWizard(data)) {
      setShowCompletion(true);
      const timer = setTimeout(() => {
        // Wizard será removido pelo ProfilePage
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const stepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const currentStepDef = WIZARD_STEPS[stepIndex];
  const CurrentIcon = currentStepDef.icon;
  const totalSteps = WIZARD_STEPS.length;

  // O passaporte é obrigatório - não pode pular
  const canSkip = currentStep !== 'documents';

  /**
   * Invalida queries para atualizar dados.
   */
  function refreshData() {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  /**
   * Avança para o próximo passo ou conclui.
   */
  function goNext() {
    if (stepIndex < totalSteps - 1) {
      // Encontra o próximo step não-completo
      for (let i = stepIndex + 1; i < totalSteps; i++) {
        const stepId = WIZARD_STEPS[i].id;
        const stepData = getWizardStep(data);
        if (stepId === stepData) {
          setCurrentStep(stepId);
          return;
        }
      }
      // Se todos os seguintes estão completos, vai para o primeiro pendente
      setCurrentStep(getWizardStep(data));
    }
  }

  /**
   * Volta ao passo anterior.
   */
  function goPrevious() {
    if (stepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[stepIndex - 1].id);
    }
  }

  /**
   * Salva dados de identidade.
   */
  async function handleSaveIdentity() {
    setIsSaving(true);
    try {
      await updateProfile({
        dateOfBirth: identityData.dateOfBirth || undefined,
        nationality: identityData.nationality || undefined,
      } as Partial<UserType>);
      toast.success(t('feedback.success'));
      refreshData();
      goNext();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Salva telefone.
   */
  async function handleSavePhone() {
    if (!phoneData.number.trim()) return;
    setIsSaving(true);
    try {
      await addPhone({
        countryCode: phoneData.countryCode,
        number: phoneData.number,
        type: phoneData.type,
        isPrimary: true,
      });
      toast.success(t('feedback.success'));
      refreshData();
      goNext();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Salva localização.
   */
  async function handleSaveLocation() {
    setIsSaving(true);
    try {
      await updateProfile({
        address: locationData.address || undefined,
        city: locationData.city || undefined,
        postalCode: locationData.postalCode || undefined,
        country: locationData.country || undefined,
      } as Partial<UserType>);
      toast.success(t('feedback.success'));
      refreshData();
      goNext();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Salva dados profissionais.
   */
  async function handleSaveProfessional() {
    setIsSaving(true);
    try {
      await updateProfile({
        department: professionalData.department || undefined,
        position: professionalData.position || undefined,
        hireDate: professionalData.hireDate || undefined,
      } as Partial<UserType>);
      toast.success(t('feedback.success'));
      refreshData();
      goNext();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Salva passaporte.
   */
  async function handleSaveDocument() {
    if (!documentData.documentNumber.trim()) return;
    setIsSaving(true);
    try {
      await addDocument({
        type: 'PASSPORT',
        documentNumber: documentData.documentNumber,
        issuingCountry: documentData.issuingCountry || undefined,
        expiryDate: documentData.expiryDate || undefined,
      });
      toast.success(t('feedback.success'));
      refreshData();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Pula a etapa atual.
   */
  function handleSkip() {
    if (!canSkip) return;
    goNext();
  }

  /**
   * Renderiza o conteúdo do step atual.
   */
  function renderStepContent() {
    switch (currentStep) {
      case 'identity':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.dateOfBirth')}</label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={identityData.dateOfBirth}
                  onChange={(e) => setIdentityData({ ...identityData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.nationality')}</label>
                <select
                  className="form-select w-full"
                  value={identityData.nationality}
                  onChange={(e) => setIdentityData({ ...identityData, nationality: e.target.value })}
                >
                  <option value="">{t('validation.selectOption', { defaultValue: 'Selecione...' })}</option>
                  {PREDEFINED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">{t('phones.countryCode')}</label>
                <select
                  className="form-select w-full"
                  value={phoneData.countryCode}
                  onChange={(e) => setPhoneData({ ...phoneData, countryCode: e.target.value })}
                >
                  {PREDEFINED_COUNTRIES.map((c) => (
                    <option key={c.phoneCode} value={c.phoneCode}>
                      {c.phoneCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">{t('phones.number')}</label>
                <input
                  type="tel"
                  className="form-input w-full"
                  value={phoneData.number}
                  onChange={(e) => setPhoneData({ ...phoneData, number: e.target.value })}
                  placeholder="912345678"
                />
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">{t('profile.address')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={locationData.address}
                  onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.city')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={locationData.city}
                  onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.postalCode')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={locationData.postalCode}
                  onChange={(e) => setLocationData({ ...locationData, postalCode: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">{t('profile.country')}</label>
                <select
                  className="form-select w-full"
                  value={locationData.country}
                  onChange={(e) => setLocationData({ ...locationData, country: e.target.value })}
                >
                  <option value="">{t('validation.selectOption', { defaultValue: 'Selecione...' })}</option>
                  {PREDEFINED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.department')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={professionalData.department}
                  onChange={(e) => setProfessionalData({ ...professionalData, department: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.position')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={professionalData.position}
                  onChange={(e) => setProfessionalData({ ...professionalData, position: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.hireDate')}</label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={professionalData.hireDate}
                  onChange={(e) => setProfessionalData({ ...professionalData, hireDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            {/* Aviso de obrigatoriedade */}
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <CreditCard size={16} className="text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-700">{t('wizard.passportRequired')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('documents.documentNumber')}</label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={documentData.documentNumber}
                  onChange={(e) => setDocumentData({ ...documentData, documentNumber: e.target.value })}
                  placeholder="AB123456"
                />
              </div>
              <div>
                <label className="form-label">{t('documents.issuingCountry')}</label>
                <select
                  className="form-select w-full"
                  value={documentData.issuingCountry}
                  onChange={(e) => setDocumentData({ ...documentData, issuingCountry: e.target.value })}
                >
                  <option value="">{t('validation.selectOption', { defaultValue: 'Selecione...' })}</option>
                  {PREDEFINED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('documents.expiryDate')}</label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={documentData.expiryDate}
                  onChange={(e) => setDocumentData({ ...documentData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
    }
  }

  // Tela de conclusão
  if (showCompletion) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-emerald-900 mb-2">
          {t('wizard.allDone')}
        </h2>
        <p className="text-emerald-700">
          {t('wizard.allDoneDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header com saudação */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t('wizard.welcome')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('wizard.subtitle')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {t('wizard.step', { current: stepIndex + 1, total: totalSteps })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === stepIndex;
            const isPast = index < stepIndex;
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isActive
                      ? `${step.bg} ring-2 ring-offset-1 ring-blue-300`
                      : isPast
                        ? 'bg-emerald-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {isPast ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <StepIcon size={16} className={isActive ? step.color : 'text-gray-400'} />
                  )}
                </div>
                {/* Barra de conexão */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                    isPast ? 'bg-emerald-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Label do step atual */}
        <div className="mt-3 flex items-center gap-2">
          <CurrentIcon size={16} className={currentStepDef.color} />
          <span className="text-sm font-medium text-gray-700">
            {t(`wizard.steps.${currentStep}`)}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            — {t(`wizard.descriptions.${currentStep}`)}
          </span>
        </div>
      </div>

      {/* Conteúdo do Step */}
      <div className="px-6 py-5">
        {renderStepContent()}
      </div>

      {/* Footer com navegação */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {/* Esquerda: Voltar + Pular */}
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              onClick={goPrevious}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              {t('wizard.previous')}
            </button>
          )}
          {canSkip && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SkipForward size={14} />
              {t('wizard.skip')}
            </button>
          )}
        </div>

        {/* Direita: Salvar/Continuar */}
        <button
          onClick={() => {
            switch (currentStep) {
              case 'identity': handleSaveIdentity(); break;
              case 'contact': handleSavePhone(); break;
              case 'location': handleSaveLocation(); break;
              case 'professional': handleSaveProfessional(); break;
              case 'documents': handleSaveDocument(); break;
            }
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('actions.saving')}
            </>
          ) : (
            <>
              {stepIndex === totalSteps - 1 ? t('wizard.finish') : t('wizard.next')}
              {stepIndex < totalSteps - 1 && <ArrowRight size={14} />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
