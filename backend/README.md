# my-java-app — Backend design notes

Spring Boot 3 + MyBatis + Java 21. This note documents the backend's own architecture — package layering, request lifecycle, auth, exception handling, and data access conventions — as an internal reference, separate from the public wiki (`/docs`) which documents business flows for a general audience.

---

## 1. Package layout

```
com.example.my_java_app/
├── controller/    REST endpoints — extends BaseController, no business logic
├── service/       Business logic, transaction boundary, @Write-annotated write methods
├── repository/    Thin wrapper over Mapper — normalizes method names, no SQL
├── mapper/        MyBatis @Mapper interfaces — signatures only, SQL lives in resources/mapper/*.xml
├── entity/        MyBatis result objects (22 entities) — 1:1 with DB tables, no JPA
├── dto/
│   ├── request/   Inbound payloads
│   ├── response/  Outbound payloads
│   └── common/    Shared shapes (e.g. policy evaluation snapshot) used both directions
├── exception/     ApiException hierarchy + GlobalExceptionHandler (@ControllerAdvice)
├── annotation/    @Write — marks a service method as a write for datasource routing
├── config/        DataSourceConfig, DataSourceAspect, JwtAuthFilter, FilterConfig, StorageConfig, SwaggerConfig
└── client/        GroqClient — outbound HTTP to the Groq API (OCR + chat)
```

21 controllers, 16 services, ~20 repository/mapper pairs, 22 entities. No JPA/Hibernate anywhere — MyBatis only, so every query is explicit SQL in an XML file, reviewable in a diff.

---

## 2. Request lifecycle

```
HTTP request
  → JwtAuthFilter                (Servlet filter, not Spring Security — see §4)
  → Controller (extends BaseController)
  → ┌─ DataSourceAspect ─────────┐  (@Around every service method — see §7)
    │ Service (business logic)   │
    └─────────────────────────────┘
  → Repository                   (thin wrapper, no SQL)
  → Mapper (MyBatis @Mapper)      (SQL in resources/mapper/*.xml)
  → MySQL
```

Exceptions thrown anywhere in this chain propagate up to `GlobalExceptionHandler` (`@ControllerAdvice`) at the very top, converted to a JSON `ErrorResponse` — see §5.

---

## 3. Controller layer — `BaseController`

Every controller extends `BaseController`, a thin set of `ResponseEntity` helpers:

```java
public abstract class BaseController {
    protected <T> ResponseEntity<T> ok(T body)          { return ResponseEntity.ok(body); }
    protected <T> ResponseEntity<T> created(T body)      { return new ResponseEntity<>(body, HttpStatus.CREATED); }
    protected <T> ResponseEntity<T> badRequest(T body)   { return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST); }
    protected <T> ResponseEntity<T> notFound(T body)     { return new ResponseEntity<>(body, HttpStatus.NOT_FOUND); }
    protected <T> ResponseEntity<T> forbidden(T body)    { return new ResponseEntity<>(body, HttpStatus.FORBIDDEN); }
}
```

Deliberately minimal — no generic CRUD scaffolding, no `@RequestMapping` base path, no shared field. Its only job is to keep controller method bodies from repeating `new ResponseEntity<>(x, HttpStatus.Y)` everywhere. Controllers still declare their own `@RequestMapping` base path and inject their own services directly:

```java
@RestController
@RequestMapping("/api/v1/admin/gdpr")
public class GdprController extends BaseController {
    private final GdprService gdprService;
    // ... constructor injection, no field injection anywhere in the codebase
}
```

Authorization is not centralized in a filter or interceptor — each controller that needs it calls a local `requireXxx(request)` helper (e.g. `GdprController.requireAdmin()`) which reads `cognitoSub` off the request and checks it against `SystemAdminRepository` / `RoleRepository`. This is a deliberate simplicity trade-off: role checks are visible at the call site in each endpoint rather than hidden behind annotations or a global interceptor, at the cost of some duplication across controllers.

**More important than the duplication itself: there is no compile-time or framework-level enforcement.** Nothing stops a new endpoint from being added without calling `requireAdmin()` (or the equivalent) at all — the check is a plain method call a developer has to remember to add, not an annotation Spring validates is present, and not something a missing-annotation-detector would catch. An endpoint that should be admin-only but omits the check fails open (any authenticated caller reaches it), and there is no test or static check in this codebase that would currently catch that omission. This is the actual risk this pattern carries, not just repeated boilerplate — a `@RequireRole(ADMIN)` annotation + a shared `HandlerInterceptor` (or an AOP aspect analogous to `DataSourceAspect`) would close this gap at the cost of the visibility trade-off described above.

---

## 4. Auth — no Spring Security, a single Servlet filter

`JwtAuthFilter` (`OncePerRequestFilter`, registered via `FilterConfig` on `/api/v1/*`) does exactly one thing: **decode** — not verify — the Cognito/Auth0 ID token's `sub` claim, and set it as a request attribute:

```java
String cognitoSub = extractSubFromJwt(token);   // base64url-decode payload, read "sub"
request.setAttribute("cognitoSub", cognitoSub);
```

No signature verification happens here. That's intentional, not an oversight: the BFF (Express) already verified the token against Auth0 before ever calling this API — the Java backend sits behind the BFF, never directly exposed to the browser. Re-verifying here would duplicate trust already established one hop earlier. Controllers then read `request.getAttribute("cognitoSub")` to identify the caller.

**No `spring-boot-starter-security` dependency.** Filter registration uses plain Servlet `FilterRegistrationBean`:

```java
@Bean
public FilterRegistrationBean<JwtAuthFilter> jwtAuthFilterRegistration(JwtAuthFilter jwtAuthFilter) {
    FilterRegistrationBean<JwtAuthFilter> reg = new FilterRegistrationBean<>();
    reg.setFilter(jwtAuthFilter);
    reg.addUrlPatterns("/api/v1/*");
    reg.setOrder(1);
    return reg;
}
```

This keeps the security model legible in one file instead of spread across a `SecurityFilterChain` bean, `@PreAuthorize` annotations, and a custom `AuthenticationProvider` — appropriate for a single-token, single-trust-boundary system. It would not scale to multiple auth schemes or fine-grained method security without outgrowing this pattern.

---

## 5. Exception handling

Two-exception hierarchy, both unchecked:

```java
ApiException extends RuntimeException        // generic 400
  └── NotFoundException extends ApiException // 404
ForbiddenException extends RuntimeException  // 403 (separate branch, not an ApiException)
```

`GlobalExceptionHandler` (`@ControllerAdvice`) maps each to a `ResponseEntity<ErrorResponse>`:

| Exception | HTTP status |
|---|---|
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ApiException` | 400 |
| `MethodArgumentNotValidException` (`@Valid` failures) | 400, first field error message |
| `Exception` (catch-all) | 500 |

Services and controllers throw these directly (`throw new NotFoundException("Expense not found: " + id)`) — no wrapping, no error codes enum, no i18n key lookup at this layer (error message i18n, where it matters, happens in the CMS-driven `policy_evaluation_history` snapshot, not in exception messages).

This `@ControllerAdvice` mechanism sits at the **outermost** boundary of request handling — `DispatcherServlet` invokes it only after the entire controller method invocation has already unwound via a thrown exception. It cannot preempt or race with anything happening inside the controller method, including the transaction rollback described in §6 — see [Read/write DB routing](/wiki/db-routing) for the full trace of why this ordering is structurally guaranteed, not just usually true.

---

## 6. Data access — Mapper vs Repository

Two layers between Service and the database, each with one job:

**Mapper** — MyBatis `@Mapper` interface. Signature only; SQL lives in `resources/mapper/<Name>Mapper.xml`. Method names describe the SQL operation directly (`insert`, `findByUserSub`, `updateStatus`).

```java
@Mapper
public interface ExpenseMapper {
    void insert(ExpenseEntity expense);
    List<ExpenseEntity> findByUserSub(@Param("userSub") String userSub);
    ExpenseEntity findById(@Param("id") Long id);
}
```

**Repository** — thin `@Repository` class wrapping a Mapper, one per aggregate. Its only job is vocabulary normalization for the service layer (`insert` → `save`, matching Spring naming conventions elsewhere) — it adds no logic, no caching, no additional queries.

```java
@Repository
public class ExpenseRepository {
    private final ExpenseMapper mapper;
    public void save(ExpenseEntity expense) { mapper.insert(expense); }
    public ExpenseEntity findById(Long id)  { return mapper.findById(id); }
}
```

Services depend on `Repository`, not `Mapper`, in almost all cases — the one notable exception is `GdprService`, which injects `GdprMapper` directly for its erasure/pseudonymization queries (`pseudonymizeExpenses`, `deleteUserProfile`, ...), since those are cross-cutting bulk operations that don't belong to a single aggregate's repository.

No JPA anywhere. This is a deliberate choice for the GDPR pseudonymization path specifically: `expenses.user_sub` and `user_consents.user_sub` intentionally carry **no foreign key** to `users(cognito_sub)`, so that a hard delete of a user row never cascades into (or is blocked by) financial records that GoBD requires to survive 10 years. JPA's automatic cascade behavior is exactly the kind of implicit behavior this design needed to avoid — MyBatis's explicit SQL keeps every pseudonymize/delete statement reviewable in a diff, with no ORM-managed cascade that could silently delete more (or less) than intended.

---

## 7. Read/write datasource routing (summary — full detail in the wiki)

Every service method is wrapped by `DataSourceAspect`, which routes the connection to a WRITE or READ MySQL pool and (for writes) manages the transaction manually rather than delegating to Spring's `@Transactional`. Detection is annotation-based (`@Write` → WRITE, `@Transactional(readOnly = true)` → READ), defaulting to **WRITE** when neither is present — a deliberate fail-safe choice, since a write silently routed to the read pool is a correctness bug, while a read routed to the write pool is only a wasted connection.

This is documented in full — including the exact bug it was written to fix, the `@Write` + `@Transactional` ordering hazard that was found and removed, and the proof that `GlobalExceptionHandler` cannot race the transaction rollback — in **[Read/write DB routing](/wiki/db-routing)**.

---

## 8. Config layer

| File | Responsibility |
|---|---|
| `DataSourceConfig` | Two Hikari pools (`write`, `read`) behind one `AbstractRoutingDataSource`; single `transactionManager` bean shared by both the aspect and any incidental `@Transactional` usage |
| `DataSourceAspect` | Routes WRITE/READ per call, owns transaction lifecycle for writes — see §7 |
| `DataSourceContextHolder` | `ThreadLocal<String>` holding the current routing key (`"WRITE"` / `"READ"`) |
| `JwtAuthFilter` | Decodes (does not verify) the caller's `sub` — see §4 |
| `FilterConfig` | Registers `JwtAuthFilter` on `/api/v1/*` via plain Servlet `FilterRegistrationBean` |
| `StorageConfig` | S3-compatible client (MinIO) + presigner for direct browser upload of receipts |
| `SwaggerConfig` | OpenAPI/Swagger UI metadata |

---

## Related

- [Read/write DB routing](/wiki/db-routing) — full design + the bugs this fixed
- [GDPR / DSGVO](/wiki/gdpr-compliance) — the erasure workflow that motivated the no-FK / MyBatis choice in §6
- Root [README](/README.md) — full-stack overview, tech stack, run instructions
