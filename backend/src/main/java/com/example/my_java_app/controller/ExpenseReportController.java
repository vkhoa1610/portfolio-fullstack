package com.example.my_java_app.controller;

import com.example.my_java_app.entity.ExpenseReportEntity;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.repository.SystemAdminRepository;
import com.example.my_java_app.service.ExpenseReportService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Endpoints for AI-powered expense report generation — accessible by Admin or Manager.
 *
 * POST /api/v1/admin/reports/generate?period=2026-03  → trigger async job
 * GET  /api/v1/admin/reports/status/{jobId}           → poll job status
 * GET  /api/v1/admin/reports/latest                   → latest DONE report
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
public class ExpenseReportController extends BaseController {

    private final ExpenseReportService reportService;
    private final SystemAdminRepository systemAdminRepository;
    private final PermissionService permissionService;

    public ExpenseReportController(ExpenseReportService reportService,
                                   SystemAdminRepository systemAdminRepository,
                                   PermissionService permissionService) {
        this.reportService          = reportService;
        this.systemAdminRepository  = systemAdminRepository;
        this.permissionService      = permissionService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @RequestParam String period,
            HttpServletRequest request) {

        requireAdmin(request);

        // Validate period format "yyyy-MM"
        if (!period.matches("\\d{4}-\\d{2}")) {
            return badRequest(Map.of("error", "period must be in format yyyy-MM (e.g. 2026-03)"));
        }

        Long jobId = reportService.createJob(period);
        CompletableFuture.runAsync(() -> reportService.runJob(jobId, period));

        return ok(Map.of("jobId", jobId, "status", "PENDING"));
    }

    @GetMapping("/status/{jobId}")
    public ResponseEntity<Map<String, Object>> status(
            @PathVariable Long jobId,
            HttpServletRequest request) {

        requireAdmin(request);

        ExpenseReportEntity entity = reportService.findById(jobId);
        if (entity == null) {
            return notFound(Map.of("error", "Job not found: " + jobId));
        }

        return ok(toResponse(entity));
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latest(HttpServletRequest request) {
        requireAdmin(request);

        ExpenseReportEntity entity = reportService.findLatestDone();
        if (entity == null) {
            return ok(Map.of("exists", false));
        }

        Map<String, Object> response = toResponse(entity);
        response.put("exists", true);
        return ok(response);
    }

    // ─────────────────────────────────────────────────────────────

    private Map<String, Object> toResponse(ExpenseReportEntity e) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id",          e.getId());
        map.put("period",      e.getPeriod());
        map.put("status",      e.getStatus());
        map.put("markdown",    e.getMarkdown());
        map.put("reportData",  e.getReportData());
        map.put("errorMsg",    e.getErrorMsg());
        map.put("generatedAt", e.getGeneratedAt() != null ? e.getGeneratedAt().toString() : null);
        return map;
    }

    private void requireAdmin(HttpServletRequest request) {
        String sub = (String) request.getAttribute("cognitoSub");
        boolean isAdmin   = systemAdminRepository.existsBySub(sub);
        boolean isManager = permissionService.hasPermission(sub, "EXPENSE_APPROVE");
        if (!isAdmin && !isManager) {
            throw new ForbiddenException("Access restricted to Admin or Manager");
        }
    }
}
