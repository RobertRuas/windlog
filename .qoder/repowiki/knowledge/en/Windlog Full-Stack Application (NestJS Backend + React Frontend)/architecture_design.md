Two co-located codebases sharing the same repository root: `API/` is the NestJS backend and `src/` is the React frontend.

Backend layering (`API/src/`):
- `main.ts` bootstraps NestJS, registers global middleware (Helmet, compression, CORS), sets the `/api/v1` prefix, enables `ValidationPipe`, installs global filters (`HttpExceptionFilter`) and interceptors (`TransformInterceptor`, `LoggingInterceptor`).
- `app.module.ts` is the single root module that imports every feature module (`AuthModule`, `UsersModule`, `ProjectsModule`, `UploadModule`, `NotificationsModule`, `WeeklyTimesheetModule`, `FeedbackModule`, `SystemLogModule`) plus `ConfigModule` for env validation.
- Each business domain lives under `modules/<name>/` with the strict triad `{name}.module.ts` + `{name}.controller.ts` + `{name}.service.ts` plus a `dto/` folder of class-validator DTOs. Controllers contain only routing/parameter mapping; all business logic is in services.
- Database access goes through a shared `database/prisma.service.ts` which extends PrismaClient with a PostgreSQL adapter (Prisma v7). The schema is defined in `prisma/schema.prisma` and is the single source of truth for types.
- Cross-cutting concerns live under `common/`: decorators (`current-user.decorator`, `roles.decorator`), guards (`roles.guard`), pipes, interceptors (`logging.interceptor`, `transform.interceptor`), filters, and DTOs (`api-response.dto`, `pagination.dto`).
- `LoggingInterceptor` maps HTTP method+URL to `LogAction` enums via `determineAction()` and writes to `SystemLogService` asynchronously without blocking responses.

Frontend layering (`src/`):
- `App.tsx` wires `QueryClientProvider`, `SettingsProvider`, `BrowserRouter`, and defines all routes wrapped by role-based route guards (`ProtectedRoute`, `AdminRoute`, `AdminOrHRRoute`, `AuthOnlyRoute`).
- Pages follow `{PageName}.tsx` + `components/` + optional `hooks/` convention; reusable UI components live in `src/components/ui/` and structural layout in `src/components/layout/`.
- All API calls are centralized in `src/services/api.ts` (fetch wrapper with Bearer token, 401 auto-logout) and each domain has a dedicated service file (`auth.service.ts`, `project.service.ts`, etc.).
- TanStack Query keys follow `['entity', filter?]` / `['entity', id]` pattern; mutations invalidate related keys.
- Toast notifications use Sonner with Portuguese messages for every CRUD operation.
- Internationalization is under `src/i18n/locales/pt/*.json` loaded via `@/i18n` index.