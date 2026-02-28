package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.ReviewExpenseRequestDto;
import com.example.my_java_app.dto.response.ExpenseResponseDto;
import com.example.my_java_app.service.ManagerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Manager Approval API (v1)
 * Chỉ MANAGER role được phép gọi (kiểm tra ở BFF layer)
 */
@RestController
@RequestMapping("/api/v1/manager/expenses")
public class ManagerController extends BaseController {

    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    /** GET /api/v1/manager/expenses — danh sách PENDING_REVIEW */
    @GetMapping
    public ResponseEntity<List<ExpenseResponseDto>> getPending() {
        return ok(managerService.getPending());
    }

    /** PUT /api/v1/manager/expenses/{id}/approve */
    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approve(
            HttpServletRequest request,
            @PathVariable Long id) {
        String managerSub = (String) request.getAttribute("cognitoSub");
        managerService.approve(id, managerSub);
        return ResponseEntity.ok().build();
    }

    /** PUT /api/v1/manager/expenses/{id}/reject */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody ReviewExpenseRequestDto dto) {
        String managerSub = (String) request.getAttribute("cognitoSub");
        managerService.reject(id, managerSub, dto.getRejectionReason());
        return ResponseEntity.ok().build();
    }
}
