package com.example.my_java_app.controller;

import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.service.FinanceService;
import com.example.my_java_app.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Finance API (v1) — requires FINANCE_VIEW / FINANCE_EXPORT permission.
 *
 * GET  /api/v1/finance/expenses          — list APPROVED + PAID
 * PUT  /api/v1/finance/expenses/{id}/pay — mark single expense PAID
 * PUT  /api/v1/finance/expenses/batch-pay — bulk mark PAID
 */
@RestController
@RequestMapping("/api/v1/finance/expenses")
public class FinanceController extends BaseController {

    private final FinanceService financeService;
    private final PermissionService permissionService;

    public FinanceController(FinanceService financeService, PermissionService permissionService) {
        this.financeService    = financeService;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> list(HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        return ok(financeService.listAll());
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> pay(@PathVariable Long id,
                                                   HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        financeService.pay(id);
        return ok(Map.of("id", id, "status", "PAID"));
    }

    @PutMapping("/batch-pay")
    public ResponseEntity<Map<String, Object>> batchPay(@RequestBody Map<String, List<Long>> body,
                                                        HttpServletRequest request) {
        requirePermission(request, "FINANCE_VIEW");
        List<Long> ids = body.get("ids");
        int count = financeService.batchPay(ids);
        return ok(Map.of("paid", count));
    }

    // ─────────────────────────────────────────────────────────────

    private void requirePermission(HttpServletRequest request, String code) {
        String sub = (String) request.getAttribute("cognitoSub");
        if (!permissionService.hasPermission(sub, code)) {
            throw new ForbiddenException("Missing permission: " + code);
        }
    }
}
