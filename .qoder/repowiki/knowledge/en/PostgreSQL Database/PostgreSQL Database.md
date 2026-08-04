---
kind: external_dependency
name: PostgreSQL Database
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

PostgreSQL 15+ serves as the relational database for Windlog. Connection is configured via DATABASE_URL in .env with format postgresql://user:password@host:port/database. The database stores all application data including users, projects, turbines, certifications, documents, notifications, and system logs. Default development database is 'windlog_dev'.