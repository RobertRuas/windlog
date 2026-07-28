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
 * Interface User - Representa os dados básicos de um usuário.
 *
 * Esta interface é usada tanto na resposta do login quanto no perfil.
 * Contém apenas os dados essenciais exibidos na interface.
 */
export interface User {
  /** ID único do usuário no banco de dados */
  id: string;
  /** E-mail do usuário (usado para login) */
  email: string;
  /** Nome completo do usuário */
  firstName: string;
  /** Sobrenome do usuário */
  lastName: string;
  /** Papel/função do usuário no sistema (ADMIN, HR, STANDARD) */
  role: string;
  /** Indica se a conta do usuário está ativa */
  isActive: boolean;
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
 * Interface ProfileResponse - Resposta da API ao buscar o perfil.
 *
 * Contém dados completos do usuário, incluindo informações
 * profissionais, idiomas, certificações, etc.
 */
export interface ProfileResponse {
  /** Dados básicos do usuário */
  user: User;
  /** Nacionalidade do usuário (código do país, ex: "BR", "PT") */
  nationality?: string;
  /** Idiomas que o usuário fala */
  languages?: UserLanguage[];
  /** Certificações profissionais do usuário */
  certifications?: UserCertification[];
  /** Números de telefone do usuário */
  phoneNumbers?: UserPhoneNumber[];
}

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
