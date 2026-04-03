package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.CreateFinanceReportRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.dto.response.FinanceReportResponseDto;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.service.FinanceReportService;
import com.example.my_java_app.service.FinanceService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Finance API (v1) — requires FINANCE_VIEW permission.
 *
 * GET  /api/v1/finance/expenses            — list APPROVED + PAID employee expenses
 * PUT  /api/v1/finance/expenses/{id}/pay   — mark single expense PAID
 * PUT  /api/v1/finance/expenses/batch-pay  — bulk mark PAID
 * POST /api/v1/finance/reports             — create finance report
 * GET  /api/v1/finance/reports             — list finance reports
 */
@RestController
@RequestMapping("/api/v1/finance")
public class FinanceController extends BaseController {

    private final FinanceService financeService;
    private final FinanceReportService financeReportService;
    private final PermissionService permissionService;

    public FinanceController(FinanceService financeService,
                             FinanceReportService financeReportService,
                             PermissionService permissionService) {
        this.financeService       = financeService;
        this.financeReportService = financeReportService;
        this.permissionService    = permissionService;
    }

    // ── Employee expenses (existing) ─────────────────────────────

    @GetMapping("/expenses")
    public ResponseEntity<List<ExpenseResponseDto>> listExpenses(HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        return ok(financeService.listAll());
    }

    @PutMapping("/expenses/{id}/pay")
    public ResponseEntity<Map<String, Object>> pay(@PathVariable Long id,
                                                   HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        financeService.pay(id);
        return ok(Map.of("id", id, "status", "PAID"));
    }

    @PutMapping("/expenses/batch-pay")
    public ResponseEntity<Map<String, Object>> batchPay(@RequestBody Map<String, List<Long>> body,
                                                        HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        List<Long> ids = body.get("ids");
        int count = financeService.batchPay(ids);
        return ok(Map.of("paid", count));
    }

    // ── Finance reports (new) ────────────────────────────────────

    @PostMapping("/reports")
    public ResponseEntity<FinanceReportResponseDto> createReport(
            @RequestBody CreateFinanceReportRequestDto body,
            HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        String sub = (String) request.getAttribute("cognitoSub");
        return ok(financeReportService.create(sub, body));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<FinanceReportResponseDto>> listReports(HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        return ok(financeReportService.listAll());
    }

    // ─────────────────────────────────────────────────────────────

    private void requirePermission(HttpServletRequest request, String code) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (!permissionService.hasPermission(sub, code)) {
            throw new ForbiddenException("Missing permission: " + code);
        }
    }
}
