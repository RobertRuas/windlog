# Windlog API

API REST para o sistema Windlog - Gestão de projetos eólicos.

## Stack Tecnológica

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Node.js | 20+ | Runtime JavaScript |
| TypeScript | 5.7+ | Linguagem (superset tipado do JS) |
| NestJS | 11+ | Framework backend modular |
| Prisma | 7+ | ORM com type-safety |
| PostgreSQL | 15+ | Banco de dados relacional |
| JWT | - | Autenticação via tokens |
| Swagger | - | Documentação interativa da API |
| GitHub Actions | - | CI/CD |

## Estrutura de Pastas

```
windlog/
├── API/
│   ├── src/
│   │   ├── common/              # Componentes compartilhados
│   │   │   ├── decorators/      # Decoradores customizados (@Roles, @CurrentUser)
│   │   │   ├── filters/         # Filtros de exceção globais
│   │   │   ├── guards/          # Guards (RolesGuard)
│   │   │   ├── interceptors/    # Interceptors (TransformInterceptor)
│   │   │   ├── pipes/           # Pipes de validação
│   │   │   ├── dto/             # DTOs base (paginação, response)
│   │   │   ├── utils/           # Funções utilitárias
│   │   │   └── index.ts         # Barrel export
│   │   ├── config/              # Configurações (env validation)
│   │   ├── database/            # PrismaService (conexão com banco)
│   │   ├── modules/             # Módulos de negócio
│   │   │   └── auth/            # Módulo de autenticação
│   │   │       ├── dto/         # DTOs do auth (login, register)
│   │   │       ├── strategies/  # Estratégias Passport (JWT)
│   │   │       ├── auth.controller.ts
│   │   │       ├── auth.service.ts
│   │   │       └── auth.module.ts
│   │   ├── app.module.ts        # Módulo raiz
│   │   └── main.ts              # Bootstrap da aplicação
│   ├── prisma/
│   │   ├── migrations/          # Migrations do banco
│   │   ├── schema.prisma        # Definição dos models
│   │   └── generated/           # Client gerado (gitignored)
│   ├── .env                     # Variáveis de ambiente (NÃO commite)
│   ├── .env.example             # Template de variáveis
│   ├── prisma.config.ts         # Configuração Prisma v7
│   └── package.json
├── frontend/                    # (futuro)
└── README.md
```

## Como Rodar

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm

### Instalação

```bash
# 1. Clone o repositório
git clone <repo-url>
cd windlog

# 2. Entre na pasta da API
cd API

# 3. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 4. Edite .env com suas configurações
# DATABASE_URL, JWT_SECRET, etc.

# 5. Instale as dependências
npm install

# 6. Gere o Prisma Client
npm run prisma:generate

# 7. Rode as migrations (cria as tabelas no banco)
npm run prisma:migrate

# 8. Inicie o servidor de desenvolvimento
npm run start:dev
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Servidor com hot-reload |
| `npm run build` | Compila para produção |
| `npm run start:prod` | Roda versão compilada |
| `npm run lint` | Verifica e corrige padrões de código |
| `npm run test` | Roda testes unitários |
| `npm run test:e2e` | Roda testes E2E |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Cria/aplica migrations |
| `npm run prisma:studio` | Abre o Prisma Studio (UI do banco) |

### Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/v1/auth/register` | Registrar novo usuário | Não |
| POST | `/api/v1/auth/login` | Fazer login | Não |
| GET | `/api/v1/auth/profile` | Obter perfil do usuário | Sim |

**Documentação Swagger:** http://localhost:3000/api/docs

## Convenções de Código

### Idioma

- **Código**: Inglês (variáveis, funções, classes, tipos)
- **Comentários**: Português brasileiro, didático e explicativo
- **Documentação**: Português brasileiro

### Padrão de Respostas

**Sucesso:**
```json
{
  "data": { ... },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Erro:**
```json
{
  "error": "BadRequest",
  "message": "Email is required",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

### Padrão de Módulos

Cada módulo segue a mesma estrutura:

```
src/modules/<nome>/
├── dto/
│   ├── create-<nome>.dto.ts
│   └── update-<nome>.dto.ts
├── <nome>.controller.ts    # Endpoints HTTP
├── <nome>.service.ts       # Lógica de negócio
└── <nome>.module.ts        # Registro do módulo
```

### CRUD Padrão

Todo módulo implementa as mesmas operações:

| Operação | Método HTTP | Rota | Descrição |
|----------|-------------|------|-----------|
| Create | POST | `/api/v1/<module>` | Criar registro |
| Find All | GET | `/api/v1/<module>` | Listar (paginado) |
| Find One | GET | `/api/v1/<module>/:id` | Buscar por ID |
| Update | PATCH | `/api/v1/<module>/:id` | Atualizar |
| Remove | DELETE | `/api/v1/<module>/:id` | Soft delete |

### Como Criar um Novo Módulo

1. Crie a pasta em `src/modules/<nome>/`
2. Siga a estrutura padrão (controller, service, module, dto/)
3. Registre o módulo em `src/app.module.ts`
4. Adicione a tag no Swagger em `src/main.ts`
5. Pronto!

### Regras Importantes

- **IDs**: Sempre UUID
- **Datas**: Sempre UTC
- **Soft Delete**: Nunca delete fisicamente (use `deletedAt`)
- **Multi-tenant**: Toda entidade pertence a uma empresa
- **Validação**: Todo DTO deve usar class-validator
- **Documentação**: Todo endpoint deve ter Swagger decorators
- **Comentários**: Em português, didáticos, explicando o "porquê"

## Roles (Papéis)

| Role | Descrição |
|------|-----------|
| TECHNICIAN | Acesso básico (registro de atividades) |
| TEAM_LEADER | Aprovações e gestão de equipe |
| SUPERVISOR | Criar/editar projetos e gerenciar usuários |
| ADMIN | Acesso completo ao sistema |

## Autenticação

A API usa JWT (JSON Web Token) para autenticação:

1. Faça login: `POST /api/v1/auth/login`
2. Receba o token: `{ accessToken: "..." }`
3. Envie em todas as requisições protegidas:
   ```
   Authorization: Bearer <accessToken>
   ```

## CI/CD

O GitHub Actions roda automaticamente a cada push/PR para `main`:

1. Instala dependências
2. Gera Prisma Client
3. Verifica lint
4. Faz build
5. Roda testes

## Licença

UNLICENSED
