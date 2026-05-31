package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.PendingFinanceConfirmationDto;
import com.example.my_java_app.entity.GdprAuditLogEntity;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.GdprAuditLogRepository;
import com.example.my_java_app.service.GdprService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Finance role's GoBD sign-off on GDPR pseudonymizations.
 *
 * Architectural rationale (separation of duties — Section 3.2 of GDPR-Compliance.md):
 * the Admin role can trigger pseudonymization, but the accounting integrity of expense
 * records belongs to Finance. Each pseudonymization therefore requires a post-hoc
 * Finance acknowledgement, recorded as an immutable audit event.
 *
 * GET  /api/v1/finance/gdpr/pending      — pseudonymizations awaiting confirmation
 * PUT  /api/v1/finance/gdpr/confirm/{id} — confirm one pseudonymization (id = pseudo event id)
 */
@RestController
@RequestMapping("/api/v1/finance/gdpr")
public class FinanceGdprController extends BaseController {

    private final GdprService gdprService;
    private final GdprAuditLogRepository auditLogRepository;
    private final PermissionService permissionService;

    public FinanceGdprController(GdprService gdprService,
                                 GdprAuditLogRepository auditLogRepository,
                                 PermissionService permissionService) {
        this.gdprService = gdprService;
        this.auditLogRepository = auditLogRepository;
        this.permissionService = permissionService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingFinanceConfirmationDto>> listPending(HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        List<GdprAuditLogEntity> rows = auditLogRepository.findPendingFinanceConfirmations();
        List<PendingFinanceConfirmationDto> dtos = new ArrayList<>(rows.size());
        for (GdprAuditLogEntity r : rows) {
            dtos.add(new PendingFinanceConfirmationDto(
                    r.getId(),
                    r.getSubjectSub(),
                    r.getSubjectToken(),
                    r.getCreatedAt() == null ? null : r.getCreatedAt().toString(),
                    r.getActorSub(),
                    r.getActorRole(),
                    r.getDetailsJson()
            ));
        }
        return ok(dtos);
    }

    @PutMapping("/confirm/{id}")
    public ResponseEntity<Map<String, Object>> confirm(@PathVariable Long id,
                                                       HttpServletRequest request) {
        String actorSub = requirePermission(request, "FINANCE_VIEW");

        GdprAuditLogEntity pseudo = auditLogRepository.findById(id);
        if (pseudo == null) throw new NotFoundException("Pseudonymization event not found: " + id);
        if (!"ERASURE_FINANCIAL_PSEUDONYMIZED".equals(pseudo.getEventType())) {
            throw new IllegalStateException("Audit row " + id + " is not a pseudonymization event");
        }
        if (auditLogRepository.hasLaterEvent(pseudo.getSubjectToken(), "FINANCE_GOBD_CONFIRMED", pseudo.getCreatedAt())) {
            throw new IllegalStateException("Pseudonymization " + id + " is already confirmed");
        }

        gdprService.confirmFinanceGobd(pseudo.getSubjectSub(), pseudo.getSubjectToken(),
                pseudo.getId(), actorSub, "FINANCE");

        return ok(Map.of(
                "pseudoEventId", id,
                "subjectToken", pseudo.getSubjectToken(),
                "confirmed", true
        ));
    }

    private String requirePermission(HttpServletRequest request, String code) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (sub == null || !permissionService.hasPermission(sub, code)) {
            throw new ForbiddenException("Missing permission: " + code);
        }
        return sub;
    }
}
