/**
 * ============================================================================
 * USE ONBOARDING FORM - Hook do Formulário de Onboarding
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Hook personalizado que encapsula toda a lógica do formulário de onboarding:
 * - Carregamento de dados existentes do perfil
 * - Estado de todos os campos do formulário
 * - Validações (campos obrigatórios, idade mínima, datas)
 * - Submissão e conversão de datas para formato ISO
 *
 * SEPORAÇÃO DE RESPONSABILIDADES:
 * --------------------------------
 * - Este hook: lógica de negócio (estado, validação, submissão)
 * - OnboardingPage: renderização JSX (template do formulário)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { submitOnboarding, getProfile } from '@/services/auth.service';

/**
 * Converte data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD).
 */
function convertToIso(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return '';
}

/**
 * Valida se o usuário tem pelo menos 18 anos.
 */
function isOlderThan18(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('/');
  let isoDate = dateStr;
  if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  const birthDate = new Date(isoDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}

/**
 * Hook que gerencia todo o estado e lógica do formulário de onboarding.
 */
export function useOnboardingForm() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
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
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [phone, setPhone] = useState('');

  // === LOCALIZAÇÃO ===
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // === IDIOMA MATERNO ===
  const [motherTongue, setMotherTongue] = useState('');

  // === AEROPORTO PREFERIDO ===
  const [preferredAirportCity, setPreferredAirportCity] = useState('');
  const [preferredAirportCountry, setPreferredAirportCountry] = useState('');

  // === DADOS PROFISSIONAIS ===
  const [windaId, setWindaId] = useState('');
  const [irataLevel, setIrataLevel] = useState('');
  const [irataNumber, setIrataNumber] = useState('');

  /**
   * Carrega os dados existentes do perfil ao montar a página.
   */
  useEffect(() => {
    async function loadProfileData() {
      try {
        const profile = await getProfile();

        if (profile.firstName) setFirstName(profile.firstName);
        if (profile.lastName) setLastName(profile.lastName);
        if (profile.nationality) setNationality(profile.nationality);
        if (profile.dateOfBirth) {
          const iso = profile.dateOfBirth;
          const parts = iso.split('T')[0].split('-');
          if (parts.length === 3) setDateOfBirth(`${parts[2]}/${parts[1]}/${parts[0]}`);
        }

        if (profile.email) setEmail(profile.email);
        if (profile.phoneCountryCode) setPhoneCountryCode(profile.phoneCountryCode);
        if (profile.phone) {
          let phoneNumber = profile.phone;
          if (profile.phoneCountryCode) {
            const codeDigits = profile.phoneCountryCode.replace(/\D/g, '');
            const phoneDigits = phoneNumber.replace(/\D/g, '');
            if (phoneDigits.startsWith(codeDigits) && phoneDigits.length > codeDigits.length) {
              phoneNumber = phoneDigits.slice(codeDigits.length);
            }
          }
          setPhone(phoneNumber);
        }

        if (profile.address) setAddress(profile.address);
        if (profile.city) setCity(profile.city);
        if (profile.postalCode) setPostalCode(profile.postalCode);
        if (profile.country) setCountry(profile.country);

        if (profile.preferredAirportCity) setPreferredAirportCity(profile.preferredAirportCity);
        if (profile.preferredAirportCountry) setPreferredAirportCountry(profile.preferredAirportCountry);

        if (profile.windaId) setWindaId(profile.windaId);
        if (profile.irataLevel) setIrataLevel(profile.irataLevel);
        if (profile.irataNumber) setIrataNumber(profile.irataNumber);

        const passport = profile.documents?.find(d => d.type === 'PASSPORT');
        if (passport) {
          if (passport.documentNumber) setPassportNumber(passport.documentNumber);
          if (passport.issuingCountry) setPassportIssuingCountry(passport.issuingCountry);
          if (passport.issueDate) {
            const parts = passport.issueDate.split('T')[0].split('-');
            if (parts.length === 3) setPassportIssueDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
          }
          if (passport.expiryDate) {
            const parts = passport.expiryDate.split('T')[0].split('-');
            if (parts.length === 3) setPassportExpiryDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
          }
        }

        const nativeLang = profile.languages?.find(l => l.level === 'NATIVE');
        if (nativeLang) setMotherTongue(nativeLang.language);
      } catch {
        // Silencioso - usuário pode preencher manualmente
      } finally {
        setIsLoadingData(false);
      }
    }

    loadProfileData();
  }, []);

  /**
   * Submete o formulário de onboarding com validações.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!firstName || !lastName || !nationality || !dateOfBirth) {
      setError(t('errors.requiredField')); return;
    }
    if (!isOlderThan18(dateOfBirth)) {
      setError(t('errors.minAge18')); return;
    }
    if (!passportNumber || !passportIssuingCountry || !passportIssueDate || !passportExpiryDate) {
      setError(t('errors.requiredField')); return;
    }
    if (!email || !phoneCountryCode || !phone) {
      setError(t('errors.requiredField')); return;
    }
    if (!address || !city || !postalCode || !country) {
      setError(t('errors.requiredField')); return;
    }
    if (!motherTongue) {
      setError(t('errors.requiredField')); return;
    }
    if (!preferredAirportCity || !preferredAirportCountry) {
      setError(t('errors.requiredField')); return;
    }
    if (!windaId || !irataLevel || !irataNumber) {
      setError(t('errors.requiredField')); return;
    }

    const dobIso = convertToIso(dateOfBirth);
    const issueDateIso = convertToIso(passportIssueDate);
    const expiryDateIso = convertToIso(passportExpiryDate);

    if (!dobIso || !issueDateIso || !expiryDateIso) {
      setError(t('errors.requiredField')); return;
    }

    if (new Date(expiryDateIso) < new Date(issueDateIso)) {
      setError(t('errors.expiryBeforeIssue')); return;
    }

    setIsLoading(true);

    try {
      const result = await submitOnboarding({
        firstName, lastName, nationality, dateOfBirth: dobIso,
        passportNumber, passportIssuingCountry,
        passportIssueDate: issueDateIso, passportExpiryDate: expiryDateIso,
        email, phoneCountryCode, phone,
        address, city, postalCode, country,
        motherTongue, preferredAirportCity, preferredAirportCountry,
        windaId, irataLevel, irataNumber,
      });

      localStorage.setItem('accessToken', result.accessToken);
      toast.success(t('success'));
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.generic');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    // Estado de carregamento
    isLoading, isLoadingData, error,
    // Dados pessoais
    firstName, setFirstName, lastName, setLastName,
    nationality, setNationality, dateOfBirth, setDateOfBirth,
    // Passaporte
    passportNumber, setPassportNumber,
    passportIssuingCountry, setPassportIssuingCountry,
    passportIssueDate, setPassportIssueDate,
    passportExpiryDate, setPassportExpiryDate,
    // Contato
    email, setEmail, phoneCountryCode, setPhoneCountryCode, phone, setPhone,
    // Localização
    address, setAddress, city, setCity,
    postalCode, setPostalCode, country, setCountry,
    // Idioma
    motherTongue, setMotherTongue,
    // Aeroporto
    preferredAirportCity, setPreferredAirportCity,
    preferredAirportCountry, setPreferredAirportCountry,
    // Profissional
    windaId, setWindaId, irataLevel, setIrataLevel, irataNumber, setIrataNumber,
    // Manipuladores
    handleSubmit,
  };
}
