# Stack e Dependências

<cite>
**Referenced Files in This Document**
- [API/src/app.module.ts](file://API/src/app.module.ts)
- [API/src/main.ts](file://API/src/main.ts)
- [API/prisma/schema.prisma](file://API/prisma/schema.prisma)
- [src/main.tsx](file://src/main.tsx)
- [src/App.tsx](file://src/App.tsx)
- [API/src/config/env.validation.ts](file://API/src/config/env.validation.ts)
- [API/src/database/prisma.service.ts](file://API/src/database/prisma.service.ts)
- [src/services/api.ts](file://src/services/api.ts)
</cite>

## Backend (API/)

### Core Framework and Runtime
- **Node.js**: JavaScript runtime environment for server-side execution
- **NestJS**: Progressive Node.js framework for building efficient and scalable server-side applications
  - Provides modular architecture with dependency injection
  - Built-in support for TypeScript
  - REST API capabilities with decorators-based routing

### Database Layer
- **Prisma ORM**: Next-generation ORM for Node.js and TypeScript
  - Type-safe database access
  - Automatic type generation from schema
  - Migration management
  - Connection pooling and query optimization

### Authentication and Authorization
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
  - Bearer token-based authentication
  - Payload contains user ID, email, and role information
  - Secure token validation and refresh mechanisms

### Security and Validation
- **Class Validator**: Decorator-based validation for DTOs and request payloads
- **Helmet**: Security headers middleware for HTTP response protection
- **CORS**: Cross-Origin Resource Sharing configuration for frontend-backend communication

### API Documentation
- **Swagger/OpenAPI**: Interactive API documentation
  - Auto-generated API specifications
  - Interactive API testing interface
  - Request/response schema validation

### File Upload and Storage
- **Multer**: Middleware for handling multipart/form-data
  - File upload processing
  - MIME type validation
  - File size restrictions
  - Temporary URL generation for secure file access

### Logging and Monitoring
- **Winston**: Structured logging library
  - Multi-transport logging (console, file, external services)
  - Log levels and filtering
  - Performance metrics collection

### Configuration Management
- **dotenv**: Environment variable management
  - Development/production environment separation
  - Configuration validation
  - Secret management

**Section sources**
- [API/src/app.module.ts:1-50](file://API/src/app.module.ts#L1-L50)
- [API/src/main.ts:1-30](file://API/src/main.ts#L1-L30)
- [API/prisma/schema.prisma:1-20](file://API/prisma/schema.prisma#L1-L20)

## Frontend (src/)

### Core Framework and Build Tools
- **React 18**: Component-based UI library with concurrent features
  - Functional components with hooks
  - Context API for state management
  - React Router for client-side routing

- **Vite**: Next-generation frontend build tool
  - Lightning-fast development server
  - Optimized production builds
  - Hot Module Replacement (HMR)
  - TypeScript and JSX support out of the box

### Styling and Design System
- **Tailwind CSS v4**: Utility-first CSS framework
  - Responsive design utilities
  - Custom theme configuration
  - Apple-inspired design system implementation
  - Dark mode support

- **CSS Modules**: Scoped CSS for component styling
  - Component-level style isolation
  - Build-time optimization
  - Better performance than global styles

### State Management and Data Fetching
- **TanStack Query (React Query)**: Server state management and caching
  - Automatic data fetching and caching
  - Background refetching and pagination
  - Mutation invalidation strategies
  - Optimistic updates support

- **Zustand**: Lightweight state management for client state
  - Minimal boilerplate
  - TypeScript support
  - DevTools integration

### Form Handling and Validation
- **React Hook Form**: Performant form validation
  - Uncontrolled components for better performance
  - Schema validation with Zod
  - Custom field validation rules
  - Real-time validation feedback

- **Zod**: TypeScript-first schema validation
  - Compile-time type inference
  - Rich validation rules
  - Error message customization

### Internationalization
- **i18next**: Internationalization framework
  - Multi-language support (Portuguese default)
  - Pluralization and date formatting
  - Namespace organization
  - Dynamic language switching

### UI Components and Libraries
- **React Icons**: Icon library with SVG icons
  - Multiple icon sets
  - Tree-shaking support
  - Customizable props

- **Framer Motion**: Animation library for React
  - Declarative animations
  - Gesture recognition
  - Layout transitions

### Testing and Quality Assurance
- **Jest**: JavaScript testing framework
  - Unit testing for components and utilities
  - Mock functions and modules
  - Snapshot testing

- **React Testing Library**: Component testing utilities
  - User-centric testing approach
  - Accessibility testing
  - Integration testing patterns

- **ESLint**: Code linting and quality enforcement
  - Airbnb style guide
  - React-specific rules
  - TypeScript integration

- **Prettier**: Code formatter
  - Consistent code style
  - Git hook integration
  - VS Code integration

**Section sources**
- [src/main.tsx:1-40](file://src/main.tsx#L1-L40)
- [src/App.tsx:1-60](file://src/App.tsx#L1-L60)
- [src/services/api.ts:1-30](file://src/services/api.ts#L1-L30)

## Banco de Dados

### Database Engine
- **PostgreSQL**: Relational database management system
  - ACID compliance
  - Advanced indexing and query optimization
  - JSON column support for flexible schemas
  - Full-text search capabilities

### ORM and Schema Management
- **Prisma Client**: Generated type-safe database client
  - Automatic type generation from schema
  - Query builder with full TypeScript support
  - Migration system for schema evolution
  - Connection pooling and transaction support

### Data Modeling
- **UUID Primary Keys**: Universally unique identifiers for all entities
  - Distributed system compatibility
  - Security through obscurity
  - Better distribution characteristics than auto-increment

- **Soft Delete Pattern**: Logical deletion using deletedAt timestamps
  - Data retention and audit trails
  - Recovery capabilities
  - Historical data preservation

### Database Features
- **UTC Timestamps**: Standardized time handling across the application
  - Timezone-independent operations
  - Global deployment support
  - Consistent reporting and analytics

- **Index Optimization**: Strategic indexing for query performance
  - Composite indexes for common queries
  - Partial indexes for filtered queries
  - Unique constraints for data integrity

**Section sources**
- [API/prisma/schema.prisma:1-100](file://API/prisma/schema.prisma#L1-L100)
- [API/src/database/prisma.service.ts:1-40](file://API/src/database/prisma.service.ts#L1-L40)

## Ferramentas de Desenvolvimento

### Development Environment
- **TypeScript**: Static type checking and enhanced IDE support
  - Compile-time error detection
  - IntelliSense and autocomplete
  - Interface definitions for APIs
  - Generic types for reusable components

- **VS Code**: Integrated Development Environment
  - Extensions for NestJS, React, and Prisma
  - Debugging capabilities
  - Git integration
  - Terminal integration

### Package Management
- **npm**: Node.js package manager
  - Dependency resolution and installation
  - Script automation
  - Version locking with package-lock.json

- **Concurrently**: Run multiple commands simultaneously
  - Parallel development servers
  - Automated build processes
  - Development workflow optimization

### Version Control and Collaboration
- **Git**: Distributed version control system
  - Branching strategies
  - Merge conflict resolution
  - Tagging releases

- **GitHub**: Code hosting and collaboration platform
  - Pull request workflows
  - Issue tracking
  - CI/CD pipeline integration

### Code Quality and Standards
- **Husky**: Git hooks manager
  - Pre-commit linting
  - Pre-push testing
  - Commit message validation

- **Commitlint**: Conventional commit messages
  - Automated commit message validation
  - Semantic versioning support
  - Change log generation

### Containerization and Deployment
- **Docker**: Containerization platform
  - Consistent development environments
  - Production deployment containers
  - Service orchestration with Docker Compose

- **Docker Compose**: Multi-container application orchestration
  - Local development setup
  - Database container management
  - Service dependency management

### Monitoring and Analytics
- **Sentry**: Error tracking and monitoring
  - Real-time error reporting
  - Performance monitoring
  - User session replay

- **Google Analytics**: Website analytics and user behavior tracking
  - User engagement metrics
  - Conversion tracking
  - Geographic analysis

### Security Tools
- **Dependency Scanning**: Automated vulnerability detection
  - npm audit for known vulnerabilities
  - Security advisories
  - Automated security updates

- **SSL/TLS**: Secure communication protocols
  - HTTPS enforcement
  - Certificate management
  - Security headers configuration

**Section sources**
- [API/src/config/env.validation.ts:1-30](file://API/src/config/env.validation.ts#L1-L30)