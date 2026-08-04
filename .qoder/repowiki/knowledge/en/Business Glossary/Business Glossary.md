---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Windlog
- Definition：The name of the wind energy management system being developed - a platform for managing wind turbine projects, technicians, certifications, and related operations across multiple countries.

### Role-Based Access Control (RBAC)
- Definition：Access control model implemented with three roles: ADMIN (full system access), HR (employee management, certifications), and STANDARD (basic operations). Enforced via @Roles() decorator and RolesGuard.
- Aliases：RBAC、roles

### Soft Delete
- Definition：Data deletion pattern where records are not physically removed but marked with deletedAt timestamp field, allowing data recovery and maintaining referential integrity.
- Aliases：deletedAt、soft delete

### CEFR Language Levels
- Definition：Common European Framework of Reference for Languages proficiency scale used to standardize language skills: A1, A2, B1, B2, C1, C2, NATIVE. Applied to UserLanguage model for multinational workforce management.
- Aliases：language levels、proficiency levels

### Multi-tenant Architecture
- Definition：System design where each entity belongs to a company/organization, enabling single instance serving multiple organizations with data isolation.
- Aliases：multi-tenant、tenant

### System Log (Audit Trail)
- Definition：Comprehensive audit logging system tracking all actions (LOGIN, USER_CREATE, PROJECT_UPDATE, etc.) with severity levels (INFO, WARNING, ERROR, CRITICAL), capturing user context, IP address, HTTP details, and execution duration.
- Aliases：audit log、system-log、LogAction

### Notification System
- Definition：User notification system with types (ACTION_REQUIRED, DOCUMENT_EXPIRING, CERTIFICATION_EXPIRING, PROJECT_UPDATE, etc.), priorities (LOW, MEDIUM, HIGH, URGENT), and read/unread status tracking.
- Aliases：notifications、NotificationType

### Project Management Domain
- Definition：Core business entities for wind energy projects: Project (with status PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED), ProjectTurbine (individual turbines with OPERATIONAL, MAINTENANCE, OFFLINE, DECOMMISSIONED status), and ProjectMember associations.
- Aliases：projects、turbines、project status

### Employee Document Management
- Definition：System for managing multinational employee documents including PASSPORT, ID_CARD, TAX_ID, SOCIAL_SECURITY, WORK_PERMIT, VISA, DRIVERS_LICENSE, POSTING_ORDER (A1), MEDICAL_EXAM with issue/expiry dates and file attachments.
- Aliases：documents、UserDocument、document types

### Certification Tracking
- Definition：Professional certification management system supporting CERTIFICATION, DIPLOMA, COURSE, TRAINING, LICENSE types with issuer tracking, certificate numbers, issue/expiry dates, and expiration alerts.
- Aliases：certifications、UserCertification、certification types

### Bank Account Management
- Definition：Employee banking information system storing IBAN, BIC/SWIFT codes, bank names, and account holder details for payroll processing, with primary account designation.
- Aliases：bank accounts、UserBankAccount、IBAN

### Standardized Response Format
- Definition：Consistent API response structure: success responses use { data, message, statusCode, timestamp } and error responses use { error, message, statusCode, timestamp, path } across all endpoints.
- Aliases：response format、standard response
