# System Architecture

3-tier architecture with a clear split between UI, orchestration, and domain logic.

## Overview

- **Frontend** — Next.js 15 App Router, RTK Query, TypeScript. Server components for data loads, client components for interactivity.
- **BFF** — Express + TypeScript. Handles auth cookies, orchestrates AI (Groq), shapes API responses for the frontend.
- **Backend** — Spring Boot 3 + MyBatis + Java 21. Domain logic, MyBatis XMLs for explicit SQL.

## High-level flow

```
[Next.js :3000] ──▶ [Express BFF :4000] ──▶ [Spring Boot :8080] ──▶ [MySQL 8]
                          │                          │
                          ▼                          ▼
                    [Groq AI]                   [MinIO S3]
```

## Key architectural decisions

- **No tokens in the browser.** JWT lives in HttpOnly cookies; BFF extracts `cognito_sub` and proxies authenticated calls.
- **Direct-to-storage uploads.** Frontend requests a presigned PUT URL (15 min TTL), then uploads binary straight to MinIO. Java server never streams file bytes.
- **Granular permissions.** `user_permissions` table holds codes like `EXPENSE_APPROVE`, `FINANCE_EXPORT`. Role is a default; permission is the truth.
- **MyBatis over JPA.** Explicit SQL keeps GDPR pseudonymization queries reviewable. JPA cascade would fight a `user_sub` column intentionally without FK.

> 🚧 Full C4 diagrams (Context / Container / Component) coming soon.
