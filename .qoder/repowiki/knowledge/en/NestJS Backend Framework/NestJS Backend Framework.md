---
kind: external_dependency
name: NestJS Backend Framework
slug: nestjs
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

NestJS 11+ is the core backend framework powering the Windlog API. It provides modular architecture (src/modules/), dependency injection, global pipes/guards/filters/interceptors, and built-in OpenAPI/Swagger support. The application bootstraps via main.ts and uses @nestjs/config for environment validation. All modules follow the standard controller/service/module pattern defined in the README conventions.