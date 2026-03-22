package com.example.my_java_app.controller;

import com.example.my_java_app.entity.ExpenseReportEntity;
import com.example.my_java_app.service.ExpenseReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Read-only AI report endpoint for Manager role.
 * Role check happens at BFF layer (mgr-005).
 *
 * GET /api/v1/manager/reports/latest → latest DONE report
 */
@RestController
@RequestMapping("/api/v1/manager/reports")
public class ManagerReportController extends BaseController {

    private final ExpenseReportService reportService;

    public ManagerReportController(ExpenseReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latest() {
        ExpenseReportEntity entity = reportService.findLatestDone();
        if (entity == null) {
            return ok(Map.of("exists", false));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("exists",       true);
        response.put("id",           entity.getId());
        response.put("period",       entity.getPeriod());
        response.put("status",       entity.getStatus());
        response.put("markdown",     entity.getMarkdown());
        response.put("reportData",   entity.getReportData());
        response.put("errorMsg",     entity.getErrorMsg());
        response.put("generatedAt",  entity.getGeneratedAt() != null
                                        ? entity.getGeneratedAt().toString() : null);
        return ok(response);
    }
}
