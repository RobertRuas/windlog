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
 * - Dados Pessoais (nome, sobrenome, nacionalidade, data de nascimento)
 * - Passaporte (número, país emissor, data emissão, validade)
 * - Contato (email, telefone)
 * - Localização (endereço)
 * - Idiomas (pelo menos um idioma com nível)
 * - Aeroporto Preferido (cidade, país)
 * - Dados Profissionais (WINDA ID, IRATA nível, IRATA número)
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UserCircle, Plane, GraduationCap, Globe, MapPin, Phone, FileText, Briefcase } from 'lucide-react';

// Componentes compartilhados
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';

// Constantes
import { PREDEFINED_COUNTRIES } from '@/constants/countries';
import { PREDEFINED_LANGUAGES } from '@/constants/languages';

// Serviço de autenticação
import { submitOnboarding } from '@/services/auth.service';

/**
 * Interface para uma entrada de idioma no formulário.
 */
interface LanguageEntry {
  language: string;
  level: string;
}

/**
 * Níveis de proficiência de idiomas (escala CEFR).
 */
const LANGUAGE_LEVELS = ['NATIVE', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'];

/**
 * Componente OnboardingPage - Formulário obrigatório de onboarding.
 */
export function OnboardingPage() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // === DADOS PESSOAIS ===
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // === PASSAPORTE ===
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssuingCountry, setPassportIssuingCountry] = useState('');
  const [passportIssueDate, setPassportIssueDate] = useState('');
  const [passportExpiryDate, setPassportExpiryDate] = useState('');

  // === CONTATO ===
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // === LOCALIZAÇÃO ===
  const [address, setAddress] = useState('');

  // === IDIOMAS ===
  const [languages, setLanguages] = useState<LanguageEntry[]>([
    { language: '', level: '' },
  ]);

  // === AEROPORTO PREFERIDO ===
  const [preferredAirportCity, setPreferredAirportCity] = useState('');
  const [preferredAirportCountry, setPreferredAirportCountry] = useState('');

  // === DADOS PROFISSIONAIS ===
  const [windaId, setWindaId] = useState('');
  const [irataLevel, setIrataLevel] = useState('');
  const [irataNumber, setIrataNumber] = useState('');

  /**
   * Adiciona uma nova entrada de idioma.
   */
  function addLanguage() {
    setLanguages([...languages, { language: '', level: '' }]);
  }

  /**
   * Remove uma entrada de idioma.
   */
  function removeLanguage(index: number) {
    if (languages.length <= 1) return; // Pelo menos um idioma
    setLanguages(languages.filter((_, i) => i !== index));
  }

  /**
   * Atualiza um campo de um idioma.
   */
  function updateLanguage(index: number, field: keyof LanguageEntry, value: string) {
    setLanguages(languages.map((lang, i) =>
      i === index ? { ...lang, [field]: value } : lang
    ));
  }

  /**
   * Submete o formulário de onboarding.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    // Validações básicas
    if (!firstName || !lastName || !nationality || !dateOfBirth) {
      setError(t('errors.requiredField'));
      return;
    }
    if (!passportNumber || !passportIssuingCountry || !passportIssueDate || !passportExpiryDate) {
      setError(t('errors.requiredField'));
      return;
    }
    if (!email || !phone) {
      setError(t('errors.requiredField'));
      return;
    }
    if (!address) {
      setError(t('errors.requiredField'));
      return;
    }
    if (languages.some(l => !l.language || !l.level)) {
      setError(t('errors.minLanguages'));
      return;
    }
    if (!preferredAirportCity || !preferredAirportCountry) {
      setError(t('errors.requiredField'));
      return;
    }
    if (!windaId || !irataLevel || !irataNumber) {
      setError(t('errors.requiredField'));
      return;
    }

    // Converte data de nascimento de DD/MM/YYYY para ISO
    const dobIso = convertToIso(dateOfBirth);
    const issueDateIso = convertToIso(passportIssueDate);
    const expiryDateIso = convertToIso(passportExpiryDate);

    if (!dobIso || !issueDateIso || !expiryDateIso) {
      setError(t('errors.requiredField'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await submitOnboarding({
        firstName,
        lastName,
        nationality,
        dateOfBirth: dobIso,
        passportNumber,
        passportIssuingCountry,
        passportIssueDate: issueDateIso,
        passportExpiryDate: expiryDateIso,
        email,
        phone,
        address,
        languages,
        preferredAirportCity,
        preferredAirportCountry,
        windaId,
        irataLevel,
        irataNumber,
      });

      // Substitui o token JWT pelo novo token com profileComplete: true
      localStorage.setItem('accessToken', result.accessToken);

      toast.success(t('success'));
      navigate('/');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Converte DD/MM/YYYY para YYYY-MM-DD (ISO).
   */
  function convertToIso(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    return '';
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* === DADOS PESSOAIS === */}
          <SectionCard icon={<UserCircle size={18} />} title={t('sections.personal')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.firstName.label')}
                value={firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                placeholder={t('fields.firstName.placeholder')}
                required
              />
              <Input
                label={t('fields.lastName.label')}
                value={lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                placeholder={t('fields.lastName.placeholder')}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.nationality.label')}</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('fields.nationality.placeholder')}</option>
                  {PREDEFINED_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.dateOfBirth.label')}</label>
                <DatePicker
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </SectionCard>

          {/* === PASSAPORTE === */}
          <SectionCard icon={<FileText size={18} />} title={t('sections.passport')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.passportNumber.label')}
                value={passportNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassportNumber(e.target.value)}
                placeholder={t('fields.passportNumber.placeholder')}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.passportIssuingCountry.label')}</label>
                <select
                  value={passportIssuingCountry}
                  onChange={(e) => setPassportIssuingCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('fields.passportIssuingCountry.placeholder')}</option>
                  {PREDEFINED_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.passportIssueDate.label')}</label>
                <DatePicker
                  value={passportIssueDate}
                  onChange={setPassportIssueDate}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.passportExpiryDate.label')}</label>
                <DatePicker
                  value={passportExpiryDate}
                  onChange={setPassportExpiryDate}
                />
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
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder={t('fields.email.placeholder')}
                required
              />
              <Input
                label={t('fields.phone.label')}
                type="tel"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder={t('fields.phone.placeholder')}
                required
              />
            </div>
          </SectionCard>

          {/* === LOCALIZAÇÃO === */}
          <SectionCard icon={<MapPin size={18} />} title={t('sections.location')}>
            <Input
              label={t('fields.address.label')}
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              placeholder={t('fields.address.placeholder')}
              required
            />
          </SectionCard>

          {/* === IDIOMAS === */}
          <SectionCard icon={<Globe size={18} />} title={t('sections.languages')}>
            <div className="space-y-3">
              {languages.map((lang, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {t('languageEntry.language.label')}
                    </label>
                    <select
                      value={lang.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                      required
                    >
                      <option value="">{t('languageEntry.language.placeholder')}</option>
                      {PREDEFINED_LANGUAGES.map(l => (
                        <option key={l.code} value={l.name}>{l.name} ({l.nativeName})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {t('languageEntry.level.label')}
                    </label>
                    <select
                      value={lang.level}
                      onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                      required
                    >
                      <option value="">{t('languageEntry.level.placeholder')}</option>
                      {LANGUAGE_LEVELS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="text-sm text-red-600 hover:text-red-700 pb-2 px-2"
                    >
                      {t('languageEntry.removeLanguage')}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLanguage}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + {t('languageEntry.addLanguage')}
              </button>
            </div>
          </SectionCard>

          {/* === AEROPORTO PREFERIDO === */}
          <SectionCard icon={<Plane size={18} />} title={t('sections.airport')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.preferredAirportCity.label')}
                value={preferredAirportCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferredAirportCity(e.target.value)}
                placeholder={t('fields.preferredAirportCity.placeholder')}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.preferredAirportCountry.label')}</label>
                <select
                  value={preferredAirportCountry}
                  onChange={(e) => setPreferredAirportCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('fields.preferredAirportCountry.placeholder')}</option>
                  {PREDEFINED_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* === DADOS PROFISSIONAIS === */}
          <SectionCard icon={<Briefcase size={18} />} title={t('sections.professional')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('fields.windaId.label')}
                value={windaId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWindaId(e.target.value)}
                placeholder={t('fields.windaId.placeholder')}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('fields.irataLevel.label')}</label>
                <select
                  value={irataLevel}
                  onChange={(e) => setIrataLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('fields.irataLevel.placeholder')}</option>
                  <option value="L1">{t('irataOptions.L1')}</option>
                  <option value="L2">{t('irataOptions.L2')}</option>
                  <option value="L3">{t('irataOptions.L3')}</option>
                  <option value="NOT_APPLICABLE">{t('irataOptions.NOT_APPLICABLE')}</option>
                </select>
              </div>
              <Input
                label={t('fields.irataNumber.label')}
                value={irataNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIrataNumber(e.target.value)}
                placeholder={t('fields.irataNumber.placeholder')}
                required
              />
            </div>
          </SectionCard>

          {/* Mensagem de erro */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Botão de submit */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? t('submitting') : t('submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Componente auxiliar - Card de secção com ícone e título.
 */
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
