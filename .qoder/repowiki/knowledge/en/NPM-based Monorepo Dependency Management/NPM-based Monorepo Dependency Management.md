---
kind: dependency_management
name: npm-based Monorepo Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - API/package.json
    - API/package-lock.json
---

The Windlog project uses npm as its package manager across a monorepo structure with two separate Node.js applications: a NestJS backend in `API/` and a React frontend at the repository root. Each subproject maintains its own `package.json` and `package-lock.json`, with no shared workspace configuration (no `pnpm-workspace.yaml`, no Yarn workspaces, no npm workspaces). Dependencies are declared using caret (`^`) ranges for both production and development dependencies, allowing minor/patch updates within the specified major version. There is no vendoring strategy — all packages are fetched from the public npm registry (`https://registry.npmjs.org/`) as evidenced by the `resolved` URLs in the lockfiles. No private registry configuration (`.npmrc`), proxy settings, or authentication tokens are present. The `.gitignore` includes `pnpm-debug.log*` but no actual pnpm usage is detected; npm is the sole package manager in use. Prisma dependencies (`@prisma/client`, `prisma`, `@prisma/adapter-pg`) are pinned together at version `^7.9.1` across the API project, ensuring schema/code generation compatibility. TypeScript versions differ between the frontend (`~5.8.3` with exact pin via tilde) and API (`^5.7.3`), indicating independent toolchain management per subproject.