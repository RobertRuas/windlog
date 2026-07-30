/**
 * ============================================================================
 * USER TYPES - Tipos TypeScript para Autenticação e Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define as interfaces TypeScript que representam os dados de usuário
 * e as respostas da API de autenticação.
 *
 * POR QUE USAR INTERFACES?
 * ------------------------
 * Interfaces garantem type-safety (segurança de tipos) no TypeScript.
 * Se a API mudar a estrutura dos dados, o TypeScript avisa em tempo de
 * desenvolvimento, evitando erros em produção.
 *
 * COMO USAR?
 * ----------
 * Importe estas interfaces nos componentes e serviços que precisam
 * trabalhar com dados de usuário ou autenticação.
 * ============================================================================
 */

/**
 * Interface User - Representa os dados completos de um usuário.
 *
 * Esta interface é usada tanto na resposta do login quanto no perfil.
 * Contém todos os dados retornados pela API.
 */
export interface User {
  /** ID único do usuário no banco de dados */
  id: string;
  /** E-mail do usuário (usado para login) */
  email: string;
  /** Primeiro nome do usuário */
  firstName: string;
  /** Sobrenome do usuário */
  lastName: string;
  /** Papel/função do usuário no sistema (ADMIN, HR, STANDARD) */
  role: string;
  /** Número de telefone principal */
  phone?: string;
  /** Código do país do telefone (ex: "+351") */
  phoneCountryCode?: string;
  /** Data de nascimento (formato ISO) */
  dateOfBirth?: string | null;
  /** Nacionalidade (código do país, ex: "PT", "BR") */
  nationality?: string;
  /** Endereço */
  address?: string | null;
  /** Cidade */
  city?: string | null;
  /** Código postal */
  postalCode?: string | null;
  /** País */
  country?: string | null;
  /** Departamento */
  department?: string;
  /** Cargo/função profissional */
  position?: string;
  /** Data de contratação (formato ISO) */
  hireDate?: string | null;
  /** ID do funcionário */
  employeeId?: string | null;
  /** Biografia/resumo */
  bio?: string | null;
  /** URL da foto do usuário */
  photoUrl?: string | null;
  /** Data de criação da conta (formato ISO) */
  createdAt?: string;
  /** Idiomas que o usuário fala */
  languages?: UserLanguage[];
  /** Certificações profissionais do usuário */
  certifications?: UserCertification[];
  /** Números de telefone do usuário */
  phoneNumbers?: UserPhoneNumber[];
  /** Documentos pessoais do usuário */
  documents?: UserDocument[];
  /** Contas bancárias do usuário */
  bankAccounts?: UserBankAccount[];
}

/**
 * Interface LoginPayload - Dados enviados para fazer login.
 *
 * Representa o corpo da requisição POST /api/v1/auth/login.
 * O frontend envia estes dados para a API autenticar o usuário.
 */
export interface LoginPayload {
  /** E-mail do usuário */
  email: string;
  /** Senha em texto plano (será enviada via HTTPS) */
  password: string;
}

/**
 * Interface LoginResponse - Resposta da API ao fazer login.
 *
 * Contém o token JWT (usado para autenticar requisições futuras)
 * e os dados básicos do usuário autenticado.
 */
export interface LoginResponse {
  /** Token JWT para autenticação nas próximas requisições */
  accessToken: string;
  /** Dados do usuário autenticado */
  user: User;
}

/**
 * Type alias para ProfileResponse.
 * A API retorna os dados do perfil diretamente (mesma estrutura de User).
 */
export type ProfileResponse = User;

/**
 * Interface UserLanguage - Idioma falado pelo usuário.
 */
export interface UserLanguage {
  /** Código do idioma (ex: "en", "pt", "es") */
  language: string;
  /** Nível de proficiência (A1, A2, B1, B2, C1, C2, NATIVE) */
  level: string;
}

/**
 * Interface UserCertification - Certificação profissional do usuário.
 */
export interface UserCertification {
  /** Tipo de certificação (CERTIFICATION, DIPLOMA, COURSE, TRAINING, LICENSE) */
  type: string;
  /** Nome/título da certificação */
  name: string;
  /** Descrição adicional (opcional) */
  description?: string;
  /** Data de emissão (formato ISO) */
  issueDate?: string;
  /** Data de validade (formato ISO, opcional) */
  expiryDate?: string;
}

/**
 * Interface UserPhoneNumber - Número de telefone do usuário.
 */
export interface UserPhoneNumber {
  /** Código do país (ex: "+351" para Portugal, "+55" para Brasil) */
  countryCode: string;
  /** Número de telefone sem o código do país */
  number: string;
  /** Tipo do número (MOBILE, HOME, WORK) */
  type: string;
}

/**
 * Interface UserDocument - Documento pessoal do usuário.
 */
export interface UserDocument {
  /** ID único do documento */
  id: string;
  /** Tipo de documento (PASSPORT, ID_CARD, TAX_ID, etc.) */
  type: string;
  /** Número do documento */
  documentNumber?: string | null;
  /** País emissor (código ISO) */
  issuingCountry?: string | null;
  /** Data de expedição (formato ISO) */
  issueDate?: string | null;
  /** Data de validade (formato ISO) */
  expiryDate?: string | null;
  /** Descrição ou notas adicionais */
  description?: string | null;
}

/**
 * Interface UserBankAccount - Conta bancária do usuário.
 */
export interface UserBankAccount {
  /** ID único da conta */
  id: string;
  /** Nome do banco */
  bankName: string;
  /** IBAN */
  iban: string;
  /** Código BIC/SWIFT */
  bicSwift?: string | null;
  /** Nome do titular da conta */
  accountHolder: string;
  /** Se é a conta principal */
  isPrimary: boolean;
  /** Descrição opcional */
  description?: string | null;
}
