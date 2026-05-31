package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.CreateErasureRequestDto;
import com.example.my_java_app.dto.response.GdprDataMapDto;
import com.example.my_java_app.dto.response.GdprErasureRequestDto;
import com.example.my_java_app.dto.response.UserConsentDto;
import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.entity.UserConsentEntity;
import com.example.my_java_app.mapper.GdprMapper;
import com.example.my_java_app.repository.GdprAuditLogRepository;
import com.example.my_java_app.repository.UserConsentRepository;
import com.example.my_java_app.service.DataExportService;
import com.example.my_java_app.service.GdprService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Employee self-service privacy controls.
 *
 * GET  /api/v1/user/privacy/data-map        — inventory of my data across tables
 * GET  /api/v1/user/privacy/consents        — consent history (active + withdrawn)
 * GET  /api/v1/user/privacy/erasure-status  — my most recent erasure request, if any
 * POST /api/v1/user/privacy/erasure-request — submit a new erasure request (GDPR Art. 17)
 * GET  /api/v1/user/data-export             — download ZIP of my data (GDPR Art. 20)
 */
@RestController
@RequestMapping("/api/v1/user")
public class UserPrivacyController extends BaseController {

    private static final int GDPR_DEADLINE_DAYS = 30;

    private final GdprService gdprService;
    private final DataExportService dataExportService;
    private final GdprMapper gdprMapper;
    private final GdprAuditLogRepository auditLogRepository;
    private final UserConsentRepository userConsentRepository;
    private final ObjectMapper objectMapper;

    public UserPrivacyController(GdprService gdprService,
                                 DataExportService dataExportService,
                                 GdprMapper gdprMapper,
                                 GdprAuditLogRepository auditLogRepository,
                                 UserConsentRepository userConsentRepository,
                                 ObjectMapper objectMapper) {
        this.gdprService = gdprService;
        this.dataExportService = dataExportService;
        this.gdprMapper = gdprMapper;
        this.auditLogRepository = auditLogRepository;
        this.userConsentRepository = userConsentRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/privacy/data-map")
    public ResponseEntity<GdprDataMapDto> myDataMap(HttpServletRequest request) {
        String sub = requireSub(request);
        List<GdprDataMapDto.TableInfo> tables = List.of(
                new GdprDataMapDto.TableInfo("users",                     gdprMapper.countUsersBySub(sub),                "PII_HARD_DELETE",         "Your identity — will be hard deleted on erasure"),
                new GdprDataMapDto.TableInfo("user_profiles",             gdprMapper.countUserProfilesByUser(sub),        "PII_HARD_DELETE",         "Name, avatar, language preference — will be hard deleted"),
                new GdprDataMapDto.TableInfo("user_roles",                gdprMapper.countUserRolesByUser(sub),           "PII_HARD_DELETE",         "Role assignments — will be hard deleted"),
                new GdprDataMapDto.TableInfo("user_consents",             gdprMapper.countConsentsByUser(sub),            "FINANCIAL_PSEUDONYMIZE",  "Consent evidence — kept (anonymized) for legal proof"),
                new GdprDataMapDto.TableInfo("expenses",                  gdprMapper.countExpensesByUser(sub),            "FINANCIAL_PSEUDONYMIZE",  "Expense records — kept 10 years (GoBD §14), anonymized"),
                new GdprDataMapDto.TableInfo("policy_evaluation_history", gdprMapper.countPolicyEvalHistoryByUser(sub),   "AUDIT_NULLIFY",           "Compliance audit trail — created_by set to NULL")
        );
        return ok(new GdprDataMapDto(sub, tables));
    }

    @GetMapping("/privacy/consents")
    public ResponseEntity<List<UserConsentDto>> myConsents(HttpServletRequest request) {
        String sub = requireSub(request);
        List<UserConsentEntity> rows = userConsentRepository.findByUserSub(sub);
        List<UserConsentDto> dtos = new ArrayList<>(rows.size());
        for (UserConsentEntity c : rows) {
            String status = c.getRevokedAt() == null ? "ACTIVE" : "WITHDRAWN";
            dtos.add(new UserConsentDto(
                    c.getId(),
                    c.getPolicyId(),
                    c.getPolicyTitle(),
                    c.getPolicyType(),
                    c.getPolicyVersion(),
                    c.getConsentMethod(),
                    c.getCreatedAt() == null ? null : c.getCreatedAt().toString(),
                    c.getRevokedAt() == null ? null : c.getRevokedAt().toString(),
                    status
            ));
        }
        return ok(dtos);
    }

    @GetMapping("/privacy/erasure-status")
    public ResponseEntity<GdprErasureRequestDto> myErasureStatus(HttpServletRequest request) {
        String sub = requireSub(request);
        String token = GdprService.subjectTokenFor(sub);
        List<GdprAuditLogEntity> events = auditLogRepository.findBySubjectToken(token);
        GdprAuditLogEntity latestRequest = null;
        for (GdprAuditLogEntity e : events) {
            if ("ERASURE_REQUESTED".equals(e.getEventType())) {
                latestRequest = e; // findBySubjectToken returns newest first → first match is latest
                break;
            }
        }
        if (latestRequest == null) return ok(null);
        return ok(toRequestDto(latestRequest));
    }

    @PostMapping("/privacy/erasure-request")
    public ResponseEntity<GdprErasureRequestDto> submitErasureRequest(@RequestBody CreateErasureRequestDto body,
                                                                      HttpServletRequest request) {
        String sub = requireSub(request);
        // Reject if a non-completed request already exists for this user (one active request at a time).
        String token = GdprService.subjectTokenFor(sub);
        List<GdprAuditLogEntity> events = auditLogRepository.findBySubjectToken(token);
        for (GdprAuditLogEntity e : events) {
            if ("ERASURE_REQUESTED".equals(e.getEventType())) {
                if (!auditLogRepository.hasLaterEvent(token, "ERASURE_COMPLETED", e.getCreatedAt())) {
                    throw new IllegalStateException("An active erasure request already exists");
                }
                break;
            }
        }
        gdprService.recordErasureRequest(sub, body == null ? "" : body.getReason());

        // Find the just-inserted request to return its details.
        List<GdprAuditLogEntity> after = auditLogRepository.findBySubjectToken(token);
        for (GdprAuditLogEntity e : after) {
            if ("ERASURE_REQUESTED".equals(e.getEventType())) return ok(toRequestDto(e));
        }
        return ok(null);
    }

    @GetMapping("/data-export")
    public ResponseEntity<byte[]> exportMyData(HttpServletRequest request) throws IOException {
        String sub = requireSub(request);
        byte[] zipBytes = dataExportService.buildExport(sub);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentDispositionFormData("attachment",
                "my-data-export-" + LocalDate.now() + ".zip");
        headers.setContentLength(zipBytes.length);
        return new ResponseEntity<>(zipBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private String requireSub(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (sub == null || sub.isBlank()) {
            throw new IllegalStateException("cognitoSub missing from request — JwtAuthFilter not applied?");
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
