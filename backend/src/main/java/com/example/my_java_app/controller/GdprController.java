package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.GdprAuditLogEntryDto;
import com.example.my_java_app.dto.response.GdprDataMapDto;
import com.example.my_java_app.dto.response.GdprErasureRequestDto;
import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.mapper.GdprMapper;
import com.example.my_java_app.repository.GdprAuditLogRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import com.example.my_java_app.service.GdprService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * GDPR admin tooling — requires caller to be in system_admins table.
 *
 * GET  /api/v1/admin/gdpr/requests       — erasure request queue with status + deadline countdown
 * GET  /api/v1/admin/gdpr/data-map/{sub} — per-user inventory of rows across PII + financial tables
 * POST /api/v1/admin/gdpr/process/{id}   — run full erasure workflow for the given request
 * GET  /api/v1/admin/gdpr/audit-log      — recent audit events (optional filter by subjectSub)
 */
@RestController
@RequestMapping("/api/v1/admin/gdpr")
public class GdprController extends BaseController {

    /** GDPR Art. 12 — controller must respond to erasure requests within 30 days. */
    private static final int GDPR_DEADLINE_DAYS = 30;

    private final GdprService gdprService;
    private final GdprAuditLogRepository auditLogRepository;
    private final GdprMapper gdprMapper;
    private final SystemAdminRepository systemAdminRepository;
    private final ObjectMapper objectMapper;

    public GdprController(GdprService gdprService,
                          GdprAuditLogRepository auditLogRepository,
                          GdprMapper gdprMapper,
                          SystemAdminRepository systemAdminRepository,
                          ObjectMapper objectMapper) {
        this.gdprService = gdprService;
        this.auditLogRepository = auditLogRepository;
        this.gdprMapper = gdprMapper;
        this.systemAdminRepository = systemAdminRepository;
        this.objectMapper = objectMapper;
    }

    // ── 1. Queue ──────────────────────────────────────────────────────────────
    @GetMapping("/requests")
    public ResponseEntity<List<GdprErasureRequestDto>> listRequests(HttpServletRequest request) {
        requireAdmin(request);
        List<GdprAuditLogEntity> requests = auditLogRepository.findAllErasureRequests();
        List<GdprErasureRequestDto> dtos = new ArrayList<>(requests.size());
        for (GdprAuditLogEntity req : requests) {
            dtos.add(toRequestDto(req));
        }
        return ok(dtos);
    }

    // ── 2. Data map for a user ────────────────────────────────────────────────
    @GetMapping("/data-map/{sub}")
    public ResponseEntity<GdprDataMapDto> dataMap(@PathVariable String sub,
                                                  HttpServletRequest request) {
        requireAdmin(request);
        List<GdprDataMapDto.TableInfo> tables = List.of(
                new GdprDataMapDto.TableInfo("users",                     gdprMapper.countUsersBySub(sub),                "PII_HARD_DELETE",         "Auth identity — hard delete"),
                new GdprDataMapDto.TableInfo("user_profiles",             gdprMapper.countUserProfilesByUser(sub),        "PII_HARD_DELETE",         "Name, avatar, language — hard delete"),
                new GdprDataMapDto.TableInfo("user_roles",                gdprMapper.countUserRolesByUser(sub),           "PII_HARD_DELETE",         "Role assignments — hard delete"),
                new GdprDataMapDto.TableInfo("user_consents",             gdprMapper.countConsentsByUser(sub),            "FINANCIAL_PSEUDONYMIZE",  "Consent evidence — keep, anonymize user_sub"),
                new GdprDataMapDto.TableInfo("expenses",                  gdprMapper.countExpensesByUser(sub),            "FINANCIAL_PSEUDONYMIZE",  "GoBD §14 — keep 10 years, anonymize user_sub"),
                new GdprDataMapDto.TableInfo("policy_evaluation_history", gdprMapper.countPolicyEvalHistoryByUser(sub),   "AUDIT_NULLIFY",           "Audit attribution — set created_by NULL")
        );
        return ok(new GdprDataMapDto(sub, tables));
    }

    // ── 3. Process erasure ───────────────────────────────────────────────────
    @PostMapping("/process/{id}")
    public ResponseEntity<Map<String, Object>> processErasure(@PathVariable Long id,
                                                              HttpServletRequest request) {
        String actorSub = requireAdmin(request);
        GdprAuditLogEntity req = auditLogRepository.findById(id);
        if (req == null) throw new NotFoundException("GDPR request not found: " + id);
        if (!"ERASURE_REQUESTED".equals(req.getEventType())) {
            throw new IllegalStateException("Audit log row " + id + " is not an ERASURE_REQUESTED event");
        }
        String subjectSub = req.getSubjectSub();
        if (subjectSub == null) {
            throw new IllegalStateException("Cannot process request " + id + ": subject_sub already null (likely already processed)");
        }

        // Phase 1 of erasure: pseudonymize financial records first (else FK-free expenses still link the user).
        GdprService.PseudonymizationResult pseudo = gdprService.pseudonymizeFinancialData(subjectSub, actorSub, "ADMIN");
        // Phase 2: hard-delete PII tables.
        gdprService.hardDeletePersonalData(subjectSub, actorSub, "ADMIN");

        return ok(Map.of(
                "requestId", id,
                "subjectSub", subjectSub,
                "expensesPseudonymized", pseudo.expensesAffected(),
                "consentsAnonymized", pseudo.consentsAffected(),
                "policyEvalHistoryNullified", pseudo.policyHistoryAffected(),
                "anonymizedSub", pseudo.anonymizedSub()
        ));
    }

    // ── 4. Audit log ─────────────────────────────────────────────────────────
    @GetMapping("/audit-log")
    public ResponseEntity<List<GdprAuditLogEntryDto>> auditLog(@RequestParam(required = false) String subjectSub,
                                                               @RequestParam(defaultValue = "200") int limit,
                                                               HttpServletRequest request) {
        requireAdmin(request);
        String subjectToken = subjectSub == null ? null : GdprService.subjectTokenFor(subjectSub);
        int safeLimit = Math.max(1, Math.min(limit, 1000));
        List<GdprAuditLogEntity> rows = auditLogRepository.findRecent(subjectToken, safeLimit);
        List<GdprAuditLogEntryDto> dtos = new ArrayList<>(rows.size());
        for (GdprAuditLogEntity row : rows) {
            dtos.add(new GdprAuditLogEntryDto(
                    row.getId(),
                    row.getEventType(),
                    row.getSubjectSub(),
                    row.getSubjectToken(),
                    row.getActorSub(),
                    row.getActorRole(),
                    row.getDetailsJson(),
                    row.getCreatedAt() == null ? null : row.getCreatedAt().toString()
            ));
        }
        return ok(dtos);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private String requireAdmin(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (sub == null || !systemAdminRepository.existsBySub(sub)) {
            throw new ForbiddenException("Not a system admin");
        }
        return sub;
    }

    private GdprErasureRequestDto toRequestDto(GdprAuditLogEntity req) {
        LocalDateTime requestedAt = req.getCreatedAt();
        LocalDate deadline = requestedAt == null ? null : requestedAt.toLocalDate().plusDays(GDPR_DEADLINE_DAYS);
        long daysRemaining = deadline == null ? 0 : ChronoUnit.DAYS.between(LocalDate.now(), deadline);

        String status = deriveStatus(req);
        String reason = "";
        if (req.getDetailsJson() != null) {
            try {
                JsonNode node = objectMapper.readTree(req.getDetailsJson());
                if (node.hasNonNull("reason")) reason = node.path("reason").asText("");
            } catch (Exception ignored) { /* leave empty */ }
        }

        return new GdprErasureRequestDto(
                req.getId(),
                req.getSubjectSub(),
                req.getSubjectToken(),
                status,
                requestedAt == null ? null : requestedAt.toString(),
                deadline == null ? null : deadline.toString(),
                daysRemaining,
                reason
        );
    }

    private String deriveStatus(GdprAuditLogEntity request) {
        LocalDateTime after = request.getCreatedAt();
        String token = request.getSubjectToken();
        if (auditLogRepository.hasLaterEvent(token, "ERASURE_COMPLETED", after)) return "COMPLETED";
        boolean piiDone     = auditLogRepository.hasLaterEvent(token, "ERASURE_PII_DELETED", after);
        boolean financeDone = auditLogRepository.hasLaterEvent(token, "ERASURE_FINANCIAL_PSEUDONYMIZED", after);
        return (piiDone || financeDone) ? "PROCESSING" : "PENDING";
    }
}
