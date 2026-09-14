# System Architecture

Three-layer split (Frontend / BFF / Backend) with intentional token isolation, MyBatis-explicit SQL, and CMS-driven UI rules. Documented as a light C4 model: **Context** → **Container** → **Component**.

---

## C1 — Context

Who uses the system, and what external services it calls.

```mermaid
flowchart TB
    subgraph Users[Users]
        EMP[👤 Employee<br/>Anna Müller]
        MGR[👤 Manager<br/>Thomas Weber]
        FIN[👤 Finance<br/>Sarah Chen]
        ADM[👤 Admin<br/>David Kim]
    end

    SYS[FintechSaaS<br/>Expense Platform<br/>Corporate expense management<br/>with GDPR + GoBD compliance]

    subgraph External[External systems]
        A0[Auth0<br/>OAuth2 + MFA]
        GRQ[Groq API<br/>LLaMA Vision + Chat]
        MIN[MinIO / S3<br/>Receipt storage]
    end

    EMP -->|Submit expense| SYS
    MGR -->|Approve / reject| SYS
    FIN -->|Pay + export| SYS
    ADM -->|Manage users + GDPR| SYS

    SYS -->|Login, MFA verify,<br/>token refresh| A0
    SYS -->|Receipt OCR,<br/>policy insight,<br/>monthly reports| GRQ
    SYS -->|Presigned PUT/GET<br/>for receipt images| MIN

    style SYS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
```

**Boundaries:**
- All login and MFA flows delegate to Auth0 — the system never stores passwords.
- Every AI feature routes through Groq — Groq is a hard dependency for OCR and insights, but every call has a mock fallback so demos work offline (see [ai-report](/wiki/ai-report)).
- Receipt binaries never touch the Java API — browsers upload directly to MinIO via presigned URLs.

---

## C2 — Container

Five Docker services, one Docker network (`portfolio-network`).

```mermaid
flowchart TB
    Browser[Browser]

    subgraph Docker[Docker network — portfolio-network]
        NGX[Nginx Gateway<br/>:8080<br/>image: nginx:alpine]
        FE[Next.js Frontend<br/>:3000<br/>App Router + RTK Query]
        BFF[Express BFF<br/>:4000<br/>TypeScript + cookie auth]
        BE[Spring Boot Backend<br/>:8080 → :8081 host<br/>Java 21 + MyBatis]
        DB[(MySQL 8.0<br/>:3306 → :3307 host)]
    end

    subgraph Ext[External services]
        A0[Auth0]
        GRQ[Groq]
        MIN[MinIO / B2]
    end

    Browser -->|"/*"| NGX
    NGX -->|"/"| FE
    NGX -->|"/api/*<br/>(strip /api prefix)"| BFF
    FE -->|SSR data<br/>internal fetch| BFF
    BFF -->|Bearer JWT<br/>from HttpOnly cookie| BE
    BE -->|JDBC| DB

    BFF -.->|OAuth2 code exchange| A0
    BE -.->|OCR + Chat calls| GRQ
    BE -.->|S3 presigned URLs| MIN

    style NGX fill:#fff3e0
    style FE fill:#e3f2fd
    style BFF fill:#e8f5e9
    style BE fill:#f3e5f5
    style DB fill:#fce4ec
```

### Nginx routing rules

Configured in [`nginx/nginx.conf`](../nginx/nginx.conf):

```nginx
location / {
    proxy_pass http://react-frontend:3000;
}
location /api/ {
    rewrite ^/api/(.*) /$1 break;         # strip /api prefix before hitting BFF
    proxy_pass http://nextjs-bff:4000;
    proxy_buffer_size 128k;               # accommodate large Auth0 cookies
}
```

Two upstream paths, one public port. The frontend calls `/api/emp-001` (from the browser's perspective); Nginx strips `/api/` and forwards `/emp-001` to the BFF.

### Container responsibilities

| Container | Owns |
|---|---|
| **Frontend** | User-facing rendering, RTK Query cache, form state, client-side validation, Mermaid diagrams in wiki |
| **BFF** | HttpOnly cookie management, Auth0 token exchange, request shaping (e.g. `/emp-001?filename=x` → `/api/v1/expenses/upload-url?filename=x`), AI orchestration prompts |
| **Backend** | Domain logic, MyBatis queries, GDPR pseudonymization, retention timestamp computation, Groq client calls, presigned URL generation |
| **MySQL** | Persistent state — expenses, users, permissions, `policy_evaluation_history`, `gdpr_audit_log`, `screen_configs` |
| **Nginx Gateway** | Single public port, path-based routing, cookie proxy header limits |

---

## C3 — Component (backend focus)

The most interesting per-file structure lives in the Java backend. ~135 files across 9 packages:

```mermaid
flowchart LR
    subgraph API[HTTP layer]
        C[controller/<br/>~21 files]
        F[config/<br/>JwtAuthFilter<br/>WebConfig]
        E[exception/<br/>GlobalExceptionHandler<br/>Forbidden/NotFoundException]
    end

    subgraph Domain[Domain layer]
        S[service/<br/>~16 files<br/>ExpenseService, GdprService, ...]
        Client[client/<br/>GroqClient]
    end

    subgraph Data[Data layer]
        R[repository/<br/>~16 files<br/>thin MyBatis wrappers]
        M[mapper/<br/>~18 interfaces + XML]
        En[entity/<br/>~22 files]
    end

    subgraph Contracts[Contracts]
        D[dto/<br/>~27 files<br/>request + response + common]
    end

    C -->|receives| D
    C -->|extracts cognitoSub via| F
    C -->|throws| E
    C -->|calls| S
    S -->|persists via| R
    S -->|external AI| Client
    R -->|delegates SQL| M
    M -->|hydrates| En
    S -->|returns| D

    style API fill:#e3f2fd
    style Domain fill:#e8f5e9
    style Data fill:#fce4ec
    style Contracts fill:#fff3e0
```

### Package roles

| Package | Purpose | Notable classes |
|---|---|---|
| `controller/` | HTTP endpoints, one file per feature area | `AdminController`, `ExpenseController`, `GdprController`, `FinanceGdprController`, `UserPrivacyController` |
| `service/` | Business logic, transactional boundaries (`@Transactional`) | `ExpenseService`, `GdprService`, `DataExportService`, `ExpenseReportService`, `CsvImportService` |
| `repository/` | Thin wrapper over MyBatis mappers — clean method names | `ExpenseRepository.findByUserSub`, `GdprAuditLogRepository.hasLaterEvent` |
| `mapper/` | MyBatis interfaces + `resources/mapper/*.xml` with explicit SQL | `ExpenseMapper.xml`, `GdprMapper.xml`, `PolicyEvaluationHistoryMapper.xml` |
| `entity/` | Lombok `@Data` POJOs, 1:1 with DB tables | `ExpenseEntity`, `GdprAuditLogEntity`, `ScreenConfigEntity` |
| `dto/` | Request + response shapes exposed via HTTP | `CreateExpenseRequestDto`, `GdprErasureRequestDto`, `ScanResponseDto` |
| `config/` | Filters, MVC config, Spring beans | `JwtAuthFilter` (extract `cognitoSub`), `WebConfig` |
| `exception/` | Domain exceptions + `@ControllerAdvice` global handler | `ForbiddenException` → 403, `NotFoundException` → 404, generic → 500 |
| `client/` | External API clients | `GroqClient` (OCR + Chat) |

### Cross-cutting concerns present in code

- **[JwtAuthFilter](/wiki/auth-flow)** — decodes JWT, injects `cognitoSub` into request attributes for `/api/v1/**` routes only.
- **GlobalExceptionHandler** — `@ControllerAdvice` mapping domain exceptions to HTTP status codes.
- **SLF4J logging** — active in most services (`private static final Logger log = ...`).
- **`@Transactional`** — all mutating operations (`ExpenseService.create`, `GdprService.hardDeletePersonalData`, `FinanceService.batchPay`) are wrapped.
- **CORS** — not enforced by Spring; handled at Nginx via header forwarding since the frontend is same-origin behind the gateway.

---

## Key architectural decisions

Each of these is a design choice worth defending in interview:

1. **BFF as auth boundary** — tokens live in HttpOnly cookies + BFF memory only. Never in JS. See [auth-flow](/wiki/auth-flow).
2. **MyBatis over JPA** — GDPR pseudonymization queries are explicit UPDATE statements with no FK. JPA cascade behavior would be a liability here.
3. **Direct-to-storage uploads** — presigned PUT URLs (15 min TTL). Java server never streams file bytes; memory footprint is fixed regardless of receipt size.
4. **CMS-driven compliance rules** — evaluation logic lives in `screen_configs` JSON, not Java. Snapshot captured at expense create time is immutable (see [CMS policy rules](/wiki/cms-policy-rules)).
5. **Async AI jobs** — `CompletableFuture.runAsync()` for reports; polling from frontend at 2s intervals. No queue infrastructure needed at demo scale (see [AI report](/wiki/ai-report)).
6. **`retention_expires_at` in SQL, not Java** — computed via `DATE_ADD(CURDATE(), INTERVAL 10 YEAR)` in the same UPDATE that sets `paid_at`. Eliminates clock drift; no backfill migration ever needed.

---

## Related

- [Auth flow](/wiki/auth-flow) — how tokens flow through the BFF
- [Expense lifecycle](/wiki/expense-lifecycle) — the domain state machine that all controllers converge on
- [Admin & management](/wiki/admin-management) — how the permission model is administered
- [CMS policy rules](/wiki/cms-policy-rules) — the `screen_configs` versioning strategy
