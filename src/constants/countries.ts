/**
 * ============================================================================
 * PREDEFINED COUNTRIES - Lista de Países Predefinidos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Lista de países disponíveis para seleção no sistema.
 * Os usuários devem escolher um país desta lista ao invés de digitar.
 *
 * POR QUE UMA LISTA?
 * ------------------
 * - Padronização dos dados
 * - Evita duplicatas e variações de escrita
 * - Facilita validações e filtros
 * - Melhora a experiência do usuário
 * ============================================================================
 */

/**
 * Interface para um país predefinido.
 */
export interface PredefinedCountry {
  code: string;      // Código ISO 3166-1 alpha-2 (ex: "PT", "FR", "DE")
  name: string;      // Nome em português
  phoneCode: string; // Código telefônico do país (ex: "+351", "+33")
}

/**
 * Lista de países predefinidos.
 * Ordenados alfabeticamente pelo nome em português.
 */
export const PREDEFINED_COUNTRIES: PredefinedCountry[] = [
  { code: 'AF', name: 'Afeganistão', phoneCode: '+93' },
  { code: 'AL', name: 'Albânia', phoneCode: '+355' },
  { code: 'DE', name: 'Alemanha', phoneCode: '+49' },
  { code: 'AD', name: 'Andorra', phoneCode: '+376' },
  { code: 'AO', name: 'Angola', phoneCode: '+244' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54' },
  { code: 'DZ', name: 'Argélia', phoneCode: '+213' },
  { code: 'AU', name: 'Austrália', phoneCode: '+61' },
  { code: 'AT', name: 'Áustria', phoneCode: '+43' },
  { code: 'BE', name: 'Bélgica', phoneCode: '+32' },
  { code: 'BO', name: 'Bolívia', phoneCode: '+591' },
  { code: 'BR', name: 'Brasil', phoneCode: '+55' },
  { code: 'BG', name: 'Bulgária', phoneCode: '+359' },
  { code: 'CA', name: 'Canadá', phoneCode: '+1' },
  { code: 'CL', name: 'Chile', phoneCode: '+56' },
  { code: 'CN', name: 'China', phoneCode: '+86' },
  { code: 'CO', name: 'Colômbia', phoneCode: '+57' },
  { code: 'HR', name: 'Croácia', phoneCode: '+385' },
  { code: 'DK', name: 'Dinamarca', phoneCode: '+45' },
  { code: 'EG', name: 'Egito', phoneCode: '+20' },
  { code: 'ES', name: 'Espanha', phoneCode: '+34' },
  { code: 'US', name: 'Estados Unidos', phoneCode: '+1' },
  { code: 'EE', name: 'Estônia', phoneCode: '+372' },
  { code: 'FI', name: 'Finlândia', phoneCode: '+358' },
  { code: 'FR', name: 'França', phoneCode: '+33' },
  { code: 'GR', name: 'Grécia', phoneCode: '+30' },
  { code: 'HU', name: 'Hungria', phoneCode: '+36' },
  { code: 'IN', name: 'Índia', phoneCode: '+91' },
  { code: 'IE', name: 'Irlanda', phoneCode: '+353' },
  { code: 'IT', name: 'Itália', phoneCode: '+39' },
  { code: 'JP', name: 'Japão', phoneCode: '+81' },
  { code: 'LV', name: 'Letônia', phoneCode: '+371' },
  { code: 'LT', name: 'Lituânia', phoneCode: '+370' },
  { code: 'LU', name: 'Luxemburgo', phoneCode: '+352' },
  { code: 'MA', name: 'Marrocos', phoneCode: '+212' },
  { code: 'MX', name: 'México', phoneCode: '+52' },
  { code: 'NL', name: 'Países Baixos', phoneCode: '+31' },
  { code: 'NO', name: 'Noruega', phoneCode: '+47' },
  { code: 'NZ', name: 'Nova Zelândia', phoneCode: '+64' },
  { code: 'PL', name: 'Polônia', phoneCode: '+48' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351' },
  { code: 'GB', name: 'Reino Unido', phoneCode: '+44' },
  { code: 'CZ', name: 'República Checa', phoneCode: '+420' },
  { code: 'RO', name: 'Romênia', phoneCode: '+40' },
  { code: 'RU', name: 'Rússia', phoneCode: '+7' },
  { code: 'SE', name: 'Suécia', phoneCode: '+46' },
  { code: 'CH', name: 'Suíça', phoneCode: '+41' },
  { code: 'SK', name: 'Eslováquia', phoneCode: '+421' },
  { code: 'SI', name: 'Eslovênia', phoneCode: '+386' },
  { code: 'UA', name: 'Ucrânia', phoneCode: '+380' },
];

/**
 * Busca um país pelo código.
 */
export function getCountryByCode(code: string): PredefinedCountry | undefined {
  return PREDEFINED_COUNTRIES.find(c => c.code === code);
}

/**
 * Busca um país pelo nome.
 */
export function getCountryByName(name: string): PredefinedCountry | undefined {
  return PREDEFINED_COUNTRIES.find(c =>
    c.name.toLowerCase() === name.toLowerCase()
  );
}
