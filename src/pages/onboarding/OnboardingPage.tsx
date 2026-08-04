/**
 * ============================================================================
 * ONBOARDING PAGE - Página de Onboarding Obrigatório
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Exibida quando o usuário faz login pela primeira vez (ou quando o perfil
 * ainda não está completo). O usuário é obrigado a preencher todos os dados
 * essenciais antes de acessar o sistema.
 *
 * FLUXO:
 * ------
 * 1. Admin cria usuário com senha temporária
 * 2. Usuário faz login → troca a senha temporária
 * 3. Sistema detecta profileComplete: false
 * 4. Redireciona para esta página
 * 5. Usuário preenche todos os dados obrigatórios
 * 6. Sistema marca profileComplete: true
 * 7. Usuário é redirecionado para a home
 *
 * SECÇÕES:
 * --------
 * - Dados Pessoais (nome, sobrenome, nacionalidade, data de nascimento ≥18)
 * - Passaporte (número, país emissor, data emissão, validade)
 * - Contato (email, código país + telefone separados)
 * - Localização (endereço, cidade, código postal, país)
 * - Idioma Materno (apenas idioma materno)
 * - Aeroporto Preferido (cidade, país)
 * - Dados Profissionais (WINDA ID, IRATA nível, IRATA número)
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserCircle, Plane, Globe, MapPin, Phone, FileText, Briefcase, Loader2 } from 'lucide-react';

// Componentes compartilhados
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { SectionCard } from '@/components/ui/SectionCard';

// Constantes
import { PREDEFINED_COUNTRIES } from '@/constants/countries';
import { PREDEFINED_LANGUAGES } from '@/constants/languages';

// Hook personalizado com toda a lógica do formulário
import { useOnboardingForm } from './hooks/useOnboardingForm';

/**
 * Componente OnboardingPage - Formulário obrigatório de onboarding.
 * A lógica de estado/validação/submissão está no hook useOnboardingForm.
 */
export function OnboardingPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const form = useOnboardingForm();

  // Estado de carregamento enquanto busca dados do perfil
  if (form.isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <UserCircle className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Aviso informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">{t('info')}</p>
        </div>

        {/* Formulário */}
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* === DADOS PESSOAIS === */}
          <SectionCard icon={<UserCircle size={18} />} title={t('sections.personal')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.firstName.label')}
                value={form.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFirstName(e.target.value)}
                placeholder={t('fields.firstName.placeholder')}
                required
              />
              <Input
                label={t('fields.lastName.label')}
                value={form.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setLastName(e.target.value)}
                placeholder={t('fields.lastName.placeholder')}
                required
              />
              <Select
                label={t('fields.nationality.label')}
                value={form.nationality}
                onChange={(e) => form.setNationality(e.target.value)}
                required
              >
                <option value="">{t('fields.nationality.placeholder')}</option>
                {PREDEFINED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
              <div className="flex flex-col gap-1">
                <label className="form-label">{t('fields.dateOfBirth.label')}</label>
                <DatePicker
                  value={form.dateOfBirth}
                  onChange={form.setDateOfBirth}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                <span className="text-xs text-gray-400">{t('fields.dateOfBirth.hint')}</span>
              </div>
            </div>
          </SectionCard>

          {/* === PASSAPORTE === */}
          <SectionCard icon={<FileText size={18} />} title={t('sections.passport')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.passportNumber.label')}
                value={form.passportNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPassportNumber(e.target.value)}
                placeholder={t('fields.passportNumber.placeholder')}
                required
              />
              <Select
                label={t('fields.passportIssuingCountry.label')}
                value={form.passportIssuingCountry}
                onChange={(e) => form.setPassportIssuingCountry(e.target.value)}
                required
              >
                <option value="">{t('fields.passportIssuingCountry.placeholder')}</option>
                {PREDEFINED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
              <div className="flex flex-col gap-1">
                <label className="form-label">{t('fields.passportIssueDate.label')}</label>
                <DatePicker value={form.passportIssueDate} onChange={form.setPassportIssueDate} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="form-label">{t('fields.passportExpiryDate.label')}</label>
                <DatePicker value={form.passportExpiryDate} onChange={form.setPassportExpiryDate} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mt-1">
                  📎 {t('fields.passportFile.label')}: {t('fields.passportFile.hint')}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* === CONTATO === */}
          <SectionCard icon={<Phone size={18} />} title={t('sections.contact')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.email.label')}
                type="email"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setEmail(e.target.value)}
                placeholder={t('fields.email.placeholder')}
                required
              />
              <div className="flex gap-1">
                  <select
                    value={form.phoneCountryCode}
                    onChange={(e) => form.setPhoneCountryCode(e.target.value)}
                    className="form-select w-20 flex-shrink-0"
                    required
                  >
                    <option value="">{t('fields.phoneCountryCode.placeholder')}</option>
                    {PREDEFINED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.phoneCode}>{c.phoneCode}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPhone(e.target.value)}
                    placeholder={t('fields.phone.placeholder')}
                    className="form-input flex-1 min-w-0"
                    required
                  />
                </div>
            </div>
          </SectionCard>

          {/* === LOCALIZAÇÃO === */}
          <SectionCard icon={<MapPin size={18} />} title={t('sections.location')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={t('fields.address.label')}
                  value={form.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setAddress(e.target.value)}
                  placeholder={t('fields.address.placeholder')}
                  required
                />
              </div>
              <Input
                label={t('fields.city.label')}
                value={form.city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setCity(e.target.value)}
                placeholder={t('fields.city.placeholder')}
                required
              />
              <Input
                label={t('fields.postalCode.label')}
                value={form.postalCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPostalCode(e.target.value)}
                placeholder={t('fields.postalCode.placeholder')}
                required
              />
              <Select
                label={t('fields.country.label')}
                value={form.country}
                onChange={(e) => form.setCountry(e.target.value)}
                required
              >
                <option value="">{t('fields.country.placeholder')}</option>
                {PREDEFINED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
          </SectionCard>

          {/* === IDIOMA MATERNO === */}
          <SectionCard icon={<Globe size={18} />} title={t('sections.motherTongue')}>
            <Select
              label={t('fields.motherTongue.label')}
              value={form.motherTongue}
              onChange={(e) => form.setMotherTongue(e.target.value)}
              required
            >
              <option value="">{t('fields.motherTongue.placeholder')}</option>
              {PREDEFINED_LANGUAGES.map(l => (
                <option key={l.code} value={l.name}>{l.name} ({l.nativeName})</option>
              ))}
            </Select>
          </SectionCard>

          {/* === AEROPORTO PREFERIDO === */}
          <SectionCard icon={<Plane size={18} />} title={t('sections.airport')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.preferredAirportCity.label')}
                value={form.preferredAirportCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setPreferredAirportCity(e.target.value)}
                placeholder={t('fields.preferredAirportCity.placeholder')}
                required
              />
              <Select
                label={t('fields.preferredAirportCountry.label')}
                value={form.preferredAirportCountry}
                onChange={(e) => form.setPreferredAirportCountry(e.target.value)}
                required
              >
                <option value="">{t('fields.preferredAirportCountry.placeholder')}</option>
                {PREDEFINED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
          </SectionCard>

          {/* === DADOS PROFISSIONAIS === */}
          <SectionCard icon={<Briefcase size={18} />} title={t('sections.professional')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('fields.windaId.label')}
                value={form.windaId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setWindaId(e.target.value)}
                placeholder={t('fields.windaId.placeholder')}
                required
              />
              <Select
                label={t('fields.irataLevel.label')}
                value={form.irataLevel}
                onChange={(e) => {
                  form.setIrataLevel(e.target.value);
                  if (e.target.value === 'NOT_APPLICABLE') {
                    form.setIrataNumber('NOT_APPLICABLE');
                  } else if (form.irataNumber === 'NOT_APPLICABLE') {
                    form.setIrataNumber('');
                  }
                }}
                required
              >
                <option value="">{t('fields.irataLevel.placeholder')}</option>
                <option value="L1">{t('irataOptions.L1')}</option>
                <option value="L2">{t('irataOptions.L2')}</option>
                <option value="L3">{t('irataOptions.L3')}</option>
                <option value="NOT_APPLICABLE">{t('irataOptions.NOT_APPLICABLE')}</option>
              </Select>
              <Input
                label={t('fields.irataNumber.label')}
                value={form.irataNumber === 'NOT_APPLICABLE' ? t('irataNumberOptions.notApplicable') : form.irataNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setIrataNumber(e.target.value)}
                placeholder={t('fields.irataNumber.placeholder')}
                disabled={form.irataLevel === 'NOT_APPLICABLE'}
                required
              />
            </div>
          </SectionCard>

          {/* Mensagem de erro */}
          {form.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {form.error}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={form.isLoading} className="w-full">
              {form.isLoading ? t('submitting') : t('submit')}
            </Button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login');
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
